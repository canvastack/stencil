import { useCallback, useEffect, useState, useMemo } from 'react';
import { useGlobalContext, UserType } from '@/contexts/GlobalContext';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { authService } from '@/services/api/auth';

export interface AuthState {
  /** Current user type */
  userType: UserType;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication check is loading */
  isLoading: boolean;
  /** Authentication error */
  error: string | null;
  /** Platform account information */
  platformAccount: any | null;
  /** Tenant user information */
  tenantUser: any | null;
  /** Current tenant information */
  tenant: any | null;
  /** User permissions */
  permissions: string[];
  /** User roles (tenant only) */
  roles: string[];
  /** Whether user is anonymous */
  isAnonymous: boolean;
  /** Whether user is platform admin */
  isPlatformAdmin: boolean;
  /** Whether user is tenant user */
  isTenantUser: boolean;
}

export interface AuthActions {
  /** Login as platform user */
  loginAsPlatform: (email: string, password: string) => Promise<void>;
  /** Login as tenant user */
  loginAsTenant: (email: string, password: string, tenantSlug: string) => Promise<void>;
  /** Logout current user */
  logout: () => Promise<void>;
  /** Refresh current authentication state */
  refreshAuth: () => Promise<void>;
  /** Clear authentication errors */
  clearError: () => void;
  /** Switch between contexts (admin only) */
  switchContext: (type: Exclude<UserType, 'anonymous'>) => Promise<void>;
}

export interface UseAuthStateReturn extends AuthState, AuthActions {}

export const useAuthState = (): UseAuthStateReturn => {
  const globalContext = useGlobalContext();
  const platformAuth = usePlatformAuth();
  const tenantAuth = useTenantAuth();
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  // Centralized authentication state
  const authState: AuthState = useMemo(() => {
    return {
      userType: globalContext.userType,
      isAuthenticated: globalContext.userType !== 'anonymous',
      isLoading: globalContext.isLoading || platformAuth.isLoading || tenantAuth.isLoading || isLocalLoading,
      error: globalContext.error || platformAuth.error || tenantAuth.error || localError,
      platformAccount: platformAuth.account,
      tenantUser: tenantAuth.user,
      tenant: tenantAuth.tenant || globalContext.tenant,
      permissions: globalContext.userType === 'platform' ? platformAuth.permissions : tenantAuth.permissions,
      roles: tenantAuth.roles,
      isAnonymous: globalContext.isAnonymous,
      isPlatformAdmin: globalContext.isPlatformUser,
      isTenantUser: globalContext.isTenantUser
    };
  }, [
    globalContext,
    platformAuth,
    tenantAuth,
    isLocalLoading,
    localError
  ]);

  // Authentication actions
  const loginAsPlatform = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLocalLoading(true);
      setLocalError(null);
      
      await platformAuth.login(email, password);
      
      // The global context will be updated automatically via the effect in GlobalContextProvider
      console.log('useAuthState: Platform login successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Platform login failed';
      setLocalError(message);
      console.error('useAuthState: Platform login failed:', error);
      throw error;
    } finally {
      setIsLocalLoading(false);
    }
  }, [platformAuth]);

  const loginAsTenant = useCallback(async (email: string, password: string, tenantSlug: string): Promise<void> => {
    try {
      setIsLocalLoading(true);
      setLocalError(null);
      
      await tenantAuth.login(email, password, tenantSlug);
      
      // The global context will be updated automatically via the effect in GlobalContextProvider
      console.log('useAuthState: Tenant login successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tenant login failed';
      setLocalError(message);
      console.error('useAuthState: Tenant login failed:', error);
      throw error;
    } finally {
      setIsLocalLoading(false);
    }
  }, [tenantAuth]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLocalLoading(true);
      setLocalError(null);
      
      // Determine which auth context to logout from
      if (globalContext.userType === 'platform') {
        await platformAuth.logout();
      } else if (globalContext.userType === 'tenant') {
        await tenantAuth.logout();
      } else {
        // Clear any stored authentication
        authService.clearAuth();
      }
      
      // Clear global context
      globalContext.clearContext();
      
      console.log('useAuthState: Logout successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      setLocalError(message);
      console.error('useAuthState: Logout failed:', error);
    } finally {
      setIsLocalLoading(false);
    }
  }, [globalContext, platformAuth, tenantAuth]);

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      setIsLocalLoading(true);
      setLocalError(null);
      
      // Refresh global context detection
      await globalContext.detectContext();
      
      // Refresh appropriate auth context
      if (globalContext.userType === 'platform') {
        await platformAuth.getCurrentAccount();
      } else if (globalContext.userType === 'tenant') {
        await tenantAuth.getCurrentUser();
      }
      
      console.log('useAuthState: Auth refresh successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Auth refresh failed';
      setLocalError(message);
      console.error('useAuthState: Auth refresh failed:', error);
    } finally {
      setIsLocalLoading(false);
    }
  }, [globalContext, platformAuth, tenantAuth]);

  const clearError = useCallback(() => {
    setLocalError(null);
    platformAuth.clearError();
    tenantAuth.clearError();
  }, [platformAuth, tenantAuth]);

  const switchContext = useCallback(async (type: Exclude<UserType, 'anonymous'>): Promise<void> => {
    try {
      setIsLocalLoading(true);
      setLocalError(null);
      
      // Only allow context switching if user has appropriate permissions
      // This would require additional permission checks in a real implementation
      if (type === 'platform') {
        // Switch to platform context
        await globalContext.switchContext('platform');
      } else if (type === 'tenant') {
        // Switch to tenant context
        await globalContext.switchContext('tenant');
      }
      
      console.log(`useAuthState: Context switched to ${type}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Context switch failed';
      setLocalError(message);
      console.error('useAuthState: Context switch failed:', error);
      throw error;
    } finally {
      setIsLocalLoading(false);
    }
  }, [globalContext]);

  // Auto-refresh auth state on mount (only once) - DISABLED to prevent infinite loops
  useEffect(() => {
    const token = authService.getToken();
    
    // CRITICAL FIX: Clear demo tokens immediately on mount
    if (token && authService.isDemoToken(token)) {
      console.log('useAuthState: Demo token detected on mount, clearing auth');
      authService.clearAuth();
      return;
    }
    
    // Only refresh if there's a valid stored token and we're not already authenticated
    const hasValidToken = authService.isAuthenticated() && token && !token.startsWith('demo_token_');
    const needsRefresh = hasValidToken && !authState.isAuthenticated && !authState.isLoading;
    
    if (needsRefresh) {
      console.log('useAuthState: Auto-refreshing authentication on mount');
      refreshAuth();
    } else {
      console.log('useAuthState: Skipping auto-refresh to prevent loops', {
        hasValidToken,
        tokenExists: !!token,
        tokenType: token?.substring(0, 10) + '...',
        isDemoToken: token?.startsWith('demo_token_'),
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps - Only run once on mount

  // Monitor authentication state changes
  useEffect(() => {
    console.log('useAuthState: Auth state changed:', {
      userType: authState.userType,
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      hasError: !!authState.error
    });
  }, [authState.userType, authState.isAuthenticated, authState.isLoading, authState.error]);

  return {
    ...authState,
    loginAsPlatform,
    loginAsTenant,
    logout,
    refreshAuth,
    clearError,
    switchContext
  };
};