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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const storedAccountType = authService.getAccountType();
    if (storedAccountType === 'platform' && authService.isAuthenticated()) {
      const storedAccount = authService.getPlatformAccountFromStorage();
      const storedPermissions = authService.getPermissionsFromStorage();
      
      if (storedAccount) {
        setAccount(storedAccount);
        setPermissions(storedPermissions);
      }
    }
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
    isAuthenticated: !!account,
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