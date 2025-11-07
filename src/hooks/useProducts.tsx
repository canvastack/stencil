import React, { useState, useEffect, useCallback } from 'react';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  images: string[];
  category: string;
  subcategory?: string;
  tags: string[];
  material: string;
  price: number;
  currency: string;
  priceUnit: string;
  minOrder: number;
  specifications: Array<{ key: string; value: string }>;
  customizable: boolean;
  customOptions?: Array<any>;
  inStock: boolean;
  stockQuantity?: number;
  leadTime: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

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
      
      // Load from JSON mockup
      const response = await fetch('/src/data/mockup/products.json');
      let data: Product[] = await response.json();
      
      // Apply filters
      if (options.category) {
        data = data.filter(p => p.category === options.category);
      }
      
      if (options.featured !== undefined) {
        data = data.filter(p => p.featured === options.featured);
      }
      
      if (options.status) {
        data = data.filter(p => p.status === options.status);
      }
      
      if (options.limit) {
        data = data.slice(0, options.limit);
      }
      
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
        
        // Load all products and find by slug or id
        const response = await fetch('/src/data/mockup/products.json');
        const data: Product[] = await response.json();
        
        const found = data.find(p => p.slug === slugOrId || p.id === slugOrId);
        
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
        
        const response = await fetch('/src/data/mockup/products.json');
        const data: Product[] = await response.json();
        
        // Extract unique categories
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
