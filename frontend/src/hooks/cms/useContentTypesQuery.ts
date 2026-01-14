import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentTypeService } from '@/services/cms/contentTypeService';
import type {
  ContentType,
  ContentTypeListItem,
  CreateContentTypeInput,
  UpdateContentTypeInput,
  ApiResponse,
  ApiListResponse,
} from '@/types/cms';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/react-query';
import { TenantContextError, AuthError } from '@/lib/errors';

export const useContentTypesQuery = (filters?: Record<string, any>) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.contentTypes.list(filters),
    queryFn: async (): Promise<ApiListResponse<ContentTypeListItem>> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching content types', { filters, tenantId: tenant.uuid });
      
      try {
        return await contentTypeService.admin.list();
      } catch (error: any) {
        logger.error('[CMS] Failed to fetch content types', { error: error.message });
        throw error;
      }
    },
    enabled: !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useContentTypeQuery = (uuid?: string) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.contentTypes.detail(uuid || ''),
    queryFn: async (): Promise<ApiResponse<ContentType>> => {
      if (!uuid) {
        throw new Error('Content type UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching content type', { uuid, tenantId: tenant.uuid });
      
      return await contentTypeService.admin.getById(uuid);
    },
    enabled: !!uuid && !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useCreateContentTypeMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (input: CreateContentTypeInput) => {
      logger.debug('[CMS] Creating content type', { input, tenantId: tenant?.uuid });
      return await contentTypeService.admin.create(input);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentTypes.all });
      toast.success('Content type created successfully', {
        description: `Content type "${data.data.display_name}" has been created.`,
      });
      logger.info('[CMS] Content type created', { uuid: data.data.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to create content type', {
        description: error?.message || 'An error occurred while creating the content type.',
      });
      logger.error('[CMS] Failed to create content type', { error: error.message });
    },
  });
};

export const useUpdateContentTypeMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async ({ uuid, input }: { uuid: string; input: UpdateContentTypeInput }) => {
      logger.debug('[CMS] Updating content type', { uuid, input, tenantId: tenant?.uuid });
      return await contentTypeService.admin.update(uuid, input);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentTypes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contentTypes.detail(variables.uuid) });
      toast.success('Content type updated successfully', {
        description: `Content type has been updated.`,
      });
      logger.info('[CMS] Content type updated', { uuid: variables.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to update content type', {
        description: error?.message || 'An error occurred while updating the content type.',
      });
      logger.error('[CMS] Failed to update content type', { error: error.message });
    },
  });
};

export const useDeleteContentTypeMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Deleting content type', { uuid, tenantId: tenant?.uuid });
      return await contentTypeService.admin.delete(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentTypes.all });
      queryClient.removeQueries({ queryKey: queryKeys.contentTypes.detail(uuid) });
      toast.success('Content type deleted successfully', {
        description: 'The content type has been permanently deleted.',
      });
      logger.info('[CMS] Content type deleted', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to delete content type', {
        description: error?.message || 'An error occurred while deleting the content type.',
      });
      logger.error('[CMS] Failed to delete content type', { error: error.message });
    },
  });
};

export const useActivateContentTypeMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Activating content type', { uuid, tenantId: tenant?.uuid });
      return await contentTypeService.admin.activate(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentTypes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contentTypes.detail(uuid) });
      toast.success('Content type activated', {
        description: 'The content type is now active and visible.',
      });
      logger.info('[CMS] Content type activated', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to activate content type', {
        description: error?.message || 'An error occurred while activating the content type.',
      });
      logger.error('[CMS] Failed to activate content type', { error: error.message });
    },
  });
};

export const useDeactivateContentTypeMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Deactivating content type', { uuid, tenantId: tenant?.uuid });
      return await contentTypeService.admin.deactivate(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentTypes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contentTypes.detail(uuid) });
      toast.success('Content type deactivated', {
        description: 'The content type is now hidden from the public.',
      });
      logger.info('[CMS] Content type deactivated', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to deactivate content type', {
        description: error?.message || 'An error occurred while deactivating the content type.',
      });
      logger.error('[CMS] Failed to deactivate content type', { error: error.message });
    },
  });
};

export const useContentsCountQuery = (contentTypeUuid?: string) => {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.contentTypes.contentsCount(contentTypeUuid || ''),
    queryFn: async (): Promise<number> => {
      if (!contentTypeUuid) {
        throw new Error('Content type UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      const response = await contentTypeService.admin.getContentsCount(contentTypeUuid);
      return response.data;
    },
    enabled: !!contentTypeUuid && !!tenant?.uuid && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
