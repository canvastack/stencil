import React, { useState, useCallback, useMemo } from 'react';
import { resolveImageUrl } from '@/utils/imageUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductImageProps {
  src?: string | string[];
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

const DEFAULT_PRODUCT_IMAGE = '/images/product-placeholder.svg';

// Global cache untuk track loaded images
const loadedImagesCache = new Set<string>();

export const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className = "",
  loading = 'lazy'
}) => {
  // Resolve image source once
  const imageSrc = useMemo(() => {
    if (!src) return DEFAULT_PRODUCT_IMAGE;
    if (Array.isArray(src)) {
      return src.length > 0 ? resolveImageUrl(src[0]) : DEFAULT_PRODUCT_IMAGE;
    }
    return resolveImageUrl(src);
  }, [src]);

  // Check if image already loaded (from cache or previous render)
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !loadedImagesCache.has(imageSrc));

  const handleImageLoad = useCallback(() => {
    loadedImagesCache.add(imageSrc);
    setIsLoading(false);
  }, [imageSrc]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (!target.dataset.fallback) {
      target.dataset.fallback = 'true';
      target.src = DEFAULT_PRODUCT_IMAGE;
      loadedImagesCache.add(DEFAULT_PRODUCT_IMAGE);
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={loading}
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default ProductImage;
