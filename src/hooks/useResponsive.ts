import { useState, useEffect } from 'react';

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export interface UseResponsiveReturn {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  showMobileLayout: boolean;
  showDesktopLayout: boolean;
  width: number;
}

/**
 * Hook untuk responsive breakpoint detection
 * Mengikuti Tailwind CSS breakpoint standards
 */
export const useResponsive = (): UseResponsiveReturn => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const windowWidth = window.innerWidth;
      setWidth(windowWidth);
      
      if (windowWidth < breakpoints.sm) {
        setBreakpoint('sm');
      } else if (windowWidth < breakpoints.md) {
        setBreakpoint('sm');
      } else if (windowWidth < breakpoints.lg) {
        setBreakpoint('md');
      } else if (windowWidth < breakpoints.xl) {
        setBreakpoint('lg');
      } else if (windowWidth < breakpoints['2xl']) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };
    
    updateBreakpoint();
    
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  const isMobile = breakpoint === 'sm' || breakpoint === 'md';
  const isTablet = breakpoint === 'md' || breakpoint === 'lg';
  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
  
  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    showMobileLayout: isMobile,
    showDesktopLayout: isDesktop,
    width,
  };
};

/**
 * Hook untuk media query matching
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

/**
 * Touch target utilities untuk accessibility
 */
export const touchTargets = {
  // Minimum touch target size: 44x44px (Apple HIG) / 48x48px (Material Design)
  minSize: 'min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px]',
  comfortable: 'min-w-[48px] min-h-[48px]',
  
  // Touch spacing
  spacing: 'gap-4 md:gap-2',
  
  // Swipe gestures support
  swipeable: 'touch-pan-x select-none',
  panY: 'touch-pan-y',
  
  // Active state untuk touch feedback
  active: 'active:scale-95 transition-transform duration-100',
} as const;
