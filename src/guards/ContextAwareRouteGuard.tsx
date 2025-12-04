import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGlobalContext, type UserType } from '@/contexts/GlobalContext';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { useTenantAuth } from '@/hooks/useTenantAuth';

interface ContextAwareRouteGuardProps {
  children: ReactNode;
  allowedContexts: UserType[];
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallbackRoute?: string;
}

export const ContextAwareRouteGuard = ({ 
  children, 
  allowedContexts, 
  requiredPermissions = [], 
  requiredRoles = [],
  fallbackRoute = '/login'
}: ContextAwareRouteGuardProps) => {
  const { userType, isLoading } = useGlobalContext();
  const { isAuthenticated: isPlatformAuth, permissions: platformPermissions } = usePlatformAuth();
  const { isAuthenticated: isTenantAuth, permissions: tenantPermissions, roles: tenantRoles } = useTenantAuth();
  const location = useLocation();

  // Show loading while context is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if current context is allowed
  if (!allowedContexts.includes(userType)) {
    const contextLabels = {
      anonymous: 'public access',
      platform: 'platform administration',
      tenant: 'business administration'
    };
    
    const allowedLabels = allowedContexts.map(ctx => contextLabels[ctx]).join(' or ');
    
    return <Navigate 
      to={fallbackRoute} 
      state={{ 
        from: location, 
        error: `Access denied: This page requires ${allowedLabels}.` 
      }} 
      replace 
    />;
  }

  // For anonymous users, no further validation needed
  if (userType === 'anonymous') {
    return <>{children}</>;
  }

  // Check authentication for non-anonymous contexts
  const isAuthenticated = userType === 'platform' ? isPlatformAuth : isTenantAuth;
  if (!isAuthenticated) {
    return <Navigate 
      to={fallbackRoute} 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check permissions if required
  if (requiredPermissions.length > 0) {
    const currentPermissions = userType === 'platform' ? platformPermissions : tenantPermissions;
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      currentPermissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      const dashboardRoute = userType === 'platform' ? '/platform/dashboard' : '/admin/dashboard';
      return <Navigate 
        to={dashboardRoute} 
        state={{ error: 'Access denied: Insufficient permissions' }} 
        replace 
      />;
    }
  }

  // Check roles if required (only applicable to tenant users)
  if (requiredRoles.length > 0 && userType === 'tenant') {
    const hasRequiredRole = requiredRoles.some(role =>
      tenantRoles.includes(role)
    );

    if (!hasRequiredRole) {
      return <Navigate 
        to="/admin/dashboard" 
        state={{ error: 'Access denied: Insufficient role' }} 
        replace 
      />;
    }
  }

  return <>{children}</>;
};

// Convenience components for specific contexts
export const PlatformOnlyGuard = ({ children, requiredPermissions, fallbackRoute }: {
  children: ReactNode;
  requiredPermissions?: string[];
  fallbackRoute?: string;
}) => (
  <ContextAwareRouteGuard 
    allowedContexts={['platform']}
    requiredPermissions={requiredPermissions}
    fallbackRoute={fallbackRoute}
  >
    {children}
  </ContextAwareRouteGuard>
);

export const TenantOnlyGuard = ({ children, requiredPermissions, requiredRoles, fallbackRoute }: {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallbackRoute?: string;
}) => (
  <ContextAwareRouteGuard 
    allowedContexts={['tenant']}
    requiredPermissions={requiredPermissions}
    requiredRoles={requiredRoles}
    fallbackRoute={fallbackRoute}
  >
    {children}
  </ContextAwareRouteGuard>
);

export const AuthenticatedGuard = ({ children, requiredPermissions, requiredRoles, fallbackRoute }: {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallbackRoute?: string;
}) => (
  <ContextAwareRouteGuard 
    allowedContexts={['platform', 'tenant']}
    requiredPermissions={requiredPermissions}
    requiredRoles={requiredRoles}
    fallbackRoute={fallbackRoute}
  >
    {children}
  </ContextAwareRouteGuard>
);

export const PublicGuard = ({ children }: {
  children: ReactNode;
}) => (
  <ContextAwareRouteGuard 
    allowedContexts={['anonymous', 'platform', 'tenant']}
  >
    {children}
  </ContextAwareRouteGuard>
);