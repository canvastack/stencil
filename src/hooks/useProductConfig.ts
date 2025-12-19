import { useQuery } from '@tanstack/react-query';
import { createProductConfigService } from '@/services/api/productConfig';
import type { ProductConfigResponse, StatusOption, AvailabilityOption } from '@/services/api/productConfig';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { useMemo } from 'react';
import { logger } from '@/lib/logger';

export const useProductConfig = () => {
  const { userType } = useGlobalContext();
  
  const productConfigService = useMemo(() => {
    return createProductConfigService(userType || 'tenant');
  }, [userType]);

  return useQuery({
    queryKey: ['product-config'] as const,
    queryFn: async ({ signal }): Promise<ProductConfigResponse> => {
      logger.debug('Fetching product configuration');
      return await productConfigService.getProductConfig(signal);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

export const useProductStatuses = () => {
  const { userType } = useGlobalContext();
  
  const productConfigService = useMemo(() => {
    return createProductConfigService(userType || 'tenant');
  }, [userType]);

  return useQuery({
    queryKey: ['product-config', 'statuses'] as const,
    queryFn: async ({ signal }): Promise<StatusOption[]> => {
      logger.debug('Fetching product statuses');
      return await productConfigService.getStatuses(signal);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

export const useProductAvailabilities = () => {
  const { userType } = useGlobalContext();
  
  const productConfigService = useMemo(() => {
    return createProductConfigService(userType || 'tenant');
  }, [userType]);

  return useQuery({
    queryKey: ['product-config', 'availabilities'] as const,
    queryFn: async ({ signal }): Promise<AvailabilityOption[]> => {
      logger.debug('Fetching product availabilities');
      return await productConfigService.getAvailabilities(signal);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};
