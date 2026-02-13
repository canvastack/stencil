import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import vendorApi from '@/services/api/vendorApi';
import type { VendorUser, VendorProfile } from '@/types/vendor/portal';
import { handleApiError } from '@/services/api/errorHandler';
import { logger, setUserContext, clearUserContext } from '@/lib/monitoring';

interface VendorAuthContextType {
  user: VendorUser | null;
  vendor: VendorProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const VendorAuthContext = createContext<VendorAuthContextType | undefined>(undefined);

interface VendorAuthProviderProps {
  children: ReactNode;
}

export const VendorAuthProvider: React.FC<VendorAuthProviderProps> = ({ children }) => {
  const [userState, setUserState] = useState<VendorUser | null>(null);
  const [vendorState, setVendorState] = useState<VendorProfile | null>(null);
  // CRITICAL FIX: Start with loading=true during initialization
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize user and vendor to prevent unnecessary re-renders
  const user = useMemo(() => userState, [userState?.id, userState?.uuid, userState?.email]);
  const vendor = useMemo(() => vendorState, [vendorState?.id, vendorState?.uuid, vendorState?.company_name]);

  // Initialize from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuthenticated = vendorApi.isAuthenticated();
        
        console.log('VendorAuthContext: Initializing from storage', {
          isAuthenticated,
          hasToken: !!vendorApi.getAuthToken()
        });
        
        if (isAuthenticated) {
          const storedUser = vendorApi.getVendorUser();
          const storedVendor = vendorApi.getVendorProfile();
          
          console.log('VendorAuthContext: Found stored data', {
            hasUser: !!storedUser,
            hasVendor: !!storedVendor,
            userSnippet: storedUser ? { id: storedUser.id, email: storedUser.email } : null,
            vendorSnippet: storedVendor ? { id: storedVendor.id, company_name: storedVendor.company_name } : null
          });
          
          if (storedUser && storedVendor) {
            setUserState(storedUser);
            setVendorState(storedVendor);
            
            // Set monitoring context
            setUserContext({
              id: storedUser.uuid || storedUser.id,
              email: storedUser.email,
              name: storedUser.name,
              account_type: 'vendor',
            });
          } else {
            console.log('VendorAuthContext: Missing user or vendor data, clearing state');
            setUserState(null);
            setVendorState(null);
          }
        } else {
          console.log('VendorAuthContext: Not authenticated, clearing state');
          setUserState(null);
          setVendorState(null);
        }
      } catch (error) {
        console.error('VendorAuthContext: Initialization error', error);
        setUserState(null);
        setVendorState(null);
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
    const formatted = handleApiError(err, 'Vendor Auth');
    setError(formatted.userMessage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      console.log('VendorAuthContext: Attempting login', { email });
      
      const response = await vendorApi.login({ email, password });
      
      if (response.success && response.data.user && response.data.vendor) {
        setUserState(response.data.user);
        setVendorState(response.data.vendor);
        
        // CRITICAL: Set login timestamp for API client grace period
        // This prevents immediate logout on 401 errors within 10 seconds of login
        localStorage.setItem('vendor_login_timestamp', Date.now().toString());
        
        setUserContext({
          id: response.data.user.uuid || response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          account_type: 'vendor',
        });
        
        logger.info('Vendor login successful', {
          user_id: response.data.user.uuid || response.data.user.id,
          vendor_id: response.data.vendor.uuid,
          company_name: response.data.vendor.company_name,
        });
        
        console.log('VendorAuthContext: Login successful');
      } else {
        throw new Error('Vendor user data not received');
      }
    } catch (err) {
      logger.error('Vendor login failed', err instanceof Error ? err : new Error(String(err)), {
        email,
      });
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  const logout = useCallback(async (allDevices: boolean = false) => {
    try {
      setIsLoading(true);
      
      console.log('VendorAuthContext: Attempting logout', { allDevices });
      
      // Clear local state immediately to prevent UI confusion
      setUserState(null);
      setVendorState(null);
      clearError();
      
      // Try to call logout API, but don't fail if it doesn't work
      try {
        await vendorApi.logout(allDevices);
      } catch (logoutError) {
        console.warn('VendorAuthContext: Logout API call failed, continuing with local cleanup', logoutError);
      }
      
      // Clear monitoring context
      clearUserContext();
      
      logger.info('Vendor logout successful', { allDevices });
      
      console.log('VendorAuthContext: Logout completed successfully');
      
    } catch (err) {
      console.error('VendorAuthContext: Logout failed', err);
      handleError(err);
    } finally {
      setIsLoading(false);
      
      // Navigate to vendor login page
      if (window.location.pathname !== '/vendor/login') {
        window.location.href = '/vendor/login';
      }
    }
  }, [clearError, handleError]);

  const refreshProfile = useCallback(async () => {
    // Don't make API calls if not authenticated or already loading
    if (!vendorApi.isAuthenticated() || isLoading) {
      console.log('VendorAuthContext: refreshProfile skipped - not authenticated or loading');
      return;
    }

    // CRITICAL: Check if we're within grace period after login
    const loginTimestamp = localStorage.getItem('vendor_login_timestamp');
    if (loginTimestamp) {
      const timeSinceLogin = Date.now() - parseInt(loginTimestamp, 10);
      if (timeSinceLogin < 5000) { // 5 seconds grace before making API calls
        console.log('VendorAuthContext: Skipping refreshProfile - within grace period after login', {
          timeSinceLogin
        });
        return;
      }
    }

    try {
      setIsLoading(true);
      console.log('VendorAuthContext: Fetching profile from API');
      
      const response = await vendorApi.getProfile();
      
      if (response.success && response.data.vendor) {
        setVendorState(response.data.vendor);
        console.log('VendorAuthContext: Profile refresh successful');
      }
    } catch (err) {
      console.error('VendorAuthContext: refreshProfile failed', err);
      // Don't set error state for authentication failures to prevent loops
      // handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const value: VendorAuthContextType = useMemo(() => ({
    user,
    vendor,
    isAuthenticated: !!user && !!vendor && vendorApi.isAuthenticated(),
    isLoading,
    error,
    login,
    logout,
    refreshProfile,
    clearError,
  }), [user, vendor, isLoading, error, login, logout, refreshProfile, clearError]);

  return (
    <VendorAuthContext.Provider value={value}>
      {children}
    </VendorAuthContext.Provider>
  );
};

export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext);
  if (context === undefined) {
    throw new Error('useVendorAuth must be used within a VendorAuthProvider');
  }
  return context;
};
