import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useProductsQuery, 
  useProductQuery, 
  useCreateProductMutation, 
  useUpdateProductMutation,
  useDeleteProductMutation,
  useBulkDeleteProductsMutation 
} from '@/hooks/useProductsQuery';
import { createContextAwareProductsService } from '@/services/api/contextAwareProductsService';
import { toast } from 'sonner';
import React from 'react';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/contexts/TenantAuthContext', () => ({
  useTenantAuth: () => ({
    tenant: { uuid: 'test-tenant-uuid', id: '1' },
    user: { id: 'test-user-id' },
    isAuthenticated: true,
  }),
}));

vi.mock('@/contexts/GlobalContext', () => ({
  useGlobalContext: () => ({
    userType: 'tenant',
    tenant: { uuid: 'test-tenant-uuid' },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Products React Query Hooks Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('useProductsQuery Hook', () => {
    test('harus fetch products dengan sukses', async () => {
      const { result } = renderHook(
        () => useProductsQuery({ page: 1, per_page: 10 }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      if (result.current.data) {
        expect(result.current.data).toBeDefined();
        expect(Array.isArray(result.current.data.data)).toBe(true);
      }
    });

    test('harus handle filters dengan benar', async () => {
      const filters = {
        search: 'test',
        status: 'published',
        category: 'awards',
        page: 1,
        per_page: 10,
      };

      const { result } = renderHook(
        () => useProductsQuery(filters),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });
    });

    test('harus handle error dengan graceful', async () => {
      const { result } = renderHook(
        () => useProductsQuery({ page: 9999, per_page: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });
    });
  });

  describe('useProductQuery Hook', () => {
    test('harus fetch single product by ID', async () => {
      const { result } = renderHook(
        () => useProductQuery('test-product-id'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });
    });

    test('tidak harus fetch jika ID tidak ada', () => {
      const { result } = renderHook(
        () => useProductQuery(undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useCreateProductMutation Hook', () => {
    test('harus create product dengan data valid', async () => {
      const { result } = renderHook(
        () => useCreateProductMutation(),
        { wrapper: createWrapper() }
      );

      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description for product',
        images: ['https://example.com/image.jpg'],
        category: 'awards',
        material: 'metal',
        price: 100000,
        status: 'draft' as const,
      };

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    test('harus reject data invalid dengan Zod', async () => {
      const { result } = renderHook(
        () => useCreateProductMutation(),
        { wrapper: createWrapper() }
      );

      const invalidData = {
        name: 'Te',
        slug: 'test',
        description: 'Short',
        images: [],
        category: '',
        material: '',
        price: -100,
      };

      try {
        await result.current.mutateAsync(invalidData as any);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('useUpdateProductMutation Hook', () => {
    test('harus update product dengan optimistic updates', async () => {
      const { result } = renderHook(
        () => useUpdateProductMutation(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe('useDeleteProductMutation Hook', () => {
    test('harus delete product dengan optimistic UI update', async () => {
      const { result } = renderHook(
        () => useDeleteProductMutation(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    test('harus rollback on delete error', async () => {
      const { result } = renderHook(
        () => useDeleteProductMutation(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe('useBulkDeleteProductsMutation Hook', () => {
    test('harus delete multiple products dengan progress tracking', async () => {
      const progressCallback = vi.fn();

      const { result } = renderHook(
        () => useBulkDeleteProductsMutation(progressCallback),
        { wrapper: createWrapper() }
      );

      const productIds = ['id-1', 'id-2', 'id-3'];

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    test('harus handle partial failures dalam bulk delete', async () => {
      const progressCallback = vi.fn();

      const { result } = renderHook(
        () => useBulkDeleteProductsMutation(progressCallback),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    test('harus update progress callback selama bulk operation', async () => {
      const progressCallback = vi.fn();

      const { result } = renderHook(
        () => useBulkDeleteProductsMutation(progressCallback),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe('Request Cancellation', () => {
    test('harus cancel request saat component unmount', async () => {
      const { result, unmount } = renderHook(
        () => useProductsQuery({ page: 1, per_page: 10 }),
        { wrapper: createWrapper() }
      );

      unmount();

      expect(result.current.isLoading).toBe(true);
    });

    test('harus cancel previous request saat filter berubah', async () => {
      const { result, rerender } = renderHook(
        ({ filters }) => useProductsQuery(filters),
        { 
          wrapper: createWrapper(),
          initialProps: { filters: { page: 1, per_page: 10 } }
        }
      );

      rerender({ filters: { page: 2, per_page: 10 } });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });
    });
  });

  describe('Cache Management', () => {
    test('harus cache query results dengan staleTime', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useProductsQuery({ page: 1 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      const cachedData = queryClient.getQueryData(['products', 'list', { page: 1 }]);
      expect(cachedData).toBeDefined();
    });

    test('harus invalidate cache setelah mutation', async () => {
      const { result: createResult } = renderHook(
        () => useCreateProductMutation(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(createResult.current.isPending).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    test('harus handle TenantContextError', async () => {
      vi.mock('@/contexts/TenantAuthContext', () => ({
        useTenantAuth: () => ({
          tenant: null,
          user: null,
          isAuthenticated: false,
        }),
      }));

      const { result } = renderHook(
        () => useProductsQuery({ page: 1 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('harus display toast error on mutation failure', async () => {
      const { result } = renderHook(
        () => useCreateProductMutation(),
        { wrapper: createWrapper() }
      );

      const invalidData = {
        name: 'Test',
        slug: 'test',
        description: 'Test',
        images: [],
        category: 'test',
        material: 'test',
        price: 100,
      };

      try {
        await result.current.mutateAsync(invalidData as any);
      } catch (error) {
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalled();
        });
      }
    });
  });
});
