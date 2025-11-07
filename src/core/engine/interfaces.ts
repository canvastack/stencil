import { ReactNode } from 'react';

// Base interface untuk semua theme components
export interface ThemeComponentBase {
  className?: string;
  children?: ReactNode;
}

// Header component interface
export interface HeaderProps extends ThemeComponentBase {
  onSearch?: (term: string) => void;
}

// Footer component interface
export interface FooterProps extends ThemeComponentBase {
  showSocialLinks?: boolean;
}

// HeroCarousel component interface
export interface HeroCarouselProps extends ThemeComponentBase {
  slides?: Array<{
    id: string;
    image: string;
    title?: string;
    description?: string;
  }>;
}

// CTASection component interface
export interface CTASectionProps extends ThemeComponentBase {
  title?: string;
  description?: string;
  buttonText?: string;
  onAction?: () => void;
}

// Product3DViewer component interface
export interface Product3DViewerProps extends ThemeComponentBase {
  modelUrl: string;
  fallbackImage?: string;
}

// ScrollToTop component interface
export interface ScrollToTopProps extends ThemeComponentBase {
  showAfter?: number; // pixels scrolled
  behavior?: 'smooth' | 'auto';
}

// Theme component interfaces exports
export type ThemeInterfaces = {
  Header: React.FC<HeaderProps>;
  Footer: React.FC<FooterProps>;
  HeroCarousel: React.FC<HeroCarouselProps>;
  CTASection: React.FC<CTASectionProps>;
  Product3DViewer: React.FC<Product3DViewerProps>;
  ScrollToTop: React.FC<ScrollToTopProps>;
};