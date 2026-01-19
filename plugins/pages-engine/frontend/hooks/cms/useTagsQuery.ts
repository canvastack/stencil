import { useQuery } from '@tanstack/react-query';
import { tagService } from '@/services/cms/tagService';
import type {
  Tag,
  ApiListResponse,
} from '@/types/cms';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/react-query';
import { TenantContextError, AuthError } from '@/lib/errors';

export const useTagsQuery = (filters?: Record<string, any>) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.tags.list(filters),
    queryFn: async (): Promise<ApiListResponse<Tag>> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching tags', { filters, tenantId: tenant.uuid });
      return await tagService.list();
    },
    enabled: !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};
