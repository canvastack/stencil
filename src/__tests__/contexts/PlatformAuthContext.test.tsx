import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlatformAuthProvider, usePlatformAuth } from '../../contexts/PlatformAuthContext';
import { authService } from '../../services/api/auth';

// Mock the auth service
vi.mock('../../services/api/auth', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    getAccountType: vi.fn(),
    getPlatformAccountFromStorage: vi.fn(),
    getPermissionsFromStorage: vi.fn(),
    clearAuth: vi.fn(),
  }
}));

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
    account,
    permissions,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getCurrentAccount,
    clearError
  } = usePlatformAuth();

  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="account-name">{account?.name || 'no-account'}</div>
      <div data-testid="permissions-count">{permissions.length}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => getCurrentAccount()}>Get Account</button>
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PlatformAuthProvider>
      {component}
    </PlatformAuthProvider>
  );
};

describe('PlatformAuthContext', () => {
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
    expect(screen.getByTestId('account-name')).toHaveTextContent('no-account');
    expect(screen.getByTestId('permissions-count')).toHaveTextContent('0');
  });

  it('initializes from localStorage when platform account exists', () => {
    const mockAccount = {
      id: '1',
      uuid: 'test-uuid',
      email: 'platform@example.com',
      name: 'Platform Admin',
      email_verified_at: '2024-01-01T00:00:00Z'
    };

    const mockPermissions = ['platform:read', 'platform:write'];

    authService.getAccountType = vi.fn().mockReturnValue('platform');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);
    authService.getPlatformAccountFromStorage = vi.fn().mockReturnValue(mockAccount);
    authService.getPermissionsFromStorage = vi.fn().mockReturnValue(mockPermissions);

    renderWithProvider(<TestComponent />);

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('account-name')).toHaveTextContent('Platform Admin');
    expect(screen.getByTestId('permissions-count')).toHaveTextContent('2');
  });

  it('handles successful login', async () => {
    const mockLoginResponse = {
      account: {
        id: '1',
        uuid: 'test-uuid',
        email: 'platform@example.com',
        name: 'Platform Admin',
        email_verified_at: '2024-01-01T00:00:00Z'
      },
      permissions: ['platform:read', 'platform:write']
    };

    authService.login = vi.fn().mockResolvedValue(mockLoginResponse);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('account-name')).toHaveTextContent('Platform Admin');
      expect(screen.getByTestId('permissions-count')).toHaveTextContent('2');
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      accountType: 'platform'
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

  it('handles successful logout', async () => {
    // Start with authenticated state
    const mockAccount = {
      id: '1',
      uuid: 'test-uuid',
      email: 'platform@example.com',
      name: 'Platform Admin',
      email_verified_at: '2024-01-01T00:00:00Z'
    };

    authService.getAccountType = vi.fn().mockReturnValue('platform');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);
    authService.getPlatformAccountFromStorage = vi.fn().mockReturnValue(mockAccount);
    authService.getPermissionsFromStorage = vi.fn().mockReturnValue(['platform:read']);
    authService.logout = vi.fn().mockResolvedValue(undefined);

    renderWithProvider(<TestComponent />);

    // Verify initial authenticated state
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('account-name')).toHaveTextContent('no-account');
      expect(screen.getByTestId('permissions-count')).toHaveTextContent('0');
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
      expect(screen.getByTestId('account-name')).toHaveTextContent('no-account');
    });
  });

  it('handles getCurrentAccount success', async () => {
    const mockResponse = {
      account: {
        id: '1',
        uuid: 'test-uuid',
        email: 'platform@example.com',
        name: 'Updated Platform Admin',
        email_verified_at: '2024-01-01T00:00:00Z'
      }
    };

    authService.getCurrentUser = vi.fn().mockResolvedValue(mockResponse);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Get Account').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('account-name')).toHaveTextContent('Updated Platform Admin');
    });
  });

  it('handles getCurrentAccount failure', async () => {
    const mockError = new Error('Failed to get account');
    authService.getCurrentUser = vi.fn().mockRejectedValue(mockError);

    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByText('Get Account').click();
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
        account: { id: '1', name: 'Test', email: 'test@example.com' }
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
    }).toThrow('usePlatformAuth must be used within a PlatformAuthProvider');

    consoleError.mockRestore();
  });

  it('handles missing account data in login response', async () => {
    const mockLoginResponse = {
      // Missing account field
      permissions: ['platform:read']
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

  it('isolates platform context from tenant context', () => {
    authService.getAccountType = vi.fn().mockReturnValue('tenant');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);

    renderWithProvider(<TestComponent />);

    // Should not initialize with tenant account type
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('account-name')).toHaveTextContent('no-account');
  });

  it('validates account type during initialization', () => {
    authService.getAccountType = vi.fn().mockReturnValue('platform');
    authService.isAuthenticated = vi.fn().mockReturnValue(true);
    authService.getPlatformAccountFromStorage = vi.fn().mockReturnValue(null);

    renderWithProvider(<TestComponent />);

    // Should not authenticate without valid platform account
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });
});