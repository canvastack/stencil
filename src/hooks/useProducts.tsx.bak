import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';
import { getProducts } from '@/services/mock/products';

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
      
      const data = getProducts({
        category: options.category,
        featured: options.featured,
        status: options.status,
        limit: options.limit,
      });
      
      setProducts(data);
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

export const useProduct = (slugOrId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        
        const found = getProducts().find(p => p.slug === slugOrId || p.id === slugOrId);
        
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
  }, [slugOrId]);

  return { product, loading, error };
};

export const useProductCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        
        const data = getProducts();
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
