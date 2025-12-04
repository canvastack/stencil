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
  const [isLoading, setIsLoading] = useState(false);
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
        
        if (tenantData) {
          setTenant({
            uuid: tenantData.uuid,
            name: tenantData.name,
            slug: tenantData.slug,
            domain: tenantData.domain,
            settings: tenantData.settings
          });
          setUserType('tenant');
          return 'tenant';
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear context (logout)
  const clearContext = useCallback(() => {
    setUserType('anonymous');
    setTenant(undefined);
    setPlatform(undefined);
    setError(null);
  }, []);

  // Effect to sync with auth contexts
  useEffect(() => {
    console.log('GlobalContext: Auth state changed', {
      platformAuth: platformAuth.isAuthenticated,
      tenantAuth: tenantAuth.isAuthenticated
    });

    if (platformAuth.isAuthenticated && platformAuth.account) {
      switchContext('platform', { account: platformAuth.account });
    } else if (tenantAuth.isAuthenticated && tenantAuth.user && tenantAuth.tenant) {
      switchContext('tenant', { user: tenantAuth.user, tenant: tenantAuth.tenant });
    } else if (!platformAuth.isAuthenticated && !tenantAuth.isAuthenticated) {
      clearContext();
    }
  }, [
    platformAuth.isAuthenticated,
    platformAuth.account,
    tenantAuth.isAuthenticated,
    tenantAuth.user,
    tenantAuth.tenant
  ]);

  // Initialize context detection on mount
  useEffect(() => {
    detectContext();
  }, [detectContext]);

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