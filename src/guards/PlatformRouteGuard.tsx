import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';

interface PlatformRouteGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
}

export const PlatformRouteGuard = ({ children, requiredPermissions = [] }: PlatformRouteGuardProps) => {
  const { isAuthenticated, account, permissions } = usePlatformAuth();
  const location = useLocation();

  // Not authenticated - redirect to platform login
  if (!isAuthenticated || !account) {
    return <Navigate 
      to="/platform/login" 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check account type - must be platform_owner
  if (account.account_type !== 'platform_owner') {
    return <Navigate 
      to="/platform/login" 
      state={{ error: 'Access denied: Platform access required' }} 
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
        to="/platform/dashboard" 
        state={{ error: 'Access denied: Insufficient permissions' }} 
        replace 
      />;
    }
  }

  return <>{children}</>;
};