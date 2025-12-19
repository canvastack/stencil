import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVendors } from '@/hooks/useVendors';
import { vendorsService } from '@/services/api/vendors';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

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

describe('useVendors Hook Error Handling Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchVendors Error Handling', () => {
    test('should handle 500 server error gracefully', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal server error' },
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
      };

      vi.mocked(vendorsService.getVendors).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      await result.current.fetchVendors();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Server error. Please try again later.');
        expect(toast.error).toHaveBeenCalledWith(
          'Fetch Vendors: Server error. Please try again later.',
          { duration: 4000 }
        );
      });
    });

    test('should handle network error', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        message: 'Network Error',
        name: 'AxiosError',
        config: {} as any,
      };

      vi.mocked(vendorsService.getVendors).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      await result.current.fetchVendors();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Network error. Please check your internet connection.');
        expect(toast.error).toHaveBeenCalled();
      });
    });

    test('should handle timeout error', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout exceeded',
        name: 'AxiosError',
        config: {} as any,
      };

      vi.mocked(vendorsService.getVendors).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      await result.current.fetchVendors();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Request timeout. Please check your connection.');
      });
    });

    test('should handle 401 unauthorized error', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
      };

      vi.mocked(vendorsService.getVendors).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      await result.current.fetchVendors();

      await waitFor(() => {
        expect(result.current.error).toBe('Session expired. Please login again.');
        expect(toast.error).toHaveBeenCalledWith(
          'Fetch Vendors: Session expired. Please login again.',
          { duration: 4000 }
        );
      });
    });

    test('should handle 403 forbidden error', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Forbidden' },
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
      };

      vi.mocked(vendorsService.getVendors).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      await result.current.fetchVendors();

      await waitFor(() => {
        expect(result.current.error).toBe("You don't have permission to perform this action.");
      });
    });
  });

  describe('fetchVendorById Error Handling', () => {
    test('should handle 404 not found error', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Vendor not found' },
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
      };

      vi.mocked(vendorsService.getVendorById).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      await result.current.fetchVendorById('non-existent-id');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Vendor not found');
        expect(toast.error).toHaveBeenCalledWith('Fetch Vendor: Vendor not found', {
          duration: 4000,
        });
      });
    });

    test('should reset loading state after error', async () => {
      const mockError = new Error('Generic error');
      vi.mocked(vendorsService.getVendorById).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      await result.current.fetchVendorById('123');

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createVendor Error Handling', () => {
    test('should handle 422 validation error with field details', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'The given data was invalid',
            errors: {
              name: ['The name field is required'],
              email: ['Invalid email format', 'Email already exists'],
            },
            code: 'VALIDATION_ERROR',
          },
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Validation failed',
      };

      vi.mocked(vendorsService.createVendor).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      try {
        await result.current.createVendor({
          name: '',
          email: 'invalid-email',
          phone: '1234567890',
          address: '123 Test St',
        });
      } catch (error: any) {
        expect(error.status).toBe(422);
        expect(error.errors).toEqual({
          name: ['The name field is required'],
          email: ['Invalid email format', 'Email already exists'],
        });
      }

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
        expect(result.current.error).toBe('The given data was invalid');
        expect(toast.error).toHaveBeenCalledWith('Create Vendor: The given data was invalid', {
          description: 'name: The name field is required\nemail: Invalid email format, Email already exists',
          duration: 5000,
        });
      });
    });

    test('should throw ApiException for form-level validation handling', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: { phone: ['Invalid phone number'] },
          },
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Validation failed',
      };

      vi.mocked(vendorsService.createVendor).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      let caughtError;
      try {
        await result.current.createVendor({
          name: 'Test Vendor',
          email: 'test@vendor.com',
          phone: 'invalid',
          address: '123 Test St',
        });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeDefined();
      expect((caughtError as any).status).toBe(422);
      expect((caughtError as any).errors).toEqual({ phone: ['Invalid phone number'] });
    });

    test('should reset isSaving state after error', async () => {
      const mockError = new Error('Server error');
      vi.mocked(vendorsService.createVendor).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      try {
        await result.current.createVendor({
          name: 'Test',
          email: 'test@test.com',
          phone: '1234567890',
          address: '123 St',
        });
      } catch (error) {
      }

      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('updateVendor Error Handling', () => {
    test('should handle update validation errors', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'Update validation failed',
            errors: {
              website: ['Invalid URL format'],
            },
          },
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Validation failed',
      };

      vi.mocked(vendorsService.updateVendor).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      try {
        await result.current.updateVendor('123', {
          website: 'not-a-valid-url',
        });
      } catch (error: any) {
        expect(error.status).toBe(422);
        expect(error.errors?.website).toEqual(['Invalid URL format']);
      }

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('Update Vendor: Update validation failed', {
          description: 'website: Invalid URL format',
          duration: 5000,
        });
      });
    });

    test('should handle 404 on update non-existent vendor', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Vendor not found' },
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Not found',
      };

      vi.mocked(vendorsService.updateVendor).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      try {
        await result.current.updateVendor('non-existent', { name: 'Updated' });
      } catch (error: any) {
        expect(error.status).toBe(404);
        expect(error.message).toBe('Vendor not found');
      }

      await waitFor(() => {
        expect(result.current.error).toBe('Vendor not found');
      });
    });
  });

  describe('deleteVendor Error Handling', () => {
    test('should handle delete server error', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Failed to delete vendor' },
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Server error',
      };

      vi.mocked(vendorsService.deleteVendor).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      try {
        await result.current.deleteVendor('123');
      } catch (error: any) {
        expect(error.status).toBe(500);
      }

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
        expect(toast.error).toHaveBeenCalledWith(
          'Delete Vendor: Server error. Please try again later.',
          { duration: 4000 }
        );
      });
    });

    test('should handle 404 on delete non-existent vendor', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Vendor not found' },
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Not found',
      };

      vi.mocked(vendorsService.deleteVendor).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      try {
        await result.current.deleteVendor('non-existent');
      } catch (error: any) {
        expect(error.message).toBe('Vendor not found');
      }
    });
  });

  describe('Vendor Related Data Error Handling', () => {
    test('should handle getVendorEvaluations errors', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Server error',
      };

      vi.mocked(vendorsService.getVendorEvaluations).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      try {
        await result.current.getVendorEvaluations('123');
      } catch (error: any) {
        expect(error.status).toBe(500);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Fetch Vendor Evaluations: Server error. Please try again later.',
          { duration: 4000 }
        );
      });
    });

    test('should handle getVendorSpecializations errors', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'No specializations found' },
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Not found',
      };

      vi.mocked(vendorsService.getVendorSpecializations).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      try {
        await result.current.getVendorSpecializations('123');
      } catch (error: any) {
        expect(error.message).toBe('No specializations found');
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Fetch Vendor Specializations: No specializations found',
          { duration: 4000 }
        );
      });
    });

    test('should handle getVendorOrders errors', async () => {
      const mockError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Access denied' },
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Forbidden',
      };

      vi.mocked(vendorsService.getVendorOrders).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      try {
        await result.current.getVendorOrders('123');
      } catch (error: any) {
        expect(error.status).toBe(403);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Fetch Vendor Orders: You don't have permission to perform this action.",
          { duration: 4000 }
        );
      });
    });
  });

  describe('Error State Management', () => {
    test('should clear error on successful operation after failed operation', async () => {
      const mockError = new Error('Initial error');
      vi.mocked(vendorsService.getVendors).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVendors());

      await result.current.fetchVendors();

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      const mockSuccess = {
        data: [{ id: '1', name: 'Vendor A' }],
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 1,
      };
      vi.mocked(vendorsService.getVendors).mockResolvedValueOnce(mockSuccess);

      await result.current.fetchVendors();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.vendors).toHaveLength(1);
      });
    });

    test('should handle multiple consecutive errors', async () => {
      const { result } = renderHook(() => useVendors());

      const error1: Partial<AxiosError> = {
        isAxiosError: true,
        response: { status: 500, data: {}, statusText: 'Error', headers: {}, config: {} as any },
        config: {} as any,
        name: 'AxiosError',
        message: 'Error 1',
      };
      vi.mocked(vendorsService.getVendors).mockRejectedValueOnce(error1);
      await result.current.fetchVendors();

      await waitFor(() => {
        expect(result.current.error).toBe('Server error. Please try again later.');
      });

      const error2: Partial<AxiosError> = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        message: 'Network error',
        name: 'AxiosError',
        config: {} as any,
      };
      vi.mocked(vendorsService.getVendors).mockRejectedValueOnce(error2);
      await result.current.fetchVendors();

      await waitFor(() => {
        expect(result.current.error).toBe('Network error. Please check your internet connection.');
      });
    });
  });

  describe('Context Labels Verification', () => {
    test('should apply correct context labels to all operations', async () => {
      const operations = [
        { service: vendorsService.getVendors, hook: 'fetchVendors', label: 'Fetch Vendors', args: [] },
        { service: vendorsService.getVendorById, hook: 'fetchVendorById', label: 'Fetch Vendor', args: ['1'] },
        { service: vendorsService.createVendor, hook: 'createVendor', label: 'Create Vendor', args: [{ name: 'Test', email: 'test@test.com', phone: '123', address: '123' }] },
        { service: vendorsService.updateVendor, hook: 'updateVendor', label: 'Update Vendor', args: ['1', { name: 'Updated' }] },
        { service: vendorsService.deleteVendor, hook: 'deleteVendor', label: 'Delete Vendor', args: ['1'] },
        { service: vendorsService.getVendorEvaluations, hook: 'getVendorEvaluations', label: 'Fetch Vendor Evaluations', args: ['1'] },
        { service: vendorsService.getVendorSpecializations, hook: 'getVendorSpecializations', label: 'Fetch Vendor Specializations', args: ['1'] },
        { service: vendorsService.getVendorOrders, hook: 'getVendorOrders', label: 'Fetch Vendor Orders', args: ['1'] },
      ];

      for (const operation of operations) {
        vi.clearAllMocks();
        const mockError: Partial<AxiosError> = {
          isAxiosError: true,
          response: { status: 500, data: {}, statusText: 'Error', headers: {}, config: {} as any },
          config: {} as any,
          name: 'AxiosError',
          message: 'Error',
        };

        vi.mocked(operation.service).mockRejectedValueOnce(mockError as any);

        const { result } = renderHook(() => useVendors());
        
        try {
          await (result.current as any)[operation.hook](...operation.args);
        } catch (error) {
        }

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining(operation.label),
            expect.any(Object)
          );
        });
      }
    });
  });
});
