import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TenantAuthProvider, useTenantAuth } from '../../contexts/TenantAuthContext';
import { authService } from '../../services/api/auth';

// Mock the auth service
vi.mock('../../services/api/auth', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    getAccountType: vi.fn(),
    getCurrentUserFromStorage: vi.fn(),
    getCurrentTenantFromStorage: vi.fn(),
    getPermissionsFromStorage: vi.fn(),
    getRolesFromStorage: vi.fn(),
    clearAuth: vi.fn(),
  }
}));

// Mock console.log to avoid test noise
const mockConsoleLog = vi.fn();
console.log = mockConsoleLog;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test component that uses the context
const TestComponent = () => {
  const {
    user,
    tenant,
    permissions,
    roles,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getCurrentUser,
    clearError
  } = useTenantAuth();

  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="user-name">{user?.name || 'no-user'}</div>
      <div data-testid="tenant-name">{tenant?.name || 'no-tenant'}</div>
      <div data-testid="permissions-count">{permissions.length}</div>
      <div data-testid="roles-count">{roles.length}</div>
      <button onClick={() => login('test@example.com', 'password', 'test-tenant')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => getCurrentUser()}>Get User</button>
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <TenantAuthProvider>
      {component}
    </TenantAuthProvider>
  );
};

describe('TenantAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('initializes with default state', () => {
    renderWithProvider(<TestComponent />);

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('user-name')).toHaveTextContent('no-user');
    expect(screen.getByTestId('tenant-name')).toHaveTextContent('no-tenant');
    expect(screen.getByTestId('permissions-count')).toHaveTextContent('0');
    expect(screen.getByTestId('roles-count')).toHaveTextContent('0');
  });

  it('initializes from localStorage when tenant account exists', () => {
    const mockUser = {
      id: '1',
      uuid: 'user-uuid',
      tenant_id: 'tenant-1',
      email: 'user@tenant.com',
      name: 'Tenant User'
    };

    const mockTenant = {
      id: 'tenant-1',
      uuid: 'tenant-uuid',
      name: 'Test Tenant',
      slug: 'test-tenant'
    };

    const mockPermissions = ['tenant:read', 'tenant:write'];
    const mockRoles = ['admin'];

    authService.getAccountType = vi.fn().mockReturnValue('tenant');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);
    authService.getCurrentUserFromStorage = vi.fn().mockReturnValue(mockUser);
    authService.getCurrentTenantFromStorage = vi.fn().mockReturnValue(mockTenant);
    authService.getPermissionsFromStorage = vi.fn().mockReturnValue(mockPermissions);
    authService.getRolesFromStorage = vi.fn().mockReturnValue(mockRoles);

    renderWithProvider(<TestComponent />);

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Tenant User');
    expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');
    expect(screen.getByTestId('permissions-count')).toHaveTextContent('2');
    expect(screen.getByTestId('roles-count')).toHaveTextContent('1');
  });

  it('clears auth when user data is incomplete during initialization', () => {
    const mockUser = {
      id: '1',
      uuid: 'user-uuid',
      tenant_id: 'tenant-1',
      email: 'user@tenant.com',
      name: 'Tenant User'
    };
    // Missing tenant data

    authService.getAccountType = vi.fn().mockReturnValue('tenant');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);
    authService.getCurrentUserFromStorage = vi.fn().mockReturnValue(mockUser);
    authService.getCurrentTenantFromStorage = vi.fn().mockReturnValue(null);
    authService.clearAuth = vi.fn();

    renderWithProvider(<TestComponent />);

    expect(authService.clearAuth).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('clears auth when account type is wrong', () => {
    authService.getAccountType = vi.fn().mockReturnValue('platform');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);
    authService.clearAuth = vi.fn();

    renderWithProvider(<TestComponent />);

    expect(authService.clearAuth).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('handles successful login', async () => {
    const mockLoginResponse = {
      user: {
        id: '1',
        uuid: 'user-uuid',
        tenant_id: 'tenant-1',
        email: 'user@tenant.com',
        name: 'Tenant User'
      },
      tenant: {
        id: 'tenant-1',
        uuid: 'tenant-uuid',
        name: 'Test Tenant',
        slug: 'test-tenant'
      },
      permissions: ['tenant:read', 'tenant:write'],
      roles: ['admin']
    };

    authService.login = vi.fn().mockResolvedValue(mockLoginResponse);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Tenant User');
      expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');
      expect(screen.getByTestId('permissions-count')).toHaveTextContent('2');
      expect(screen.getByTestId('roles-count')).toHaveTextContent('1');
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      accountType: 'tenant',
      tenant_slug: 'test-tenant'
    });
  });

  it('handles login failure', async () => {
    const mockError = new Error('Invalid credentials');
    authService.login = vi.fn().mockRejectedValue(mockError);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('handles missing user or tenant data in login response', async () => {
    const mockLoginResponse = {
      user: {
        id: '1',
        name: 'User'
      },
      // Missing tenant
      permissions: ['tenant:read']
    };

    authService.login = vi.fn().mockResolvedValue(mockLoginResponse);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('handles successful logout', async () => {
    // Start with authenticated state
    const mockUser = {
      id: '1',
      uuid: 'user-uuid',
      tenant_id: 'tenant-1',
      email: 'user@tenant.com',
      name: 'Tenant User'
    };

    const mockTenant = {
      id: 'tenant-1',
      uuid: 'tenant-uuid',
      name: 'Test Tenant',
      slug: 'test-tenant'
    };

    authService.getAccountType = vi.fn().mockReturnValue('tenant');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);
    authService.getCurrentUserFromStorage = vi.fn().mockReturnValue(mockUser);
    authService.getCurrentTenantFromStorage = vi.fn().mockReturnValue(mockTenant);
    authService.getPermissionsFromStorage = vi.fn().mockReturnValue(['tenant:read']);
    authService.getRolesFromStorage = vi.fn().mockReturnValue(['admin']);
    authService.logout = vi.fn().mockResolvedValue(undefined);

    renderWithProvider(<TestComponent />);

    // Verify initial authenticated state
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-name')).toHaveTextContent('no-user');
      expect(screen.getByTestId('tenant-name')).toHaveTextContent('no-tenant');
      expect(screen.getByTestId('permissions-count')).toHaveTextContent('0');
      expect(screen.getByTestId('roles-count')).toHaveTextContent('0');
    });

    expect(authService.logout).toHaveBeenCalled();
  });

  it('handles logout failure gracefully', async () => {
    const mockError = new Error('Logout failed');
    authService.logout = vi.fn().mockRejectedValue(mockError);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      // Even on logout failure, local state should be cleared
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-name')).toHaveTextContent('no-user');
      expect(screen.getByTestId('tenant-name')).toHaveTextContent('no-tenant');
    });
  });

  it('handles getCurrentUser success', async () => {
    const mockResponse = {
      user: {
        id: '1',
        uuid: 'user-uuid',
        tenant_id: 'tenant-1',
        email: 'user@tenant.com',
        name: 'Updated User'
      },
      tenant: {
        id: 'tenant-1',
        uuid: 'tenant-uuid',
        name: 'Updated Tenant',
        slug: 'test-tenant'
      }
    };

    authService.getCurrentUser = vi.fn().mockResolvedValue(mockResponse);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Get User').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Updated User');
      expect(screen.getByTestId('tenant-name')).toHaveTextContent('Updated Tenant');
    });
  });

  it('handles getCurrentUser failure', async () => {
    const mockError = new Error('Failed to get user');
    authService.getCurrentUser = vi.fn().mockRejectedValue(mockError);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Get User').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
    });
  });

  it('clears error state', async () => {
    const mockError = new Error('Test error');
    authService.login = vi.fn().mockRejectedValue(mockError);

    renderWithProvider(<TestComponent />);

    // Trigger an error
    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
    });

    // Clear the error
    await act(async () => {
      screen.getByText('Clear Error').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('shows loading state during operations', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });

    authService.login = vi.fn().mockReturnValue(loginPromise);

    renderWithProvider(<TestComponent />);

    // Start login
    act(() => {
      screen.getByText('Login').click();
    });

    // Should show loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // Resolve login
    await act(async () => {
      resolveLogin!({
        user: { id: '1', name: 'Test', email: 'test@example.com', tenant_id: '1' },
        tenant: { id: '1', name: 'Test Tenant', slug: 'test' }
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('throws error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTenantAuth must be used within a TenantAuthProvider');

    consoleError.mockRestore();
  });

  it('requires both user and tenant for authentication', () => {
    const mockUser = {
      id: '1',
      uuid: 'user-uuid',
      tenant_id: 'tenant-1',
      email: 'user@tenant.com',
      name: 'Tenant User'
    };

    authService.getAccountType = vi.fn().mockReturnValue('tenant');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);
    authService.getCurrentUserFromStorage = vi.fn().mockReturnValue(mockUser);
    authService.getCurrentTenantFromStorage = vi.fn().mockReturnValue(null);

    renderWithProvider(<TestComponent />);

    // Should not be authenticated without both user and tenant
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('isolates tenant context from platform context', () => {
    authService.getAccountType = vi.fn().mockReturnValue('platform');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);

    renderWithProvider(<TestComponent />);

    // Should not initialize with platform account type
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user-name')).toHaveTextContent('no-user');
  });

  it('logs initialization process', () => {
    authService.getAccountType = vi.fn().mockReturnValue('tenant');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);

    renderWithProvider(<TestComponent />);

    // Should have logged initialization details
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'TenantAuthContext: Initializing from storage',
      expect.any(Object)
    );
  });

  it('validates tenant slug parameter in login', async () => {
    const mockLoginResponse = {
      user: {
        id: '1',
        name: 'User',
        email: 'test@example.com',
        tenant_id: '1'
      },
      tenant: {
        id: '1',
        name: 'Tenant',
        slug: 'test-tenant'
      }
    };

    authService.login = vi.fn().mockResolvedValue(mockLoginResponse);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(authService.login).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_slug: 'test-tenant'
      })
    );
  });
});