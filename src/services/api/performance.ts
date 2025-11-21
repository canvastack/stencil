import { mockApiCall } from './base';
import { PerformanceMetric, PerformanceReport, PerformanceStats } from '../performance/performanceMonitor';

// Mock performance data
const mockPerformanceData: PerformanceReport[] = [
  {
    sessionId: 'session_1',
    userId: 'user-1',
    timestamp: Date.now() - 3600000, // 1 hour ago
    metrics: [
      {
        id: 'metric_1',
        type: 'page_load',
        name: 'load_complete',
        value: 1250,
        unit: 'ms',
        timestamp: Date.now() - 3600000,
        sessionId: 'session_1',
        userId: 'user-1'
      },
      {
        id: 'metric_2',
        type: 'api',
        name: 'api_call',
        value: 320,
        unit: 'ms',
        timestamp: Date.now() - 3600000,
        sessionId: 'session_1',
        userId: 'user-1',
        metadata: { endpoint: '/api/orders', success: true, statusCode: 200 }
      }
    ],
    deviceInfo: {
      userAgent: 'Mozilla/5.0...',
      screenResolution: '1920x1080',
      deviceMemory: 8,
      connectionType: '4g',
      cookieEnabled: true
    },
    pageInfo: {
      url: '/admin/dashboard',
      referrer: '',
      title: 'Dashboard - Admin'
    }
  }
];

export const performanceService = {
  // Send performance report
  sendReport: async (report: PerformanceReport): Promise<{ success: boolean; id: string }> => {
    return mockApiCall(async () => {
      mockPerformanceData.push(report);
      return { success: true, id: `report_${Date.now()}` };
    }, 100);
  },

  // Get performance statistics
  getStats: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    userId?: string;
    metricType?: string;
  }): Promise<PerformanceStats> => {
    return mockApiCall(async () => {
      let reports = [...mockPerformanceData];

      // Apply filters
      if (params?.dateFrom) {
        const fromDate = new Date(params.dateFrom).getTime();
        reports = reports.filter(report => report.timestamp >= fromDate);
      }
      if (params?.dateTo) {
        const toDate = new Date(params.dateTo).getTime();
        reports = reports.filter(report => report.timestamp <= toDate);
      }
      if (params?.userId) {
        reports = reports.filter(report => report.userId === params.userId);
      }

      // Extract all metrics
      const allMetrics = reports.flatMap(report => report.metrics);

      // Calculate average page load time
      const pageLoadMetrics = allMetrics.filter(m => m.type === 'page_load' && m.name === 'load_complete');
      const avgPageLoadTime = pageLoadMetrics.length > 0
        ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length
        : 0;

      // Calculate average API response time
      const apiMetrics = allMetrics.filter(m => m.type === 'api' && m.name === 'api_call');
      const avgApiResponseTime = apiMetrics.length > 0
        ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
        : 0;

      // Calculate average memory usage
      const memoryMetrics = allMetrics.filter(m => m.type === 'memory' && m.name === 'heap_used');
      const avgMemoryUsage = memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
        : 0;

      // Find slowest pages
      const pagesByUrl = reports.reduce((acc, report) => {
        const loadTime = report.metrics.find(m => m.name === 'load_complete')?.value || 0;
        if (!acc[report.pageInfo.url]) {
          acc[report.pageInfo.url] = { totalTime: 0, count: 0 };
        }
        acc[report.pageInfo.url].totalTime += loadTime;
        acc[report.pageInfo.url].count += 1;
        return acc;
      }, {} as Record<string, { totalTime: number; count: number }>);

      const slowestPages = Object.entries(pagesByUrl)
        .map(([page, data]) => ({
          page,
          avgTime: data.totalTime / data.count
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 10);

      // Find slowest APIs
      const apisByEndpoint = apiMetrics.reduce((acc, metric) => {
        const endpoint = metric.metadata?.endpoint || 'unknown';
        if (!acc[endpoint]) {
          acc[endpoint] = { totalTime: 0, count: 0 };
        }
        acc[endpoint].totalTime += metric.value;
        acc[endpoint].count += 1;
        return acc;
      }, {} as Record<string, { totalTime: number; count: number }>);

      const slowestApis = Object.entries(apisByEndpoint)
        .map(([endpoint, data]) => ({
          endpoint,
          avgTime: data.totalTime / data.count
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 10);

      // Memory trends (simplified)
      const memoryTrends = memoryMetrics
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(metric => ({
          timestamp: metric.timestamp,
          usage: metric.value
        }))
        .slice(-50); // Last 50 data points

      // Error rates by endpoint
      const errorRates = Object.entries(apisByEndpoint).map(([endpoint, data]) => {
        const endpointMetrics = apiMetrics.filter(m => m.metadata?.endpoint === endpoint);
        const errorCount = endpointMetrics.filter(m => !m.metadata?.success).length;
        return {
          endpoint,
          errorRate: data.count > 0 ? errorCount / data.count : 0
        };
      });

      return {
        avgPageLoadTime,
        avgApiResponseTime,
        avgMemoryUsage,
        slowestPages,
        slowestApis,
        memoryTrends,
        errorRates
      };
    });
  },

  // Get performance metrics with filtering
  getMetrics: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    userId?: string;
  }): Promise<{
    metrics: PerformanceMetric[];
    total: number;
    page: number;
    limit: number;
  }> => {
    return mockApiCall(async () => {
      const {
        page = 1,
        limit = 50,
        type,
        dateFrom,
        dateTo,
        userId
      } = params || {};

      let allMetrics = mockPerformanceData.flatMap(report => report.metrics);

      // Apply filters
      if (type) {
        allMetrics = allMetrics.filter(metric => metric.type === type);
      }
      if (userId) {
        allMetrics = allMetrics.filter(metric => metric.userId === userId);
      }
      if (dateFrom) {
        const fromDate = new Date(dateFrom).getTime();
        allMetrics = allMetrics.filter(metric => metric.timestamp >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo).getTime();
        allMetrics = allMetrics.filter(metric => metric.timestamp <= toDate);
      }

      // Sort by timestamp (newest first)
      allMetrics.sort((a, b) => b.timestamp - a.timestamp);

      // Paginate
      const startIndex = (page - 1) * limit;
      const paginatedMetrics = allMetrics.slice(startIndex, startIndex + limit);

      return {
        metrics: paginatedMetrics,
        total: allMetrics.length,
        page,
        limit
      };
    });
  },

  // Get real-time performance metrics
  getRealTimeMetrics: async (): Promise<{
    currentLoad: number;
    activeConnections: number;
    memoryUsage: number;
    responseTime: number;
    errorRate: number;
  }> => {
    return mockApiCall(async () => {
      return {
        currentLoad: Math.random() * 100,
        activeConnections: Math.floor(Math.random() * 1000),
        memoryUsage: 60 + Math.random() * 30, // 60-90%
        responseTime: 100 + Math.random() * 200, // 100-300ms
        errorRate: Math.random() * 5 // 0-5%
      };
    }, 100);
  },

  // Get performance alerts
  getAlerts: async (): Promise<{
    id: string;
    type: 'warning' | 'critical';
    message: string;
    timestamp: number;
    metric: string;
    value: number;
    threshold: number;
  }[]> => {
    return mockApiCall(async () => {
      return [
        {
          id: 'alert_1',
          type: 'warning' as const,
          message: 'Page load time exceeding threshold',
          timestamp: Date.now() - 300000, // 5 minutes ago
          metric: 'page_load_time',
          value: 3500,
          threshold: 3000
        },
        {
          id: 'alert_2',
          type: 'critical' as const,
          message: 'API response time critical',
          timestamp: Date.now() - 600000, // 10 minutes ago
          metric: 'api_response_time',
          value: 5000,
          threshold: 2000
        }
      ];
    });
  },

  // Get performance trends
  getTrends: async (metric: string, period: string): Promise<{
    labels: string[];
    values: number[];
  }> => {
    return mockApiCall(async () => {
      const now = Date.now();
      const labels: string[] = [];
      const values: number[] = [];

      // Generate mock trend data
      for (let i = 23; i >= 0; i--) {
        const timestamp = now - (i * 3600000); // hourly data
        labels.push(new Date(timestamp).toLocaleTimeString());
        
        // Generate realistic values based on metric type
        let value = 0;
        switch (metric) {
          case 'page_load_time':
            value = 1000 + Math.random() * 2000;
            break;
          case 'api_response_time':
            value = 200 + Math.random() * 800;
            break;
          case 'memory_usage':
            value = 50 + Math.random() * 40;
            break;
          case 'error_rate':
            value = Math.random() * 3;
            break;
          default:
            value = Math.random() * 100;
        }
        values.push(value);
      }

      return { labels, values };
    });
  }
};

export default performanceService;