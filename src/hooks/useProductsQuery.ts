import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createContextAwareProductsService, CreateProductRequest, UpdateProductRequest } from '@/services/api/contextAwareProductsService';
import type { Product, ProductFilters } from '@/types/product';
import type { PaginatedResponse } from '@/types/api';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/react-query';
import { TenantContextError, AuthError, PermissionError } from '@/lib/errors';
import { useMemo } from 'react';
import { createProductSchema, updateProductSchema } from '@/schemas/product.schema';
import { ZodError } from 'zod';

export const useProductsQuery = (filters?: ProductFilters) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async ({ signal }): Promise<PaginatedResponse<Product>> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching products', { filters, tenantId: tenant.uuid });
      return await productsService.getProducts(filters, signal);
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error instanceof AuthError || error instanceof PermissionError) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useProductQuery = (id?: string) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useQuery({
    queryKey: queryKeys.products.detail(id || ''),
    queryFn: async ({ signal }): Promise<Product> => {
      if (!id) {
        throw new Error('Product ID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      return await productsService.getProductById(id, signal);
    },
    enabled: !!id && !!tenant?.uuid && !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useProductBySlugQuery = (slug?: string) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useQuery({
    queryKey: [...queryKeys.products.all, 'slug', slug] as const,
    queryFn: async ({ signal }): Promise<Product> => {
      if (!slug) {
        throw new Error('Product slug is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      return await productsService.getProductBySlug(slug, signal);
    },
    enabled: !!slug && !!tenant?.uuid && !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useCreateProductMutation = () => {
  const { userType } = useGlobalContext();
  const { tenant } = useTenantAuth();
  const queryClient = useQueryClient();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useMutation({
    mutationFn: async (data: CreateProductRequest): Promise<Product> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context required');
      }
      
      try {
        createProductSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          const firstError = error.errors[0];
          throw new Error(firstError.message);
        }
        throw error;
      }
      
      return await productsService.createProduct(data);
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      toast.success('Product created successfully');
      logger.info('Product created', { productId: newProduct.id });
    },
    onError: (error: Error) => {
      logger.error('Failed to create product', { error: error.message });
      
      if (error instanceof TenantContextError) {
        toast.error('Tenant context not available. Please refresh the page.');
      } else if (error instanceof AuthError) {
        toast.error('Session expired. Please login again.');
      } else if (error instanceof PermissionError) {
        toast.error('You do not have permission to create products.');
      } else {
        toast.error(error.message || 'Failed to create product');
      }
    },
  });
};

export const useUpdateProductMutation = () => {
  const { userType } = useGlobalContext();
  const { tenant } = useTenantAuth();
  const queryClient = useQueryClient();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductRequest }): Promise<Product> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context required');
      }
      
      try {
        updateProductSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          const firstError = error.errors[0];
          throw new Error(firstError.message);
        }
        throw error;
      }
      
      return await productsService.updateProduct(id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) });
      
      const previousProduct = queryClient.getQueryData<Product>(queryKeys.products.detail(id));
      
      if (previousProduct) {
        queryClient.setQueryData<Product>(queryKeys.products.detail(id), {
          ...previousProduct,
          ...data,
        });
      }
      
      return { previousProduct };
    },
    onSuccess: (updatedProduct, variables) => {
      queryClient.setQueryData(queryKeys.products.detail(variables.id), updatedProduct);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      toast.success('Product updated successfully');
      logger.info('Product updated', { productId: variables.id });
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(
          queryKeys.products.detail(variables.id),
          context.previousProduct
        );
      }
      
      logger.error('Failed to update product', { error: error.message, productId: variables.id });
      
      if (error instanceof TenantContextError) {
        toast.error('Tenant context not available. Please refresh the page.');
      } else if (error instanceof AuthError) {
        toast.error('Session expired. Please login again.');
      } else if (error instanceof PermissionError) {
        toast.error('You do not have permission to update products.');
      } else {
        toast.error(error.message || 'Failed to update product');
      }
    },
  });
};

export const useDeleteProductMutation = () => {
  const { userType } = useGlobalContext();
  const { tenant } = useTenantAuth();
  const queryClient = useQueryClient();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context required');
      }
      return await productsService.deleteProduct(id);
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.lists() });

      const previousProducts = queryClient.getQueriesData<PaginatedResponse<Product>>({ 
        queryKey: queryKeys.products.lists() 
      });

      queryClient.setQueriesData<PaginatedResponse<Product>>(
        { queryKey: queryKeys.products.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((p) => p.id !== productId),
            total: old.total - 1,
          };
        }
      );

      return { previousProducts };
    },
    onError: (error: Error, productId, context) => {
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      logger.error('Failed to delete product', { error: error.message, productId });
      
      if (error instanceof TenantContextError) {
        toast.error('Tenant context not available. Please refresh the page.');
      } else if (error instanceof AuthError) {
        toast.error('Session expired. Please login again.');
      } else if (error instanceof PermissionError) {
        toast.error('You do not have permission to delete products.');
      } else {
        toast.error(error.message || 'Failed to delete product');
      }
    },
    onSuccess: (_, productId) => {
      toast.success('Product deleted successfully');
      logger.info('Product deleted', { productId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
};

export interface BulkDeleteProgress {
  total: number;
  completed: number;
  failed: number;
  failedIds: string[];
}

export const useBulkDeleteProductsMutation = (
  onProgress?: (progress: BulkDeleteProgress) => void
) => {
  const { userType } = useGlobalContext();
  const { tenant } = useTenantAuth();
  const queryClient = useQueryClient();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useMutation({
    mutationFn: async (productIds: string[]): Promise<BulkDeleteProgress> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context required');
      }

      const progress: BulkDeleteProgress = {
        total: productIds.length,
        completed: 0,
        failed: 0,
        failedIds: [],
      };

      const results = await Promise.allSettled(
        productIds.map(async (id) => {
          try {
            await productsService.deleteProduct(id);
            progress.completed++;
            onProgress?.(progress);
            return { success: true, id };
          } catch (error) {
            progress.failed++;
            progress.failedIds.push(id);
            onProgress?.(progress);
            logger.error('Failed to delete product in bulk', { 
              error: error instanceof Error ? error.message : 'Unknown error', 
              productId: id 
            });
            return { success: false, id, error };
          }
        })
      );

      return progress;
    },
    onMutate: async (productIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.lists() });

      const previousProducts = queryClient.getQueriesData<PaginatedResponse<Product>>({ 
        queryKey: queryKeys.products.lists() 
      });

      queryClient.setQueriesData<PaginatedResponse<Product>>(
        { queryKey: queryKeys.products.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((p) => !productIds.includes(p.id)),
            total: old.total - productIds.length,
          };
        }
      );

      return { previousProducts };
    },
    onError: (error: Error, productIds, context) => {
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      logger.error('Bulk delete failed', { error: error.message, count: productIds.length });
      
      if (error instanceof TenantContextError) {
        toast.error('Tenant context not available. Please refresh the page.');
      } else if (error instanceof AuthError) {
        toast.error('Session expired. Please login again.');
      } else if (error instanceof PermissionError) {
        toast.error('You do not have permission to delete products.');
      } else {
        toast.error(error.message || 'Bulk delete failed');
      }
    },
    onSuccess: (result) => {
      const successCount = result.completed;
      const failedCount = result.failed;
      
      if (failedCount > 0) {
        toast.error(`${successCount} deleted, ${failedCount} failed`, {
          description: 'Some products could not be deleted. Please try again.',
        });
      } else {
        toast.success(`${successCount} products deleted successfully`);
      }
      
      logger.info('Bulk delete completed', { 
        total: result.total,
        succeeded: successCount, 
        failed: failedCount 
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
};

export const useReorderProductsMutation = () => {
  const { userType } = useGlobalContext();
  const { tenant } = useTenantAuth();
  const queryClient = useQueryClient();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useMutation({
    mutationFn: async (productIds: string[]): Promise<{ success: boolean; message: string }> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context required');
      }
      return await productsService.reorderProducts(productIds);
    },
    onMutate: async (productIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.lists() });

      const previousData = queryClient.getQueriesData<PaginatedResponse<Product>>({
        queryKey: queryKeys.products.lists()
      });

      queryClient.setQueriesData<PaginatedResponse<Product>>(
        { queryKey: queryKeys.products.lists() },
        (old) => {
          if (!old) return old;
          
          const productMap = new Map(old.data.map(p => [p.uuid || p.id, p]));
          const reorderedData = productIds
            .map(id => productMap.get(id))
            .filter((p): p is Product => p !== undefined);
          
          return {
            ...old,
            data: reorderedData,
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Products reordered successfully');
      logger.info('Products reordered');
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }

      logger.error('Failed to reorder products', { error: error.message });

      if (error instanceof TenantContextError) {
        toast.error('Tenant context not available. Please refresh the page.');
      } else if (error instanceof AuthError) {
        toast.error('Session expired. Please login again.');
      } else if (error instanceof PermissionError) {
        toast.error('You do not have permission to reorder products.');
      } else {
        toast.error(error.message || 'Failed to reorder products');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
};

export const useBulkUpdateProductsMutation = () => {
  const { userType } = useGlobalContext();
  const { tenant } = useTenantAuth();
  const queryClient = useQueryClient();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useMutation({
    mutationFn: async ({ 
      productIds, 
      updateData 
    }: { 
      productIds: string[]; 
      updateData: any;
    }): Promise<{ updated: number; failed: number; errors?: any[] }> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context required');
      }
      return await productsService.bulkUpdateProducts(productIds, updateData);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.lists() });
      const previousData = queryClient.getQueriesData<PaginatedResponse<Product>>({
        queryKey: queryKeys.products.lists()
      });
      return { previousData };
    },
    onSuccess: (result, { productIds }) => {
      if (result.updated === productIds.length) {
        toast.success(`Successfully updated ${result.updated} product${result.updated > 1 ? 's' : ''}`);
      } else if (result.updated > 0) {
        toast.warning(`Updated ${result.updated} of ${productIds.length} products. ${result.failed} failed.`);
      } else {
        toast.error('Failed to update products');
      }
      
      logger.info('Bulk update completed', { 
        updated: result.updated, 
        failed: result.failed 
      });
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }

      logger.error('Failed to bulk update products', { error: error.message });

      if (error instanceof TenantContextError) {
        toast.error('Tenant context not available. Please refresh the page.');
      } else if (error instanceof AuthError) {
        toast.error('Session expired. Please login again.');
      } else if (error instanceof PermissionError) {
        toast.error('You do not have permission to update products.');
      } else {
        toast.error(error.message || 'Failed to update products');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
};

export const useDuplicateProductMutation = () => {
  const { userType } = useGlobalContext();
  const { tenant } = useTenantAuth();
  const queryClient = useQueryClient();

  const productsService = useMemo(() => {
    return createContextAwareProductsService(userType || 'tenant');
  }, [userType]);

  return useMutation({
    mutationFn: async (productId: string): Promise<Product> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context required');
      }
      return await productsService.duplicateProduct(productId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.lists() });
      const previousData = queryClient.getQueriesData<PaginatedResponse<Product>>({
        queryKey: queryKeys.products.lists()
      });
      return { previousData };
    },
    onSuccess: (duplicatedProduct) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      toast.success(`Product duplicated: ${duplicatedProduct.name}`);
      logger.info('Product duplicated', { productId: duplicatedProduct.id });
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }

      logger.error('Failed to duplicate product', { error: error.message });

      if (error instanceof TenantContextError) {
        toast.error('Tenant context not available. Please refresh the page.');
      } else if (error instanceof AuthError) {
        toast.error('Session expired. Please login again.');
      } else if (error instanceof PermissionError) {
        toast.error('You do not have permission to duplicate products.');
      } else {
        toast.error(error.message || 'Failed to duplicate product');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
};
