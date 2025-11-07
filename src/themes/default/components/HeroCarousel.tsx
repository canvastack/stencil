import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play } from 'lucide-react';
import type { HeroCarouselProps } from '@/core/engine/interfaces';

const defaultHeroImages = [
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1920&q=80',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
  'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1920&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1920&q=80',
];

const HeroCarousel: React.FC<HeroCarouselProps> = (props) => {
  const { className, slides = defaultHeroImages.map((image, index) => ({ id: String(index), image })) } = props;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

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