import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { useGlobalContext } from '@/contexts/GlobalContext';

interface PlatformRouteGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
}

export const PlatformRouteGuard = ({ children, requiredPermissions = [] }: PlatformRouteGuardProps) => {
  const { isAuthenticated, account, permissions } = usePlatformAuth();
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

  // Check global context - must be platform user
  if (userType !== 'platform') {
    return <Navigate 
      to="/login" 
      state={{ from: location, error: 'Platform access required. Please login as platform administrator.' }} 
      replace 
    />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !account) {
    return <Navigate 
      to="/login" 
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