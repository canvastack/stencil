import { lazy } from 'react';

// Lazy load components for better code splitting
export const LazyComponents = {
  // Admin Pages
  ProductCatalog: lazy(() => import('../pages/admin/products/ProductCatalog')),
  ProductEditor: lazy(() => import('../pages/admin/ProductEditor')),
  ProductDetail: lazy(() => import('../pages/admin/ProductDetail')),
  OrderManagement: lazy(() => import('../pages/admin/OrderManagement')),
  CustomerManagement: lazy(() => import('../pages/admin/CustomerManagement')),
  CustomerDetail: lazy(() => import('../pages/admin/CustomerDetail')),
  VendorManagement: lazy(() => import('../pages/admin/VendorManagement')),
  VendorDetail: lazy(() => import('../pages/admin/VendorDetail')),
  PaymentManagement: lazy(() => import('../pages/admin/PaymentManagement')),
  ShippingManagement: lazy(() => import('../pages/admin/ShippingManagement')),
  InventoryManagement: lazy(() => import('../pages/admin/InventoryManagement')),
  MediaLibrary: lazy(() => import('../pages/admin/MediaLibrary')),
  UserManagement: lazy(() => import('../pages/admin/UserManagement')),
  RoleManagement: lazy(() => import('../pages/admin/RoleManagement')),
  Settings: lazy(() => import('../pages/admin/Settings')),
  ActivityLog: lazy(() => import('../pages/admin/ActivityLog')),
  PerformanceMonitoring: lazy(() => import('../pages/admin/PerformanceMonitoring')),
  
  // Theme Management
  ThemeDashboard: lazy(() => import('../pages/admin/ThemeDashboard')),
  ThemeEditor: lazy(() => import('../pages/admin/ThemeCodeEditor')),
  ThemeSettings: lazy(() => import('../pages/admin/ThemeSettings')),
  ThemeMarketplace: lazy(() => import('../pages/admin/ThemeMarketplace')),
  
  // Public Pages
  HomePage: lazy(() => import('../pages/public/HomePage')),
  AboutPage: lazy(() => import('../pages/public/AboutPage')),
  ContactPage: lazy(() => import('../pages/public/ContactPage')),
  ProductsPage: lazy(() => import('../pages/public/ProductsPage')),
  
  // Content Pages
  PageHome: lazy(() => import('../pages/content/PageHome')),
  PageAbout: lazy(() => import('../pages/content/PageAbout')),
  PageContact: lazy(() => import('../pages/content/PageContact')),
  PageFAQ: lazy(() => import('../pages/content/PageFAQ')),
};

// Resource hints for critical resources
export const addResourceHints = () => {
  // Preconnect to external domains
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.canvastencil.com',
  ];
  
  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
  
  // DNS prefetch for likely navigation targets
  const dnsPrefetchDomains = [
    'https://cdn.canvastencil.com',
    'https://analytics.google.com',
  ];
  
  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// Image optimization utilities
export const createOptimizedImageUrl = (
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  } = {}
): string => {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // If it's a local image, return as-is for now
  if (originalUrl.startsWith('/') || originalUrl.startsWith('./')) {
    return originalUrl;
  }
  
  // For external images, you could integrate with services like Cloudinary, ImageKit, etc.
  const url = new URL(originalUrl);
  
  if (width) url.searchParams.set('w', width.toString());
  if (height) url.searchParams.set('h', height.toString());
  url.searchParams.set('q', quality.toString());
  url.searchParams.set('f', format);
  
  return url.toString();
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null => {
  if (!('IntersectionObserver' in window)) {
    return null;
  }
  
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Performance monitoring utilities
export const performanceUtils = {
  // Mark performance events
  mark: (name: string) => {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
    }
  },
  
  // Measure performance between marks
  measure: (name: string, startMark: string, endMark?: string) => {
    if ('performance' in window && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
  },
  
  // Get all performance entries
  getEntries: (type?: string) => {
    if ('performance' in window && performance.getEntriesByType) {
      return type ? performance.getEntriesByType(type) : performance.getEntries();
    }
    return [];
  },
  
  // Clear performance data
  clear: () => {
    if ('performance' in window) {
      if (performance.clearMarks) performance.clearMarks();
      if (performance.clearMeasures) performance.clearMeasures();
      if (performance.clearResourceTimings) performance.clearResourceTimings();
    }
  },
  
  // Get Core Web Vitals
  getCoreWebVitals: () => {
    return new Promise((resolve) => {
      const vitals = {
        fcp: 0, // First Contentful Paint
        lcp: 0, // Largest Contentful Paint
        fid: 0, // First Input Delay
        cls: 0, // Cumulative Layout Shift
        ttfb: 0, // Time to First Byte
      };
      
      // FCP and TTFB from navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        vitals.fcp = navigation.loadEventEnd - navigation.fetchStart;
        vitals.ttfb = navigation.responseStart - navigation.requestStart;
      }
      
      // LCP
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1] as any;
          vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
        }
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }
      
      // FID
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          vitals.fid = entry.processingStart - entry.startTime;
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID not supported
      }
      
      // CLS
      let clsValue = 0;
      const clsEntries: any[] = [];
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsEntries.push(entry);
            clsValue += (entry as any).value;
          }
        }
        vitals.cls = clsValue;
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
      
      // Return vitals after 3 seconds
      setTimeout(() => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        resolve(vitals);
      }, 3000);
    });
  },
};

// Bundle splitting utilities
export const bundleUtils = {
  // Check if module should be in vendor bundle
  isVendorModule: (id: string): boolean => {
    return id.includes('node_modules');
  },
  
  // Get chunk name based on module path
  getChunkName: (id: string): string => {
    if (id.includes('node_modules')) {
      if (id.includes('react')) return 'react-vendor';
      if (id.includes('@radix-ui')) return 'ui-vendor';
      if (id.includes('@tanstack')) return 'query-vendor';
      if (id.includes('recharts') || id.includes('three')) return 'chart-vendor';
      return 'vendor';
    }
    
    if (id.includes('/pages/admin/')) return 'admin';
    if (id.includes('/pages/public/')) return 'public';
    if (id.includes('/components/')) return 'components';
    if (id.includes('/services/')) return 'services';
    
    return 'main';
  },
};

// Critical resource loading
export const loadCriticalResources = async (): Promise<void> => {
  const criticalFonts = [
    '/fonts/inter-var.woff2',
    '/fonts/roboto-mono-var.woff2',
  ];
  
  // Preload critical fonts
  criticalFonts.forEach(fontUrl => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = fontUrl;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
  
  // Preload critical images
  const criticalImages = [
    '/images/hero/hero-bg.jpg',
    '/images/logo/logo.svg',
  ];
  
  criticalImages.forEach(imageUrl => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = imageUrl;
    link.as = 'image';
    document.head.appendChild(link);
  });
};

// Service Worker registration
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              console.log('New content available, refresh to update');
            }
          });
        }
      });
      
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

export default {
  LazyComponents,
  addResourceHints,
  createOptimizedImageUrl,
  createIntersectionObserver,
  performanceUtils,
  bundleUtils,
  loadCriticalResources,
  registerServiceWorker,
};