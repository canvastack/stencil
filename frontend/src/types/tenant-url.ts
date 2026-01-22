/**
 * TENANT URL CONFIGURATION TYPES
 * 
 * Compliance:
 * - UUID-ONLY EXPOSURE: All IDs use UUID strings
 * - NO MOCK DATA: Types designed for real API responses
 * - EXACT BACKEND ALIGNMENT: Matches Laravel API Resource structure
 */

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * Tenant URL Configuration
 * Represents how a tenant can be accessed via different URL patterns
 */
export interface TenantUrlConfiguration {
  uuid: string;
  tenant_uuid: string;
  primary_url_pattern: UrlPatternType;
  is_subdomain_enabled: boolean;
  subdomain_pattern: string | null;
  is_path_based_enabled: boolean;
  path_prefix: string | null;
  is_custom_domain_enabled: boolean;
  primary_domain: string | null;
  force_https: boolean;
  enable_www_redirect: boolean;
  enable_analytics_tracking: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Custom Domain
 * Represents a custom domain configured for a tenant
 */
export interface CustomDomain {
  uuid: string;
  tenant_uuid: string;
  domain_name: string;
  is_primary: boolean;
  verification_status: DomainVerificationStatus;
  verification_method: DomainVerificationMethod;
  verification_token: string;
  ssl_status: SslStatus;
  ssl_provider: string | null;
  ssl_expires_at: string | null;
  dns_configured: boolean;
  dns_provider: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Domain Verification Log
 * Audit trail for domain verification attempts
 */
export interface DomainVerificationLog {
  uuid: string;
  custom_domain_uuid: string;
  verification_method: DomainVerificationMethod;
  verification_status: 'success' | 'failed' | 'pending';
  verification_details: Record<string, unknown>;
  verified_at: string | null;
  created_at: string;
}

/**
 * URL Access Analytics Record
 * Individual analytics record for URL access tracking
 */
export interface UrlAccessAnalytic {
  uuid: string;
  tenant_uuid: string;
  url_pattern_used: UrlPatternType;
  accessed_url: string;
  http_status: number;
  response_time_ms: number;
  user_ip: string;
  user_agent: string;
  device_type: DeviceType;
  country_code: string | null;
  referrer: string | null;
  accessed_at: string;
}

// ============================================================================
// ENUMS & LITERAL TYPES
// ============================================================================

export type UrlPatternType = 'subdomain' | 'path' | 'custom_domain';

export type DomainVerificationStatus = 'pending' | 'verified' | 'failed';

export type DomainVerificationMethod = 'txt' | 'cname' | 'file';

export type SslStatus = 'pending' | 'active' | 'expired' | 'failed';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'bot';

// ============================================================================
// ANALYTICS AGGREGATES
// ============================================================================

/**
 * URL Analytics Overview
 * Aggregated metrics for dashboard overview cards
 */
export interface UrlAnalyticsOverview {
  total_accesses: number;
  unique_visitors: number;
  avg_response_time_ms: number;
  by_url_pattern: {
    subdomain: number;
    path: number;
    custom_domain: number;
  };
  growth_percentage: number;
  period: string;
}

/**
 * Access Trends Data Point
 * Time series data for trend charts
 */
export interface AccessTrendsDataPoint {
  date: string;
  total_accesses: number;
  unique_visitors: number;
  avg_response_time_ms: number;
}

/**
 * Access Trends Response
 * Complete trend data for a period
 */
export interface AccessTrendsData {
  labels: string[];
  total_accesses: number[];
  unique_visitors: number[];
  avg_response_time: number[];
}

/**
 * Geographic Distribution Entry
 * Access counts by country
 */
export interface GeographicDistributionEntry {
  country_code: string;
  country_name: string;
  access_count: number;
  percentage: number;
}

/**
 * Performance Distribution
 * Response time distribution buckets
 */
export interface PerformanceDistribution {
  under_100ms: number;
  under_500ms: number;
  under_1s: number;
  under_2s: number;
  over_2s: number;
}

/**
 * Top Referrer Entry
 */
export interface TopReferrer {
  referrer: string;
  count: number;
  percentage: number;
}

/**
 * Device Breakdown
 */
export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
  bot: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Update URL Configuration Request
 */
export interface UpdateUrlConfigurationRequest {
  primary_url_pattern?: UrlPatternType;
  is_subdomain_enabled?: boolean;
  subdomain_pattern?: string | null;
  is_path_based_enabled?: boolean;
  path_prefix?: string | null;
  is_custom_domain_enabled?: boolean;
  primary_domain?: string | null;
  force_https?: boolean;
  enable_www_redirect?: boolean;
  enable_analytics_tracking?: boolean;
}

/**
 * Add Custom Domain Request
 */
export interface AddCustomDomainRequest {
  domain_name: string;
  verification_method: DomainVerificationMethod;
}

/**
 * Verify Domain Response
 */
export interface VerifyDomainResponse {
  success: boolean;
  message: string;
  domain: CustomDomain;
}

/**
 * DNS Configuration Instructions
 */
export interface DnsInstructions {
  record_type: 'A' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl: number;
  priority?: number;
}

/**
 * SSL Certificate Info
 */
export interface SslCertificateInfo {
  status: SslStatus;
  provider: string;
  issued_at: string;
  expires_at: string;
  days_remaining: number;
  auto_renewal_enabled: boolean;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

/**
 * Error Response
 */
export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
