import { renderHook, waitFor, act } from '@testing-library/react';
import { useVendors } from '@/hooks/useVendors';
import { vendorsService } from '@/services/api/vendors';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { Vendor, UpdateVendorRequest } from '@/services/api/vendors';

vi.mock('@/services/api/vendors', () => ({
  vendorsService: {
    getVendors: vi.fn(),
    getVendorById: vi.fn(),
    createVendor: vi.fn(),
    updateVendor: vi.fn(),
    deleteVendor: vi.fn(),
    getVendorEvaluations: vi.fn(),
    getVendorSpecializations: vi.fn(),
    getVendorOrders: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useVendors Hook - Optimistic Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockVendor: Vendor = {
    id: '1',
    name: 'Test Vendor',
    code: 'TEST001',
    email: 'test@vendor.com',
    status: 'active',
    company_size: 'medium',
    city: 'Jakarta',
    address: 'Jl. Test No. 1',
    rating: 4.5,
    total_orders: 100,
    total_value: 1000000,
  };

  const mockVendors: Vendor[] = [
    mockVendor,
    {
      id: '2',
      name: 'Second Vendor',
      code: 'TEST002',
      email: 'second@vendor.com',
      status: 'active',
      company_size: 'small',
      city: 'Bandung',
      address: 'Jl. Second No. 2',
      rating: 4.0,
      total_orders: 50,
      total_value: 500000,
    },
  ];

  describe('updateVendor - Optimistic Updates', () => {
    test('should update UI immediately before API call completes', async () => {
      vi.mocked(vendorsService.getVendors).mockResolvedValueOnce({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 2,
      });

      const { result } = renderHook(() => useVendors());

      await act(async () => {
        await result.current.fetchVendors();
      });

      expect(result.current.vendors).toHaveLength(2);

      // Setup delayed API response
      const updateData: UpdateVendorRequest = {
        name: 'Updated Vendor Name',
        email: 'updated@vendor.com',
      };

      let resolveUpdate: (value: Vendor) => void;
      const updatePromise = new Promise<Vendor>((resolve) => {
        resolveUpdate = resolve;
      });
      vi.mocked(vendorsService.updateVendor).mockReturnValueOnce(updatePromise);

      // Call updateVendor
      act(() => {
        result.current.updateVendor('1', updateData);
      });

      // UI should update immediately (optimistically)
      await waitFor(() => {
        const updatedVendor = result.current.vendors.find(v => v.id === '1');
        expect(updatedVendor?.name).toBe('Updated Vendor Name');
        expect(updatedVendor?.email).toBe('updated@vendor.com');
      });

      // isSaving should be true during API call
      expect(result.current.isSaving).toBe(true);

      // Resolve API call
      const serverResponse: Vendor = {
        ...mockVendor,
        ...updateData,
        rating: 4.8, // Server might return additional updated fields
      };

      await act(async () => {
        resolveUpdate(serverResponse);
        await updatePromise;
      });

      // UI should now reflect server response
      await waitFor(() => {
        const finalVendor = result.current.vendors.find(v => v.id === '1');
        expect(finalVendor?.rating).toBe(4.8);
        expect(result.current.isSaving).toBe(false);
      });

      expect(toast.success).toHaveBeenCalledWith('Vendor updated successfully');
    });

    test('should rollback optimistic update when API call fails', async () => {
      vi.mocked(vendorsService.getVendors).mockResolvedValueOnce({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 2,
      });

      const { result } = renderHook(() => useVendors());

      await act(async () => {
        await result.current.fetchVendors();
      });

      const originalVendor = result.current.vendors.find(v => v.id === '1');

      // Setup API error
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Server error' },
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
      };

      vi.mocked(vendorsService.updateVendor).mockRejectedValueOnce(mockError);

      const updateData: UpdateVendorRequest = {
        name: 'Failed Update',
      };

      // Attempt update
      await act(async () => {
        try {
          await result.current.updateVendor('1', updateData);
        } catch (error) {
          // Expected to throw
        }
      });

      // UI should rollback to original state
      await waitFor(() => {
        const rolledBackVendor = result.current.vendors.find(v => v.id === '1');
        expect(rolledBackVendor?.name).toBe(originalVendor?.name);
        expect(result.current.isSaving).toBe(false);
      });

      expect(toast.error).toHaveBeenCalled();
    });

    test('should preserve vendors list structure on rollback', async () => {
      vi.mocked(vendorsService.getVendors).mockResolvedValueOnce({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 2,
      });

      const { result } = renderHook(() => useVendors());

      await act(async () => {
        await result.current.fetchVendors();
      });

      const originalVendorsList = [...result.current.vendors];

      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 422,
          data: { 
            message: 'Validation failed',
            errors: { name: ['Name is required'] },
          },
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Validation error',
      };

      vi.mocked(vendorsService.updateVendor).mockRejectedValueOnce(mockError);

      const updateData: UpdateVendorRequest = {
        name: 'Failed Update',
        status: 'inactive',
      };

      await act(async () => {
        try {
          await result.current.updateVendor('1', updateData);
        } catch (error) {
          // Expected
        }
      });

      // Vendors list should be restored to original state
      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(originalVendorsList.length);
        expect(result.current.vendors[0]).toEqual(originalVendorsList[0]);
      });
    });
  });

  describe('deleteVendor - Optimistic Updates', () => {
    test('should remove vendor from UI immediately before API completes', async () => {
      vi.mocked(vendorsService.getVendors).mockResolvedValueOnce({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 2,
      });

      const { result } = renderHook(() => useVendors());

      await act(async () => {
        await result.current.fetchVendors();
      });

      expect(result.current.vendors).toHaveLength(2);

      // Setup delayed API response
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      vi.mocked(vendorsService.deleteVendor).mockReturnValueOnce(deletePromise);

      // Call deleteVendor
      act(() => {
        result.current.deleteVendor('1');
      });

      // UI should update immediately (vendor removed optimistically)
      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(1);
        expect(result.current.vendors.find(v => v.id === '1')).toBeUndefined();
        expect(result.current.pagination.total).toBe(1);
      });

      expect(result.current.isSaving).toBe(true);

      // Resolve API call
      await act(async () => {
        resolveDelete();
        await deletePromise;
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });

      expect(toast.success).toHaveBeenCalledWith('Vendor deleted successfully');
    });

    test('should rollback deletion when API call fails', async () => {
      vi.mocked(vendorsService.getVendors).mockResolvedValueOnce({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 2,
      });

      const { result } = renderHook(() => useVendors());

      await act(async () => {
        await result.current.fetchVendors();
      });

      expect(result.current.vendors).toHaveLength(2);

      // Setup API error
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Permission denied' },
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Permission denied',
      };

      vi.mocked(vendorsService.deleteVendor).mockRejectedValueOnce(mockError);

      // Attempt delete
      await act(async () => {
        try {
          await result.current.deleteVendor('1');
        } catch (error) {
          // Expected to throw
        }
      });

      // UI should rollback - vendor should be restored
      await waitFor(() => {
        expect(result.current.vendors).toHaveLength(2);
        expect(result.current.vendors.find(v => v.id === '1')).toBeDefined();
        expect(result.current.pagination.total).toBe(2);
        expect(result.current.isSaving).toBe(false);
      });

      expect(toast.error).toHaveBeenCalled();
    });

    test('should restore currentVendor on rollback if it was deleted', async () => {
      vi.mocked(vendorsService.getVendors).mockResolvedValueOnce({
        data: mockVendors,
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 2,
      });

      const { result } = renderHook(() => useVendors());

      await act(async () => {
        await result.current.fetchVendors();
      });

      // Set currentVendor to the one we'll try to delete
      vi.mocked(vendorsService.getVendorById).mockResolvedValueOnce(mockVendor);
      
      await act(async () => {
        await result.current.fetchVendorById('1');
      });

      expect(result.current.currentVendor?.id).toBe('1');

      // Setup API error
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Server error' },
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Server error',
      };

      vi.mocked(vendorsService.deleteVendor).mockRejectedValueOnce(mockError);

      // Attempt delete
      await act(async () => {
        try {
          await result.current.deleteVendor('1');
        } catch (error) {
          // Expected
        }
      });

      // currentVendor should be restored after rollback
      await waitFor(() => {
        expect(result.current.currentVendor?.id).toBe('1');
        expect(result.current.currentVendor?.name).toBe('Test Vendor');
      });
    });
  });
});
