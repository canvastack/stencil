import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import type { ComparisonNote, SavedComparison } from '@/types/comparison';
import { toast } from 'sonner';

interface ProductComparisonContextType {
  comparedProducts: Product[];
  comparedProductIds: string[];
  isComparing: (productId: string) => boolean;
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearComparison: () => void;
  loadComparison: (comparison: SavedComparison) => void;
  maxProducts: number;
  isMaxReached: boolean;
  notes: ComparisonNote[];
  addNote: (productId: string, content: string) => void;
  removeNote: (noteId: string) => void;
  currentComparison?: SavedComparison;
  setCurrentComparison: (comparison?: SavedComparison) => void;
}

const ProductComparisonContext = createContext<ProductComparisonContextType | undefined>(undefined);

const STORAGE_KEY = 'product-comparison';
const NOTES_STORAGE_KEY = 'product-comparison-notes';
const MAX_PRODUCTS = 10;

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

  const [notes, setNotes] = useState<ComparisonNote[]>(() => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load notes from localStorage:', error);
      return [];
    }
  });

  const [currentComparison, setCurrentComparison] = useState<SavedComparison | undefined>();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedProducts));
    } catch (error) {
      console.error('Failed to save comparison to localStorage:', error);
    }
  }, [comparedProducts]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Failed to save notes to localStorage:', error);
    }
  }, [notes]);

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
    setNotes([]);
    setCurrentComparison(undefined);
    toast.info('Comparison cleared');
  }, []);

  const loadComparison = useCallback((comparison: SavedComparison) => {
    setCurrentComparison(comparison);
    setNotes(comparison.config.notes || []);
    toast.success(`Loaded comparison: ${comparison.name}`);
  }, []);

  const addNote = useCallback((productId: string, content: string) => {
    const newNote: ComparisonNote = {
      id: Date.now().toString(),
      uuid: Date.now().toString(),
      productId,
      content,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, newNote]);
    toast.success('Note added');
  }, []);

  const removeNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.info('Note removed');
  }, []);

  const value: ProductComparisonContextType = {
    comparedProducts,
    comparedProductIds,
    isComparing,
    addToCompare,
    removeFromCompare,
    clearComparison,
    loadComparison,
    maxProducts: MAX_PRODUCTS,
    isMaxReached,
    notes,
    addNote,
    removeNote,
    currentComparison,
    setCurrentComparison,
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
