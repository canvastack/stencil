import { useQuery } from '@tanstack/react-query';
import { anonymousApiClient } from '@/services/api/anonymousApiClient';

export interface ProductOptions {
  materials: string[];
  sizes: Record<string, string>;
  quality_levels: string[];
  colors: Array<{
    name: string;
    hex: string | null;
    label: string;
  }>;
  thickness_options: string[];
  custom_options: Record<string, boolean>;
  customizable: boolean;
}

export const useProductOptions = (tenantSlug?: string, productUuid?: string) => {
  return useQuery<{ data: ProductOptions }>({
    queryKey: ['product-options', tenantSlug, productUuid],
    queryFn: async () => {
      if (!tenantSlug || !productUuid) {
        throw new Error('Tenant slug and product UUID are required');
      }
      
      const response = await anonymousApiClient.get(
        `/public/${tenantSlug}/products/${productUuid}/options`
      );
      
      return response.data;
    },
    enabled: !!tenantSlug && !!productUuid,
    staleTime: 5 * 60 * 1000,
  });
};
