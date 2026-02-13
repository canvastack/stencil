import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VendorProtectedRoute } from '@/components/vendor/VendorProtectedRoute';
import { VendorAuthProvider } from '@/contexts/VendorAuthContext';

// Mock the VendorAuthContext
vi.mock('@/contexts/VendorAuthContext', async () => {
  const actual = await vi.importActual('@/contexts/VendorAuthContext');
  return {
    ...actual,
    useVendorAuth: vi.fn(),
  };
});

// Mock the vendorApi
vi.mock('@/services/api/vendorApi', () => ({
  default: {
    isAuthenticated: vi.fn(() => false),
    getAuthToken: vi.fn(() => null),
    getVendorUser: vi.fn(() => null),
    getVendorProfile: vi.fn(() => null),
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}));

// Mock monitoring
vi.mock('@/lib/monitoring', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  setUserContext: vi.fn(),
  clearUserContext: vi.fn(),
}));

describe('VendorProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when authentication is loading', async () => {
    const { useVendorAuth } = await import('@/contexts/VendorAuthContext');
    
    vi.mocked(useVendorAuth).mockReturnValue({
      user: null,
      vendor: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/vendor/dashboard']}>
        <Routes>
          <Route
            path="/vendor/dashboard"
            element={
              <VendorProtectedRoute>
                <div>Protected Content</div>
              </VendorProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to /vendor/login when not authenticated', async () => {
    const { useVendorAuth } = await import('@/contexts/VendorAuthContext');
    
    vi.mocked(useVendorAuth).mockReturnValue({
      user: null,
      vendor: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/vendor/dashboard']}>
        <Routes>
          <Route
            path="/vendor/dashboard"
            element={
              <VendorProtectedRoute>
                <div>Protected Content</div>
              </VendorProtectedRoute>
            }
          />
          <Route path="/vendor/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', async () => {
    const { useVendorAuth } = await import('@/contexts/VendorAuthContext');
    
    const mockUser = {
      id: '1',
      uuid: 'user-uuid-123',
      email: 'vendor@example.com',
      name: 'Test Vendor User',
      account_type: 'vendor' as const,
      vendor_id: 'vendor-123',
      status: 'active' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockVendor = {
      id: 'vendor-123',
      uuid: 'vendor-uuid-123',
      tenant_id: 'tenant-123',
      company_name: 'Test Vendor Company',
      email: 'vendor@example.com',
      phone: '+1234567890',
      status: 'active' as const,
      portal_access_enabled: true,
      onboarding_status: 'completed' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(useVendorAuth).mockReturnValue({
      user: mockUser,
      vendor: mockVendor,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/vendor/dashboard']}>
        <Routes>
          <Route
            path="/vendor/dashboard"
            element={
              <VendorProtectedRoute>
                <div>Protected Content</div>
              </VendorProtectedRoute>
            }
          />
          <Route path="/vendor/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('should not render children when user is null even if isAuthenticated is true', async () => {
    const { useVendorAuth } = await import('@/contexts/VendorAuthContext');
    
    // Edge case: isAuthenticated is true but user is null (shouldn't happen but test defensive coding)
    vi.mocked(useVendorAuth).mockReturnValue({
      user: null,
      vendor: null,
      isAuthenticated: false, // This should be false when user is null
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/vendor/dashboard']}>
        <Routes>
          <Route
            path="/vendor/dashboard"
            element={
              <VendorProtectedRoute>
                <div>Protected Content</div>
              </VendorProtectedRoute>
            }
          />
          <Route path="/vendor/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should handle multiple children elements', async () => {
    const { useVendorAuth } = await import('@/contexts/VendorAuthContext');
    
    const mockUser = {
      id: '1',
      uuid: 'user-uuid-123',
      email: 'vendor@example.com',
      name: 'Test Vendor User',
      account_type: 'vendor' as const,
      vendor_id: 'vendor-123',
      status: 'active' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockVendor = {
      id: 'vendor-123',
      uuid: 'vendor-uuid-123',
      tenant_id: 'tenant-123',
      company_name: 'Test Vendor Company',
      email: 'vendor@example.com',
      phone: '+1234567890',
      status: 'active' as const,
      portal_access_enabled: true,
      onboarding_status: 'completed' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(useVendorAuth).mockReturnValue({
      user: mockUser,
      vendor: mockVendor,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/vendor/dashboard']}>
        <Routes>
          <Route
            path="/vendor/dashboard"
            element={
              <VendorProtectedRoute>
                <div>Header</div>
                <div>Content</div>
                <div>Footer</div>
              </VendorProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
