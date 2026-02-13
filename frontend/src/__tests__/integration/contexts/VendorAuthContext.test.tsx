/**
 * VendorAuthContext Integration Tests
 * 
 * Tests the vendor authentication context functionality including:
 * - Initialization from localStorage
 * - Login flow
 * - Logout flow
 * - Profile refresh
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { VendorAuthProvider, useVendorAuth } from '@/contexts/VendorAuthContext';
import vendorApi from '@/services/api/vendorApi';
import type { VendorAuthResponse, VendorProfileResponse } from '@/types/vendor/portal';

// Mock the vendor API
vi.mock('@/services/api/vendorApi', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    isAuthenticated: vi.fn(),
    getAuthToken: vi.fn(),
    getVendorUser: vi.fn(),
    getVendorProfile: vi.fn(),
  },
}));

// Mock the monitoring library
vi.mock('@/lib/monitoring', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  setUserContext: vi.fn(),
  clearUserContext: vi.fn(),
}));

// Mock the error handler
vi.mock('@/services/api/errorHandler', () => ({
  handleApiError: vi.fn((err) => ({
    userMessage: err.message || 'An error occurred',
    technicalMessage: err.message || 'An error occurred',
  })),
}));

describe('VendorAuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset default mock implementations
    vi.mocked(vendorApi.isAuthenticated).mockReturnValue(false);
    vi.mocked(vendorApi.getAuthToken).mockReturnValue(null);
    vi.mocked(vendorApi.getVendorUser).mockReturnValue(null);
    vi.mocked(vendorApi.getVendorProfile).mockReturnValue(null);
  });

  describe('Initialization', () => {
    it('should initialize with unauthenticated state when no stored data', async () => {
      const { result } = renderHook(() => useVendorAuth(), {
        wrapper: VendorAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.vendor).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should initialize with authenticated state when valid stored data exists', async () => {
      const mockUser = {
        id: 'user-1',
        uuid: 'user-uuid-1',
        email: 'vendor@example.com',
        name: 'Test Vendor User',
        account_type: 'vendor' as const,
        vendor_id: 'vendor-1',
        status: 'active' as const,
        is_email_verified: true,
        two_factor_enabled: false,
        failed_login_attempts: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockVendor = {
        id: 'vendor-1',
        uuid: 'vendor-uuid-1',
        tenant_id: 'tenant-1',
        company_name: 'Test Vendor Company',
        email: 'vendor@example.com',
        status: 'active' as const,
        is_verified: true,
        onboarding_status: 'completed' as const,
        portal_access_enabled: true,
        total_orders: 10,
        completed_orders: 8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(vendorApi.isAuthenticated).mockReturnValue(true);
      vi.mocked(vendorApi.getAuthToken).mockReturnValue('test-token');
      vi.mocked(vendorApi.getVendorUser).mockReturnValue(mockUser);
      vi.mocked(vendorApi.getVendorProfile).mockReturnValue(mockVendor);

      const { result } = renderHook(() => useVendorAuth(), {
        wrapper: VendorAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.vendor).toEqual(mockVendor);
    });
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse: VendorAuthResponse = {
        success: true,
        data: {
          token: 'test-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 'user-1',
            uuid: 'user-uuid-1',
            email: 'vendor@example.com',
            name: 'Test Vendor User',
            account_type: 'vendor',
            vendor_id: 'vendor-1',
            status: 'active',
            is_email_verified: true,
            two_factor_enabled: false,
            failed_login_attempts: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          vendor: {
            id: 'vendor-1',
            uuid: 'vendor-uuid-1',
            tenant_id: 'tenant-1',
            company_name: 'Test Vendor Company',
            email: 'vendor@example.com',
            status: 'active',
            is_verified: true,
            onboarding_status: 'completed',
            portal_access_enabled: true,
            total_orders: 10,
            completed_orders: 8,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      };

      vi.mocked(vendorApi.login).mockResolvedValue(mockResponse);
      vi.mocked(vendorApi.isAuthenticated).mockReturnValue(true);

      const { result } = renderHook(() => useVendorAuth(), {
        wrapper: VendorAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('vendor@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(result.current.vendor).toEqual(mockResponse.data.vendor);
      expect(result.current.error).toBeNull();
      expect(vendorApi.login).toHaveBeenCalledWith({
        email: 'vendor@example.com',
        password: 'password123',
      });
    });

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(vendorApi.login).mockRejectedValue(mockError);

      const { result } = renderHook(() => useVendorAuth(), {
        wrapper: VendorAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.login('vendor@example.com', 'wrong-password');
        } catch (err) {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.vendor).toBeNull();
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('Logout', () => {
    it('should successfully logout', async () => {
      // Setup authenticated state
      const mockUser = {
        id: 'user-1',
        uuid: 'user-uuid-1',
        email: 'vendor@example.com',
        name: 'Test Vendor User',
        account_type: 'vendor' as const,
        vendor_id: 'vendor-1',
        status: 'active' as const,
        is_email_verified: true,
        two_factor_enabled: false,
        failed_login_attempts: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockVendor = {
        id: 'vendor-1',
        uuid: 'vendor-uuid-1',
        tenant_id: 'tenant-1',
        company_name: 'Test Vendor Company',
        email: 'vendor@example.com',
        status: 'active' as const,
        is_verified: true,
        onboarding_status: 'completed' as const,
        portal_access_enabled: true,
        total_orders: 10,
        completed_orders: 8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(vendorApi.isAuthenticated).mockReturnValue(true);
      vi.mocked(vendorApi.getAuthToken).mockReturnValue('test-token');
      vi.mocked(vendorApi.getVendorUser).mockReturnValue(mockUser);
      vi.mocked(vendorApi.getVendorProfile).mockReturnValue(mockVendor);
      vi.mocked(vendorApi.logout).mockResolvedValue({
        success: true,
        data: { message: 'Logged out successfully' },
      });

      const { result } = renderHook(() => useVendorAuth(), {
        wrapper: VendorAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Mock window.location.href to prevent actual navigation
      delete (window as any).location;
      window.location = { href: '/vendor/dashboard' } as any;

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.vendor).toBeNull();
      expect(vendorApi.logout).toHaveBeenCalledWith(false);
    });

    it('should logout from all devices when requested', async () => {
      vi.mocked(vendorApi.logout).mockResolvedValue({
        success: true,
        data: { message: 'Logged out from all devices' },
      });

      const { result } = renderHook(() => useVendorAuth(), {
        wrapper: VendorAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock window.location.href to prevent actual navigation
      delete (window as any).location;
      window.location = { href: '/vendor/dashboard' } as any;

      await act(async () => {
        await result.current.logout(true);
      });

      expect(vendorApi.logout).toHaveBeenCalledWith(true);
    });
  });

  describe('Profile Refresh', () => {
    it('should successfully refresh profile', async () => {
      const mockUser = {
        id: 'user-1',
        uuid: 'user-uuid-1',
        email: 'vendor@example.com',
        name: 'Test Vendor User',
        account_type: 'vendor' as const,
        vendor_id: 'vendor-1',
        status: 'active' as const,
        is_email_verified: true,
        two_factor_enabled: false,
        failed_login_attempts: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockVendor = {
        id: 'vendor-1',
        uuid: 'vendor-uuid-1',
        tenant_id: 'tenant-1',
        company_name: 'Test Vendor Company',
        email: 'vendor@example.com',
        status: 'active' as const,
        is_verified: true,
        onboarding_status: 'completed' as const,
        portal_access_enabled: true,
        total_orders: 10,
        completed_orders: 8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(vendorApi.isAuthenticated).mockReturnValue(true);
      vi.mocked(vendorApi.getAuthToken).mockReturnValue('test-token');
      vi.mocked(vendorApi.getVendorUser).mockReturnValue(mockUser);
      vi.mocked(vendorApi.getVendorProfile).mockReturnValue(mockVendor);

      const mockProfileResponse: VendorProfileResponse = {
        success: true,
        data: {
          vendor: mockVendor,
          metrics: {
            total_quotes: 20,
            accepted_quotes: 15,
            rejected_quotes: 3,
            pending_quotes: 2,
            countered_quotes: 0,
            expired_quotes: 0,
            acceptance_rate: 75,
            average_response_time: 24,
            total_orders: 15,
            completed_orders: 12,
            completion_rate: 80,
            overall_rating: 4.5,
            quality_rating: 4.7,
            timeliness_rating: 4.3,
            communication_rating: 4.6,
          },
        },
      };

      vi.mocked(vendorApi.getProfile).mockResolvedValue(mockProfileResponse);

      const { result } = renderHook(() => useVendorAuth(), {
        wrapper: VendorAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set login timestamp to past to bypass grace period
      localStorage.setItem('vendor_login_timestamp', (Date.now() - 10000).toString());

      await act(async () => {
        await result.current.refreshProfile();
      });

      // Verify the API was called
      expect(vendorApi.getProfile).toHaveBeenCalled();
      
      // Verify vendor is still set (profile refresh doesn't clear it)
      expect(result.current.vendor).toBeTruthy();
      expect(result.current.vendor?.id).toBe('vendor-1');
    }, 10000); // Increase timeout to 10 seconds

    it('should skip refresh when not authenticated', async () => {
      vi.mocked(vendorApi.isAuthenticated).mockReturnValue(false);

      const { result } = renderHook(() => useVendorAuth(), {
        wrapper: VendorAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(vendorApi.getProfile).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should clear error when clearError is called', async () => {
      const mockError = new Error('Test error');
      vi.mocked(vendorApi.login).mockRejectedValue(mockError);

      const { result } = renderHook(() => useVendorAuth(), {
        wrapper: VendorAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger an error
      await act(async () => {
        try {
          await result.current.login('vendor@example.com', 'wrong-password');
        } catch (err) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
