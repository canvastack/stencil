import { config } from './environment';

// Monitoring and error tracking configuration
export interface MonitoringConfig {
  ANALYTICS_CONFIG: {
    GA_ID?: string;
    HOTJAR_ID?: string;
    ENABLE_TRACKING: boolean;
  };
  PERFORMANCE_CONFIG: {
    ENABLE_WEB_VITALS: boolean;
    ENABLE_RESOURCE_TIMING: boolean;
    ENABLE_USER_TIMING: boolean;
    SAMPLE_RATE: number;
  };
}

export const monitoringConfig: MonitoringConfig = {
  ANALYTICS_CONFIG: {
    GA_ID: config.GOOGLE_ANALYTICS_ID,
    HOTJAR_ID: config.HOTJAR_ID,
    ENABLE_TRACKING: config.ENVIRONMENT !== 'development',
  },
  
  PERFORMANCE_CONFIG: {
    ENABLE_WEB_VITALS: true,
    ENABLE_RESOURCE_TIMING: true,
    ENABLE_USER_TIMING: true,
    SAMPLE_RATE: config.ENVIRONMENT === 'production' ? 0.1 : 1.0,
  },
};

// Google Analytics setup
export const initializeAnalytics = (): void => {
  if (!monitoringConfig.ANALYTICS_CONFIG.ENABLE_TRACKING || !monitoringConfig.ANALYTICS_CONFIG.GA_ID) {
    return;
  }
  
  // Google Analytics 4
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${monitoringConfig.ANALYTICS_CONFIG.GA_ID}`;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  
  const gtag = function(...args: any[]) {
    (window as any).dataLayer.push(args);
  };
  
  (window as any).gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', monitoringConfig.ANALYTICS_CONFIG.GA_ID, {
    page_title: document.title,
    page_location: window.location.href,
    anonymize_ip: true,
    cookie_flags: 'secure;samesite=strict',
  });
};

// Performance monitoring utilities
export const performanceMonitoring = {
  // Web Vitals tracking - Custom implementation without web-vitals package
  trackWebVitals: () => {
    if (!monitoringConfig.PERFORMANCE_CONFIG.ENABLE_WEB_VITALS) return;
    
    // Track First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          const metric = {
            name: 'FCP',
            value: entry.startTime,
            id: 'fcp-' + Date.now(),
          };
          
          // Send to Google Analytics
          if ((window as any).gtag) {
            (window as any).gtag('event', metric.name, {
              event_category: 'Web Vitals',
              value: Math.round(metric.value),
              custom_map: { metric_id: metric.id },
              non_interaction: true,
            });
          }
          
          // Log to console for development
          if (config.ENVIRONMENT === 'development') {
            console.log(`Web Vitals: ${metric.name} = ${metric.value}ms`);
          }
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  },
  
  // Resource timing tracking
  trackResourceTiming: () => {
    if (!monitoringConfig.PERFORMANCE_CONFIG.ENABLE_RESOURCE_TIMING) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resourceEntry.duration > 1000) { // > 1 second
            console.warn(`Slow resource: ${resourceEntry.name} (${resourceEntry.duration.toFixed(2)}ms)`);
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  },
  
  // Custom performance tracking
  trackCustomMetric: (name: string, value: number, tags?: Record<string, string>) => {
    // Log to console for development
    if (config.ENVIRONMENT === 'development') {
      console.log(`Custom Metric: ${name} = ${value}`, tags);
    }
    
    // Send to Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'custom_metric', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        ...tags,
      });
    }
  },
};

// Error tracking utilities
export const errorTracking = {
  // Track custom error
  trackError: (error: Error, context?: Record<string, any>) => {
    console.error('Application Error:', error, context);
    
    // Send to Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: context,
      });
    }
  },
  
  // Track custom message
  trackMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) => {
    console[level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}] ${message}`, context);
  },
};

// Initialize all monitoring
export const initializeMonitoring = (): void => {
  // Initialize analytics
  initializeAnalytics();
  
  // Initialize performance monitoring
  if (config.PERFORMANCE_MONITORING) {
    performanceMonitoring.trackWebVitals();
    performanceMonitoring.trackResourceTiming();
  }
  
  // Global error handler
  window.addEventListener('error', (event) => {
    errorTracking.trackError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    errorTracking.trackError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      { reason: event.reason }
    );
  });
};

export default {
  monitoringConfig,
  initializeMonitoring,
  performanceMonitoring,
  errorTracking,
};