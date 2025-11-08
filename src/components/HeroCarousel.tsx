import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play } from 'lucide-react';
import { usePageContent } from '@/contexts/ContentContext';

export const HeroCarousel = () => {
  const { content } = usePageContent("home");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Default carousel settings
  const isDevEnv = import.meta.env.DEV;
  const basePath = isDevEnv ? '' : '/stencil';
  
  const defaultImages = [
    `${basePath}/images/hero/default-1.jpg`,
    `${basePath}/images/hero/default-2.jpg`,
    `${basePath}/images/hero/default-3.jpg`
  ];
  const images = content?.content?.hero?.carousel?.images || defaultImages;
  const autoPlayInterval = content?.content?.hero?.carousel?.autoPlayInterval || 5000;
  const showPauseButton = content?.content?.hero?.carousel?.showPauseButton !== false;

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
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
        {images.map((_, index) => (
          <button
            key={index}
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
