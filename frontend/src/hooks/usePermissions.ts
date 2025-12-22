import { useMemo } from 'react';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';

export const usePermissions = () => {
  const { permissions, roles } = useTenantAuth();
  const { userType } = useGlobalContext();

  const canAccess = useMemo(() => (permission: string): boolean => {
    if (userType !== 'tenant') {
      return false;
    }
    
    if (!permissions || permissions.length === 0) {
      return false;
    }

    return permissions.includes(permission);
  }, [permissions, userType]);

  const hasRole = useMemo(() => (role: string): boolean => {
    if (userType !== 'tenant') {
      return false;
    }
    
    if (!roles || roles.length === 0) {
      return false;
    }

    return roles.includes(role);
  }, [roles, userType]);

  const hasAnyRole = useMemo(() => (roleList: string[]): boolean => {
    if (userType !== 'tenant') {
      return false;
    }
    
    if (!roles || roles.length === 0) {
      return false;
    }

    return roleList.some(role => roles.includes(role));
  }, [roles, userType]);

  const hasAllRoles = useMemo(() => (roleList: string[]): boolean => {
    if (userType !== 'tenant') {
      return false;
    }
    
    if (!roles || roles.length === 0) {
      return false;
    }

    return roleList.every(role => roles.includes(role));
  }, [roles, userType]);

  const canAccessAny = useMemo(() => (permissionList: string[]): boolean => {
    if (userType !== 'tenant') {
      return false;
    }
    
    if (!permissions || permissions.length === 0) {
      return false;
    }

    return permissionList.some(permission => permissions.includes(permission));
  }, [permissions, userType]);

  const canAccessAll = useMemo(() => (permissionList: string[]): boolean => {
    if (userType !== 'tenant') {
      return false;
    }
    
    if (!permissions || permissions.length === 0) {
      return false;
    }

    return permissionList.every(permission => permissions.includes(permission));
  }, [permissions, userType]);

  return useMemo(() => ({
    permissions,
    roles,
    canAccess,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccessAny,
    canAccessAll,
    isSuperAdmin: hasRole('super-admin'),
    isAdmin: hasRole('admin'),
  }), [permissions, roles, canAccess, hasRole, hasAnyRole, hasAllRoles, canAccessAny, canAccessAll]);
};
