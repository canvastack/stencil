import { platformApiClient } from './platformApiClient';

export interface TenantAccount {
  id: string;
  tenant_uuid: string;
  
  // Basic Information
  name: string;
  slug: string;
  display_name: string;
  description?: string;
  
  // Contact Information
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone?: string;
  company_address?: {
    street_line_1: string;
    street_line_2?: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
  };
  
  // Tenant Configuration
  domain?: string;
  custom_domain?: string;
  subdomain: string;
  logo_url?: string;
  favicon_url?: string;
  brand_colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Subscription & License
  subscription_plan: 'trial' | 'starter' | 'professional' | 'enterprise' | 'custom';
  subscription_status: 'active' | 'inactive' | 'suspended' | 'cancelled' | 'trial_expired';
  trial_ends_at?: string;
  subscription_starts_at?: string;
  subscription_ends_at?: string;
  
  // Usage & Limits
  user_limit: number;
  storage_limit_gb: number;
  bandwidth_limit_gb: number;
  api_call_limit: number;
  custom_domain_enabled: boolean;
  white_label_enabled: boolean;
  
  // Current Usage
  current_users: number;
  current_storage_gb: number;
  current_bandwidth_gb: number;
  current_api_calls: number;
  
  // Features & Permissions
  enabled_features: string[];
  feature_overrides?: Record<string, any>;
  
  // Status & Health
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'provisioning' | 'migrating' | 'deactivated';
  health_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  last_activity_at?: string;
  last_health_check_at?: string;
  
  // Database & Infrastructure
  database_name: string;
  database_schema: string;
  database_size_mb: number;
  backup_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  last_backup_at?: string;
  
  // Analytics
  total_orders: number;
  total_revenue: number;
  monthly_active_users: number;
  daily_active_users: number;
  page_views_last_30_days: number;
  
  // Compliance & Security
  data_retention_days: number;
  gdpr_compliance_enabled: boolean;
  security_level: 'standard' | 'enhanced' | 'enterprise';
  two_factor_enforced: boolean;
  
  // Migration & History
  migrated_from?: string;
  migration_completed_at?: string;
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
  
  // Metadata
  tags: string[];
  notes?: string;
  
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  users?: TenantUser[];
  subscription?: TenantSubscription;
  usage_stats?: TenantUsageStats;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  
  // User Info
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  
  // Role & Permissions
  role: string;
  permissions: string[];
  is_admin: boolean;
  is_owner: boolean;
  
  // Status
  status: 'active' | 'inactive' | 'invited' | 'suspended';
  email_verified: boolean;
  last_login_at?: string;
  
  // Invitation
  invited_by?: string;
  invited_at?: string;
  invitation_accepted_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  
  // Plan Information
  plan_name: string;
  plan_type: 'trial' | 'paid';
  billing_cycle: 'monthly' | 'yearly';
  price: number;
  currency: string;
  
  // Billing
  next_billing_date?: string;
  last_billing_date?: string;
  payment_method?: string;
  billing_email: string;
  
  // Status
  status: 'active' | 'past_due' | 'cancelled' | 'unpaid' | 'trial';
  auto_renew: boolean;
  
  // Trial
  trial_days: number;
  trial_ends_at?: string;
  
  // Features included
  included_features: string[];
  usage_limits: {
    users: number;
    storage_gb: number;
    bandwidth_gb: number;
    api_calls: number;
  };
  
  created_at: string;
  updated_at: string;
}

export interface TenantUsageStats {
  tenant_id: string;
  date: string;
  
  // Users
  active_users: number;
  new_users: number;
  total_users: number;
  
  // Orders & Revenue
  orders_count: number;
  orders_value: number;
  
  // System Usage
  api_calls: number;
  storage_used_mb: number;
  bandwidth_used_mb: number;
  page_views: number;
  
  // Performance
  avg_response_time_ms: number;
  error_rate: number;
  uptime_percentage: number;
  
  created_at: string;
}

export interface TenantOnboardingStep {
  step_key: string;
  step_name: string;
  description: string;
  is_completed: boolean;
  completed_at?: string;
  is_required: boolean;
  order: number;
  
  // For tracking progress
  sub_steps?: {
    name: string;
    is_completed: boolean;
  }[];
}

export interface TenantHealthCheck {
  tenant_id: string;
  check_timestamp: string;
  overall_status: 'healthy' | 'warning' | 'critical';
  
  checks: {
    database_connection: 'pass' | 'fail';
    storage_usage: 'pass' | 'warning' | 'critical';
    api_response_time: 'pass' | 'warning' | 'critical';
    backup_status: 'pass' | 'fail';
    security_compliance: 'pass' | 'warning' | 'fail';
  };
  
  metrics: {
    database_size_mb: number;
    storage_usage_percentage: number;
    avg_response_time_ms: number;
    error_rate_percentage: number;
    uptime_percentage: number;
  };
  
  issues: {
    type: 'warning' | 'critical';
    message: string;
    recommendation: string;
  }[];
  
  next_check_at: string;
}

export interface CreateTenantRequest {
  // Basic Information
  name: string;
  display_name?: string;
  description?: string;
  
  // Contact Information
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone?: string;
  
  // Configuration
  subdomain: string;
  subscription_plan: TenantAccount['subscription_plan'];
  
  // Features
  enabled_features?: string[];
  
  // Initial User
  admin_user?: {
    name: string;
    email: string;
    password: string;
  };
}

export interface UpdateTenantRequest {
  // Basic Information
  name?: string;
  display_name?: string;
  description?: string;
  
  // Contact Information
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  company_address?: TenantAccount['company_address'];
  
  // Branding
  logo_url?: string;
  favicon_url?: string;
  brand_colors?: TenantAccount['brand_colors'];
  
  // Configuration
  custom_domain?: string;
  status?: TenantAccount['status'];
  
  // Features
  enabled_features?: string[];
  feature_overrides?: Record<string, any>;
  
  // Limits
  user_limit?: number;
  storage_limit_gb?: number;
  bandwidth_limit_gb?: number;
  api_call_limit?: number;
  
  // Security
  security_level?: TenantAccount['security_level'];
  two_factor_enforced?: boolean;
  
  // Metadata
  tags?: string[];
  notes?: string;
}

export interface TenantListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: TenantAccount['status'];
  subscription_plan?: TenantAccount['subscription_plan'];
  subscription_status?: TenantAccount['subscription_status'];
  health_status?: TenantAccount['health_status'];
  
  // Date filters
  created_from?: string;
  created_to?: string;
  last_activity_from?: string;
  last_activity_to?: string;
  
  // Usage filters
  usage_above?: number; // percentage
  storage_above?: number; // percentage
  
  sort_by?: 'created_at' | 'name' | 'last_activity_at' | 'current_users' | 'total_revenue';
  sort_order?: 'asc' | 'desc';
}

export interface TenantListResponse {
  data: TenantAccount[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    summary?: {
      total_tenants: number;
      active_tenants: number;
      trial_tenants: number;
      suspended_tenants: number;
      total_revenue: number;
      total_users: number;
    };
  };
}

export interface PlatformStats {
  // Tenant Metrics
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  paid_tenants: number;
  suspended_tenants: number;
  
  // User Metrics
  total_users: number;
  active_users_last_30_days: number;
  new_users_this_month: number;
  
  // Revenue Metrics
  total_revenue: number;
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  average_revenue_per_user: number;
  
  // Usage Metrics
  total_storage_used_gb: number;
  total_bandwidth_used_gb: number;
  total_api_calls: number;
  
  // Health Metrics
  healthy_tenants: number;
  tenants_with_warnings: number;
  tenants_with_critical_issues: number;
  average_uptime_percentage: number;
  
  // Growth Metrics
  tenant_growth_rate: number;
  user_growth_rate: number;
  revenue_growth_rate: number;
  churn_rate: number;
  
  // System Metrics
  platform_uptime_percentage: number;
  average_response_time_ms: number;
  total_database_size_gb: number;
  
  // Subscription Distribution
  subscription_distribution: Array<{
    plan: string;
    count: number;
    percentage: number;
    revenue: number;
  }>;
  
  // Geographic Distribution
  geographic_distribution: Array<{
    country: string;
    tenants_count: number;
    users_count: number;
  }>;
  
  // Timeline Data
  monthly_metrics: Array<{
    month: string;
    new_tenants: number;
    churned_tenants: number;
    revenue: number;
    users: number;
  }>;
}

class TenantService {
  private baseUrl = '/tenants';

  /**
   * Get paginated list of tenants
   */
  async getTenants(params: TenantListParams = {}): Promise<TenantListResponse> {
    const response = await platformApiClient.get(`${this.baseUrl}`, { params });
    return response;
  }

  /**
   * Get a specific tenant by ID
   */
  async getTenant(id: string): Promise<TenantAccount> {
    const response = await platformApiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Create a new tenant
   */
  async createTenant(data: CreateTenantRequest): Promise<TenantAccount> {
    const response = await platformApiClient.post(`${this.baseUrl}`, data);
    return response.data;
  }

  /**
   * Update an existing tenant
   */
  async updateTenant(id: string, data: UpdateTenantRequest): Promise<TenantAccount> {
    const response = await platformApiClient.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Suspend a tenant
   */
  async suspendTenant(id: string, reason?: string): Promise<TenantAccount> {
    const response = await platformApiClient.post(`${this.baseUrl}/${id}/suspend`, { reason });
    return response.data;
  }

  /**
   * Activate a tenant
   */
  async activateTenant(id: string): Promise<TenantAccount> {
    const response = await platformApiClient.post(`${this.baseUrl}/${id}/activate`);
    return response.data;
  }

  /**
   * Deactivate a tenant (soft delete)
   */
  async deactivateTenant(id: string, reason?: string): Promise<void> {
    await platformApiClient.post(`${this.baseUrl}/${id}/deactivate`, { reason });
  }

  /**
   * Get tenant onboarding status
   */
  async getTenantOnboarding(id: string): Promise<TenantOnboardingStep[]> {
    const response = await platformApiClient.get(`${this.baseUrl}/${id}/onboarding`);
    return response.data;
  }

  /**
   * Update tenant onboarding step
   */
  async updateOnboardingStep(id: string, stepKey: string, completed: boolean): Promise<TenantOnboardingStep> {
    const response = await platformApiClient.post(`${this.baseUrl}/${id}/onboarding/${stepKey}`, { completed });
    return response.data;
  }

  /**
   * Get tenant health status
   */
  async getTenantHealth(id: string): Promise<TenantHealthCheck> {
    const response = await platformApiClient.get(`${this.baseUrl}/${id}/health`);
    return response.data;
  }

  /**
   * Trigger tenant health check
   */
  async triggerHealthCheck(id: string): Promise<TenantHealthCheck> {
    const response = await platformApiClient.post(`${this.baseUrl}/${id}/health/check`);
    return response.data;
  }

  /**
   * Get tenant users
   */
  async getTenantUsers(id: string, params?: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{
    data: TenantUser[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await platformApiClient.get(`${this.baseUrl}/${id}/users`, { params });
    return response;
  }

  /**
   * Invite user to tenant
   */
  async inviteUserToTenant(id: string, data: {
    email: string;
    name?: string;
    role: string;
    permissions?: string[];
  }): Promise<TenantUser> {
    const response = await platformApiClient.post(`${this.baseUrl}/${id}/users/invite`, data);
    return response.data;
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(id: string, userId: string): Promise<void> {
    await platformApiClient.delete(`${this.baseUrl}/${id}/users/${userId}`);
  }

  /**
   * Get tenant subscription
   */
  async getTenantSubscription(id: string): Promise<TenantSubscription> {
    const response = await platformApiClient.get(`${this.baseUrl}/${id}/subscription`);
    return response.data;
  }

  /**
   * Update tenant subscription
   */
  async updateTenantSubscription(id: string, data: {
    plan_name?: string;
    billing_cycle?: string;
    auto_renew?: boolean;
  }): Promise<TenantSubscription> {
    const response = await platformApiClient.put(`${this.baseUrl}/${id}/subscription`, data);
    return response.data;
  }

  /**
   * Get tenant usage statistics
   */
  async getTenantUsage(id: string, params?: {
    date_from?: string;
    date_to?: string;
    granularity?: 'daily' | 'weekly' | 'monthly';
  }): Promise<TenantUsageStats[]> {
    const response = await platformApiClient.get(`${this.baseUrl}/${id}/usage`, { params });
    return response.data;
  }

  /**
   * Create tenant backup
   */
  async createTenantBackup(id: string, type: 'manual' | 'scheduled' = 'manual'): Promise<{
    backup_id: string;
    status: string;
    size_mb: number;
    created_at: string;
  }> {
    const response = await platformApiClient.post(`${this.baseUrl}/${id}/backup`, { type });
    return response.data;
  }

  /**
   * Restore tenant from backup
   */
  async restoreTenantFromBackup(id: string, backupId: string): Promise<{
    restore_id: string;
    status: string;
    estimated_completion: string;
  }> {
    const response = await platformApiClient.post(`${this.baseUrl}/${id}/restore`, { backup_id: backupId });
    return response.data;
  }

  /**
   * Migrate tenant to new infrastructure
   */
  async migrateTenant(id: string, data: {
    target_environment?: string;
    migration_type: 'database' | 'full';
    scheduled_at?: string;
  }): Promise<{
    migration_id: string;
    status: string;
    estimated_completion: string;
  }> {
    const response = await platformApiClient.post(`${this.baseUrl}/${id}/migrate`, data);
    return response.data;
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<PlatformStats> {
    const response = await platformApiClient.get('/stats', { params });
    return response.data;
  }

  /**
   * Get platform dashboard summary
   */
  async getPlatformDashboard(): Promise<{
    today: {
      new_tenants: number;
      new_users: number;
      revenue: number;
      api_calls: number;
    };
    alerts: {
      critical_issues: number;
      pending_subscriptions: number;
      trial_expiring_soon: number;
      overdue_payments: number;
    };
    recent_activity: Array<{
      type: string;
      tenant_name: string;
      description: string;
      timestamp: string;
    }>;
  }> {
    const response = await platformApiClient.get('/dashboard');
    return response.data;
  }

  /**
   * Bulk update tenants
   */
  async bulkUpdateTenants(tenantIds: string[], data: {
    status?: TenantAccount['status'];
    subscription_plan?: TenantAccount['subscription_plan'];
    enabled_features?: string[];
    tags?: string[];
  }): Promise<{
    success: TenantAccount[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const response = await platformApiClient.post(`${this.baseUrl}/bulk-update`, {
      tenant_ids: tenantIds,
      ...data
    });
    return response.data;
  }

  /**
   * Export tenants data
   */
  async exportTenants(params: TenantListParams & {
    format: 'csv' | 'excel' | 'pdf';
    include_users?: boolean;
    include_usage?: boolean;
  }): Promise<Blob> {
    const response = await platformApiClient.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}

export const tenantService = new TenantService();
export default tenantService;