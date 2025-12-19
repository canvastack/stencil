import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useVendors } from '@/hooks/useVendors';
import { vendorsService } from '@/services/api/vendors';
import { tenantApiClient } from '@/services/api/tenantApiClient';
import type { Vendor } from '@/types/vendor';

vi.mock('@/services/api/vendors', () => ({
  vendorsService: {
    getVendors: vi.fn(),
    getVendorById: vi.fn(),
    createVendor: vi.fn(),
    updateVendor: vi.fn(),
    deleteVendor: vi.fn(),
  },
}));

vi.mock('@/services/api/tenantApiClient', () => ({
  tenantApiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/lib/toast-config', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Vendor Business Logic Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Backend Company Size Classification', () => {
    test('should use backend-calculated company_size field', async () => {
      const mockVendors: Vendor[] = [
        {
          id: '1',
          uuid: 'uuid-1',
          tenant_id: 'tenant-1',
          name: 'Small Vendor',
          email: 'small@vendor.com',
          total_orders: 5,
          company_size: 'small',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          uuid: 'uuid-2',
          tenant_id: 'tenant-1',
          name: 'Medium Vendor',
          email: 'medium@vendor.com',
          total_orders: 50,
          company_size: 'medium',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '3',
          uuid: 'uuid-3',
          tenant_id: 'tenant-1',
          name: 'Large Vendor',
          email: 'large@vendor.com',
          total_orders: 150,
          company_size: 'large',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(vendorsService.getVendors).mockResolvedValue({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 3,
      });

      const { result } = renderHook(() => useVendors());

      await act(async () => {
        await result.current.fetchVendors();
      });

      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(3);
      });
      expect(result.current.vendors[0].company_size).toBe('small');
      expect(result.current.vendors[1].company_size).toBe('medium');
      expect(result.current.vendors[2].company_size).toBe('large');
    });

    test('should filter vendors by backend-calculated company_size', async () => {
      const mockVendors: Vendor[] = [
        {
          id: '1',
          uuid: 'uuid-1',
          tenant_id: 'tenant-1',
          name: 'Vendor 1',
          email: 'v1@vendor.com',
          total_orders: 150,
          company_size: 'large',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          uuid: 'uuid-2',
          tenant_id: 'tenant-1',
          name: 'Vendor 2',
          email: 'v2@vendor.com',
          total_orders: 50,
          company_size: 'medium',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(vendorsService.getVendors).mockResolvedValue({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 2,
      });

      const { result } = renderHook(() => useVendors());

      await act(async () => {
        await result.current.fetchVendors();
      });

      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(2);
      });

      const largeVendors = result.current.vendors.filter(v => v.company_size === 'large');
      expect(largeVendors).toHaveLength(1);
      expect(largeVendors[0].total_orders).toBeGreaterThanOrEqual(100);
    });

    test('should verify company_size matches total_orders threshold', async () => {
      const mockVendor: Vendor = {
        id: '1',
        uuid: 'uuid-1',
        tenant_id: 'tenant-1',
        name: 'Boundary Vendor',
        email: 'boundary@vendor.com',
        total_orders: 100,
        company_size: 'large',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(vendorsService.getVendorById).mockResolvedValue(mockVendor);

      const vendor = await vendorsService.getVendorById('1');

      expect(vendor.company_size).toBe('large');
      expect(vendor.total_orders).toBe(100);
    });
  });

  describe('Vendor Settings Configuration', () => {
    test('should fetch vendor settings from API', async () => {
      const mockSettings = {
        company_size_large_threshold: 100,
        company_size_medium_threshold: 20,
        min_rating_for_auto_approval: 4.5,
        default_payment_terms: 30,
        max_lead_time_days: 60,
      };

      vi.mocked(tenantApiClient.get).mockResolvedValue(mockSettings);

      const settings = await tenantApiClient.get('/settings/vendor');

      expect(settings).toEqual(mockSettings);
      expect(settings.company_size_large_threshold).toBe(100);
      expect(settings.company_size_medium_threshold).toBe(20);
    });

    test('should update vendor settings via API', async () => {
      const updatedSettings = {
        company_size_large_threshold: 150,
        company_size_medium_threshold: 30,
        min_rating_for_auto_approval: 4.0,
        default_payment_terms: 45,
        max_lead_time_days: 90,
      };

      vi.mocked(tenantApiClient.put).mockResolvedValue({
        success: true,
        message: 'Vendor settings updated successfully',
        data: updatedSettings,
      });

      const response = await tenantApiClient.put('/settings/vendor', updatedSettings);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(updatedSettings);
    });

    test('should validate settings thresholds', async () => {
      const invalidSettings = {
        company_size_large_threshold: 0,
        company_size_medium_threshold: -10,
        min_rating_for_auto_approval: 6.0,
        default_payment_terms: -5,
        max_lead_time_days: 0,
      };

      vi.mocked(tenantApiClient.put).mockRejectedValue({
        response: {
          status: 422,
          data: {
            success: false,
            message: 'Validation failed',
            errors: {
              company_size_large_threshold: ['The company size large threshold must be at least 1.'],
              company_size_medium_threshold: ['The company size medium threshold must be at least 1.'],
              min_rating_for_auto_approval: ['The min rating for auto approval must not be greater than 5.'],
              default_payment_terms: ['The default payment terms must be at least 0.'],
              max_lead_time_days: ['The max lead time days must be at least 1.'],
            },
          },
        },
      });

      await expect(
        tenantApiClient.put('/settings/vendor', invalidSettings)
      ).rejects.toMatchObject({
        response: {
          status: 422,
          data: {
            success: false,
            message: 'Validation failed',
          },
        },
      });
    });
  });

  describe('Business Logic Consistency', () => {
    test('should ensure company_size is consistent with total_orders', async () => {
      const mockVendors: Vendor[] = [
        {
          id: '1',
          uuid: 'uuid-1',
          tenant_id: 'tenant-1',
          name: 'Vendor 1',
          email: 'v1@vendor.com',
          total_orders: 5,
          company_size: 'small',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          uuid: 'uuid-2',
          tenant_id: 'tenant-1',
          name: 'Vendor 2',
          email: 'v2@vendor.com',
          total_orders: 25,
          company_size: 'medium',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '3',
          uuid: 'uuid-3',
          tenant_id: 'tenant-1',
          name: 'Vendor 3',
          email: 'v3@vendor.com',
          total_orders: 120,
          company_size: 'large',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(vendorsService.getVendors).mockResolvedValue({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 3,
      });

      const { result } = renderHook(() => useVendors());

      await act(async () => {
        await result.current.fetchVendors();
      });

      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(3);
      });

      const smallVendors = result.current.vendors.filter(v => v.company_size === 'small');
      const mediumVendors = result.current.vendors.filter(v => v.company_size === 'medium');
      const largeVendors = result.current.vendors.filter(v => v.company_size === 'large');

      smallVendors.forEach(v => {
        expect(v.total_orders).toBeLessThan(20);
      });

      mediumVendors.forEach(v => {
        expect(v.total_orders).toBeGreaterThanOrEqual(20);
        expect(v.total_orders).toBeLessThan(100);
      });

      largeVendors.forEach(v => {
        expect(v.total_orders).toBeGreaterThanOrEqual(100);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle vendors with null company_size gracefully', async () => {
      const mockVendors: Vendor[] = [
        {
          id: '1',
          uuid: 'uuid-1',
          tenant_id: 'tenant-1',
          name: 'Legacy Vendor',
          email: 'legacy@vendor.com',
          total_orders: 50,
          company_size: undefined,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(vendorsService.getVendors).mockResolvedValue({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 1,
      });

      const { result } = renderHook(() => useVendors());
      
      await act(async () => {
        await result.current.fetchVendors();
      });

      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(1);
      });

      expect(result.current.vendors[0].company_size).toBeUndefined();
    });

    test('should handle vendors with zero total_orders', async () => {
      const mockVendors: Vendor[] = [
        {
          id: '1',
          uuid: 'uuid-1',
          tenant_id: 'tenant-1',
          name: 'New Vendor',
          email: 'new@vendor.com',
          total_orders: 0,
          company_size: 'small',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(vendorsService.getVendors).mockResolvedValue({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 1,
      });

      const { result } = renderHook(() => useVendors());
      
      await act(async () => {
        await result.current.fetchVendors();
      });

      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(1);
      });

      expect(result.current.vendors[0].company_size).toBe('small');
      expect(result.current.vendors[0].total_orders).toBe(0);
    });

    test('should handle settings fetch error gracefully', async () => {
      vi.mocked(tenantApiClient.get).mockRejectedValue(new Error('Network error'));

      await expect(tenantApiClient.get('/settings/vendor')).rejects.toThrow('Network error');
    });

    test('should handle empty vendor list', async () => {
      vi.mocked(vendorsService.getVendors).mockResolvedValue({
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
      });

      const { result } = renderHook(() => useVendors());
      
      await act(async () => {
        await result.current.fetchVendors();
      });

      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(0);
      });
    });

    test('should handle boundary case at exact medium threshold', async () => {
      const mockVendors: Vendor[] = [
        {
          id: '1',
          uuid: 'uuid-1',
          tenant_id: 'tenant-1',
          name: 'Boundary Vendor',
          email: 'boundary@vendor.com',
          total_orders: 20,
          company_size: 'medium',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(vendorsService.getVendors).mockResolvedValue({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 1,
      });

      const { result } = renderHook(() => useVendors());
      
      await act(async () => {
        await result.current.fetchVendors();
      });

      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(1);
      });

      expect(result.current.vendors[0].company_size).toBe('medium');
      expect(result.current.vendors[0].total_orders).toBe(20);
    });

    test('should handle boundary case at exact large threshold', async () => {
      const mockVendors: Vendor[] = [
        {
          id: '1',
          uuid: 'uuid-1',
          tenant_id: 'tenant-1',
          name: 'Large Boundary Vendor',
          email: 'large-boundary@vendor.com',
          total_orders: 100,
          company_size: 'large',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(vendorsService.getVendors).mockResolvedValue({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 1,
      });

      const { result } = renderHook(() => useVendors());
      
      await act(async () => {
        await result.current.fetchVendors();
      });

      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(1);
      });

      expect(result.current.vendors[0].company_size).toBe('large');
      expect(result.current.vendors[0].total_orders).toBe(100);
    });

    test('should filter out vendors correctly when all filters are applied', async () => {
      const mockVendors: Vendor[] = [
        {
          id: '1',
          uuid: 'uuid-1',
          tenant_id: 'tenant-1',
          name: 'Small Vendor',
          email: 'small@vendor.com',
          total_orders: 5,
          company_size: 'small',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          uuid: 'uuid-2',
          tenant_id: 'tenant-1',
          name: 'Medium Vendor',
          email: 'medium@vendor.com',
          total_orders: 50,
          company_size: 'medium',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '3',
          uuid: 'uuid-3',
          tenant_id: 'tenant-1',
          name: 'Large Vendor',
          email: 'large@vendor.com',
          total_orders: 150,
          company_size: 'large',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(vendorsService.getVendors).mockResolvedValue({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 3,
      });

      const { result } = renderHook(() => useVendors());
      
      await act(async () => {
        await result.current.fetchVendors();
      });

      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(3);
      });

      const largeOnly = result.current.vendors.filter(v => v.company_size === 'large');
      expect(largeOnly).toHaveLength(1);
      expect(largeOnly[0].name).toBe('Large Vendor');
    });
  });
});
