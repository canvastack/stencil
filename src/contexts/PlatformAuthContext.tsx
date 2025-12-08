import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService } from '@/services/api/auth';
import type { PlatformAccount, LoginRequest, AccountType } from '@/services/api/auth';
import { handleApiError } from '@/services/api/errorHandler';

interface PlatformAuthContextType {
  account: PlatformAccount | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentAccount: () => Promise<void>;
  clearError: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

interface PlatformAuthProviderProps {
  children: ReactNode;
}

export const PlatformAuthProvider: React.FC<PlatformAuthProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<PlatformAccount | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  // CRITICAL FIX: Start with loading=true during initialization
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAccountType = authService.getAccountType();
        const hasValidToken = authService.isAuthenticated();
        
        console.log('PlatformAuthContext: Initializing...', {
          storedAccountType,
          hasValidToken,
          tokenExists: !!authService.getToken()
        });
        
        if (storedAccountType === 'platform' && hasValidToken) {
          const storedAccount = authService.getPlatformAccountFromStorage();
          const storedPermissions = authService.getPermissionsFromStorage();
          
          if (storedAccount) {
            console.log('PlatformAuthContext: Restoring account from localStorage', {
              accountId: storedAccount.id,
              accountName: storedAccount.name
            });
            setAccount(storedAccount);
            setPermissions(storedPermissions);
          } else {
            console.log('PlatformAuthContext: No stored account found, clearing auth');
            authService.clearAuth(true); // Force clear non-platform auth
          }
        } else if (storedAccountType === 'platform' && !hasValidToken) {
          console.log('PlatformAuthContext: Invalid token, clearing auth');
          authService.clearAuth(true); // Force clear invalid platform tokens
        }
      } catch (error) {
        console.error('PlatformAuthContext: Initialization error', error);
        authService.clearAuth(true); // Force clear on errors
      } finally {
        // Mark initialization as complete
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: unknown) => {
    const formatted = handleApiError(err, 'Platform Auth');
    setError(formatted.userMessage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      const loginRequest: LoginRequest = {
        email,
        password,
        accountType: 'platform' as AccountType,
      };
      
      const response = await authService.login(loginRequest);
      
      if (response.account) {
        setAccount(response.account);
        if (response.permissions) {
          setPermissions(response.permissions);
        }
      } else {
        throw new Error('Platform account data not received');
      }
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (err) {
      handleError(err);
    } finally {
      setAccount(null);
      setPermissions([]);
      clearError();
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  const getCurrentAccount = useCallback(async () => {
    // Don't make API calls if not authenticated
    if (!authService.isAuthenticated()) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.getCurrentUser();
      
      if (response.account) {
        setAccount(response.account);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const value: PlatformAuthContextType = {
    account,
    permissions,
    isAuthenticated: !!account && authService.isAuthenticated(),
    isLoading,
    error,
    login,
    logout,
    getCurrentAccount,
    clearError,
  };

  return (
    <PlatformAuthContext.Provider value={value}>
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  const context = useContext(PlatformAuthContext);
  if (context === undefined) {
    throw new Error('usePlatformAuth must be used within a PlatformAuthProvider');
  }
  return context;
};