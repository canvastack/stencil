import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect, 
  ReactNode, 
  useMemo 
} from 'react';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { authService } from '@/services/api/auth';

export type UserType = 'anonymous' | 'platform' | 'tenant';

export interface TenantInfo {
  uuid: string;
  name: string;
  slug: string;
  domain?: string;
  settings?: Record<string, any>;
}

export interface PlatformInfo {
  name: string;
  version: string;
  settings?: Record<string, any>;
}

export interface GlobalContextType {
  userType: UserType;
  tenant?: TenantInfo;
  platform?: PlatformInfo;
  isLoading: boolean;
  error: string | null;
  switchContext: (type: Exclude<UserType, 'anonymous'>, contextData?: any) => Promise<void>;
  detectContext: () => Promise<UserType>;
  clearContext: () => void;
  isAnonymous: boolean;
  isPlatformUser: boolean;
  isTenantUser: boolean;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalContextProviderProps {
  children: ReactNode;
}

export const GlobalContextProvider: React.FC<GlobalContextProviderProps> = ({ children }) => {
  const [userType, setUserType] = useState<UserType>('anonymous');
  const [tenant, setTenant] = useState<TenantInfo | undefined>(undefined);
  const [platform, setPlatform] = useState<PlatformInfo | undefined>(undefined);
  // CRITICAL FIX: Start with loading=true until auth contexts initialize
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const platformAuth = usePlatformAuth();
  const tenantAuth = useTenantAuth();

  // Detect context on component mount and auth state changes
  const detectContext = useCallback(async (): Promise<UserType> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check stored account type first
      const storedAccountType = authService.getAccountType();
      
      if (!storedAccountType || !authService.isAuthenticated()) {
        console.log('GlobalContext: No stored account type or not authenticated, setting anonymous');
        setUserType('anonymous');
        setTenant(undefined);
        setPlatform(undefined);
        return 'anonymous';
      }

      if (storedAccountType === 'platform') {
        console.log('GlobalContext: Detected platform user');
        const platformAccount = authService.getPlatformAccountFromStorage();
        
        if (platformAccount) {
          setPlatform({
            name: 'CanvaStencil Platform',
            version: '1.0.0',
            settings: {}
          });
          setUserType('platform');
          return 'platform';
        }
      } else if (storedAccountType === 'tenant') {
        console.log('GlobalContext: Detected tenant user');
        const tenantData = authService.getCurrentTenantFromStorage();
        const storedToken = authService.getAuthToken();
        
        // CRITICAL FIX: Check if we have valid token and tenant data
        console.log('GlobalContext: Checking tenant authentication', {
          hasTenantData: !!tenantData,
          hasToken: !!storedToken,
          tokenSnippet: storedToken?.substring(0, 20) + '...'
        });
        
        if (tenantData && storedToken) {
          setTenant({
            uuid: tenantData.uuid,
            name: tenantData.name,
            slug: tenantData.slug,
            domain: tenantData.domain,
            settings: tenantData.settings
          });
          setUserType('tenant');
          return 'tenant';
        } else {
          console.log('GlobalContext: Tenant data missing but keeping token - setting anonymous');
        }
      }

      // Fallback to anonymous if authentication data is inconsistent
      console.log('GlobalContext: Authentication data inconsistent, setting anonymous');
      setUserType('anonymous');
      setTenant(undefined);
      setPlatform(undefined);
      return 'anonymous';
    } catch (err) {
      console.error('GlobalContext: Error detecting context:', err);
      setError(err instanceof Error ? err.message : 'Failed to detect user context');
      setUserType('anonymous');
      setTenant(undefined);
      setPlatform(undefined);
      return 'anonymous';
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch between different contexts
  const switchContext = useCallback(async (
    type: Exclude<UserType, 'anonymous'>, 
    contextData?: any
  ): Promise<void> => {
    try {
      // Don't set loading here - it's managed by the main useEffect
      setError(null);

      if (type === 'platform') {
        // Clear any existing tenant context
        setTenant(undefined);
        // The actual platform login should be handled by PlatformAuthProvider
        // This just updates the global context state
        setPlatform({
          name: 'CanvaStencil Platform',
          version: '1.0.0',
          settings: contextData?.settings || {}
        });
        setUserType('platform');
      } else if (type === 'tenant') {
        // Clear any existing platform context
        setPlatform(undefined);
        // Set tenant context data
        if (contextData?.tenant) {
          setTenant({
            uuid: contextData.tenant.uuid,
            name: contextData.tenant.name,
            slug: contextData.tenant.slug,
            domain: contextData.tenant.domain,
            settings: contextData.tenant.settings
          });
        }
        setUserType('tenant');
      }
    } catch (err) {
      console.error('GlobalContext: Error switching context:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch context');
    }
  }, []);

  // Clear context (logout)
  const clearContext = useCallback(() => {
    setUserType('anonymous');
    setTenant(undefined);
    setPlatform(undefined);
    setError(null);
  }, []);

  // CRITICAL FIX: Single initialization based on auth contexts
  // Remove race conditions by waiting for auth contexts to finish loading
  useEffect(() => {
    console.log('GlobalContext: Auth state changed', {
      platformAuth: platformAuth.isAuthenticated,
      tenantAuth: tenantAuth.isAuthenticated,
      platformLoading: platformAuth.isLoading,
      tenantLoading: tenantAuth.isLoading
    });

    // Don't make decisions while auth contexts are still loading
    if (platformAuth.isLoading || tenantAuth.isLoading) {
      console.log('GlobalContext: Auth contexts still loading, waiting...');
      return;
    }

    // Auth contexts have finished loading, set loading to false
    setIsLoading(false);

    if (platformAuth.isAuthenticated && platformAuth.account) {
      console.log('GlobalContext: Setting platform user context');
      switchContext('platform', { account: platformAuth.account });
    } else if (tenantAuth.isAuthenticated && tenantAuth.user && tenantAuth.tenant) {
      console.log('GlobalContext: Setting tenant user context');
      switchContext('tenant', { user: tenantAuth.user, tenant: tenantAuth.tenant });
    } else if (!platformAuth.isAuthenticated && !tenantAuth.isAuthenticated) {
      console.log('GlobalContext: No authentication found, setting anonymous');
      clearContext();
    }
  }, [
    platformAuth.isAuthenticated,
    platformAuth.account,
    platformAuth.isLoading,
    tenantAuth.isAuthenticated,
    tenantAuth.user,
    tenantAuth.tenant,
    tenantAuth.isLoading,
    switchContext,
    clearContext
  ]);

  // REMOVED: detectContext() call on mount to prevent race conditions
  // Authentication state is now determined solely by auth context changes

  const value: GlobalContextType = useMemo(() => ({
    userType,
    tenant,
    platform,
    isLoading,
    error,
    switchContext,
    detectContext,
    clearContext,
    isAnonymous: userType === 'anonymous',
    isPlatformUser: userType === 'platform',
    isTenantUser: userType === 'tenant'
  }), [
    userType,
    tenant,
    platform,
    isLoading,
    error,
    switchContext,
    detectContext,
    clearContext
  ]);

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalContextProvider');
  }
  return context;
};

export default useGlobalContext;