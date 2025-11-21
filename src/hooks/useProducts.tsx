import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';
import { productsService } from '@/services/api/products';

interface UseProductsOptions {
  category?: string;
  featured?: boolean;
  status?: string;
  limit?: number;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await productsService.getProducts({
        category: options.category,
        featured: options.featured,
        status: options.status,
        limit: options.limit,
      });
      
      setProducts(response.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, [options.category, options.featured, options.status, options.limit]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return { products, loading, error, refresh: loadProducts };
};

export const useProduct = (id: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const found = await productsService.getProductById(id);
        
        if (found) {
          setProduct(found);
          setError(null);
        } else {
          setError(new Error('Product not found'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load product'));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  return { product, loading, error };
};

export const useProductBySlug = (slug: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) {
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const found = await productsService.getProductBySlug(slug);
        
        if (found) {
          setProduct(found);
          setError(null);
        } else {
          setError(new Error('Product not found'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load product'));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  return { product, loading, error };
};

export const useFeaturedProducts = (limit = 3) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoading(true);
        
        const data = await productsService.getFeaturedProducts(limit);
        
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load featured products'));
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, [limit]);

  return { products, loading, error };
};

export const useProductsByCategory = (category: string, limit?: number) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!!category);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProductsByCategory = async () => {
      if (!category) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const data = await productsService.getProductsByCategory(category, limit);
        
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load products by category'));
      } finally {
        setLoading(false);
      }
    };

    loadProductsByCategory();
  }, [category, limit]);

  return { products, loading, error };
};

export const useProductCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        
        const response = await productsService.getProducts();
        const data = response.data || [];
        const uniqueCategories = Array.from(new Set(data.map(p => p.category)));
        
        setCategories(uniqueCategories);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load categories'));
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return { categories, loading, error };
};
