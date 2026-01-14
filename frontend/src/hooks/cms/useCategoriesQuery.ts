import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/cms/categoryService';
import type {
  Category,
  CategoryListItem,
  CategoryTreeNode,
  CreateCategoryInput,
  UpdateCategoryInput,
  MoveCategoryInput,
  ApiResponse,
  ApiListResponse,
} from '@/types/cms';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/react-query';
import { TenantContextError, AuthError } from '@/lib/errors';

export const useCategoriesQuery = (filters?: Record<string, any>) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.categories.list(filters),
    queryFn: async (): Promise<ApiListResponse<CategoryListItem>> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching categories', { filters, tenantId: tenant.uuid });
      return await categoryService.admin.list();
    },
    enabled: !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCategoryTreeQuery = () => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.categories.tree(),
    queryFn: async (): Promise<ApiResponse<CategoryTreeNode[]>> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching category tree', { tenantId: tenant.uuid });
      return await categoryService.admin.tree();
    },
    enabled: !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePublicCategoriesQuery = () => {
  return useQuery({
    queryKey: [...queryKeys.categories.lists(), 'public'],
    queryFn: async (): Promise<ApiListResponse<CategoryListItem>> => {
      logger.debug('[CMS] Fetching public categories');
      return await categoryService.public.list();
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const usePublicCategoryTreeQuery = () => {
  return useQuery({
    queryKey: [...queryKeys.categories.tree(), 'public'],
    queryFn: async (): Promise<ApiResponse<CategoryTreeNode[]>> => {
      logger.debug('[CMS] Fetching public category tree');
      return await categoryService.public.tree();
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useCategoryQuery = (uuid?: string) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.categories.detail(uuid || ''),
    queryFn: async (): Promise<ApiResponse<Category>> => {
      if (!uuid) {
        throw new Error('Category UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching category', { uuid, tenantId: tenant.uuid });
      return await categoryService.admin.getById(uuid);
    },
    enabled: !!uuid && !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePublicCategoryBySlugQuery = (slug?: string) => {
  return useQuery({
    queryKey: queryKeys.categories.bySlug(slug || ''),
    queryFn: async (): Promise<ApiResponse<Category>> => {
      if (!slug) {
        throw new Error('Category slug is required');
      }

      logger.debug('[CMS] Fetching public category by slug', { slug });
      return await categoryService.public.getBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      logger.debug('[CMS] Creating category', { input, tenantId: tenant?.uuid });
      return await categoryService.admin.create(input);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category created successfully', {
        description: `Category "${data.data.name}" has been created.`,
      });
      logger.info('[CMS] Category created', { uuid: data.data.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to create category', {
        description: error?.message || 'An error occurred while creating the category.',
      });
      logger.error('[CMS] Failed to create category', { error: error.message });
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async ({ uuid, input }: { uuid: string; input: UpdateCategoryInput }) => {
      logger.debug('[CMS] Updating category', { uuid, input, tenantId: tenant?.uuid });
      return await categoryService.admin.update(uuid, input);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(variables.uuid) });
      toast.success('Category updated successfully', {
        description: 'Your changes have been saved.',
      });
      logger.info('[CMS] Category updated', { uuid: variables.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to update category', {
        description: error?.message || 'An error occurred while updating the category.',
      });
      logger.error('[CMS] Failed to update category', { error: error.message });
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Deleting category', { uuid, tenantId: tenant?.uuid });
      return await categoryService.admin.delete(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(uuid) });
      toast.success('Category deleted successfully', {
        description: 'The category has been permanently deleted.',
      });
      logger.info('[CMS] Category deleted', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to delete category', {
        description: error?.message || 'An error occurred while deleting the category.',
      });
      logger.error('[CMS] Failed to delete category', { error: error.message });
    },
  });
};

export const useMoveCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async ({ uuid, input }: { uuid: string; input: MoveCategoryInput }) => {
      logger.debug('[CMS] Moving category', { uuid, input, tenantId: tenant?.uuid });
      return await categoryService.admin.move(uuid, input);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category moved successfully', {
        description: 'The category hierarchy has been updated.',
      });
      logger.info('[CMS] Category moved', { uuid: variables.uuid, newParent: variables.input.new_parent_id });
    },
    onError: (error: any) => {
      toast.error('Failed to move category', {
        description: error?.message || 'An error occurred while moving the category.',
      });
      logger.error('[CMS] Failed to move category', { error: error.message });
    },
  });
};

export const useReorderCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async ({ uuid, newOrder }: { uuid: string; newOrder: number }) => {
      logger.debug('[CMS] Reordering category', { uuid, newOrder, tenantId: tenant?.uuid });
      return await categoryService.admin.reorder(uuid, newOrder);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category reordered successfully', {
        description: 'The category order has been updated.',
      });
      logger.info('[CMS] Category reordered', { uuid: variables.uuid, newOrder: variables.newOrder });
    },
    onError: (error: any) => {
      toast.error('Failed to reorder category', {
        description: error?.message || 'An error occurred while reordering the category.',
      });
      logger.error('[CMS] Failed to reorder category', { error: error.message });
    },
  });
};
