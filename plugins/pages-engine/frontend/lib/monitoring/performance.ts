import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  timestamp: number;
  tenantId?: string;
  accountType?: string;
  navigationType?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private initialized = false;

  init(): void {
    if (this.initialized) {
      console.warn('[PerformanceMonitor] Already initialized');
      return;
    }

    this.initialized = true;

    onCLS(this.sendToAnalytics);
    onFCP(this.sendToAnalytics);
    onINP(this.sendToAnalytics);
    onLCP(this.sendToAnalytics);
    onTTFB(this.sendToAnalytics);

    this.trackAPICallDuration();
    this.trackNavigationTiming();

    if (import.meta.env.DEV) {
      console.log('[PerformanceMonitor] Initialized');
    }
  }

  private sendToAnalytics = (metric: Metric): void => {
    const tenantId = localStorage.getItem('tenant_id') || undefined;
    const accountType = localStorage.getItem('account_type') || undefined;

    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      tenantId,
      accountType,
      navigationType: metric.navigationType,
    };

    this.metrics.push(performanceMetric);

    const endpoint = accountType === 'platform'
      ? '/api/v1/platform/analytics/performance'
      : '/api/v1/tenant/analytics/performance';

    const token = localStorage.getItem('token');
    if (token) {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(accountType === 'tenant' && {
            'X-Tenant-ID': tenantId || '',
          }),
        },
        body: JSON.stringify(performanceMetric),
        keepalive: true,
      }).catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[PerformanceMonitor] Failed to send metric:', error);
        }
      });
    }

    if (import.meta.env.DEV) {
      console.log(`[PerformanceMonitor] ${metric.name}:`, {
        value: `${metric.value.toFixed(2)}ms`,
        rating: metric.rating,
      });
    }
  };

  private trackComponentRenderTime(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.sendToAnalytics({
              name: `component-render-${entry.name}`,
              value: entry.duration,
              rating: entry.duration < 100 ? 'good' : entry.duration < 300 ? 'needs-improvement' : 'poor',
              delta: entry.duration,
              id: `render-${Date.now()}`,
              navigationType: 'navigate',
              entries: [],
            } as Metric);
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[PerformanceMonitor] Component render tracking not supported:', error);
      }
    }
  }

  private trackAPICallDuration(): void {
    const originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const startTime = performance.now();
      const [url] = args;
      const urlString = typeof url === 'string' ? url : url.toString();

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        if (urlString.includes('/api/')) {
          const apiPath = urlString.split('/api/')[1]?.split('?')[0] || 'unknown';
          
          this.sendToAnalytics({
            name: `api-${response.ok ? 'success' : 'error'}-${apiPath}`,
            value: duration,
            rating: duration < 500 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor',
            delta: duration,
            id: `api-${Date.now()}`,
            navigationType: 'navigate',
            entries: [],
          } as Metric);

          if (import.meta.env.DEV && duration > 1000) {
            logger.warn(`Slow API call detected: ${apiPath}`, {
              duration: `${duration.toFixed(2)}ms`,
              status: response.status,
            });
          }
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        if (urlString.includes('/api/')) {
          const apiPath = urlString.split('/api/')[1]?.split('?')[0] || 'unknown';
          
          this.sendToAnalytics({
            name: `api-failure-${apiPath}`,
            value: duration,
            rating: 'poor',
            delta: duration,
            id: `api-error-${Date.now()}`,
            navigationType: 'navigate',
            entries: [],
          } as Metric);
        }

        throw error;
      }
    };
  }

  private trackNavigationTiming(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            const metrics = {
              dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
              tcpConnection: navEntry.connectEnd - navEntry.connectStart,
              serverResponse: navEntry.responseStart - navEntry.requestStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              windowLoad: navEntry.loadEventEnd - navEntry.loadEventStart,
            };

            if (import.meta.env.DEV) {
              console.log('[PerformanceMonitor] Navigation Timing:', metrics);
            }

            Object.entries(metrics).forEach(([name, value]) => {
              if (value > 0) {
                this.sendToAnalytics({
                  name: `navigation-${name}`,
                  value,
                  rating: value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor',
                  delta: value,
                  id: `nav-${name}-${Date.now()}`,
                  navigationType: navEntry.type,
                  entries: [],
                } as Metric);
              }
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[PerformanceMonitor] Navigation timing tracking not supported:', error);
      }
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  markStart(name: string): void {
    performance.mark(`${name}-start`);
  }

  markEnd(name: string): void {
    performance.mark(`${name}-end`);
    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`[PerformanceMonitor] Failed to measure ${name}:`, error);
      }
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = performanceMonitor;
}
