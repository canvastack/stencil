import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Product3DViewer from './components/Product3DViewer';
import HeroCarousel from './components/HeroCarousel';
import CTASection from './components/CTASection';
import TypingEffect from './components/TypingEffect';
import { themeManager } from '@/core/engine/ThemeManager';
import type { Theme } from '@/core/engine/types';

const defaultTheme: Theme = {
  metadata: {
    name: 'Default Theme',
    version: '1.0.0',
    description: 'Default theme for Etching Xenial - A modern, responsive theme with 3D product visualization',
    author: 'Etching Xenial Team',
    license: 'MIT',
    homepage: 'https://etchingpresisi.com',
    keywords: ['default', 'etching', 'modern', '3d', 'responsive'],
    compatibility: {
      minVersion: '1.0.0'
    }
  },
  components: {
    Header,
    Footer,
    ScrollToTop,
    Product3DViewer,
    HeroCarousel,
    CTASection,
    TypingEffect,
  },
  assets: {
    styles: [
      '/themes/default/styles/main.css',
      '/themes/default/styles/components.css'
    ],
    images: {
      logo: '/themes/default/assets/images/logo.png',
      heroBackground: '/themes/default/assets/images/hero-bg.jpg',
      placeholder: '/themes/default/assets/images/placeholder.png'
    },
    fonts: {
      primary: '/themes/default/assets/fonts/inter.woff2',
      secondary: '/themes/default/assets/fonts/roboto.woff2'
    },
    icons: {
      favicon: '/themes/default/assets/icons/favicon.ico',
      apple: '/themes/default/assets/icons/apple-touch-icon.png'
    }
  },
  config: {
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      foreground: '#1f2937'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px'
      }
    },
    layout: {
      maxWidth: '1200px',
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem'
      }
    },
    features: {
      darkMode: true,
      animations: true,
      lazyLoading: true
    }
  },
  hooks: {
    onActivate: async () => {
      console.log('Default theme activated');
      // Load theme-specific styles
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = '/themes/default/styles/theme.css';
      styleLink.id = 'default-theme-styles';
      document.head.appendChild(styleLink);
    },
    onDeactivate: async () => {
      console.log('Default theme deactivated');
      // Remove theme-specific styles
      const styleLink = document.getElementById('default-theme-styles');
      if (styleLink) {
        styleLink.remove();
      }
    }
  }
};

// Register theme at module load so it's available synchronously
try {
  themeManager.registerTheme('default', defaultTheme);
} catch (e) {
  // swallow registration errors during build time or tests
  // registration will be attempted again if needed
  console.warn('Failed to register default theme during module load:', e);
}

export default defaultTheme;