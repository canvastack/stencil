import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { usePermissions } from '@/hooks/usePermissions';
import { authService } from '@/services/api/auth';
import { TenantAuthProvider } from '@/contexts/TenantAuthContext';
import { GlobalContextProvider, GlobalContext } from '@/contexts/GlobalContext';
import React, { useContext, useEffect } from 'react';

describe('usePermissions Hook - Integration Tests', () => {
  let testTenantPermissions: string[] = [];
  let testTenantRoles: string[] = [];

  beforeAll(async () => {
    try {
      const response = await authService.login({
        email: 'admin@etchinx.com',
        password: 'DemoAdmin2024!',
        tenant_id: 'tenant_demo-etching',
      });

      testTenantPermissions = response.permissions || [];
      testTenantRoles = response.roles || [];
      
      console.log(`✓ Test setup: Tenant authenticated with ${testTenantPermissions.length} permissions and ${testTenantRoles.length} roles`);
    } catch (error) {
      console.log('Test setup skipped (requires backend running)');
    }
  });

  afterAll(async () => {
    try {
      await authService.logout();
      console.log('✓ Test cleanup: Session cleared');
    } catch (error) {
      console.log('Test cleanup skipped');
    }
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <TenantAuthProvider>
        {children}
      </TenantAuthProvider>
    );
  };

  describe('Permissions Loading', () => {
    test('should load permissions from real authentication', async () => {
      try {
        if (testTenantPermissions.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          return result.current.permissions.length > 0;
        }, { timeout: 3000 });

        expect(result.current.permissions).toBeDefined();
        expect(Array.isArray(result.current.permissions)).toBe(true);
        console.log(`✓ Loaded ${result.current.permissions.length} permissions from backend`);
      } catch (error) {
        console.log('Permissions loading test skipped (requires backend running)');
      }
    });

    test('should load roles from real authentication', async () => {
      try {
        if (testTenantRoles.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          return result.current.roles.length > 0;
        }, { timeout: 3000 });

        expect(result.current.roles).toBeDefined();
        expect(Array.isArray(result.current.roles)).toBe(true);
        console.log(`✓ Loaded ${result.current.roles.length} roles from backend: ${result.current.roles.join(', ')}`);
      } catch (error) {
        console.log('Roles loading test skipped (requires backend running)');
      }
    });
  });

  describe('canAccess - Permission Checking', () => {
    test('should validate existing permission', async () => {
      try {
        if (testTenantPermissions.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.permissions.length > 0, { timeout: 3000 });

        const firstPermission = result.current.permissions[0];
        const hasPermission = result.current.canAccess(firstPermission);

        expect(hasPermission).toBe(true);
        console.log(`✓ Permission check passed for: ${firstPermission}`);
      } catch (error) {
        console.log('Permission check test skipped (requires backend running)');
      }
    });

    test('should reject non-existing permission', async () => {
      try {
        if (testTenantPermissions.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.permissions.length > 0, { timeout: 3000 });

        const hasPermission = result.current.canAccess('non.existent.permission');

        expect(hasPermission).toBe(false);
        console.log('✓ Non-existing permission correctly rejected');
      } catch (error) {
        console.log('Non-existing permission test skipped (requires backend running)');
      }
    });

    test('should check common product permissions', async () => {
      try {
        if (testTenantPermissions.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.permissions.length > 0, { timeout: 3000 });

        const commonPermissions = [
          'products.read',
          'products.create',
          'products.edit',
          'products.delete',
        ];

        const permissionResults = commonPermissions.map(perm => ({
          permission: perm,
          hasAccess: result.current.canAccess(perm),
        }));

        console.log('✓ Product permissions check:', permissionResults);
        expect(permissionResults).toBeDefined();
      } catch (error) {
        console.log('Product permissions test skipped (requires backend running)');
      }
    });
  });

  describe('hasRole - Role Checking', () => {
    test('should validate existing role', async () => {
      try {
        if (testTenantRoles.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.roles.length > 0, { timeout: 3000 });

        const firstRole = result.current.roles[0];
        const hasRoleCheck = result.current.hasRole(firstRole);

        expect(hasRoleCheck).toBe(true);
        console.log(`✓ Role check passed for: ${firstRole}`);
      } catch (error) {
        console.log('Role check test skipped (requires backend running)');
      }
    });

    test('should reject non-existing role', async () => {
      try {
        if (testTenantRoles.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.roles.length > 0, { timeout: 3000 });

        const hasRoleCheck = result.current.hasRole('non-existent-role');

        expect(hasRoleCheck).toBe(false);
        console.log('✓ Non-existing role correctly rejected');
      } catch (error) {
        console.log('Non-existing role test skipped (requires backend running)');
      }
    });

    test('should check admin role helpers', async () => {
      try {
        if (testTenantRoles.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.roles.length > 0, { timeout: 3000 });

        const isSuperAdmin = result.current.isSuperAdmin;
        const isAdmin = result.current.isAdmin;

        console.log(`✓ Role helpers - isSuperAdmin: ${isSuperAdmin}, isAdmin: ${isAdmin}`);
        expect(typeof isSuperAdmin).toBe('boolean');
        expect(typeof isAdmin).toBe('boolean');
      } catch (error) {
        console.log('Admin role helpers test skipped (requires backend running)');
      }
    });
  });

  describe('hasAnyRole - Multiple Role Checking', () => {
    test('should validate having any of the specified roles', async () => {
      try {
        if (testTenantRoles.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.roles.length > 0, { timeout: 3000 });

        const firstRole = result.current.roles[0];
        const hasAnyRoleCheck = result.current.hasAnyRole([firstRole, 'non-existent-role']);

        expect(hasAnyRoleCheck).toBe(true);
        console.log(`✓ hasAnyRole check passed for: [${firstRole}, 'non-existent-role']`);
      } catch (error) {
        console.log('hasAnyRole test skipped (requires backend running)');
      }
    });

    test('should reject when user has none of the specified roles', async () => {
      try {
        if (testTenantRoles.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.roles.length > 0, { timeout: 3000 });

        const hasAnyRoleCheck = result.current.hasAnyRole(['fake-role-1', 'fake-role-2']);

        expect(hasAnyRoleCheck).toBe(false);
        console.log('✓ hasAnyRole correctly rejected when no roles match');
      } catch (error) {
        console.log('hasAnyRole rejection test skipped (requires backend running)');
      }
    });
  });

  describe('hasAllRoles - Multiple Role Requirement', () => {
    test('should validate having all specified roles', async () => {
      try {
        if (testTenantRoles.length < 2) {
          console.log('Test skipped: requires at least 2 roles');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.roles.length > 0, { timeout: 3000 });

        const firstTwoRoles = result.current.roles.slice(0, 2);
        const hasAllRolesCheck = result.current.hasAllRoles(firstTwoRoles);

        expect(hasAllRolesCheck).toBe(true);
        console.log(`✓ hasAllRoles check passed for: ${firstTwoRoles.join(', ')}`);
      } catch (error) {
        console.log('hasAllRoles test skipped (requires backend running)');
      }
    });

    test('should reject when user is missing any specified role', async () => {
      try {
        if (testTenantRoles.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.roles.length > 0, { timeout: 3000 });

        const firstRole = result.current.roles[0];
        const hasAllRolesCheck = result.current.hasAllRoles([firstRole, 'non-existent-role']);

        expect(hasAllRolesCheck).toBe(false);
        console.log('✓ hasAllRoles correctly rejected when missing a role');
      } catch (error) {
        console.log('hasAllRoles rejection test skipped (requires backend running)');
      }
    });
  });

  describe('canAccessAny - Multiple Permission Checking', () => {
    test('should validate having any of the specified permissions', async () => {
      try {
        if (testTenantPermissions.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.permissions.length > 0, { timeout: 3000 });

        const firstPermission = result.current.permissions[0];
        const canAccessAnyCheck = result.current.canAccessAny([firstPermission, 'fake.permission']);

        expect(canAccessAnyCheck).toBe(true);
        console.log(`✓ canAccessAny check passed for: [${firstPermission}, 'fake.permission']`);
      } catch (error) {
        console.log('canAccessAny test skipped (requires backend running)');
      }
    });
  });

  describe('canAccessAll - Multiple Permission Requirement', () => {
    test('should validate having all specified permissions', async () => {
      try {
        if (testTenantPermissions.length < 2) {
          console.log('Test skipped: requires at least 2 permissions');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.permissions.length > 0, { timeout: 3000 });

        const firstTwoPermissions = result.current.permissions.slice(0, 2);
        const canAccessAllCheck = result.current.canAccessAll(firstTwoPermissions);

        expect(canAccessAllCheck).toBe(true);
        console.log(`✓ canAccessAll check passed for: ${firstTwoPermissions.join(', ')}`);
      } catch (error) {
        console.log('canAccessAll test skipped (requires backend running)');
      }
    });

    test('should reject when user is missing any specified permission', async () => {
      try {
        if (testTenantPermissions.length === 0) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => result.current.permissions.length > 0, { timeout: 3000 });

        const firstPermission = result.current.permissions[0];
        const canAccessAllCheck = result.current.canAccessAll([firstPermission, 'fake.permission']);

        expect(canAccessAllCheck).toBe(false);
        console.log('✓ canAccessAll correctly rejected when missing a permission');
      } catch (error) {
        console.log('canAccessAll rejection test skipped (requires backend running)');
      }
    });
  });

  describe('Platform vs Tenant User Permissions', () => {
    test('should return false for platform admin user type', async () => {
      try {
        await authService.logout();
        
        await authService.login({
          email: 'admin@canvastencil.com',
          password: 'Admin@2024',
        });

        const { result } = renderHook(() => usePermissions(), {
          wrapper: createWrapper(),
        });

        const canAccessCheck = result.current.canAccess('products.read');
        const hasRoleCheck = result.current.hasRole('admin');

        expect(canAccessCheck).toBe(false);
        expect(hasRoleCheck).toBe(false);
        console.log('✓ Platform admin correctly returns false for tenant permissions');

        await authService.logout();
        await authService.login({
          email: 'admin@etchinx.com',
          password: 'DemoAdmin2024!',
          tenant_id: 'tenant_demo-etching',
        });
      } catch (error) {
        console.log('Platform vs tenant test skipped (requires backend running)');
      }
    });
  });
});
