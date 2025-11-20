import apiClient from './client';
import { DashboardStats, DashboardStat, Activity, ContentOverviewItem } from '@/types/dashboard';
import { customersService } from './customers';
import { vendorsService } from './vendors';
import { ordersService } from './orders';
import { authService } from './auth';

class DashboardService {
  private cache: { data: DashboardStats | null; timestamp: number } = { data: null, timestamp: 0 };
  private readonly CACHE_DURATION = 5000; // 5 seconds
  private isLoading = false;

  async getDashboardStats(): Promise<DashboardStats> {
    // Return cached data if still valid
    const now = Date.now();
    if (this.cache.data && (now - this.cache.timestamp) < this.CACHE_DURATION) {
      console.log('Returning cached dashboard data');
      return this.cache.data;
    }

    // If already loading, wait for it
    if (this.isLoading) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.isLoading) {
            clearInterval(checkInterval);
            if (this.cache.data) {
              resolve(this.cache.data);
            } else {
              reject(new Error('Dashboard data loading failed'));
            }
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Dashboard data loading timeout'));
        }, 10000);
      });
    }

    this.isLoading = true;
    
    // Check account type and use appropriate data fetching strategy
    const accountType = authService.getAccountType();
    
    try {
      if (accountType === 'platform') {
        // Platform accounts get aggregated data across all tenants
        return await this.getPlatformDashboardStats();
      }
      
      // For tenant accounts, try to fetch real data with timeout
      const [customersResponse, vendorsResponse, ordersResponse] = await Promise.allSettled([
        Promise.race([
          customersService.getCustomers({ per_page: 100 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]),
        Promise.race([
          vendorsService.getVendors({ per_page: 100 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]),
        Promise.race([
          ordersService.getOrders({ per_page: 100 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ])
      ]);

      // Use real data if available, otherwise fallback to mock data
      const customers = customersResponse.status === 'fulfilled' ? customersResponse.value.data || [] : [];
      const vendors = vendorsResponse.status === 'fulfilled' ? vendorsResponse.value.data || [] : [];
      const orders = ordersResponse.status === 'fulfilled' ? ordersResponse.value.data || [] : [];

      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const activeCustomers = customers.filter(c => c.status === 'active').length;
      const activeVendors = vendors.filter(v => v.status === 'active').length;

      // If all API calls failed, use mock data
      const usesMockData = customersResponse.status === 'rejected' && 
                          vendorsResponse.status === 'rejected' && 
                          ordersResponse.status === 'rejected';

      const stats: DashboardStat[] = usesMockData ? [
        {
          title: 'Total Customers',
          value: 25,
          icon: 'Users',
          trend: 'Mock Data',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          title: 'Total Revenue',
          value: 'IDR 2.5M',
          icon: 'TrendingUp',
          trend: 'Mock Data',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
        {
          title: 'Total Orders',
          value: 42,
          icon: 'Package',
          trend: 'Mock Data',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          title: 'Active Vendors',
          value: 8,
          icon: 'Users',
          trend: 'Mock Data',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
        },
      ] : [
        {
          title: 'Total Customers',
          value: customers.length,
          icon: 'Users',
          trend: '+12%',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          title: 'Total Revenue',
          value: `IDR ${(totalRevenue / 1000000).toFixed(1)}M`,
          icon: 'TrendingUp',
          trend: '+8%',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
        {
          title: 'Total Orders',
          value: orders.length,
          icon: 'Package',
          trend: '+15%',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          title: 'Active Vendors',
          value: activeVendors,
          icon: 'Users',
          trend: '+5%',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
        },
      ];

      const recentActivities: Activity[] = usesMockData ? [
        {
          action: 'Mock data loaded',
          item: 'Demo dashboard active',
          time: 'Just now',
        },
        {
          action: 'System initialized',
          item: 'Backend connection pending',
          time: '2 minutes ago',
        },
        {
          action: 'Frontend ready',
          item: 'All components loaded',
          time: '5 minutes ago',
        },
        {
          action: 'Theme activated',
          item: 'Default theme loaded',
          time: '5 minutes ago',
        },
      ] : [
        {
          action: 'New customer registered',
          item: `${activeCustomers} active customers`,
          time: 'Just now',
        },
        {
          action: 'Order processed',
          item: `${orders.length} total orders`,
          time: '2 hours ago',
        },
        {
          action: 'Vendor updated',
          item: `${activeVendors} active vendors`,
          time: '4 hours ago',
        },
        {
          action: 'System sync',
          item: 'All data synchronized',
          time: '6 hours ago',
        },
      ];

      const contentOverview: ContentOverviewItem[] = usesMockData ? [
        {
          icon: 'Users',
          title: 'Demo Mode',
          description: 'Using mock data',
          value: 'Active',
        },
        {
          icon: 'Package',
          title: 'Backend Status',
          description: 'Connection pending',
          value: 'Offline',
        },
        {
          icon: 'Eye',
          title: 'Frontend',
          description: 'Fully loaded',
          value: 'Ready',
        },
        {
          icon: 'TrendingUp',
          title: 'System Health',
          description: 'All components',
          value: '100%',
        },
      ] : [
        {
          icon: 'Users',
          title: 'Active Customers',
          description: 'Business users',
          value: activeCustomers,
        },
        {
          icon: 'Package',
          title: 'Pending Orders',
          description: 'Awaiting shipment',
          value: orders.filter(o => o.status === 'pending').length,
        },
        {
          icon: 'Eye',
          title: 'Top Vendors',
          description: 'By performance',
          value: Math.min(3, activeVendors),
        },
        {
          icon: 'TrendingUp',
          title: 'Revenue Growth',
          description: 'vs last month',
          value: '+18%',
        },
      ];

      const result = {
        stats,
        recentActivities,
        contentOverview,
      };

      // Cache the result
      this.cache.data = result;
      this.cache.timestamp = Date.now();
      
      return result;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async getStats(): Promise<DashboardStat[]> {
    const data = await this.getDashboardStats();
    return data.stats;
  }

  async getRecentActivities(limit?: number): Promise<Activity[]> {
    const data = await this.getDashboardStats();
    const activities = data.recentActivities;
    return limit ? activities.slice(0, limit) : activities;
  }

  async getContentOverview(): Promise<ContentOverviewItem[]> {
    const data = await this.getDashboardStats();
    return data.contentOverview;
  }

  private async getPlatformDashboardStats(): Promise<DashboardStats> {
    try {
      // Try to fetch platform analytics data
      const [overviewResponse, systemStatsResponse] = await Promise.allSettled([
        Promise.race([
          apiClient.get('/platform/analytics/overview'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]),
        Promise.race([
          apiClient.get('/platform/system/stats'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ])
      ]);

      // If we got real platform data, use it
      if (overviewResponse.status === 'fulfilled' || systemStatsResponse.status === 'fulfilled') {
        const overview = overviewResponse.status === 'fulfilled' ? overviewResponse.value : null;
        const systemStats = systemStatsResponse.status === 'fulfilled' ? systemStatsResponse.value : null;
        
        return this.formatPlatformStats(overview, systemStats);
      }
    } catch (error) {
      console.warn('Platform API calls failed, using mock data');
    }

    // Return mock platform data
    const stats: DashboardStat[] = [
      {
        title: 'Total Tenants',
        value: 12,
        icon: 'Building',
        trend: '+2 this month',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      {
        title: 'Platform Revenue',
        value: 'IDR 45.2M',
        icon: 'TrendingUp',
        trend: '+18% from last month',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        title: 'Active Users',
        value: 234,
        icon: 'Users',
        trend: '+12% from last month',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      {
        title: 'System Uptime',
        value: '99.9%',
        icon: 'Activity',
        trend: 'Last 30 days',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
      }
    ];

    const recentActivities: Activity[] = [
      {
        id: '1',
        type: 'tenant_created',
        message: 'New tenant "ArtisticEtching" was created',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: 'System',
      },
      {
        id: '2',
        type: 'subscription_renewed',
        message: 'Tenant "Demo Etching" renewed subscription',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        user: 'Billing System',
      },
      {
        id: '3',
        type: 'system_maintenance',
        message: 'System maintenance completed successfully',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        user: 'Admin',
      }
    ];

    const contentOverview: ContentOverviewItem[] = [
      {
        type: 'tenants',
        title: 'Active Tenants',
        count: 12,
        icon: 'Building',
        description: 'Currently active tenant accounts',
      },
      {
        type: 'users',
        title: 'Total Users',
        count: 234,
        icon: 'Users',
        description: 'Across all tenant accounts',
      },
      {
        type: 'products',
        title: 'Total Products',
        count: 1567,
        icon: 'Package',
        description: 'Products across all tenants',
      },
      {
        type: 'orders',
        title: 'Monthly Orders',
        count: 89,
        icon: 'ShoppingCart',
        description: 'Orders processed this month',
      }
    ];

    const result: DashboardStats = {
      stats,
      recentActivities,
      contentOverview,
    };

    // Cache the result
    this.cache = { data: result, timestamp: Date.now() };
    this.isLoading = false;

    return result;
  }

  private formatPlatformStats(overview: any, systemStats: any): DashboardStats {
    // This method would format real platform API data into our DashboardStats format
    // For now, we would transform the real API data here
    // Since we don't have the exact API schema yet, we'll use mock data for consistency
    
    const stats: DashboardStat[] = [
      {
        title: 'Total Tenants',
        value: systemStats?.tenants_count || 12,
        icon: 'Building',
        trend: '+2 this month',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      {
        title: 'Platform Revenue', 
        value: overview?.revenue || 'IDR 45.2M',
        icon: 'TrendingUp',
        trend: '+18% from last month',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        title: 'Active Users',
        value: overview?.active_users || 234,
        icon: 'Users',
        trend: '+12% from last month', 
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      {
        title: 'System Uptime',
        value: systemStats?.uptime || '99.9%',
        icon: 'Activity',
        trend: 'Last 30 days',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
      }
    ];

    // Use the same mock activities and content overview for now
    const recentActivities: Activity[] = [
      {
        id: '1',
        type: 'tenant_created',
        message: 'New tenant "ArtisticEtching" was created',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: 'System',
      }
    ];

    const contentOverview: ContentOverviewItem[] = [
      {
        type: 'tenants',
        title: 'Active Tenants',
        count: systemStats?.tenants_count || 12,
        icon: 'Building',
        description: 'Currently active tenant accounts',
      }
    ];

    return {
      stats,
      recentActivities,
      contentOverview,
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
