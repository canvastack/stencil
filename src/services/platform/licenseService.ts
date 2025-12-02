import { platformApiClient } from './platformApiClient';

export interface LicensePackage {
  id: string;
  license_uuid: string;
  
  // Basic Information
  name: string;
  display_name: string;
  description: string;
  version: string;
  
  // Package Details
  package_type: 'starter' | 'professional' | 'enterprise' | 'custom' | 'addon';
  billing_model: 'monthly' | 'yearly' | 'one_time' | 'usage_based';
  price: number;
  currency: string;
  
  // Features & Limits
  included_features: string[];
  feature_limits: {
    users: number;
    storage_gb: number;
    bandwidth_gb: number;
    api_calls_per_month: number;
    custom_domains: number;
    email_accounts: number;
    database_size_gb: number;
    backup_retention_days: number;
  };
  
  // Advanced Features
  advanced_features: {
    white_label: boolean;
    custom_branding: boolean;
    api_access: boolean;
    webhook_support: boolean;
    custom_integrations: boolean;
    advanced_analytics: boolean;
    priority_support: boolean;
    sla_guarantee: boolean;
  };
  
  // Status & Availability
  status: 'active' | 'inactive' | 'deprecated' | 'beta';
  is_featured: boolean;
  is_popular: boolean;
  availability: 'public' | 'private' | 'invitation_only';
  
  // Metadata
  tags: string[];
  category: string;
  target_audience: 'small_business' | 'medium_business' | 'enterprise' | 'developer';
  
  // Usage Statistics
  active_subscriptions: number;
  total_subscribers: number;
  monthly_revenue: number;
  
  // Version Control
  changelog?: string[];
  migration_notes?: string;
  compatibility_version: string;
  
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureToggle {
  id: string;
  feature_key: string;
  
  // Feature Information
  name: string;
  description: string;
  category: 'core' | 'premium' | 'enterprise' | 'experimental' | 'deprecated';
  
  // Configuration
  default_enabled: boolean;
  is_beta: boolean;
  requires_license: boolean;
  required_plan_level: 'starter' | 'professional' | 'enterprise' | 'custom';
  
  // Rollout Strategy
  rollout_strategy: 'all' | 'percentage' | 'whitelist' | 'gradual';
  rollout_percentage?: number;
  whitelisted_tenants?: string[];
  
  // Dependencies
  depends_on_features?: string[];
  conflicts_with_features?: string[];
  
  // Usage Tracking
  usage_stats: {
    enabled_tenants: number;
    total_usage_count: number;
    error_rate: number;
    avg_response_time_ms: number;
  };
  
  // Metadata
  documentation_url?: string;
  support_contact?: string;
  deprecation_date?: string;
  removal_date?: string;
  
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface LicenseAssignment {
  id: string;
  assignment_uuid: string;
  
  // Assignment Details
  tenant_id: string;
  license_package_id: string;
  
  // License Information
  license_key: string;
  activation_key?: string;
  
  // Subscription Details
  subscription_status: 'active' | 'inactive' | 'suspended' | 'expired' | 'cancelled';
  billing_cycle: 'monthly' | 'yearly' | 'one_time';
  
  // Dates
  starts_at: string;
  expires_at?: string;
  trial_ends_at?: string;
  last_billing_at?: string;
  next_billing_at?: string;
  
  // Usage Tracking
  usage_limits: {
    users: number;
    storage_gb: number;
    bandwidth_gb: number;
    api_calls_per_month: number;
  };
  
  current_usage: {
    users: number;
    storage_gb: number;
    bandwidth_gb: number;
    api_calls_this_month: number;
  };
  
  // Feature Access
  enabled_features: string[];
  feature_overrides?: Record<string, any>;
  
  // Billing & Payment
  price_paid: number;
  currency: string;
  payment_method?: string;
  auto_renewal: boolean;
  billing_email: string;
  
  // Metadata
  notes?: string;
  assigned_by: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  tenant?: {
    id: string;
    name: string;
    display_name: string;
    primary_contact_email: string;
  };
  license_package?: LicensePackage;
}

export interface FeatureUsageLog {
  id: string;
  tenant_id: string;
  feature_key: string;
  
  // Usage Details
  usage_type: 'enabled' | 'disabled' | 'accessed' | 'configured';
  usage_count: number;
  
  // Performance Metrics
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  
  // Context
  user_id?: string;
  session_id?: string;
  request_ip?: string;
  user_agent?: string;
  
  timestamp: string;
  date: string; // YYYY-MM-DD for aggregation
}

export interface CreateLicensePackageRequest {
  name: string;
  display_name: string;
  description: string;
  package_type: LicensePackage['package_type'];
  billing_model: LicensePackage['billing_model'];
  price: number;
  currency: string;
  included_features: string[];
  feature_limits: LicensePackage['feature_limits'];
  advanced_features?: Partial<LicensePackage['advanced_features']>;
  status?: LicensePackage['status'];
  category: string;
  target_audience: LicensePackage['target_audience'];
  tags?: string[];
}

export interface UpdateLicensePackageRequest {
  name?: string;
  display_name?: string;
  description?: string;
  price?: number;
  included_features?: string[];
  feature_limits?: Partial<LicensePackage['feature_limits']>;
  advanced_features?: Partial<LicensePackage['advanced_features']>;
  status?: LicensePackage['status'];
  tags?: string[];
}

export interface CreateFeatureToggleRequest {
  feature_key: string;
  name: string;
  description: string;
  category: FeatureToggle['category'];
  default_enabled?: boolean;
  is_beta?: boolean;
  requires_license?: boolean;
  required_plan_level?: FeatureToggle['required_plan_level'];
  rollout_strategy?: FeatureToggle['rollout_strategy'];
  rollout_percentage?: number;
  depends_on_features?: string[];
}

export interface UpdateFeatureToggleRequest {
  name?: string;
  description?: string;
  default_enabled?: boolean;
  is_beta?: boolean;
  rollout_strategy?: FeatureToggle['rollout_strategy'];
  rollout_percentage?: number;
  whitelisted_tenants?: string[];
  depends_on_features?: string[];
  conflicts_with_features?: string[];
}

export interface AssignLicenseRequest {
  tenant_id: string;
  license_package_id: string;
  billing_cycle: LicenseAssignment['billing_cycle'];
  starts_at: string;
  expires_at?: string;
  trial_ends_at?: string;
  auto_renewal?: boolean;
  billing_email: string;
  enabled_features?: string[];
  feature_overrides?: Record<string, any>;
  notes?: string;
}

export interface LicenseListParams {
  page?: number;
  per_page?: number;
  search?: string;
  package_type?: LicensePackage['package_type'];
  status?: LicensePackage['status'];
  category?: string;
  target_audience?: LicensePackage['target_audience'];
  sort_by?: 'created_at' | 'name' | 'price' | 'active_subscriptions';
  sort_order?: 'asc' | 'desc';
}

export interface FeatureToggleListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: FeatureToggle['category'];
  enabled_only?: boolean;
  requires_license?: boolean;
  rollout_strategy?: FeatureToggle['rollout_strategy'];
  sort_by?: 'created_at' | 'name' | 'category' | 'usage_stats.enabled_tenants';
  sort_order?: 'asc' | 'desc';
}

export interface LicenseAssignmentListParams {
  page?: number;
  per_page?: number;
  search?: string;
  tenant_id?: string;
  license_package_id?: string;
  subscription_status?: LicenseAssignment['subscription_status'];
  expires_before?: string;
  usage_above?: number; // percentage
  sort_by?: 'created_at' | 'expires_at' | 'price_paid' | 'tenant.name';
  sort_order?: 'asc' | 'desc';
}

export interface LicenseStats {
  // Package Statistics
  total_packages: number;
  active_packages: number;
  deprecated_packages: number;
  
  // Assignment Statistics
  total_assignments: number;
  active_assignments: number;
  expired_assignments: number;
  trial_assignments: number;
  
  // Revenue Metrics
  total_revenue: number;
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  average_revenue_per_user: number;
  
  // Feature Usage
  most_used_features: Array<{
    feature_key: string;
    feature_name: string;
    usage_count: number;
    enabled_tenants: number;
  }>;
  
  // Package Popularity
  popular_packages: Array<{
    package_id: string;
    package_name: string;
    active_subscriptions: number;
    monthly_revenue: number;
  }>;
  
  // Usage Trends
  usage_trends: Array<{
    date: string;
    total_usage: number;
    unique_tenants: number;
    new_assignments: number;
  }>;
}

class LicenseService {
  private baseUrl = '/licenses';

  // License Package Management
  async getLicensePackages(params: LicenseListParams = {}): Promise<{
    data: LicensePackage[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await platformApiClient.get(`${this.baseUrl}/packages`, { params });
    return response;
  }

  async getLicensePackage(id: string): Promise<LicensePackage> {
    const response = await platformApiClient.get(`${this.baseUrl}/packages/${id}`);
    return response.data;
  }

  async createLicensePackage(data: CreateLicensePackageRequest): Promise<LicensePackage> {
    const response = await platformApiClient.post(`${this.baseUrl}/packages`, data);
    return response.data;
  }

  async updateLicensePackage(id: string, data: UpdateLicensePackageRequest): Promise<LicensePackage> {
    const response = await platformApiClient.put(`${this.baseUrl}/packages/${id}`, data);
    return response.data;
  }

  async deleteLicensePackage(id: string): Promise<void> {
    await platformApiClient.delete(`${this.baseUrl}/packages/${id}`);
  }

  // Feature Toggle Management
  async getFeatureToggles(params: FeatureToggleListParams = {}): Promise<{
    data: FeatureToggle[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await platformApiClient.get(`${this.baseUrl}/features`, { params });
    return response;
  }

  async getFeatureToggle(id: string): Promise<FeatureToggle> {
    const response = await platformApiClient.get(`${this.baseUrl}/features/${id}`);
    return response.data;
  }

  async createFeatureToggle(data: CreateFeatureToggleRequest): Promise<FeatureToggle> {
    const response = await platformApiClient.post(`${this.baseUrl}/features`, data);
    return response.data;
  }

  async updateFeatureToggle(id: string, data: UpdateFeatureToggleRequest): Promise<FeatureToggle> {
    const response = await platformApiClient.put(`${this.baseUrl}/features/${id}`, data);
    return response.data;
  }

  async deleteFeatureToggle(id: string): Promise<void> {
    await platformApiClient.delete(`${this.baseUrl}/features/${id}`);
  }

  async toggleFeature(id: string, enabled: boolean): Promise<FeatureToggle> {
    const response = await platformApiClient.post(`${this.baseUrl}/features/${id}/toggle`, { enabled });
    return response.data;
  }

  // License Assignment Management
  async getLicenseAssignments(params: LicenseAssignmentListParams = {}): Promise<{
    data: LicenseAssignment[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await platformApiClient.get(`${this.baseUrl}/assignments`, { params });
    return response;
  }

  async getLicenseAssignment(id: string): Promise<LicenseAssignment> {
    const response = await platformApiClient.get(`${this.baseUrl}/assignments/${id}`);
    return response.data;
  }

  async assignLicense(data: AssignLicenseRequest): Promise<LicenseAssignment> {
    const response = await platformApiClient.post(`${this.baseUrl}/assignments`, data);
    return response.data;
  }

  async updateLicenseAssignment(id: string, data: Partial<AssignLicenseRequest>): Promise<LicenseAssignment> {
    const response = await platformApiClient.put(`${this.baseUrl}/assignments/${id}`, data);
    return response.data;
  }

  async revokeLicense(id: string, reason?: string): Promise<void> {
    await platformApiClient.post(`${this.baseUrl}/assignments/${id}/revoke`, { reason });
  }

  async renewLicense(id: string, data: {
    billing_cycle?: LicenseAssignment['billing_cycle'];
    auto_renewal?: boolean;
    expires_at?: string;
  }): Promise<LicenseAssignment> {
    const response = await platformApiClient.post(`${this.baseUrl}/assignments/${id}/renew`, data);
    return response.data;
  }

  // Tenant-specific Feature Management
  async getTenantFeatures(tenantId: string): Promise<{
    enabled_features: string[];
    available_features: string[];
    feature_limits: Record<string, any>;
    usage_stats: Record<string, {
      usage_count: number;
      last_used_at: string;
    }>;
  }> {
    const response = await platformApiClient.get(`${this.baseUrl}/tenant/${tenantId}/features`);
    return response.data;
  }

  async updateTenantFeatures(tenantId: string, data: {
    enabled_features?: string[];
    feature_overrides?: Record<string, any>;
  }): Promise<{
    enabled_features: string[];
    feature_overrides: Record<string, any>;
  }> {
    const response = await platformApiClient.put(`${this.baseUrl}/tenant/${tenantId}/features`, data);
    return response.data;
  }

  async enableFeatureForTenant(tenantId: string, featureKey: string): Promise<void> {
    await platformApiClient.post(`${this.baseUrl}/tenant/${tenantId}/features/${featureKey}/enable`);
  }

  async disableFeatureForTenant(tenantId: string, featureKey: string): Promise<void> {
    await platformApiClient.post(`${this.baseUrl}/tenant/${tenantId}/features/${featureKey}/disable`);
  }

  // Usage Tracking & Analytics
  async getFeatureUsage(params?: {
    feature_key?: string;
    tenant_id?: string;
    date_from?: string;
    date_to?: string;
    granularity?: 'daily' | 'weekly' | 'monthly';
  }): Promise<FeatureUsageLog[]> {
    const response = await platformApiClient.get(`${this.baseUrl}/usage`, { params });
    return response.data;
  }

  async getLicenseStats(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<LicenseStats> {
    const response = await platformApiClient.get(`${this.baseUrl}/stats`, { params });
    return response.data;
  }

  // Bulk Operations
  async bulkUpdateLicenseAssignments(assignmentIds: string[], data: {
    subscription_status?: LicenseAssignment['subscription_status'];
    auto_renewal?: boolean;
    enabled_features?: string[];
  }): Promise<{
    success: LicenseAssignment[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const response = await platformApiClient.post(`${this.baseUrl}/assignments/bulk-update`, {
      assignment_ids: assignmentIds,
      ...data
    });
    return response.data;
  }

  async bulkToggleFeatures(featureIds: string[], enabled: boolean): Promise<{
    success: FeatureToggle[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const response = await platformApiClient.post(`${this.baseUrl}/features/bulk-toggle`, {
      feature_ids: featureIds,
      enabled
    });
    return response.data;
  }

  // Reports & Exports
  async exportLicenseData(params: {
    format: 'csv' | 'excel' | 'pdf';
    include_assignments?: boolean;
    include_usage?: boolean;
    date_from?: string;
    date_to?: string;
  }): Promise<Blob> {
    const response = await platformApiClient.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  async generateUsageReport(params: {
    tenant_id?: string;
    feature_key?: string;
    date_from: string;
    date_to: string;
    format: 'pdf' | 'excel';
  }): Promise<Blob> {
    const response = await platformApiClient.get(`${this.baseUrl}/reports/usage`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}

export const licenseService = new LicenseService();