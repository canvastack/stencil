import { useState, useCallback, useEffect } from 'react';
import { publicProductsService } from '@/services/api/publicProducts';
import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';
import { usePublicTenant } from '@/contexts/PublicTenantContext';

interface UsePublicProductsState {
  products: Product[];
  currentProduct: Product | null;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  isLoading: boolean;
  error: string | null;
}

export const usePublicProducts = () => {
  // Safe tenant context access - won't throw if outside PublicTenantProvider
  let tenantSlug: string | null = null;
  try {
    const tenantContext = usePublicTenant();
    tenantSlug = tenantContext.tenantSlug;
  } catch (error) {
    // Hook called outside PublicTenantProvider context, use null tenant
    console.log('usePublicProducts: No tenant context available, using global products');
  }
  
  const [state, setState] = useState<UsePublicProductsState>({
    products: [],
    currentProduct: null,
    pagination: {
      page: 1,
      per_page: 10,
      total: 0,
      last_page: 1,
    },
    isLoading: false,
    error: null,
  });

  const fetchProducts = useCallback(async (filters?: ProductFilters) => {
    console.log('fetchProducts called with:', { filters, tenantSlug });
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Product> = await publicProductsService.getProducts(filters, tenantSlug || undefined);
      console.log('fetchProducts response:', { 
        productsCount: response.data?.length,
        total: response.total 
      });
      setState((prev) => ({
        ...prev,
        products: response.data,
        pagination: {
          page: response.current_page || 1,
          per_page: response.per_page || 10,
          total: response.total || 0,
          last_page: response.last_page || 1,
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch products';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  // Remove tenantSlug dependency to prevent infinite loop
  }, []);

  const fetchProductBySlug = useCallback(async (slug: string) => {
    console.log('fetchProductBySlug called with:', { slug, tenantSlug });
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const product = await publicProductsService.getProductBySlug(slug, tenantSlug || undefined);
      console.log('fetchProductBySlug response:', product);
      if (product) {
        setState((prev) => ({ ...prev, currentProduct: product, isLoading: false }));
        return product;
      } else {
        setState((prev) => ({ ...prev, error: 'Product not found', isLoading: false }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch product';
      console.error('fetchProductBySlug error:', error);
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, [tenantSlug]);

  const fetchProductById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const product = await publicProductsService.getProductById(id);
      if (product) {
        setState((prev) => ({ ...prev, currentProduct: product, isLoading: false }));
        return product;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch product';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const getFeaturedProducts = useCallback(async (limit?: number) => {
    try {
      return await publicProductsService.getFeaturedProducts(limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch featured products';
      toast.error(message);
    }
  }, []);

  const getProductsByCategory = useCallback(async (category: string, limit?: number) => {
    try {
      return await publicProductsService.getProductsByCategory(category, limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch products by category';
      toast.error(message);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    try {
      return await publicProductsService.searchProducts(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search products';
      toast.error(message);
    }
  }, []);

  return {
    products: state.products,
    currentProduct: state.currentProduct,
    pagination: state.pagination,
    isLoading: state.isLoading,
    error: state.error,
    fetchProducts,
    fetchProductById,
    fetchProductBySlug,
    getFeaturedProducts,
    getProductsByCategory,
    searchProducts,
  };
};

export const usePublicProduct = (productId?: string) => {
  const { fetchProductById, currentProduct, isLoading, error } = usePublicProducts();

  useEffect(() => {
    if (productId) {
      fetchProductById(productId);
    }
  }, [productId, fetchProductById]);

  return {
    product: currentProduct,
    isLoading,
    error,
  };
};

export const usePublicProductBySlug = (slug: string) => {
  const { fetchProductBySlug, currentProduct, isLoading, error } = usePublicProducts();

  useEffect(() => {
    if (slug) {
      console.log('usePublicProductBySlug: Calling fetchProductBySlug for slug:', slug);
      fetchProductBySlug(slug);
    }
  }, [slug, fetchProductBySlug]);

  return {
    product: currentProduct,
    isLoading,
    error,
  };
};