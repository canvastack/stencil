import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalContext, UserType } from '@/contexts/GlobalContext';
import { authService } from '@/services/api/auth';

export interface ContextDetectionConfig {
  /** Redirect anonymous users to platform content */
  redirectAnonymousToHome?: boolean;
  /** Allow access to protected routes based on context */
  enforceAuthentication?: boolean;
  /** Automatically detect context on route changes */
  autoDetectOnRouteChange?: boolean;
}

export interface UseContextDetectionReturn {
  currentContext: UserType;
  isContextLoading: boolean;
  contextError: string | null;
  /** Manually trigger context detection */
  refreshContext: () => Promise<UserType>;
  /** Check if current route is accessible with current context */
  isRouteAccessible: (path: string) => boolean;
  /** Navigate to appropriate default route for current context */
  navigateToDefaultRoute: () => void;
  /** Get default route for specific context */
  getDefaultRoute: (context: UserType) => string;
}

const DEFAULT_CONFIG: ContextDetectionConfig = {
  redirectAnonymousToHome: true,
  enforceAuthentication: false,
  autoDetectOnRouteChange: true
};

export const useContextDetection = (
  config: ContextDetectionConfig = DEFAULT_CONFIG
): UseContextDetectionReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const globalContext = useGlobalContext();
  
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refreshContext = useCallback(async (): Promise<UserType> => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      return await globalContext.detectContext();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh context';
      setLocalError(errorMessage);
      console.error('useContextDetection: Error refreshing context:', err);
      return 'anonymous';
    } finally {
      setLocalLoading(false);
    }
  }, [globalContext]);

  const getDefaultRoute = useCallback((context: UserType): string => {
    switch (context) {
      case 'platform':
        return '/platform/dashboard';
      case 'tenant':
        return '/admin';
      case 'anonymous':
      default:
        return '/';
    }
  }, []);

  const isRouteAccessible = useCallback((path: string): boolean => {
    const context = globalContext.userType;
    
    // Public routes accessible by all
    const publicRoutes = [
      '/',
      '/about',
      '/contact',
      '/products',
      '/cart',
      '/faq',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/verify-email'
    ];

    if (publicRoutes.some(route => path === route || path.startsWith(route + '/'))) {
      return true;
    }

    // Platform routes
    if (path.startsWith('/platform')) {
      return context === 'platform';
    }

    // Tenant admin routes
    if (path.startsWith('/admin')) {
      return context === 'tenant';
    }

    // Default: allow access
    return true;
  }, [globalContext.userType]);

  const navigateToDefaultRoute = useCallback(() => {
    const defaultRoute = getDefaultRoute(globalContext.userType);
    console.log(`useContextDetection: Navigating to default route for ${globalContext.userType}: ${defaultRoute}`);
    navigate(defaultRoute);
  }, [globalContext.userType, getDefaultRoute, navigate]);

  // Auto-detect context on mount
  useEffect(() => {
    if (config.autoDetectOnRouteChange) {
      refreshContext();
    }
  }, [refreshContext, config.autoDetectOnRouteChange]);

  // Handle route access enforcement
  useEffect(() => {
    if (!config.enforceAuthentication) return;
    
    const currentPath = location.pathname;
    
    if (!isRouteAccessible(currentPath)) {
      console.log(`useContextDetection: Route ${currentPath} not accessible for context ${globalContext.userType}`);
      
      if (globalContext.userType === 'anonymous' && config.redirectAnonymousToHome) {
        console.log('useContextDetection: Redirecting anonymous user to home');
        navigate('/', { replace: true });
      } else {
        console.log('useContextDetection: Redirecting to default route for context');
        navigateToDefaultRoute();
      }
    }
  }, [
    location.pathname,
    globalContext.userType,
    config.enforceAuthentication,
    config.redirectAnonymousToHome,
    isRouteAccessible,
    navigate,
    navigateToDefaultRoute
  ]);

  // Handle automatic redirection for anonymous users
  useEffect(() => {
    if (
      config.redirectAnonymousToHome && 
      globalContext.userType === 'anonymous' && 
      (location.pathname.startsWith('/platform') || location.pathname.startsWith('/admin'))
    ) {
      console.log('useContextDetection: Redirecting anonymous user from protected route to home');
      navigate('/', { replace: true });
    }
  }, [
    globalContext.userType,
    location.pathname,
    config.redirectAnonymousToHome,
    navigate
  ]);

  return {
    currentContext: globalContext.userType,
    isContextLoading: globalContext.isLoading || localLoading,
    contextError: globalContext.error || localError,
    refreshContext,
    isRouteAccessible,
    navigateToDefaultRoute,
    getDefaultRoute
  };
};