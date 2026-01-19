import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionService } from '@/services/cms/revisionService';
import type {
  Revision,
  ApiResponse,
  ApiListResponse,
} from '@/types/cms';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/react-query';
import { TenantContextError, AuthError } from '@/lib/errors';

export const useRevisionsForContentQuery = (contentUuid?: string) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.revisions.forContent(contentUuid || ''),
    queryFn: async (): Promise<ApiListResponse<Revision>> => {
      if (!contentUuid) {
        throw new Error('Content UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching revisions for content', { contentUuid, tenantId: tenant.uuid });
      return await revisionService.listForContent(contentUuid);
    },
    enabled: !!contentUuid && !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useRevisionQuery = (uuid?: string) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.revisions.detail(uuid || ''),
    queryFn: async (): Promise<ApiResponse<Revision>> => {
      if (!uuid) {
        throw new Error('Revision UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching revision', { uuid, tenantId: tenant.uuid });
      return await revisionService.getById(uuid);
    },
    enabled: !!uuid && !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useRevertRevisionMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Reverting to revision', { uuid, tenantId: tenant?.uuid });
      return await revisionService.revert(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.revisions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all });
      toast.success('Revision restored successfully', {
        description: 'The content has been restored to this revision.',
      });
      logger.info('[CMS] Revision reverted', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to restore revision', {
        description: error?.message || 'An error occurred while restoring the revision.',
      });
      logger.error('[CMS] Failed to revert revision', { error: error.message });
    },
  });
};
