import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService, CreateCategoryRequest, UpdateCategoryRequest } from '@/services/api/categories';
import type { Category, CategoryFilters } from '@/types/category';
import type { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/react-query';

export const useCategoriesQuery = (filters?: CategoryFilters) => {
  return useQuery({
    queryKey: ['categories', 'list', filters] as const,
    queryFn: async ({ signal }): Promise<PaginatedResponse<Category>> => {
      logger.debug('Fetching categories', { filters });
      return await categoriesService.getCategories(filters);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useCategoryQuery = (id?: string) => {
  return useQuery({
    queryKey: ['categories', 'detail', id] as const,
    queryFn: async ({ signal }): Promise<Category> => {
      if (!id) {
        throw new Error('Category ID is required');
      }
      return await categoriesService.getCategoryById(id);
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useCategoryBySlugQuery = (slug?: string) => {
  return useQuery({
    queryKey: ['categories', 'slug', slug] as const,
    queryFn: async ({ signal }): Promise<Category> => {
      if (!slug) {
        throw new Error('Category slug is required');
      }
      return await categoriesService.getCategoryBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useCategoryTreeQuery = () => {
  return useQuery({
    queryKey: ['categories', 'tree'] as const,
    queryFn: async ({ signal }): Promise<Category[]> => {
      logger.debug('Fetching category tree');
      return await categoriesService.getCategoryTree();
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryRequest): Promise<Category> => {
      return await categoriesService.createCategory(data);
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'tree'] });
      toast.success('Category created successfully');
      logger.info('Category created', { categoryId: newCategory.id });
    },
    onError: (error: Error) => {
      logger.error('Failed to create category', { error: error.message });
      toast.error(error.message || 'Failed to create category');
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryRequest }): Promise<Category> => {
      return await categoriesService.updateCategory(id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['categories', 'detail', id] });
      
      const previousCategory = queryClient.getQueryData<Category>(['categories', 'detail', id]);
      
      if (previousCategory) {
        queryClient.setQueryData<Category>(['categories', 'detail', id], {
          ...previousCategory,
          ...data,
        });
      }
      
      return { previousCategory };
    },
    onSuccess: (updatedCategory, variables) => {
      queryClient.setQueryData(['categories', 'detail', variables.id], updatedCategory);
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'tree'] });
      toast.success('Category updated successfully');
      logger.info('Category updated', { categoryId: variables.id });
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousCategory) {
        queryClient.setQueryData(
          ['categories', 'detail', variables.id],
          context.previousCategory
        );
      }
      
      logger.error('Failed to update category', { error: error.message, categoryId: variables.id });
      toast.error(error.message || 'Failed to update category');
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await categoriesService.deleteCategory(id);
    },
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: ['categories', 'list'] });

      const previousCategories = queryClient.getQueriesData<PaginatedResponse<Category>>({ 
        queryKey: ['categories', 'list'] 
      });

      queryClient.setQueriesData<PaginatedResponse<Category>>(
        { queryKey: ['categories', 'list'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((c) => c.id !== categoryId),
            total: old.total - 1,
          };
        }
      );

      return { previousCategories };
    },
    onError: (error: Error, categoryId, context) => {
      if (context?.previousCategories) {
        context.previousCategories.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      logger.error('Failed to delete category', { error: error.message, categoryId });
      toast.error(error.message || 'Failed to delete category');
    },
    onSuccess: (_, categoryId) => {
      toast.success('Category deleted successfully');
      logger.info('Category deleted', { categoryId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'tree'] });
    },
  });
};

export const useReorderCategoriesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryIds: string[]): Promise<void> => {
      await categoriesService.reorderCategories(categoryIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'tree'] });
      toast.success('Categories reordered successfully');
      logger.info('Categories reordered');
    },
    onError: (error: Error) => {
      logger.error('Failed to reorder categories', { error: error.message });
      toast.error(error.message || 'Failed to reorder categories');
    },
  });
};
