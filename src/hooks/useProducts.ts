import { useState, useCallback, useEffect } from 'react';
import { productsService, CreateProductRequest, UpdateProductRequest } from '@/services/api/products';
import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

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

export const useProducts = () => {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    currentProduct: null,
    pagination: {
      page: 1,
      per_page: 10,
      total: 0,
      last_page: 1,
    },
    isLoading: false,
    isSaving: false,
    error: null,
  });

  const fetchProducts = useCallback(async (filters?: ProductFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Product> = await productsService.getProducts(filters);
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
  }, []);

  const fetchProductById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const product = await productsService.getProductById(id);
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

  const fetchProductBySlug = useCallback(async (slug: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const product = await productsService.getProductBySlug(slug);
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

  const createProduct = useCallback(async (data: CreateProductRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const product = await productsService.createProduct(data);
      setState((prev) => ({
        ...prev,
        products: [product, ...prev.products],
        isSaving: false,
      }));
      toast.success('Product created successfully');
      return product;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create product';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const updateProduct = useCallback(async (id: string, data: UpdateProductRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const product = await productsService.updateProduct(id, data);
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.id === id ? product : p)),
        currentProduct: prev.currentProduct?.id === id ? product : prev.currentProduct,
        isSaving: false,
      }));
      toast.success('Product updated successfully');
      return product;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await productsService.deleteProduct(id);
      setState((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
        currentProduct: prev.currentProduct?.id === id ? null : prev.currentProduct,
        isSaving: false,
      }));
      toast.success('Product deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete product';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const getFeaturedProducts = useCallback(async (limit?: number) => {
    try {
      return await productsService.getFeaturedProducts(limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch featured products';
      toast.error(message);
    }
  }, []);

  const getProductsByCategory = useCallback(async (category: string, limit?: number) => {
    try {
      return await productsService.getProductsByCategory(category, limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch products by category';
      toast.error(message);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    try {
      return await productsService.searchProducts(query);
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
    isSaving: state.isSaving,
    error: state.error,
    fetchProducts,
    fetchProductById,
    fetchProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    getFeaturedProducts,
    getProductsByCategory,
    searchProducts,
  };
};

export const useProduct = (productId?: string) => {
  const { fetchProductById, currentProduct, isLoading, error } = useProducts();

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

export const useProductBySlug = (slug: string) => {
  const { fetchProductBySlug, currentProduct, isLoading, error } = useProducts();

  useEffect(() => {
    if (slug) {
      fetchProductBySlug(slug);
    }
  }, [slug, fetchProductBySlug]);

  return {
    product: currentProduct,
    isLoading,
    error,
  };
};
