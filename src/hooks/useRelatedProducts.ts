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
    if (!productId && !category) return;

    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let products: Product[] = [];
        
        if (category) {
          // Fetch by category first - more efficient
          products = await publicProductsService.getProductsByCategory(category, limit + 5);
        } else {
          // Fallback to general product fetch
          const response = await publicProductsService.getProducts({ 
            per_page: limit + 5 
          }, tenantSlug);
          products = response.data;
        }

        // Filter out current product and limit results
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