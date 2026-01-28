import { useState, useCallback, useEffect } from 'react';
import { categoriesService, CreateCategoryRequest, UpdateCategoryRequest } from '@/services/api/categories';
import { Category, CategoryFilters } from '@/types/category';
import { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

interface UseCategoriesState {
  categories: Category[];
  currentCategory: Category | null;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

export const useCategories = () => {
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    currentCategory: null,
    pagination: {
      page: 1,
      per_page: 50,
      total: 0,
      last_page: 1,
    },
    isLoading: false,
    isSaving: false,
    error: null,
  });

  const fetchCategories = useCallback(async (filters?: CategoryFilters) => {
    console.log('[useCategories] fetchCategories called with filters:', filters);
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Category> = await categoriesService.getCategories(filters);
      
      console.log('[useCategories] Service response received:', {
        type: typeof response,
        hasData: response && 'data' in response,
        dataIsArray: response && 'data' in response && Array.isArray(response.data),
        dataLength: response && 'data' in response ? response.data?.length : 'N/A',
        currentPage: response?.current_page,
        total: response?.total,
        response: response
      });
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from service: response is not an object');
      }
      
      if (!('data' in response)) {
        throw new Error('Invalid response from service: missing data field');
      }
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response from service: data is not an array');
      }
      
      console.log('[useCategories] Setting categories state with', response.data.length, 'items');
      
      setState((prev) => ({
        ...prev,
        categories: response.data,
        pagination: {
          page: response.current_page || 1,
          per_page: response.per_page || 50,
          total: response.total || 0,
          last_page: response.last_page || 1,
        },
        isLoading: false,
      }));
      
      console.log('[useCategories] State updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch categories';
      console.error('[useCategories] Error fetching categories:', {
        error,
        message,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setState((prev) => ({ 
        ...prev, 
        // Don't reset categories if we already have data
        categories: prev.categories.length > 0 ? prev.categories : [],
        error: message, 
        isLoading: false 
      }));
      toast.error(message);
    }
  }, []);

  const fetchCategoryById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const category = await categoriesService.getCategoryById(id);
      setState((prev) => ({ ...prev, currentCategory: category, isLoading: false }));
      return category;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch category';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchCategoryBySlug = useCallback(async (slug: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const category = await categoriesService.getCategoryBySlug(slug);
      setState((prev) => ({ ...prev, currentCategory: category, isLoading: false }));
      return category;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch category';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const createCategory = useCallback(async (data: CreateCategoryRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const category = await categoriesService.createCategory(data);
      setState((prev) => ({
        ...prev,
        categories: [category, ...prev.categories],
        isSaving: false,
      }));
      toast.success('Category created successfully');
      return category;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: UpdateCategoryRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const category = await categoriesService.updateCategory(id, data);
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? category : c)),
        currentCategory: prev.currentCategory?.id === id ? category : prev.currentCategory,
        isSaving: false,
      }));
      toast.success('Category updated successfully');
      return category;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await categoriesService.deleteCategory(id);
      setState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        currentCategory: prev.currentCategory?.id === id ? null : prev.currentCategory,
        isSaving: false,
      }));
      toast.success('Category deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const getCategoryTree = useCallback(async () => {
    try {
      const tree = await categoriesService.getCategoryTree();
      return tree;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch category tree';
      toast.error(message);
      return [];
    }
  }, []);

  const reorderCategories = useCallback(async (categoryIds: string[]) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await categoriesService.reorderCategories(categoryIds);
      // Refresh categories to get new order
      await fetchCategories();
      setState((prev) => ({ ...prev, isSaving: false }));
      toast.success('Categories reordered successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reorder categories';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, [fetchCategories]);

  return {
    categories: state.categories,
    currentCategory: state.currentCategory,
    pagination: state.pagination,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchCategories,
    fetchCategoryById,
    fetchCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryTree,
    reorderCategories,
  };
};

export const useCategory = (categoryId?: string) => {
  const { fetchCategoryById, currentCategory, isLoading, error } = useCategories();

  useEffect(() => {
    if (categoryId) {
      fetchCategoryById(categoryId);
    }
  }, [categoryId, fetchCategoryById]);

  return {
    category: currentCategory,
    isLoading,
    error,
  };
};

export const useCategoryBySlug = (slug: string) => {
  const { fetchCategoryBySlug, currentCategory, isLoading, error } = useCategories();

  useEffect(() => {
    if (slug) {
      fetchCategoryBySlug(slug);
    }
  }, [slug, fetchCategoryBySlug]);

  return {
    category: currentCategory,
    isLoading,
    error,
  };
};