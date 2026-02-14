import { useState, useEffect, useCallback, useMemo } from 'react';
import { Pause, Play } from 'lucide-react';
import { resolveImageUrl, DEFAULT_PRODUCT_IMAGE } from '@/utils/imageUtils';

interface RelatedProductImageSliderProps {
  images: string[];
  productName: string;
  autoPlayInterval?: number;
}

// Random slide effects
const slideEffects = [
  'fade',
  'slide-left',
  'slide-right',
  'zoom',
  'slide-up',
] as const;

type SlideEffect = typeof slideEffects[number];

export const RelatedProductImageSlider: React.FC<RelatedProductImageSliderProps> = ({
  images,
  productName,
  autoPlayInterval = 3000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Random effect per component instance (stays consistent for this product)
  const slideEffect = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * slideEffects.length);
    return slideEffects[randomIndex] as SlideEffect;
  }, []);

  const hasMultipleImages = images && images.length > 1;

  const nextSlide = useCallback(() => {
    if (!hasMultipleImages) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [hasMultipleImages, images.length]);

  const prevSlide = useCallback(() => {
    if (!hasMultipleImages) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [hasMultipleImages, images.length]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Prevent navigation when clicking controls
  const handleControlClick = useCallback((e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (!hasMultipleImages || !isPlaying || isHovered) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [hasMultipleImages, isPlaying, isHovered, nextSlide, autoPlayInterval]);

  const getEffectClasses = (index: number): string => {
    const isActive = index === currentIndex;
    const baseClasses = 'absolute inset-0 w-full h-full object-cover transition-all duration-700';

    if (!isActive) {
      return `${baseClasses} opacity-0 pointer-events-none`;
    }

    switch (slideEffect) {
      case 'fade':
        return `${baseClasses} opacity-100 animate-in fade-in`;
      case 'slide-left':
        return `${baseClasses} opacity-100 animate-in slide-in-from-right`;
      case 'slide-right':
        return `${baseClasses} opacity-100 animate-in slide-in-from-left`;
      case 'zoom':
        return `${baseClasses} opacity-100 animate-in zoom-in`;
      case 'slide-up':
        return `${baseClasses} opacity-100 animate-in slide-in-from-bottom`;
      default:
        return `${baseClasses} opacity-100`;
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={DEFAULT_PRODUCT_IMAGE}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="aspect-video relative overflow-hidden bg-muted group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images */}
      {images.map((image, index) => (
        <img
          key={index}
          src={resolveImageUrl(image)}
          alt={`${productName} ${index + 1}`}
          className={getEffectClasses(index)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== DEFAULT_PRODUCT_IMAGE) {
              target.src = DEFAULT_PRODUCT_IMAGE;
            }
          }}
        />
      ))}

      {/* Controls - only show if multiple images */}
      {hasMultipleImages && (
        <>
          {/* Play/Pause button - shows on hover */}
          <button
            onClick={(e) => handleControlClick(e, togglePlayPause)}
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => handleControlClick(e, () => setCurrentIndex(index))}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation arrows - shows on hover */}
          <button
            onClick={(e) => handleControlClick(e, prevSlide)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => handleControlClick(e, nextSlide)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Next image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};
