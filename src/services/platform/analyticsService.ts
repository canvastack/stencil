import { platformApiClient } from './platformApiClient';

export interface PlatformAnalytics {
  id: string;
  
  // Overview Metrics
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  paid_tenants: number;
  suspended_tenants: number;
  
  // User Metrics
  total_users: number;
  active_users_30d: number;
  new_users_30d: number;
  daily_active_users: number;
  monthly_active_users: number;
  
  // Revenue Metrics
  total_revenue: number;
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  average_revenue_per_user: number;
  churn_rate: number;
  
  // Usage Metrics
  total_storage_gb: number;
  total_bandwidth_gb: number;
  total_api_calls: number;
  total_database_size_gb: number;
  
  // Performance Metrics
  platform_uptime: number;
  average_response_time_ms: number;
  error_rate: number;
  
  // Growth Metrics
  tenant_growth_rate: number;
  user_growth_rate: number;
  revenue_growth_rate: number;
  
  // Health Metrics
  healthy_tenants: number;
  tenants_with_warnings: number;
  tenants_with_critical_issues: number;
  
  date: string;
  generated_at: string;
}

export interface TenantAnalytics {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  
  // Basic Info
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  
  // Usage Metrics
  total_users: number;
  active_users_30d: number;
  storage_used_gb: number;
  bandwidth_used_gb: number;
  api_calls_30d: number;
  
  // Business Metrics
  total_orders: number;
  total_revenue: number;
  monthly_revenue: number;
  orders_30d: number;
  revenue_30d: number;
  
  // Performance Metrics
  uptime_30d: number;
  avg_response_time_ms: number;
  error_rate_30d: number;
  
  // Engagement Metrics
  page_views_30d: number;
  sessions_30d: number;
  bounce_rate: number;
  avg_session_duration_min: number;
  
  // Health Status
  health_status: 'healthy' | 'warning' | 'critical';
  last_activity: string;
  last_health_check: string;
  
  // Growth Metrics
  user_growth_rate: number;
  revenue_growth_rate: number;
  usage_growth_rate: number;
}

export interface UsageMetrics {
  tenant_id?: string;
  date: string;
  
  // Resource Usage
  storage_usage_gb: number;
  bandwidth_usage_gb: number;
  api_calls: number;
  database_queries: number;
  
  // User Activity
  active_users: number;
  new_users: number;
  sessions: number;
  page_views: number;
  
  // Business Activity
  orders: number;
  revenue: number;
  quotes: number;
  invoices: number;
  
  // Performance
  response_time_ms: number;
  error_count: number;
  uptime_minutes: number;
}

export interface PerformanceMetrics {
  timestamp: string;
  
  // System Performance
  cpu_usage_percent: number;
  memory_usage_percent: number;
  disk_usage_percent: number;
  
  // Database Performance
  database_connections: number;
  query_response_time_ms: number;
  slow_queries: number;
  
  // API Performance
  requests_per_second: number;
  response_time_95th: number;
  error_rate: number;
  
  // Cache Performance
  cache_hit_rate: number;
  cache_miss_rate: number;
  
  // Network Performance
  bandwidth_utilization: number;
  network_latency_ms: number;
}

export interface RevenueMetrics {
  date: string;
  
  // Revenue Breakdown
  total_revenue: number;
  subscription_revenue: number;
  addon_revenue: number;
  one_time_revenue: number;
  
  // Subscription Metrics
  new_subscriptions: number;
  cancelled_subscriptions: number;
  upgraded_subscriptions: number;
  downgraded_subscriptions: number;
  
  // Plan Distribution
  starter_revenue: number;
  professional_revenue: number;
  enterprise_revenue: number;
  
  // Key Ratios
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  customer_lifetime_value: number;
  churn_rate: number;
}

export interface AnalyticsFilters {
  date_from?: string;
  date_to?: string;
  tenant_ids?: string[];
  subscription_plans?: string[];
  subscription_status?: string[];
  granularity?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  include_trial?: boolean;
  include_suspended?: boolean;
}

export interface ComparisonMetrics {
  current_period: PlatformAnalytics;
  previous_period: PlatformAnalytics;
  comparison: {
    tenants_change: number;
    users_change: number;
    revenue_change: number;
    usage_change: number;
    performance_change: number;
  };
}

export interface AnalyticsDashboard {
  overview: PlatformAnalytics;
  top_tenants: TenantAnalytics[];
  recent_activity: Array<{
    type: 'tenant_created' | 'subscription_started' | 'plan_upgraded' | 'plan_downgraded' | 'subscription_cancelled';
    tenant_name: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  alerts: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    timestamp: string;
    tenant_id?: string;
    tenant_name?: string;
  }>;
  usage_trends: UsageMetrics[];
  revenue_trends: RevenueMetrics[];
  performance_metrics: PerformanceMetrics[];
}

class AnalyticsService {
  private baseUrl = '/analytics';

  /**
   * Get platform analytics dashboard
   */
  async getDashboard(filters: AnalyticsFilters = {}): Promise<AnalyticsDashboard> {
    const response = await platformApiClient.get(`${this.baseUrl}/dashboard`, { params: filters });
    return response.data;
  }

  /**
   * Get platform overview analytics
   */
  async getPlatformAnalytics(filters: AnalyticsFilters = {}): Promise<PlatformAnalytics> {
    const response = await platformApiClient.get(`${this.baseUrl}/platform`, { params: filters });
    return response.data;
  }

  /**
   * Get tenant analytics
   */
  async getTenantAnalytics(params: AnalyticsFilters & {
    page?: number;
    per_page?: number;
    sort_by?: 'name' | 'revenue' | 'users' | 'created_at' | 'last_activity';
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<{
    data: TenantAnalytics[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await platformApiClient.get(`${this.baseUrl}/tenants`, { params });
    return response;
  }

  /**
   * Get specific tenant analytics
   */
  async getTenantAnalyticsById(tenantId: string, filters: AnalyticsFilters = {}): Promise<TenantAnalytics> {
    const response = await platformApiClient.get(`${this.baseUrl}/tenants/${tenantId}`, { params: filters });
    return response.data;
  }

  /**
   * Get usage metrics
   */
  async getUsageMetrics(filters: AnalyticsFilters = {}): Promise<UsageMetrics[]> {
    const response = await platformApiClient.get(`${this.baseUrl}/usage`, { params: filters });
    return response.data;
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(filters: AnalyticsFilters = {}): Promise<PerformanceMetrics[]> {
    const response = await platformApiClient.get(`${this.baseUrl}/performance`, { params: filters });
    return response.data;
  }

  /**
   * Get revenue analytics
   */
  async getRevenueMetrics(filters: AnalyticsFilters = {}): Promise<RevenueMetrics[]> {
    const response = await platformApiClient.get(`${this.baseUrl}/revenue`, { params: filters });
    return response.data;
  }

  /**
   * Get comparison metrics (current vs previous period)
   */
  async getComparisonMetrics(filters: AnalyticsFilters = {}): Promise<ComparisonMetrics> {
    const response = await platformApiClient.get(`${this.baseUrl}/comparison`, { params: filters });
    return response.data;
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<{
    active_users: number;
    requests_per_minute: number;
    response_time_ms: number;
    error_rate: number;
    system_load: number;
    database_connections: number;
    cache_hit_rate: number;
    bandwidth_usage_mbps: number;
  }> {
    const response = await platformApiClient.get(`${this.baseUrl}/realtime`);
    return response.data;
  }

  /**
   * Get tenant health overview
   */
  async getTenantHealthOverview(): Promise<{
    healthy_tenants: number;
    warning_tenants: number;
    critical_tenants: number;
    total_tenants: number;
    health_distribution: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    recent_issues: Array<{
      tenant_id: string;
      tenant_name: string;
      issue_type: string;
      description: string;
      severity: 'warning' | 'critical';
      timestamp: string;
    }>;
  }> {
    const response = await platformApiClient.get(`${this.baseUrl}/health`);
    return response.data;
  }

  /**
   * Get geographic distribution
   */
  async getGeographicDistribution(): Promise<Array<{
    country: string;
    country_code: string;
    tenants_count: number;
    users_count: number;
    revenue: number;
    coordinates: [number, number]; // [lat, lng]
  }>> {
    const response = await platformApiClient.get(`${this.baseUrl}/geographic`);
    return response.data;
  }

  /**
   * Get feature usage analytics
   */
  async getFeatureUsageAnalytics(filters: AnalyticsFilters & {
    feature_keys?: string[];
  } = {}): Promise<Array<{
    feature_key: string;
    feature_name: string;
    total_usage: number;
    enabled_tenants: number;
    usage_trend: Array<{
      date: string;
      usage_count: number;
      unique_tenants: number;
    }>;
    performance: {
      avg_response_time_ms: number;
      error_rate: number;
    };
  }>> {
    const response = await platformApiClient.get(`${this.baseUrl}/features`, { params: filters });
    return response.data;
  }

  /**
   * Get API usage analytics
   */
  async getAPIUsageAnalytics(filters: AnalyticsFilters & {
    endpoints?: string[];
  } = {}): Promise<Array<{
    endpoint: string;
    method: string;
    total_requests: number;
    unique_tenants: number;
    avg_response_time_ms: number;
    error_rate: number;
    rate_limit_hits: number;
    usage_by_plan: Array<{
      plan: string;
      requests: number;
    }>;
  }>> {
    const response = await platformApiClient.get(`${this.baseUrl}/api-usage`, { params: filters });
    return response.data;
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(filters: AnalyticsFilters = {}): Promise<{
    total_subscriptions: number;
    active_subscriptions: number;
    trial_subscriptions: number;
    cancelled_subscriptions: number;
    
    plan_distribution: Array<{
      plan: string;
      count: number;
      percentage: number;
      revenue: number;
    }>;
    
    churn_analysis: {
      monthly_churn_rate: number;
      churn_by_plan: Array<{
        plan: string;
        churn_rate: number;
        churned_count: number;
      }>;
      churn_reasons: Array<{
        reason: string;
        count: number;
        percentage: number;
      }>;
    };
    
    growth_metrics: {
      new_subscriptions_trend: Array<{
        date: string;
        count: number;
      }>;
      revenue_trend: Array<{
        date: string;
        revenue: number;
      }>;
      net_growth_rate: number;
    };
  }> {
    const response = await platformApiClient.get(`${this.baseUrl}/subscriptions`, { params: filters });
    return response.data;
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(params: {
    format: 'csv' | 'excel' | 'pdf';
    data_type: 'platform' | 'tenants' | 'usage' | 'revenue' | 'performance';
    filters?: AnalyticsFilters;
  }): Promise<Blob> {
    const response = await platformApiClient.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Generate custom analytics report
   */
  async generateCustomReport(params: {
    title: string;
    description?: string;
    metrics: Array<{
      type: 'tenant_count' | 'user_count' | 'revenue' | 'usage' | 'performance';
      aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min';
      filters?: AnalyticsFilters;
    }>;
    format: 'pdf' | 'excel';
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
    };
  }): Promise<{
    report_id: string;
    status: 'generating' | 'completed' | 'failed';
    download_url?: string;
    generated_at?: string;
  }> {
    const response = await platformApiClient.post(`${this.baseUrl}/reports/custom`, params);
    return response.data;
  }

  /**
   * Set up analytics alerts
   */
  async setupAlert(params: {
    name: string;
    description?: string;
    metric_type: 'tenant_count' | 'user_count' | 'revenue' | 'usage' | 'performance' | 'error_rate';
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
    threshold: number;
    recipients: string[];
    frequency: 'immediate' | 'daily' | 'weekly';
    filters?: AnalyticsFilters;
  }): Promise<{
    alert_id: string;
    status: 'active' | 'inactive';
    created_at: string;
  }> {
    const response = await platformApiClient.post(`${this.baseUrl}/alerts`, params);
    return response.data;
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Array<{
    alert_id: string;
    name: string;
    metric_type: string;
    condition: string;
    threshold: number;
    current_value: number;
    status: 'triggered' | 'normal';
    last_triggered?: string;
    created_at: string;
  }>> {
    const response = await platformApiClient.get(`${this.baseUrl}/alerts`);
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();