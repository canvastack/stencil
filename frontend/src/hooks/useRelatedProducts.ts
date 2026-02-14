import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types/product';
import { publicProductsService } from '@/services/api/publicProducts';

interface UseRelatedProductsOptions {
  productId?: string;
  category?: string;
  limit?: number;
  tenantSlug?: string;
}

export const useRelatedProducts = ({ 
  productId, 
  category, 
  limit = 3,
  tenantSlug 
}: UseRelatedProductsOptions) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantSlug || (!productId && !category)) return;

    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use optimized related products endpoint
        const products = await publicProductsService.getRelatedProducts({
          tenantSlug,
          productId,
          category: typeof category === 'string' ? category : category?.name,
          limit: limit + 2, // Fetch extra in case we need to filter
        });

        // Filter and limit
        const filtered = products
          .filter(p => p.id !== productId)
          .slice(0, limit);
          
        setRelatedProducts(filtered);
      } catch (err) {
        console.error('Failed to fetch related products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch related products');
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [productId, category, limit, tenantSlug]);

  return { relatedProducts, loading, error };
};