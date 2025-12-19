import { useState, useCallback, useEffect } from 'react';
import { CreateProductRequest, UpdateProductRequest } from '@/services/api/contextAwareProductsService';
import { Product, ProductFilters } from '@/types/product';
import {
  useProductsQuery,
  useProductQuery,
  useProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from './useProductsQuery';

interface UseProductsState {
  products: Product[];
  currentProduct: Product | null;
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

export const useProducts = (initialFilters?: ProductFilters) => {
  const [filters, setFilters] = useState<ProductFilters | undefined>(initialFilters);
  const [currentProductId, setCurrentProductId] = useState<string | undefined>();
  const [currentProductSlug, setCurrentProductSlug] = useState<string | undefined>();
  
  const productsQuery = useProductsQuery(filters);
  const currentProductQuery = useProductQuery(currentProductId);
  const currentProductBySlugQuery = useProductBySlugQuery(currentProductSlug);
  
  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();

  const products = productsQuery.data?.data || [];
  const pagination = {
    page: productsQuery.data?.current_page || 1,
    per_page: productsQuery.data?.per_page || 10,
    total: productsQuery.data?.total || 0,
    last_page: productsQuery.data?.last_page || 1,
  };

  const currentProduct = currentProductQuery.data || currentProductBySlugQuery.data || null;
  
  const isLoading = productsQuery.isLoading || 
    currentProductQuery.isLoading || 
    currentProductBySlugQuery.isLoading;
    
  const isSaving = createProductMutation.isPending || 
    updateProductMutation.isPending || 
    deleteProductMutation.isPending;

  const error = (productsQuery.error as Error)?.message || 
    (currentProductQuery.error as Error)?.message || 
    (currentProductBySlugQuery.error as Error)?.message || 
    null;

  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    setFilters(newFilters);
    await productsQuery.refetch();
  }, [productsQuery]);

  const fetchProductById = useCallback(async (id: string) => {
    setCurrentProductId(id);
    const result = await currentProductQuery.refetch();
    return result.data;
  }, [currentProductQuery]);

  const fetchProductBySlug = useCallback(async (slug: string) => {
    setCurrentProductSlug(slug);
    const result = await currentProductBySlugQuery.refetch();
    return result.data;
  }, [currentProductBySlugQuery]);

  const createProduct = useCallback(async (data: CreateProductRequest) => {
    const result = await createProductMutation.mutateAsync(data);
    return result;
  }, [createProductMutation]);

  const updateProduct = useCallback(async (id: string, data: UpdateProductRequest) => {
    const result = await updateProductMutation.mutateAsync({ id, data });
    return result;
  }, [updateProductMutation]);

  const deleteProduct = useCallback(async (id: string) => {
    await deleteProductMutation.mutateAsync(id);
  }, [deleteProductMutation]);

  return {
    products,
    currentProduct,
    pagination,
    isLoading,
    isSaving,
    error,
    fetchProducts,
    fetchProductById,
    fetchProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

export const useProduct = (productId?: string) => {
  const query = useProductQuery(productId);
  
  return {
    product: query.data || null,
    loading: query.isLoading,
    isLoading: query.isLoading,
    error: (query.error as Error)?.message || null,
  };
};

export const useProductBySlug = (slug?: string) => {
  const query = useProductBySlugQuery(slug);
  
  return {
    product: query.data || null,
    isLoading: query.isLoading,
    error: (query.error as Error)?.message || null,
  };
};
