import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { authService } from '@/services/api/auth';
import type { AuthUser, AuthTenant, LoginRequest, AccountType } from '@/services/api/auth';
import { handleApiError } from '@/services/api/errorHandler';
import { logger, setUserContext, setTenantContext, clearUserContext, clearTenantContext } from '@/lib/monitoring';

interface TenantAuthContextType {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  permissions: string[];
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, tenantSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(undefined);

interface TenantAuthProviderProps {
  children: ReactNode;
}

export const TenantAuthProvider: React.FC<TenantAuthProviderProps> = ({ children }) => {
  const [userState, setUserState] = useState<AuthUser | null>(null);
  const [tenantState, setTenantState] = useState<AuthTenant | null>(null);
  const [permissionsState, setPermissions] = useState<string[]>([]);
  const [rolesState, setRoles] = useState<string[]>([]);
  // CRITICAL FIX: Start with loading=true during initialization
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize user and tenant to prevent unnecessary re-renders
  const user = useMemo(() => userState, [userState?.id, userState?.uuid, userState?.email]);
  const tenant = useMemo(() => tenantState, [tenantState?.id, tenantState?.uuid, tenantState?.slug]);
  
  // Memoize permissions and roles arrays to prevent recreation
  const permissions = useMemo(() => permissionsState, [JSON.stringify(permissionsState)]);
  const roles = useMemo(() => rolesState, [JSON.stringify(rolesState)]);

  // Initialize from localStorage
  useEffect(() => {
    const storedAccountType = authService.getAccountType();
    const isAuthenticated = authService.isAuthenticated();
    
    console.log('TenantAuthContext: Initializing from storage', {
      storedAccountType,
      isAuthenticated
    });
    
    if (storedAccountType === 'tenant' && isAuthenticated) {
      const storedToken = authService.getAuthToken();
      
      // FIXED: Demo tokens are valid authentication tokens for demo mode
      // Don't clear demo tokens as they provide legitimate fallback authentication
      
      // Continue with normal authentication flow for both real and demo tokens
      
      // Also check if there's no token at all (auth was cleared)
      if (!storedToken) {
        console.log('TenantAuthContext: No token found, clearing tenant state');
        setUserState(null);
        setTenantState(null);
        setPermissions([]);
        setRoles([]);
        return;
      }
      
      const storedUser = authService.getCurrentUserFromStorage();
      const storedTenant = authService.getCurrentTenantFromStorage();
      const storedPermissions = authService.getPermissionsFromStorage();
      const storedRoles = authService.getRolesFromStorage();
      
      console.log('TenantAuthContext: Found stored data', {
        hasUser: !!storedUser,
        hasTenant: !!storedTenant,
        hasToken: !!storedToken,
        tokenSnippet: storedToken?.substring(0, 20) + '...',
        userSnippet: storedUser ? {id: storedUser.id, email: storedUser.email} : null,
        tenantSnippet: storedTenant ? {id: storedTenant.id, name: storedTenant.name, slug: storedTenant.slug} : null
      });
      
      if (storedUser && storedTenant) {
        setUserState(storedUser);
        setTenantState(storedTenant);
        setPermissions(storedPermissions);
        setRoles(storedRoles);
      } else {
        console.log('TenantAuthContext: Missing user or tenant data, but keeping token (might be login in progress)');
        // FIXED: Don't clear auth immediately - user might be in the middle of login process
        // or data might be temporarily unavailable. Only clear if explicitly demo token
        setUserState(null);
        setTenantState(null);
        setPermissions([]);
        setRoles([]);
      }
    } else if (storedAccountType && storedAccountType !== 'tenant') {
      // IMPORTANT: This context only manages tenant sessions.
      // If the stored account type is not 'tenant' (e.g. 'platform'),
      // we MUST NOT clear global auth here. Simply treat this context
      // as unauthenticated and let the appropriate auth context handle it.
      console.log('TenantAuthContext: Non-tenant account detected, skipping tenant auth initialization');
      setUserState(null);
      setTenantState(null);
      setPermissions([]);
      setRoles([]);
    }
    
    // Mark initialization as complete
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: unknown) => {
    const formatted = handleApiError(err, 'Tenant Auth');
    setError(formatted.userMessage);
  }, []);

  const login = useCallback(async (email: string, password: string, tenantSlug: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      const loginRequest: LoginRequest = {
        email,
        password,
        accountType: 'tenant' as AccountType,
        tenant_slug: tenantSlug,
      };
      
      const response = await authService.login(loginRequest);
      
      if (response.user && response.tenant) {
        setUserState(response.user);
        setTenantState(response.tenant);
        
        if (response.permissions) {
          setPermissions(response.permissions);
        }
        if (response.roles) {
          setRoles(response.roles);
        }
        
        setUserContext({
          id: response.user.uuid,
          email: response.user.email,
          name: response.user.name,
          account_type: 'tenant',
        });
        
        setTenantContext({
          id: response.tenant.uuid,
          name: response.tenant.name,
          domain: response.tenant.domain,
        });
        
        logger.info('Tenant user login successful', {
          user_id: response.user.uuid,
          tenant_id: response.tenant.uuid,
          tenant_slug: tenantSlug,
          roles: response.roles,
        });
      } else {
        throw new Error('Tenant user data not received');
      }
    } catch (err) {
      logger.error('Tenant login failed', err instanceof Error ? err : new Error(String(err)), {
        email,
        tenant_slug: tenantSlug,
      });
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // CRITICAL: Only clear auth if current account is tenant
      // Do NOT clear platform auth by mistake
      const currentAccountType = authService.getAccountType();
      
      if (currentAccountType !== 'tenant') {
        console.warn('TenantAuthContext: Logout called but account type is not tenant', {
          currentAccountType,
        });
        // Clear local state but do NOT touch global auth
        setUserState(null);
        setTenantState(null);
        setPermissions([]);
        setRoles([]);
        setIsLoading(false);
        return;
      }
      
      // Clear local state immediately to prevent UI confusion
      setUserState(null);
      setTenantState(null);
      setPermissions([]);
      setRoles([]);
      clearError();
      
      // Try to call logout API, but don't fail if it doesn't work
      try {
        await authService.logout();
      } catch (logoutError) {
        console.warn('TenantAuthContext: Logout API call failed, continuing with local cleanup', logoutError);
      }
      
      authService.clearAuth();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('account_type');
      
      clearUserContext();
      clearTenantContext();
      
      logger.info('Tenant user logout successful');
      
      console.log('TenantAuthContext: Tenant logout completed successfully');
      
    } catch (err) {
      console.error('TenantAuthContext: Logout failed', err);
      
      // Only force cleanup if this is actually a tenant session
      const currentAccountType = authService.getAccountType();
      if (currentAccountType === 'tenant') {
        authService.clearAuth();
        localStorage.clear();
      }
    } finally {
      setIsLoading(false);
      // Navigate to login page only if we actually logged out a tenant
      const currentAccountType = authService.getAccountType();
      if (!currentAccountType && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, [clearError]);

  const getCurrentUser = useCallback(async () => {
    // Don't make API calls if not authenticated or already loading
    if (!authService.isAuthenticated() || isLoading) {
      return;
    }

    // CRITICAL FIX: Don't make API calls with demo tokens
    const currentToken = authService.getToken();
    if (currentToken?.startsWith('demo_token_')) {
      console.log('TenantAuthContext: Skipping API call - demo token detected');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.getCurrentUser();
      
      if (response.user) {
        setUserState(response.user);
      }
      if (response.tenant) {
        setTenantState(response.tenant);
      }
    } catch (err) {
      console.error('TenantAuthContext: getCurrentUser failed', err);
      // Don't set error state for authentication failures to prevent loops
      // handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const value: TenantAuthContextType = useMemo(() => ({
    user,
    tenant,
    permissions,
    roles,
    isAuthenticated: !!user && !!tenant,
    isLoading,
    error,
    login,
    logout,
    getCurrentUser,
    clearError,
  }), [user, tenant, permissions, roles, isLoading, error, login, logout, getCurrentUser, clearError]);


  return (
    <TenantAuthContext.Provider value={value}>
      {children}
    </TenantAuthContext.Provider>
  );
};

export const useTenantAuth = () => {
  const context = useContext(TenantAuthContext);
  if (context === undefined) {
    throw new Error('useTenantAuth must be used within a TenantAuthProvider');
  }
  return context;
};