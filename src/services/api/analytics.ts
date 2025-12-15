import { tenantApiClient } from '@/services/api/tenantApiClient';

export interface AnalyticsTimeRange {
  start_date: string;
  end_date: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface OrderStatusData {
  name: string;
  value: number;
  count: number;
}

export interface TopCustomerData {
  name: string;
  orders: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PerformanceMetric {
  metric: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export interface AnalyticsData {
  revenue: RevenueData[];
  orderStatus: OrderStatusData[];
  topCustomers: TopCustomerData[];
  performance: PerformanceMetric[];
}

export interface AnalyticsFilters {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
}

export const analyticsService = {
  /**
   * Get comprehensive analytics data for orders
   */
  getOrderAnalytics: async (filters: AnalyticsFilters = {}): Promise<AnalyticsData> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.timeRange) {
        params.append('time_range', filters.timeRange);
      }
      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }

      const response = await tenantApiClient.get(`/analytics/orders?${params.toString()}`);
      
      // Handle wrapped responses: { data: {...} } or direct object
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Analytics data not found');
      }
      
      return {
        revenue: data.revenue || [],
        orderStatus: data.order_status || data.orderStatus || [],
        topCustomers: data.top_customers || data.topCustomers || [],
        performance: data.performance || []
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using mock analytics data for development:', error);
        
        // Fallback analytics data for development
        return {
          revenue: [
            { month: 'Jan', revenue: 45000, orders: 120, profit: 12000 },
            { month: 'Feb', revenue: 52000, orders: 135, profit: 14000 },
            { month: 'Mar', revenue: 48000, orders: 125, profit: 13200 },
            { month: 'Apr', revenue: 61000, orders: 155, profit: 16800 },
            { month: 'May', revenue: 58000, orders: 145, profit: 15600 },
            { month: 'Jun', revenue: 67000, orders: 170, profit: 18900 }
          ],
          orderStatus: [
            { name: 'Completed', value: 45, count: 145 },
            { name: 'In Production', value: 25, count: 80 },
            { name: 'Pending Payment', value: 15, count: 48 },
            { name: 'Vendor Sourcing', value: 10, count: 32 },
            { name: 'Cancelled', value: 5, count: 16 }
          ],
          topCustomers: [
            { name: 'PT Manufaktur Jaya', orders: 23, revenue: 125000, trend: 'up' },
            { name: 'CV Teknik Presisi', orders: 18, revenue: 95000, trend: 'up' },
            { name: 'PT Indo Etching', orders: 15, revenue: 78000, trend: 'down' },
            { name: 'Berkah Metal Works', orders: 12, revenue: 65000, trend: 'up' },
            { name: 'Precision Tools Co', orders: 10, revenue: 55000, trend: 'stable' }
          ],
          performance: [
            { metric: 'Average Order Value', value: 'Rp 3,250,000', change: '+12%', trend: 'up' },
            { metric: 'Order Completion Rate', value: '94.2%', change: '+3%', trend: 'up' },
            { metric: 'Average Production Time', value: '7.5 days', change: '-8%', trend: 'down' },
            { metric: 'Customer Satisfaction', value: '4.8/5', change: '+0.2', trend: 'up' },
            { metric: 'Vendor Response Time', value: '2.3 hours', change: '-15%', trend: 'down' },
            { metric: 'Profit Margin', value: '28.5%', change: '+4%', trend: 'up' }
          ]
        };
      } else {
        console.error('Failed to load analytics data:', error);
        throw new Error(`Failed to load analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  /**
   * Get revenue trend data
   */
  getRevenueTrend: async (filters: AnalyticsFilters = {}): Promise<RevenueData[]> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.timeRange) {
        params.append('time_range', filters.timeRange);
      }
      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }

      const response = await tenantApiClient.get(`/analytics/revenue-trend?${params.toString()}`);
      const data = response?.data || response;
      
      return data || [];
    } catch (error) {
      console.error('Failed to load revenue trend:', error);
      return [];
    }
  },

  /**
   * Get order status distribution
   */
  getOrderStatusDistribution: async (): Promise<OrderStatusData[]> => {
    try {
      const response = await tenantApiClient.get('/analytics/order-status');
      const data = response?.data || response;
      
      return data || [];
    } catch (error) {
      console.error('Failed to load order status distribution:', error);
      return [];
    }
  },

  /**
   * Get top customers data
   */
  getTopCustomers: async (limit: number = 10): Promise<TopCustomerData[]> => {
    try {
      const response = await tenantApiClient.get(`/analytics/top-customers?limit=${limit}`);
      const data = response?.data || response;
      
      return data || [];
    } catch (error) {
      console.error('Failed to load top customers:', error);
      return [];
    }
  },

  /**
   * Get performance metrics
   */
  getPerformanceMetrics: async (): Promise<PerformanceMetric[]> => {
    try {
      const response = await tenantApiClient.get('/analytics/performance-metrics');
      const data = response?.data || response;
      
      return data || [];
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
      return [];
    }
  }
};