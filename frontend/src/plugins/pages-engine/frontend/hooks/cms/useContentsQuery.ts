import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '@/services/cms/contentService';
import type {
  Content,
  ContentListItem,
  CreateContentInput,
  UpdateContentInput,
  ContentFilters,
  PublishContentInput,
  ScheduleContentInput,
  ApiResponse,
  ApiListResponse,
} from '@/types/cms';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/react-query';
import { TenantContextError, AuthError } from '@/lib/errors';

export const useContentsQuery = (filters?: ContentFilters) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.contents.list(filters),
    queryFn: async (): Promise<ApiListResponse<ContentListItem>> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching contents', { filters, tenantId: tenant.uuid });
      
      return await contentService.admin.list(filters);
    },
    enabled: !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const usePublicContentsQuery = (filters?: ContentFilters) => {
  const { userType } = useGlobalContext();

  return useQuery({
    queryKey: [...queryKeys.contents.lists(), 'public', filters],
    queryFn: async (): Promise<ApiListResponse<ContentListItem>> => {
      logger.debug('[CMS] Fetching public contents', { filters });
      return await contentService.public.list(filters);
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useContentQuery = (uuid?: string) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.contents.detail(uuid || ''),
    queryFn: async (): Promise<ApiResponse<Content>> => {
      if (!uuid) {
        throw new Error('Content UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching content', { uuid, tenantId: tenant.uuid });
      return await contentService.admin.getById(uuid);
    },
    enabled: !!uuid && !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePublicContentBySlugQuery = (slug?: string) => {
  return useQuery({
    queryKey: queryKeys.contents.bySlug(slug || ''),
    queryFn: async (): Promise<ApiResponse<Content>> => {
      if (!slug) {
        throw new Error('Content slug is required');
      }

      logger.debug('[CMS] Fetching public content by slug', { slug });
      return await contentService.public.getBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useContentsByTypeQuery = (contentTypeUuid?: string, filters?: ContentFilters) => {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.contents.byType(contentTypeUuid || '', filters),
    queryFn: async (): Promise<ApiListResponse<ContentListItem>> => {
      if (!contentTypeUuid) {
        throw new Error('Content type UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }

      return await contentService.admin.byType(
        contentTypeUuid,
        filters?.page,
        filters?.per_page
      );
    },
    enabled: !!contentTypeUuid && !!tenant?.uuid && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useContentsByCategoryQuery = (categoryUuid?: string, filters?: ContentFilters) => {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.contents.byCategory(categoryUuid || '', filters),
    queryFn: async (): Promise<ApiListResponse<ContentListItem>> => {
      if (!categoryUuid) {
        throw new Error('Category UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }

      return await contentService.admin.byCategory(
        categoryUuid,
        filters?.page,
        filters?.per_page
      );
    },
    enabled: !!categoryUuid && !!tenant?.uuid && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useContentsByStatusQuery = (status?: string, filters?: ContentFilters) => {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.contents.byStatus(status || '', filters),
    queryFn: async (): Promise<ApiListResponse<ContentListItem>> => {
      if (!status) {
        throw new Error('Status is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }

      return await contentService.admin.byStatus(
        status,
        filters?.page,
        filters?.per_page
      );
    },
    enabled: !!status && !!tenant?.uuid && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useCreateContentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (input: CreateContentInput) => {
      logger.debug('[CMS] Creating content', { input, tenantId: tenant?.uuid });
      return await contentService.admin.create(input);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all });
      toast.success('Content created successfully', {
        description: `Content "${data.data.title}" has been created as draft.`,
      });
      logger.info('[CMS] Content created', { uuid: data.data.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to create content', {
        description: error?.message || 'An error occurred while creating the content.',
      });
      logger.error('[CMS] Failed to create content', { error: error.message });
    },
  });
};

export const useUpdateContentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async ({ uuid, input }: { uuid: string; input: UpdateContentInput }) => {
      logger.debug('[CMS] Updating content', { uuid, input, tenantId: tenant?.uuid });
      return await contentService.admin.update(uuid, input);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.detail(variables.uuid) });
      toast.success('Content updated successfully', {
        description: 'Your changes have been saved.',
      });
      logger.info('[CMS] Content updated', { uuid: variables.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to update content', {
        description: error?.message || 'An error occurred while updating the content.',
      });
      logger.error('[CMS] Failed to update content', { error: error.message });
    },
  });
};

export const useDeleteContentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Deleting content', { uuid, tenantId: tenant?.uuid });
      return await contentService.admin.delete(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all });
      queryClient.removeQueries({ queryKey: queryKeys.contents.detail(uuid) });
      toast.success('Content deleted successfully', {
        description: 'The content has been permanently deleted.',
      });
      logger.info('[CMS] Content deleted', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to delete content', {
        description: error?.message || 'An error occurred while deleting the content.',
      });
      logger.error('[CMS] Failed to delete content', { error: error.message });
    },
  });
};

export const usePublishContentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async ({ uuid, input }: { uuid: string; input?: PublishContentInput }) => {
      logger.debug('[CMS] Publishing content', { uuid, input, tenantId: tenant?.uuid });
      return await contentService.admin.publish(uuid, input);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.detail(variables.uuid) });
      toast.success('Content published successfully', {
        description: 'The content is now live and visible to the public.',
      });
      logger.info('[CMS] Content published', { uuid: variables.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to publish content', {
        description: error?.message || 'An error occurred while publishing the content.',
      });
      logger.error('[CMS] Failed to publish content', { error: error.message });
    },
  });
};

export const useUnpublishContentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Unpublishing content', { uuid, tenantId: tenant?.uuid });
      return await contentService.admin.unpublish(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.detail(uuid) });
      toast.success('Content unpublished', {
        description: 'The content is now hidden from the public.',
      });
      logger.info('[CMS] Content unpublished', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to unpublish content', {
        description: error?.message || 'An error occurred while unpublishing the content.',
      });
      logger.error('[CMS] Failed to unpublish content', { error: error.message });
    },
  });
};

export const useScheduleContentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async ({ uuid, input }: { uuid: string; input: ScheduleContentInput }) => {
      logger.debug('[CMS] Scheduling content', { uuid, input, tenantId: tenant?.uuid });
      return await contentService.admin.schedule(uuid, input);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.detail(variables.uuid) });
      toast.success('Content scheduled successfully', {
        description: `The content will be published on ${variables.input.scheduled_at}.`,
      });
      logger.info('[CMS] Content scheduled', { uuid: variables.uuid, scheduledAt: variables.input.scheduled_at });
    },
    onError: (error: any) => {
      toast.error('Failed to schedule content', {
        description: error?.message || 'An error occurred while scheduling the content.',
      });
      logger.error('[CMS] Failed to schedule content', { error: error.message });
    },
  });
};

export const useArchiveContentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Archiving content', { uuid, tenantId: tenant?.uuid });
      return await contentService.admin.archive(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contents.detail(uuid) });
      toast.success('Content archived', {
        description: 'The content has been moved to the archive.',
      });
      logger.info('[CMS] Content archived', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to archive content', {
        description: error?.message || 'An error occurred while archiving the content.',
      });
      logger.error('[CMS] Failed to archive content', { error: error.message });
    },
  });
};
