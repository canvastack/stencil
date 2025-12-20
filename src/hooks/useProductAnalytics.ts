import { useMemo } from 'react';
import type { Product } from '@/types/product';

export interface ProductAnalytics {
  totalProducts: number;
  totalValue: number;
  averagePrice: number;
  featuredCount: number;
  activeCount: number;
  draftCount: number;
  archivedCount: number;
  inStockCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  categoryDistribution: Array<{ name: string; count: number; value: number }>;
  priceRanges: Array<{ range: string; count: number }>;
  stockAlerts: Array<{ product: Product; stockLevel: number; status: 'critical' | 'low' }>;
  topProducts: Array<{ product: Product; value: number }>;
}

export const useProductAnalytics = (products: Product[]): ProductAnalytics => {
  return useMemo(() => {
    const totalProducts = products.length;
    
    const totalValue = products.reduce((sum, p) => {
      const stock = p.stockQuantity;
      return sum + (p.price * stock);
    }, 0);
    
    const averagePrice = totalProducts > 0 
      ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts 
      : 0;
    
    const featuredCount = products.filter(p => p.featured).length;
    const activeCount = products.filter(p => p.status === 'published').length;
    const draftCount = products.filter(p => p.status === 'draft').length;
    const archivedCount = products.filter(p => p.status === 'archived').length;
    
    const inStockCount = products.filter(p => {
      const stock = p.stockQuantity;
      return stock > 0;
    }).length;
    
    const outOfStockCount = products.filter(p => {
      const stock = p.stockQuantity;
      return stock === 0;
    }).length;
    
    const lowStockCount = products.filter(p => {
      const stock = p.stockQuantity;
      return stock > 0 && stock <= 10;
    }).length;
    
    const categoryMap = new Map<string, { count: number; value: number }>();
    products.forEach(p => {
      const categoryName = p.category?.name || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || { count: 0, value: 0 };
      const stock = p.stockQuantity;
      categoryMap.set(categoryName, {
        count: existing.count + 1,
        value: existing.value + (p.price * stock)
      });
    });
    
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const priceRanges = [
      { range: '$0-$50', count: products.filter(p => p.price < 50).length },
      { range: '$50-$100', count: products.filter(p => p.price >= 50 && p.price < 100).length },
      { range: '$100-$500', count: products.filter(p => p.price >= 100 && p.price < 500).length },
      { range: '$500-$1000', count: products.filter(p => p.price >= 500 && p.price < 1000).length },
      { range: '$1000+', count: products.filter(p => p.price >= 1000).length },
    ].filter(range => range.count > 0);
    
    const stockAlerts = products
      .map(p => {
        const stock = p.stockQuantity;
        if (stock === 0) {
          return { product: p, stockLevel: stock, status: 'critical' as const };
        } else if (stock <= 10) {
          return { product: p, stockLevel: stock, status: 'low' as const };
        }
        return null;
      })
      .filter((alert): alert is NonNullable<typeof alert> => alert !== null)
      .sort((a, b) => a.stockLevel - b.stockLevel)
      .slice(0, 10);
    
    const topProducts = products
      .map(p => {
        const stock = p.stockQuantity;
        return { product: p, value: p.price * stock };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    return {
      totalProducts,
      totalValue,
      averagePrice,
      featuredCount,
      activeCount,
      draftCount,
      archivedCount,
      inStockCount,
      outOfStockCount,
      lowStockCount,
      categoryDistribution,
      priceRanges,
      stockAlerts,
      topProducts,
    };
  }, [products]);
};
