import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import { toast } from 'sonner';

interface ProductComparisonContextType {
  comparedProducts: Product[];
  comparedProductIds: string[];
  isComparing: (productId: string) => boolean;
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearComparison: () => void;
  maxProducts: number;
  isMaxReached: boolean;
}

const ProductComparisonContext = createContext<ProductComparisonContextType | undefined>(undefined);

const STORAGE_KEY = 'product-comparison';
const MAX_PRODUCTS = 4;

export const ProductComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparedProducts, setComparedProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load comparison from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedProducts));
    } catch (error) {
      console.error('Failed to save comparison to localStorage:', error);
    }
  }, [comparedProducts]);

  const comparedProductIds = comparedProducts.map(p => p.id);
  const isMaxReached = comparedProducts.length >= MAX_PRODUCTS;

  const isComparing = useCallback((productId: string) => {
    return comparedProductIds.includes(productId);
  }, [comparedProductIds]);

  const addToCompare = useCallback((product: Product) => {
    setComparedProducts(prev => {
      if (prev.some(p => p.id === product.id)) {
        toast.info('Product already in comparison');
        return prev;
      }

      if (prev.length >= MAX_PRODUCTS) {
        toast.error(`Maximum ${MAX_PRODUCTS} products can be compared`);
        return prev;
      }

      toast.success(`${product.name} added to comparison`);
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setComparedProducts(prev => {
      const product = prev.find(p => p.id === productId);
      if (product) {
        toast.info(`${product.name} removed from comparison`);
      }
      return prev.filter(p => p.id !== productId);
    });
  }, []);

  const clearComparison = useCallback(() => {
    setComparedProducts([]);
    toast.info('Comparison cleared');
  }, []);

  const value: ProductComparisonContextType = {
    comparedProducts,
    comparedProductIds,
    isComparing,
    addToCompare,
    removeFromCompare,
    clearComparison,
    maxProducts: MAX_PRODUCTS,
    isMaxReached,
  };

  return (
    <ProductComparisonContext.Provider value={value}>
      {children}
    </ProductComparisonContext.Provider>
  );
};

export const useProductComparison = () => {
  const context = useContext(ProductComparisonContext);
  if (context === undefined) {
    throw new Error('useProductComparison must be used within ProductComparisonProvider');
  }
  return context;
};
