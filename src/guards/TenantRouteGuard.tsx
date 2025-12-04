import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { useGlobalContext } from '@/contexts/GlobalContext';

interface TenantRouteGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

export const TenantRouteGuard = ({ children, requiredPermissions = [], requiredRoles = [] }: TenantRouteGuardProps) => {
  const { isAuthenticated, user, tenant, permissions, roles } = useTenantAuth();
  const { userType, isLoading } = useGlobalContext();
  const location = useLocation();

  // Show loading while context is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check global context - must be tenant user
  if (userType !== 'tenant') {
    return <Navigate 
      to="/login" 
      state={{ from: location, error: 'Tenant access required. Please login as business administrator.' }} 
      replace 
    />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user || !tenant) {
    return <Navigate 
      to="/login" 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check permissions if required
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      permissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      return <Navigate 
        to="/admin/dashboard" 
        state={{ error: 'Access denied: Insufficient permissions' }} 
        replace 
      />;
    }
  }

  // Check roles if required
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role =>
      roles.includes(role)
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