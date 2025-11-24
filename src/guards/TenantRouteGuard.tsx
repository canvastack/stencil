import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from '@/hooks/useTenantAuth';

interface TenantRouteGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

export const TenantRouteGuard = ({ children, requiredPermissions = [], requiredRoles = [] }: TenantRouteGuardProps) => {
  const { isAuthenticated, user, tenant, permissions, roles } = useTenantAuth();
  const location = useLocation();

  // Not authenticated - redirect to tenant login
  if (!isAuthenticated || !user || !tenant) {
    return <Navigate 
      to="/admin/login" 
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