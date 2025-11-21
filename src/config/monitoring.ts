import { config } from './environment';
import * as Sentry from '@sentry/react';

// Monitoring and error tracking configuration
export interface MonitoringConfig {
  SENTRY_CONFIG: Sentry.BrowserOptions;
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

// Sentry configuration
const SENTRY_CONFIG: Sentry.BrowserOptions = {
  dsn: config.SENTRY_DSN,
  environment: config.ENVIRONMENT,
  debug: config.DEBUG_MODE,
  
  // Performance monitoring
  tracesSampleRate: config.ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: `${config.APP_NAME}@${config.APP_VERSION}`,
  
  // Integration configuration
  integrations: [
    new Sentry.BrowserTracing({
      // Set up automatic route change tracking for React Router
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
    new Sentry.Replay({
      // Capture 10% of all sessions in production
      sessionSampleRate: config.ENVIRONMENT === 'production' ? 0.1 : 1.0,
      // Capture 100% of sessions with an error
      errorSampleRate: 1.0,
    }),
  ],
  
  // Custom error filtering
  beforeSend: (event, hint) => {
    // Don't send errors in development unless explicitly enabled
    if (config.ENVIRONMENT === 'development' && !config.ERROR_REPORTING) {
      return null;
    }
    
    // Filter out specific errors
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Error).message;
      
      // Filter out known browser extension errors
      if (message.includes('Non-Error promise rejection captured') ||
          message.includes('ResizeObserver loop limit exceeded') ||
          message.includes('Script error')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Custom tags
  initialScope: {
    tags: {
      component: 'frontend',
      version: config.APP_VERSION,
    },
  },
};

export const monitoringConfig: MonitoringConfig = {
  SENTRY_CONFIG,
  
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

// Hotjar setup
export const initializeHotjar = (): void => {
  if (!monitoringConfig.ANALYTICS_CONFIG.ENABLE_TRACKING || !monitoringConfig.ANALYTICS_CONFIG.HOTJAR_ID) {
    return;
  }
  
  (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
    h.hj = h.hj || function(...args: any[]) {
      (h.hj.q = h.hj.q || []).push(args);
    };
    h._hjSettings = { hjid: monitoringConfig.ANALYTICS_CONFIG.HOTJAR_ID, hjsv: 6 };
    a = o.getElementsByTagName('head')[0];
    r = o.createElement('script');
    r.async = 1;
    r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
    a.appendChild(r);
  })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
};

// Performance monitoring utilities
export const performanceMonitoring = {
  // Web Vitals tracking
  trackWebVitals: () => {
    if (!monitoringConfig.PERFORMANCE_CONFIG.ENABLE_WEB_VITALS) return;
    
    // Import web-vitals dynamically
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      const sendToAnalytics = (metric: any) => {
        // Sample the data
        if (Math.random() > monitoringConfig.PERFORMANCE_CONFIG.SAMPLE_RATE) return;
        
        // Send to Google Analytics
        if ((window as any).gtag) {
          (window as any).gtag('event', metric.name, {
            event_category: 'Web Vitals',
            value: Math.round(metric.value),
            custom_map: { metric_id: metric.id },
            non_interaction: true,
          });
        }
        
        // Send to Sentry
        Sentry.addBreadcrumb({
          category: 'web-vitals',
          message: `${metric.name}: ${metric.value}`,
          level: 'info',
        });
      };
      
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    }).catch(error => {
      console.warn('Failed to load web-vitals:', error);
    });
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
            Sentry.addBreadcrumb({
              category: 'performance',
              message: `Slow resource: ${resourceEntry.name}`,
              data: {
                duration: resourceEntry.duration,
                size: resourceEntry.transferSize,
              },
              level: 'warning',
            });
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  },
  
  // User timing tracking
  trackUserTiming: () => {
    if (!monitoringConfig.PERFORMANCE_CONFIG.ENABLE_USER_TIMING) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'measure') {
          Sentry.addBreadcrumb({
            category: 'user-timing',
            message: `User timing: ${entry.name}`,
            data: {
              duration: entry.duration,
              startTime: entry.startTime,
            },
            level: 'info',
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
  },
  
  // Custom performance tracking
  trackCustomMetric: (name: string, value: number, tags?: Record<string, string>) => {
    // Send to Sentry
    Sentry.addBreadcrumb({
      category: 'custom-metric',
      message: `${name}: ${value}`,
      data: tags,
      level: 'info',
    });
    
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
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('custom', context);
      }
      Sentry.captureException(error);
    });
  },
  
  // Track custom message
  trackMessage: (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (context) {
        scope.setContext('custom', context);
      }
      Sentry.captureMessage(message);
    });
  },
  
  // Set user context
  setUser: (user: { id: string; email?: string; username?: string }) => {
    Sentry.setUser(user);
  },
  
  // Set tags
  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },
  
  // Add breadcrumb
  addBreadcrumb: (breadcrumb: Sentry.Breadcrumb) => {
    Sentry.addBreadcrumb(breadcrumb);
  },
};

// Initialize all monitoring
export const initializeMonitoring = (): void => {
  // Initialize Sentry
  if (config.ERROR_REPORTING && config.SENTRY_DSN) {
    Sentry.init(monitoringConfig.SENTRY_CONFIG);
    
    // Set initial context
    Sentry.setContext('app', {
      name: config.APP_NAME,
      version: config.APP_VERSION,
      environment: config.ENVIRONMENT,
    });
  }
  
  // Initialize analytics
  initializeAnalytics();
  initializeHotjar();
  
  // Initialize performance monitoring
  if (config.PERFORMANCE_MONITORING) {
    performanceMonitoring.trackWebVitals();
    performanceMonitoring.trackResourceTiming();
    performanceMonitoring.trackUserTiming();
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