import { useQuery } from '@tanstack/react-query';
import { publicProductsService } from '@/services/api/publicProducts';
import { usePublicTenant } from '@/contexts/PublicTenantContext';

export const queryKeys = {
  productFilterOptions: {
    all: ['product-filter-options'] as const,
    byTenant: (tenantSlug?: string | null) => 
      [...queryKeys.productFilterOptions.all, { tenantSlug }] as const,
  },
};

export interface FilterOption {
  value: string;
  label: string;
}

export interface ProductFilterOptions {
  business_types: FilterOption[];
  sizes: FilterOption[];
  materials: FilterOption[];
}

/**
 * Hook for fetching product filter options (business types, sizes, materials)
 * Phase 1.4.1: Remove hardcoded frontend filter data
 */
export const useProductFilterOptions = () => {
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

  return useQuery<ProductFilterOptions, Error>({
    queryKey: queryKeys.productFilterOptions.byTenant(tenantSlug),
    queryFn: async (): Promise<ProductFilterOptions> => {
      const filterOptions = await publicProductsService.getFilterOptions(tenantSlug || undefined);
      return filterOptions;
    },
    // Wait for tenant context to finish loading
    enabled: !tenantContextLoading,
    // Cache filter options for 10 minutes (they change rarely)
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
};
