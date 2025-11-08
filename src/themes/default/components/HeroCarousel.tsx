import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play } from 'lucide-react';
import type { HeroCarouselProps } from '@/core/engine/interfaces';
import { usePageContent } from '@/contexts/ContentContext';

// Default images sebagai fallback jika tidak ada data
const defaultHeroImages = [
  '/images/hero/default-1.jpg',
  '/images/hero/default-2.jpg',
  '/images/hero/default-3.jpg',
];

const HeroCarousel: React.FC<HeroCarouselProps> = (props) => {
  const { className } = props;
  const { content } = usePageContent("home");
  
  const carouselImages = content?.content?.hero?.carousel?.images || defaultHeroImages;
  const autoPlayInterval = content?.content?.hero?.carousel?.autoPlayInterval || 5000;
  const showPauseButton = content?.content?.hero?.carousel?.showPauseButton !== false;

  const slides = carouselImages.map((image, index) => ({ 
    id: String(index), 
    image 
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className || ''}`}>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {(slide.title || slide.description) && (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="max-w-4xl px-4">
                {slide.title && (
                  <h2 className="text-4xl font-bold text-white mb-4">{slide.title}</h2>
                )}
                {slide.description && (
                  <p className="text-lg text-white/90">{slide.description}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Carousel Controls */}
      {showPauseButton && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPaused(!isPaused)}
          className="absolute bottom-8 left-8 z-10 bg-background/20 backdrop-blur-md border-white/20 hover:bg-background/30"
          aria-label={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
        >
          {isPaused ? (
            <Play className="h-4 w-4 text-white" />
          ) : (
            <Pause className="h-4 w-4 text-white" />
          )}
        </Button>
      )}

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white w-8' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;