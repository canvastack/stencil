import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface DashboardMetrics {
  metrics: {
    active_orders: number;
    active_orders_change: number;
    on_time_delivery_rate: number;
    on_time_delivery_rate_change: number;
    avg_production_time: number;
    avg_production_time_change: number;
    quote_acceptance_rate: number;
    quote_acceptance_rate_change: number;
  };
  period: {
    start: string;
    end: string;
  };
}

interface ProductionTimeline {
  timeline: {
    date: string;
    accepted: number;
    completed: number;
    overdue: number;
  }[];
}

interface VendorPerformance {
  vendors: {
    id: string;
    name: string;
    total_orders: number;
    on_time_delivery_rate: number;
    avg_production_time: number;
    quality_score: number;
    status: 'active' | 'inactive';
  }[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

interface DeliveryStatus {
  distribution: {
    status: 'on_track' | 'approaching' | 'overdue' | 'completed';
    count: number;
    percentage: number;
  }[];
  total: number;
}

interface RecentActivity {
  activities: {
    id: string;
    type: 'quote_accepted' | 'production_update' | 'delivery' | 'overdue_alert' | 'qc_inspection';
    title: string;
    description: string;
    timestamp: string;
    order_id?: string;
  }[];
}

async function fetchDashboardMetrics(timeRange: string): Promise<DashboardMetrics> {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/admin/analytics/post-acceptance/dashboard/metrics`,
    {
      params: { time_range: timeRange },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.data;
}

async function fetchProductionTimeline(timeRange: string, groupBy: string = 'day'): Promise<ProductionTimeline> {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/admin/analytics/post-acceptance/dashboard/production-timeline`,
    {
      params: { time_range: timeRange, group_by: groupBy },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.data;
}

async function fetchVendorPerformance(
  page: number = 1,
  perPage: number = 10,
  sortBy: string = 'total_orders',
  sortOrder: string = 'desc',
  search?: string
): Promise<VendorPerformance> {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/admin/analytics/post-acceptance/dashboard/vendor-performance`,
    {
      params: { page, per_page: perPage, sort_by: sortBy, sort_order: sortOrder, search },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.data;
}

async function fetchDeliveryStatus(): Promise<DeliveryStatus> {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/admin/analytics/post-acceptance/dashboard/delivery-status`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.data;
}

async function fetchRecentActivity(limit: number = 20, type?: string): Promise<RecentActivity> {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/admin/analytics/post-acceptance/dashboard/recent-activity`,
    {
      params: { limit, type },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.data;
}

export function useAnalyticsDashboard(timeRange: string = '30d') {
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['analytics', 'metrics', timeRange],
    queryFn: () => fetchDashboardMetrics(timeRange),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['analytics', 'timeline', timeRange],
    queryFn: () => fetchProductionTimeline(timeRange),
    refetchInterval: 60000,
  });

  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ['analytics', 'vendors'],
    queryFn: () => fetchVendorPerformance(),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: deliveryStatusData, isLoading: statusLoading } = useQuery({
    queryKey: ['analytics', 'delivery-status'],
    queryFn: () => fetchDeliveryStatus(),
    refetchInterval: 60000,
  });

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['analytics', 'activities'],
    queryFn: () => fetchRecentActivity(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform data to match component props
  const metrics = metricsData
    ? {
        activeOrders: metricsData.metrics.active_orders,
        activeOrdersChange: metricsData.metrics.active_orders_change,
        onTimeDeliveryRate: metricsData.metrics.on_time_delivery_rate,
        onTimeDeliveryRateChange: metricsData.metrics.on_time_delivery_rate_change,
        avgProductionTime: metricsData.metrics.avg_production_time,
        avgProductionTimeChange: metricsData.metrics.avg_production_time_change,
        quoteAcceptanceRate: metricsData.metrics.quote_acceptance_rate,
        quoteAcceptanceRateChange: metricsData.metrics.quote_acceptance_rate_change,
      }
    : undefined;

  const timeline = timelineData?.timeline || [];

  const vendors = vendorsData
    ? vendorsData.vendors.map((v) => ({
        id: v.id,
        name: v.name,
        totalOrders: v.total_orders,
        onTimeDeliveryRate: v.on_time_delivery_rate,
        avgProductionTime: v.avg_production_time,
        qualityScore: v.quality_score,
        status: v.status,
      }))
    : [];

  const deliveryStatus = deliveryStatusData?.distribution || [];

  const activities = activitiesData?.activities || [];

  return {
    metrics,
    timeline,
    vendors,
    vendorsPagination: vendorsData?.pagination,
    deliveryStatus,
    activities,
    isLoading:
      metricsLoading ||
      timelineLoading ||
      vendorsLoading ||
      statusLoading ||
      activitiesLoading,
  };
}
