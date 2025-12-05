import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService } from '@/services/api/auth';
import type { AuthUser, AuthTenant, LoginRequest, AccountType } from '@/services/api/auth';
import { handleApiError } from '@/services/api/errorHandler';

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<AuthTenant | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  // CRITICAL FIX: Start with loading=true during initialization
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      // CRITICAL FIX: Check if token is a demo token and clear if so
      if (storedToken && authService.isDemoToken(storedToken)) {
        console.log('TenantAuthContext: Demo token detected, clearing auth to force real login');
        authService.clearAuth();
        // Reset all local state after clearing auth
        setUser(null);
        setTenant(null);
        setPermissions([]);
        setRoles([]);
        return;
      }
      
      // Also check if there's no token at all (auth was cleared)
      if (!storedToken) {
        console.log('TenantAuthContext: No token found, clearing tenant state');
        setUser(null);
        setTenant(null);
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
        hasRealToken: !!storedToken && !authService.isDemoToken(storedToken),
        tokenSnippet: storedToken?.substring(0, 20) + '...',
        userSnippet: storedUser ? {id: storedUser.id, email: storedUser.email} : null,
        tenantSnippet: storedTenant ? {id: storedTenant.id, name: storedTenant.name, slug: storedTenant.slug} : null
      });
      
      if (storedUser && storedTenant) {
        setUser(storedUser);
        setTenant(storedTenant);
        setPermissions(storedPermissions);
        setRoles(storedRoles);
      } else {
        console.log('TenantAuthContext: Missing user or tenant data, but keeping token (might be login in progress)');
        // FIXED: Don't clear auth immediately - user might be in the middle of login process
        // or data might be temporarily unavailable. Only clear if explicitly demo token
        setUser(null);
        setTenant(null);
        setPermissions([]);
        setRoles([]);
      }
    } else if (storedAccountType && storedAccountType !== 'tenant') {
      console.log('TenantAuthContext: Wrong account type, clearing auth');
      authService.clearAuth();
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
        setUser(response.user);
        setTenant(response.tenant);
        
        if (response.permissions) {
          setPermissions(response.permissions);
        }
        if (response.roles) {
          setRoles(response.roles);
        }
      } else {
        throw new Error('Tenant user data not received');
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
      
      // Clear local state immediately to prevent UI confusion
      setUser(null);
      setTenant(null);
      setPermissions([]);
      setRoles([]);
      clearError();
      
      // Try to call logout API, but don't fail if it doesn't work
      try {
        await authService.logout();
      } catch (logoutError) {
        console.warn('TenantAuthContext: Logout API call failed, continuing with local cleanup', logoutError);
      }
      
      // Force complete cleanup regardless of API response
      authService.clearAuth();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('account_type');
      
      console.log('TenantAuthContext: Logout completed successfully');
      
    } catch (err) {
      console.error('TenantAuthContext: Logout failed', err);
      // Force cleanup even on error
      authService.clearAuth();
      localStorage.clear();
    } finally {
      setIsLoading(false);
      // Navigate to login page
      if (window.location.pathname !== '/login') {
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
        setUser(response.user);
      }
      if (response.tenant) {
        setTenant(response.tenant);
      }
    } catch (err) {
      console.error('TenantAuthContext: getCurrentUser failed', err);
      // Don't set error state for authentication failures to prevent loops
      // handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, isLoading]);

  const value: TenantAuthContextType = {
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
  };

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