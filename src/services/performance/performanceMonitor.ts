export interface PerformanceMetric {
  id: string;
  type: 'api' | 'page_load' | 'memory' | 'network' | 'user_interaction' | 'bundle';
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'ratio';
  timestamp: number;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId: string;
}

export interface PerformanceReport {
  sessionId: string;
  userId?: string;
  timestamp: number;
  metrics: PerformanceMetric[];
  deviceInfo: {
    userAgent: string;
    screenResolution: string;
    deviceMemory?: number;
    connectionType?: string;
    cookieEnabled: boolean;
  };
  pageInfo: {
    url: string;
    referrer: string;
    title: string;
  };
}

export interface PerformanceStats {
  avgPageLoadTime: number;
  avgApiResponseTime: number;
  avgMemoryUsage: number;
  slowestPages: { page: string; avgTime: number }[];
  slowestApis: { endpoint: string; avgTime: number }[];
  memoryTrends: { timestamp: number; usage: number }[];
  errorRates: { endpoint: string; errorRate: number }[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private userId?: string;
  private reportingInterval: number = 30000; // 30 seconds
  private maxMetricsBuffer: number = 1000;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeObservers();
    this.startReporting();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Navigation timing observer
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }

      // Resource timing observer
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordResourceMetrics(entry as PerformanceResourceTiming);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }

      // Layout shift observer
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordLayoutShift(entry as any);
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported:', error);
      }

      // First input delay observer
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordFirstInputDelay(entry as any);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('First input delay observer not supported:', error);
      }

      // Long task observer
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordLongTask(entry);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }

    // Memory monitoring (if available)
    this.startMemoryMonitoring();
  }

  /**
   * Record navigation metrics
   */
  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics: PerformanceMetric[] = [
      {
        id: this.generateMetricId(),
        type: 'page_load',
        name: 'dns_lookup_time',
        value: entry.domainLookupEnd - entry.domainLookupStart,
        unit: 'ms',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      },
      {
        id: this.generateMetricId(),
        type: 'page_load',
        name: 'tcp_connect_time',
        value: entry.connectEnd - entry.connectStart,
        unit: 'ms',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      },
      {
        id: this.generateMetricId(),
        type: 'page_load',
        name: 'request_time',
        value: entry.responseStart - entry.requestStart,
        unit: 'ms',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      },
      {
        id: this.generateMetricId(),
        type: 'page_load',
        name: 'response_time',
        value: entry.responseEnd - entry.responseStart,
        unit: 'ms',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      },
      {
        id: this.generateMetricId(),
        type: 'page_load',
        name: 'dom_content_loaded',
        value: entry.domContentLoadedEventEnd - entry.navigationStart,
        unit: 'ms',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      },
      {
        id: this.generateMetricId(),
        type: 'page_load',
        name: 'load_complete',
        value: entry.loadEventEnd - entry.navigationStart,
        unit: 'ms',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      }
    ];

    this.addMetrics(metrics);
  }

  /**
   * Record resource loading metrics
   */
  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    // Only track specific resource types
    if (!entry.name.includes('/api/') && !entry.name.includes('.js') && !entry.name.includes('.css')) {
      return;
    }

    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      type: entry.name.includes('/api/') ? 'api' : 'network',
      name: entry.name.includes('/api/') ? 'api_response_time' : 'resource_load_time',
      value: entry.responseEnd - entry.requestStart,
      unit: 'ms',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      metadata: {
        url: entry.name,
        size: entry.transferSize || entry.encodedBodySize,
        type: entry.initiatorType,
      }
    };

    this.addMetrics([metric]);
  }

  /**
   * Record layout shift metrics
   */
  private recordLayoutShift(entry: any): void {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      type: 'user_interaction',
      name: 'layout_shift',
      value: entry.value,
      unit: 'ratio',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.addMetrics([metric]);
  }

  /**
   * Record first input delay
   */
  private recordFirstInputDelay(entry: any): void {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      type: 'user_interaction',
      name: 'first_input_delay',
      value: entry.processingStart - entry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.addMetrics([metric]);
  }

  /**
   * Record long tasks
   */
  private recordLongTask(entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      type: 'user_interaction',
      name: 'long_task',
      value: entry.duration,
      unit: 'ms',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.addMetrics([metric]);
  }

  /**
   * Monitor memory usage
   */
  private startMemoryMonitoring(): void {
    // Check if memory API is available
    if ('memory' in performance) {
      const recordMemory = () => {
        const memInfo = (performance as any).memory;
        const metrics: PerformanceMetric[] = [
          {
            id: this.generateMetricId(),
            type: 'memory',
            name: 'heap_used',
            value: memInfo.usedJSHeapSize,
            unit: 'bytes',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
          },
          {
            id: this.generateMetricId(),
            type: 'memory',
            name: 'heap_total',
            value: memInfo.totalJSHeapSize,
            unit: 'bytes',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
          },
          {
            id: this.generateMetricId(),
            type: 'memory',
            name: 'heap_limit',
            value: memInfo.jsHeapSizeLimit,
            unit: 'bytes',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
          }
        ];

        this.addMetrics(metrics);
      };

      // Record initial memory
      recordMemory();

      // Record memory every 10 seconds
      setInterval(recordMemory, 10000);
    }
  }

  /**
   * Record API call performance
   */
  recordApiCall(endpoint: string, duration: number, success: boolean, statusCode?: number): void {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      type: 'api',
      name: 'api_call',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      metadata: {
        endpoint,
        success,
        statusCode,
      }
    };

    this.addMetrics([metric]);
  }

  /**
   * Record user interaction
   */
  recordUserInteraction(action: string, target: string, duration?: number): void {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      type: 'user_interaction',
      name: 'user_action',
      value: duration || 0,
      unit: 'ms',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      metadata: {
        action,
        target,
      }
    };

    this.addMetrics([metric]);
  }

  /**
   * Record bundle size metrics
   */
  recordBundleMetrics(bundleName: string, size: number, loadTime: number): void {
    const metrics: PerformanceMetric[] = [
      {
        id: this.generateMetricId(),
        type: 'bundle',
        name: 'bundle_size',
        value: size,
        unit: 'bytes',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        metadata: { bundleName }
      },
      {
        id: this.generateMetricId(),
        type: 'bundle',
        name: 'bundle_load_time',
        value: loadTime,
        unit: 'ms',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        metadata: { bundleName }
      }
    ];

    this.addMetrics(metrics);
  }

  /**
   * Add metrics to buffer
   */
  private addMetrics(metrics: PerformanceMetric[]): void {
    this.metrics.push(...metrics);

    // Trim buffer if too large
    if (this.metrics.length > this.maxMetricsBuffer) {
      this.metrics = this.metrics.slice(-this.maxMetricsBuffer);
    }
  }

  /**
   * Start periodic reporting
   */
  private startReporting(): void {
    setInterval(() => {
      this.sendMetricsReport();
    }, this.reportingInterval);

    // Also send report when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.sendMetricsReport();
    });
  }

  /**
   * Send metrics report to backend
   */
  private async sendMetricsReport(): Promise<void> {
    if (this.metrics.length === 0) return;

    const report: PerformanceReport = {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      metrics: [...this.metrics],
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        deviceMemory: (navigator as any).deviceMemory,
        connectionType: (navigator as any).connection?.effectiveType,
        cookieEnabled: navigator.cookieEnabled,
      },
      pageInfo: {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
      }
    };

    try {
      // In a real app, this would send to your analytics service
      await fetch('/api/performance/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      // Clear metrics buffer after successful send
      this.metrics = [];
    } catch (error) {
      console.warn('Failed to send performance report:', error);
      // Keep metrics for next attempt, but limit buffer
      if (this.metrics.length > this.maxMetricsBuffer) {
        this.metrics = this.metrics.slice(-this.maxMetricsBuffer / 2);
      }
    }
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Generate unique metric ID
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting observer:', error);
      }
    });
    this.observers = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;