import { useQuery } from '@tanstack/react-query';
import { publicProductsService } from '@/services/api/publicProducts';
import type { Product, ProductFilters } from '@/types/product';
import type { PaginatedResponse } from '@/types/api';
import { usePublicTenant } from '@/contexts/PublicTenantContext';
import { useMemo } from 'react';

export const queryKeys = {
  publicProducts: {
    all: ['public-products'] as const,
    lists: () => [...queryKeys.publicProducts.all, 'list'] as const,
    list: (filters?: ProductFilters, tenantSlug?: string | null) => 
      [...queryKeys.publicProducts.lists(), { filters, tenantSlug }] as const,
    details: () => [...queryKeys.publicProducts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.publicProducts.details(), id] as const,
    bySlug: (slug: string, tenantSlug?: string | null) => 
      [...queryKeys.publicProducts.all, 'slug', slug, { tenantSlug }] as const,
  },
};

/**
 * Hook for fetching public products with server-side filtering, search, sorting, and pagination
 * Optimized for public product pages with debounced search and TanStack Query caching
 */
export const usePublicProductsQuery = (filters?: ProductFilters) => {
  // Safe tenant context access - won't throw if outside PublicTenantProvider
  let tenantSlug: string | null = null;
  let tenantContextLoading = false;
  try {
    const tenantContext = usePublicTenant();
    tenantSlug = tenantContext.tenantSlug;
    tenantContextLoading = tenantContext.isLoading;
  } catch (error) {
    // Hook called outside PublicTenantProvider context
  }

  // Memoize filters to prevent unnecessary re-renders
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  return useQuery<PaginatedResponse<Product>, Error>({
    queryKey: queryKeys.publicProducts.list(stableFilters, tenantSlug),
    queryFn: async ({ signal }): Promise<PaginatedResponse<Product>> => {
      const response = await publicProductsService.getProducts(stableFilters, tenantSlug || undefined);
      return response;
    },
    // CRITICAL: Wait for tenant context to finish loading before fetching
    // This prevents race condition where we fetch ALL products before tenant slug is extracted from URL
    enabled: !tenantContextLoading,
    // Caching configuration for public products (5 min stale time as per roadmap)
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
    // Only retry on network errors, not server errors (500)
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx or 5xx errors (client/server errors)
      if (error?.response?.status >= 400) return false;
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    // Refetch on window focus for fresh data
    refetchOnWindowFocus: false,
    // Note: placeholderData removed to show skeleton during pagination/filter changes
  });
};

/**
 * Hook for fetching a single public product by slug
 */
export const usePublicProductBySlugQuery = (slug?: string) => {
  // Safe tenant context access
  let tenantSlug: string | null = null;
  let tenantContextLoading = false;
  try {
    const tenantContext = usePublicTenant();
    tenantSlug = tenantContext.tenantSlug;
    tenantContextLoading = tenantContext.isLoading;
  } catch (error) {
    // Hook called outside PublicTenantProvider context
  }

  return useQuery<Product | null, Error>({
    queryKey: queryKeys.publicProducts.bySlug(slug || '', tenantSlug),
    queryFn: async ({ signal }): Promise<Product | null> => {
      if (!slug) {
        throw new Error('Product slug is required');
      }
      
      const product = await publicProductsService.getProductBySlug(slug, tenantSlug || undefined);
      return product;
    },
    enabled: !!slug && !tenantContextLoading,

    staleTime: 10 * 60 * 1000, // 10 minutes (single products change less frequently)
    gcTime: 15 * 60 * 1000,
    retry: 3,
  });
};

/**
 * Hook for fetching a single public product by ID/UUID
 */
export const usePublicProductByIdQuery = (id?: string) => {
  return useQuery<Product | null, Error>({
    queryKey: queryKeys.publicProducts.detail(id || ''),
    queryFn: async ({ signal }): Promise<Product | null> => {
      if (!id) {
        throw new Error('Product ID is required');
      }
      
      const product = await publicProductsService.getProductById(id);
      return product;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 3,
  });
};
