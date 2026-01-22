/**
 * TENANT URL CONFIGURATION API SERVICE
 * 
 * Compliance:
 * - NO MOCK DATA: 100% real backend integration
 * - UUID-ONLY EXPOSURE: All identifiers use UUID strings
 * - TENANT CONTEXT: Proper tenant scoping enforced
 * - ERROR HANDLING: User-friendly error messages
 */

import { tenantApiClient } from './tenantApiClient';
import { authService } from './auth';
import { ApiError, AuthError, PermissionError, NotFoundError } from '@/lib/errors';
import type {
  TenantUrlConfiguration,
  CustomDomain,
  DomainVerificationLog,
  UrlAnalyticsOverview,
  AccessTrendsData,
  GeographicDistributionEntry,
  PerformanceDistribution,
  TopReferrer,
  DeviceBreakdown,
  UpdateUrlConfigurationRequest,
  AddCustomDomainRequest,
  VerifyDomainResponse,
  DnsInstructions,
  SslCertificateInfo,
  ApiResponse,
  PaginatedResponse,
} from '@/types/tenant-url';

/**
 * Get authenticated tenant context
 * 
 * Mengambil tenant context dari auth service dan melakukan validasi:
 * - User harus authenticated
 * - Account type harus 'tenant'
 * - Tenant UUID harus tersedia
 * 
 * @returns {Object} Tenant context object
 * @returns {string} return.tenantId - Tenant ID (numeric string)
 * @returns {string} return.tenantUuid - Tenant UUID
 * 
 * @throws {AuthError} Jika user belum authenticated
 * @throws {PermissionError} Jika account type bukan tenant
 * @throws {Error} Jika tenant data tidak ditemukan
 */
function getTenantContext(): { tenantId: string; tenantUuid: string } {
  if (!authService.isAuthenticated()) {
    throw new AuthError('Authentication required');
  }

  const accountType = authService.getAccountType();
  if (accountType !== 'tenant') {
    throw new PermissionError('Tenant context required');
  }

  const tenantData = authService.getCurrentTenantFromStorage();
  if (!tenantData || !tenantData.uuid) {
    throw new Error('Tenant context missing');
  }

  return {
    tenantId: String(tenantData.id),
    tenantUuid: tenantData.uuid,
  };
}

/**
 * Handle API errors with user-friendly messages
 * 
 * Mengkonversi API errors menjadi custom error types dengan messages yang user-friendly.
 * Menangani status codes berikut:
 * - 401: AuthError (session expired)
 * - 403: PermissionError (insufficient permissions)
 * - 404: NotFoundError (resource not found)
 * - Other: ApiError (generic error dengan backend message)
 * 
 * @param {unknown} error - Error object dari API call
 * @param {string} operation - Deskripsi operasi yang gagal (untuk error message)
 * 
 * @throws {AuthError|PermissionError|NotFoundError|ApiError} Selalu throws error
 */
function handleError(error: unknown, operation: string): never {
  if (error instanceof AuthError || error instanceof PermissionError) {
    throw error;
  }

  const axiosError = error as any;
  
  if (axiosError?.response?.status === 401) {
    throw new AuthError('Session expired, please login again', error);
  }
  
  if (axiosError?.response?.status === 403) {
    throw new PermissionError('You do not have permission to perform this action', error);
  }
  
  if (axiosError?.response?.status === 404) {
    throw new NotFoundError('Resource not found', error);
  }
  
  const errorMessage = axiosError?.response?.data?.message || `Failed to ${operation}`;
  throw new ApiError(errorMessage, error);
}

// ============================================================================
// URL CONFIGURATION ENDPOINTS
// ============================================================================

/**
 * Get current tenant URL configuration
 * 
 * Mengambil URL configuration settings untuk tenant saat ini.
 * 
 * @returns {Promise<TenantUrlConfiguration>} URL configuration object
 * @throws {AuthError|PermissionError|ApiError} Jika request gagal
 */
export async function getUrlConfiguration(): Promise<TenantUrlConfiguration> {
  try {
    getTenantContext();
    
    const response: ApiResponse<TenantUrlConfiguration> = 
      await tenantApiClient.get('/url-configuration');
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch URL configuration');
  }
}

/**
 * Update tenant URL configuration
 * 
 * Mengupdate URL configuration settings untuk tenant (primary pattern, subdomain, path, advanced settings).
 * 
 * @param {UpdateUrlConfigurationRequest} data - URL configuration data to update
 * @returns {Promise<TenantUrlConfiguration>} Updated configuration object
 * @throws {AuthError|PermissionError|ApiError} Jika request gagal atau validation error
 */
export async function updateUrlConfiguration(
  data: UpdateUrlConfigurationRequest
): Promise<TenantUrlConfiguration> {
  try {
    getTenantContext();
    
    const response: ApiResponse<TenantUrlConfiguration> = 
      await tenantApiClient.patch('/url-configuration', data);
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'update URL configuration');
  }
}

/**
 * Test URL pattern accessibility
 */
export async function testUrlPattern(pattern: string): Promise<{ accessible: boolean; message: string }> {
  try {
    getTenantContext();
    
    const response: ApiResponse<{ accessible: boolean; message: string }> = 
      await tenantApiClient.post('/url-configuration/test', { pattern });
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'test URL pattern');
  }
}

// ============================================================================
// CUSTOM DOMAIN ENDPOINTS
// ============================================================================

/**
 * Get all custom domains for current tenant
 */
export async function getCustomDomains(): Promise<CustomDomain[]> {
  try {
    getTenantContext();
    
    const response: ApiResponse<CustomDomain[]> = 
      await tenantApiClient.get('/custom-domains');
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch custom domains');
  }
}

/**
 * Get a single custom domain by UUID
 */
export async function getCustomDomain(uuid: string): Promise<CustomDomain> {
  try {
    getTenantContext();
    
    const response: ApiResponse<CustomDomain> = 
      await tenantApiClient.get(`/custom-domains/${uuid}`);
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch custom domain');
  }
}

/**
 * Add a new custom domain
 * 
 * Menambahkan custom domain baru untuk tenant. Domain akan memiliki status 'pending' 
 * dan memerlukan verification sebelum bisa digunakan.
 * 
 * @param {AddCustomDomainRequest} data - Domain data (domain_name, verification_method)
 * @returns {Promise<CustomDomain>} Created domain object dengan verification token
 * @throws {AuthError|PermissionError|ApiError} Jika request gagal atau domain sudah ada
 */
export async function addCustomDomain(data: AddCustomDomainRequest): Promise<CustomDomain> {
  try {
    getTenantContext();
    
    const response: ApiResponse<CustomDomain> = 
      await tenantApiClient.post('/custom-domains', data);
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'add custom domain');
  }
}

/**
 * Verify domain ownership
 * 
 * Memverifikasi domain ownership dengan melakukan DNS lookup atau file check 
 * sesuai verification method yang dipilih. Jika berhasil, status berubah menjadi 'verified'
 * dan SSL certificate provisioning akan dimulai secara otomatis.
 * 
 * @param {string} uuid - Domain UUID
 * @returns {Promise<VerifyDomainResponse>} Verification result dengan status dan message
 * @throws {AuthError|PermissionError|NotFoundError|ApiError} Jika verification gagal
 */
export async function verifyDomain(uuid: string): Promise<VerifyDomainResponse> {
  try {
    getTenantContext();
    
    const response: ApiResponse<VerifyDomainResponse> = 
      await tenantApiClient.post(`/custom-domains/${uuid}/verify`);
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'verify domain');
  }
}

/**
 * Get DNS configuration instructions for domain
 */
export async function getDnsInstructions(uuid: string): Promise<DnsInstructions[]> {
  try {
    getTenantContext();
    
    const response: ApiResponse<DnsInstructions[]> = 
      await tenantApiClient.get(`/custom-domains/${uuid}/dns-instructions`);
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch DNS instructions');
  }
}

/**
 * Set a domain as primary
 */
export async function setPrimaryDomain(uuid: string): Promise<CustomDomain> {
  try {
    getTenantContext();
    
    const response: ApiResponse<CustomDomain> = 
      await tenantApiClient.patch(`/custom-domains/${uuid}/set-primary`);
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'set primary domain');
  }
}

/**
 * Delete a custom domain
 */
export async function deleteCustomDomain(uuid: string): Promise<void> {
  try {
    getTenantContext();
    
    await tenantApiClient.delete(`/custom-domains/${uuid}`);
  } catch (error) {
    throw handleError(error, 'delete custom domain');
  }
}

/**
 * Get SSL certificate info for domain
 */
export async function getSslCertificateInfo(uuid: string): Promise<SslCertificateInfo> {
  try {
    getTenantContext();
    
    const response: ApiResponse<SslCertificateInfo> = 
      await tenantApiClient.get(`/custom-domains/${uuid}/ssl-certificate`);
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch SSL certificate info');
  }
}

/**
 * Renew SSL certificate for domain
 */
export async function renewSslCertificate(uuid: string): Promise<SslCertificateInfo> {
  try {
    getTenantContext();
    
    const response: ApiResponse<SslCertificateInfo> = 
      await tenantApiClient.post(`/custom-domains/${uuid}/renew-ssl`);
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'renew SSL certificate');
  }
}

// ============================================================================
// DOMAIN VERIFICATION LOG ENDPOINTS
// ============================================================================

/**
 * Get verification logs for a domain
 */
export async function getDomainVerificationLogs(domainUuid: string): Promise<DomainVerificationLog[]> {
  try {
    getTenantContext();
    
    const response: ApiResponse<DomainVerificationLog[]> = 
      await tenantApiClient.get(`/custom-domains/${domainUuid}/verification-logs`);
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch verification logs');
  }
}

// ============================================================================
// URL ANALYTICS ENDPOINTS
// ============================================================================

/**
 * Get URL analytics overview
 * 
 * Mengambil overview metrics untuk URL analytics (total accesses, unique visitors, avg response time, custom domain usage).
 * 
 * @param {string} [period='7d'] - Time period ('1d', '7d', '30d', '90d', '1y')
 * @returns {Promise<UrlAnalyticsOverview>} Analytics overview object dengan metrics dan growth percentages
 * @throws {AuthError|PermissionError|ApiError} Jika request gagal
 */
export async function getUrlAnalyticsOverview(period: string = '7d'): Promise<UrlAnalyticsOverview> {
  try {
    getTenantContext();
    
    const response: ApiResponse<UrlAnalyticsOverview> = 
      await tenantApiClient.get('/url-analytics/overview', {
        params: { period },
      });
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch URL analytics overview');
  }
}

/**
 * Get access trends data
 */
export async function getAccessTrends(period: string = '7d'): Promise<AccessTrendsData> {
  try {
    getTenantContext();
    
    const response: ApiResponse<AccessTrendsData> = 
      await tenantApiClient.get('/url-analytics/trends', {
        params: { period },
      });
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch access trends');
  }
}

/**
 * Get geographic distribution
 */
export async function getGeographicDistribution(period: string = '7d'): Promise<GeographicDistributionEntry[]> {
  try {
    getTenantContext();
    
    const response: ApiResponse<GeographicDistributionEntry[]> = 
      await tenantApiClient.get('/url-analytics/geographic', {
        params: { period },
      });
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch geographic distribution');
  }
}

/**
 * Get performance distribution
 */
export async function getPerformanceDistribution(period: string = '7d'): Promise<PerformanceDistribution> {
  try {
    getTenantContext();
    
    const response: ApiResponse<PerformanceDistribution> = 
      await tenantApiClient.get('/url-analytics/performance', {
        params: { period },
      });
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch performance distribution');
  }
}

/**
 * Get top referrers
 */
export async function getTopReferrers(period: string = '7d', limit: number = 10): Promise<TopReferrer[]> {
  try {
    getTenantContext();
    
    const response: ApiResponse<TopReferrer[]> = 
      await tenantApiClient.get('/url-analytics/referrers', {
        params: { period, limit },
      });
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch top referrers');
  }
}

/**
 * Get device breakdown
 */
export async function getDeviceBreakdown(period: string = '7d'): Promise<DeviceBreakdown> {
  try {
    getTenantContext();
    
    const response: ApiResponse<DeviceBreakdown> = 
      await tenantApiClient.get('/url-analytics/devices', {
        params: { period },
      });
    
    return response.data;
  } catch (error) {
    throw handleError(error, 'fetch device breakdown');
  }
}

// ============================================================================
// TENANT URL SERVICE OBJECT (for backward compatibility)
// ============================================================================

export const tenantUrlService = {
  // URL Configuration
  getUrlConfiguration,
  updateUrlConfiguration,
  testUrlPattern,
  
  // Custom Domains
  getCustomDomains,
  getCustomDomain,
  addCustomDomain,
  verifyDomain,
  getDnsInstructions,
  setPrimaryDomain,
  deleteCustomDomain,
  getSslCertificateInfo,
  renewSslCertificate,
  
  // Verification Logs
  getDomainVerificationLogs,
  
  // Analytics
  getUrlAnalyticsOverview,
  getAccessTrends,
  getGeographicDistribution,
  getPerformanceDistribution,
  getTopReferrers,
  getDeviceBreakdown,
};
