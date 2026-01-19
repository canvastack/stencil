import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createIntersectionObserver } from '@/utils/performanceOptimizations';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  placeholderSrc?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Lazy loading image component with Intersection Observer
 * Provides blur-up placeholder effect and progressive loading
 * 
 * Features:
 * - Intersection Observer for viewport detection
 * - Blur-up placeholder effect
 * - Skeleton loading state
 * - Automatic fallback handling
 * - Memory efficient (loads only when visible)
 * 
 * @example
 * <LazyImage
 *   src="/product.jpg"
 *   alt="Product"
 *   placeholderSrc="/product-thumb.jpg"
 *   className="h-48 w-48"
 * />
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  wrapperClassName,
  placeholderSrc,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  ...props
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const currentSrc = useMemo(() => {
    if (!isInView) return placeholderSrc || '';
    return src;
  }, [isInView, src, placeholderSrc]);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      });
    };

    observerRef.current = createIntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    if (observerRef.current) {
      observerRef.current.observe(element);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <div className={cn('relative overflow-hidden bg-muted', wrapperClassName)}>
      {isLoading && !hasError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-all duration-500',
          isLoaded && !hasError ? 'opacity-100 blur-0' : 'opacity-0 blur-sm',
          placeholderSrc && isInView && !isLoaded && 'blur-md',
          className
        )}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-xs">Failed to load</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
