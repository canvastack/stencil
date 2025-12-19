import React, { useState, useCallback } from 'react';
import { resolveImageUrl } from '@/utils/imageUtils';

interface ProductImageProps {
  src?: string | string[];
  alt: string;
  className?: string;
}

const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='400' fill='%23F9FAFB'/%3E%3Cg opacity='0.3'%3E%3Cpath d='M200 120L280 160V240L200 280L120 240V160L200 120Z' stroke='%239CA3AF' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M200 120V200M200 200L280 240M200 200L120 240' stroke='%239CA3AF' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='200' cy='120' r='8' fill='%239CA3AF'/%3E%3Ccircle cx='280' cy='160' r='8' fill='%239CA3AF'/%3E%3Ccircle cx='120' cy='160' r='8' fill='%239CA3AF'/%3E%3Ccircle cx='200' cy='200' r='8' fill='%239CA3AF'/%3E%3C/g%3E%3Ctext x='200' y='320' font-family='system-ui, -apple-system, sans-serif' font-size='16' fill='%239CA3AF' text-anchor='middle' font-weight='500'%3ENo Image%3C/text%3E%3C/svg%3E`;

export const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className = ""
}) => {
  const [hasError, setHasError] = useState(false);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (!target.dataset.fallback) {
      target.dataset.fallback = 'true';
      target.src = DEFAULT_PRODUCT_IMAGE;
      setHasError(true);
    }
  }, []);

  // Resolve image source
  const getImageSrc = (): string => {
    if (!src) return DEFAULT_PRODUCT_IMAGE;
    
    if (Array.isArray(src)) {
      return src.length > 0 ? resolveImageUrl(src[0]) : DEFAULT_PRODUCT_IMAGE;
    }
    
    return resolveImageUrl(src);
  };

  return (
    <img
      src={getImageSrc()}
      alt={alt}
      className={className}
      onError={handleImageError}
    />
  );
};

export default ProductImage;
