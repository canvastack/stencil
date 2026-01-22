/**
 * TENANT URL CONFIGURATION HOOKS
 * 
 * Custom React hooks using TanStack Query for URL Tenant Configuration
 * 
 * Compliance:
 * - NO MOCK DATA: All data from real backend API
 * - UUID-ONLY EXPOSURE: All identifiers use UUID strings
 * - TENANT CONTEXT: Proper authentication and tenant scoping
 * - OPTIMISTIC UPDATES: For better UX
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { logger } from '@/lib/logger';
import { TenantContextError, AuthError } from '@/lib/errors';
import { toastHelpers } from '@/lib/toast-helpers';
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
} from '@/types/tenant-url';
import {
  getUrlConfiguration,
  updateUrlConfiguration,
  testUrlPattern,
  getCustomDomains,
  getCustomDomain,
  addCustomDomain,
  verifyDomain,
  getDnsInstructions,
  setPrimaryDomain,
  deleteCustomDomain,
  getSslCertificateInfo,
  renewSslCertificate,
  getDomainVerificationLogs,
  getUrlAnalyticsOverview,
  getAccessTrends,
  getGeographicDistribution,
  getPerformanceDistribution,
  getTopReferrers,
  getDeviceBreakdown,
} from '@/services/api/tenant-url';

// ============================================================================
// QUERY KEYS
// ============================================================================

const queryKeys = {
  urlConfiguration: ['tenant-url', 'configuration'] as const,
  customDomains: {
    all: ['tenant-url', 'custom-domains'] as const,
    list: () => [...queryKeys.customDomains.all, 'list'] as const,
    detail: (uuid: string) => [...queryKeys.customDomains.all, 'detail', uuid] as const,
    dnsInstructions: (uuid: string) => [...queryKeys.customDomains.all, 'dns', uuid] as const,
    sslInfo: (uuid: string) => [...queryKeys.customDomains.all, 'ssl', uuid] as const,
    verificationLogs: (uuid: string) => [...queryKeys.customDomains.all, 'logs', uuid] as const,
  },
  analytics: {
    all: ['tenant-url', 'analytics'] as const,
    overview: (period: string) => [...queryKeys.analytics.all, 'overview', period] as const,
    trends: (period: string) => [...queryKeys.analytics.all, 'trends', period] as const,
    geographic: (period: string) => [...queryKeys.analytics.all, 'geographic', period] as const,
    performance: (period: string) => [...queryKeys.analytics.all, 'performance', period] as const,
    referrers: (period: string, limit: number) => [...queryKeys.analytics.all, 'referrers', period, limit] as const,
    devices: (period: string) => [...queryKeys.analytics.all, 'devices', period] as const,
  },
};

// ============================================================================
// URL CONFIGURATION HOOKS
// ============================================================================

/**
 * Get current tenant URL configuration
 * 
 * React Query hook untuk fetching URL configuration dengan automatic caching dan refetching.
 * Data di-cache selama 5 menit (staleTime) dan di-retain selama 10 menit (gcTime).
 * 
 * @example
 * ```tsx
 * function UrlConfigPage() {
 *   const { data: config, isLoading, error } = useUrlConfiguration();
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorMessage />;
 *   
 *   return <div>Pattern: {config.primary_url_pattern}</div>;
 * }
 * ```
 * 
 * @returns {UseQueryResult<TenantUrlConfiguration>} React Query result object
 */
export function useUrlConfiguration() {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.urlConfiguration,
    queryFn: async (): Promise<TenantUrlConfiguration> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching URL configuration', { tenantId: tenant.uuid });
      return await getUrlConfiguration();
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Update tenant URL configuration
 * 
 * React Query mutation hook untuk updating URL configuration dengan optimistic updates.
 * Implementasi rollback otomatis jika update gagal dan cache invalidation setelah success.
 * 
 * @example
 * ```tsx
 * function ConfigForm() {
 *   const updateMutation = useUpdateUrlConfiguration();
 *   
 *   const handleSave = () => {
 *     updateMutation.mutate({ primary_url_pattern: 'custom_domain' });
 *   };
 *   
 *   return <Button onClick={handleSave} disabled={updateMutation.isPending}>Save</Button>;
 * }
 * ```
 * 
 * @returns {UseMutationResult<TenantUrlConfiguration, Error, UpdateUrlConfigurationRequest>} Mutation result object
 */
export function useUpdateUrlConfiguration() {
  const { tenant } = useTenantAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUrlConfigurationRequest): Promise<TenantUrlConfiguration> => {
      logger.debug('Updating URL configuration', { data, tenantId: tenant?.uuid });
      return await updateUrlConfiguration(data);
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.urlConfiguration });

      const previousConfig = queryClient.getQueryData<TenantUrlConfiguration>(queryKeys.urlConfiguration);

      if (previousConfig) {
        queryClient.setQueryData<TenantUrlConfiguration>(queryKeys.urlConfiguration, {
          ...previousConfig,
          ...newData,
        });
      }

      return { previousConfig };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(queryKeys.urlConfiguration, context.previousConfig);
      }

      logger.error('Failed to update URL configuration', { error: error.message });
      toastHelpers.error(error, 'Gagal mengupdate konfigurasi URL');
    },
    onSuccess: () => {
      toastHelpers.configurationSaved();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.urlConfiguration });
    },
  });
}

/**
 * Test URL pattern accessibility
 */
export function useTestUrlPattern() {
  return useMutation({
    mutationFn: async (pattern: string) => {
      return await testUrlPattern(pattern);
    },
    onError: (error: any) => {
      logger.error('Failed to test URL pattern', { error: error.message });
      toastHelpers.error(error, 'Gagal mengetes URL pattern');
    },
  });
}

// ============================================================================
// CUSTOM DOMAIN HOOKS
// ============================================================================

/**
 * Get all custom domains for current tenant
 */
export function useCustomDomains() {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.customDomains.list(),
    queryFn: async (): Promise<CustomDomain[]> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching custom domains', { tenantId: tenant.uuid });
      return await getCustomDomains();
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Get a single custom domain by UUID
 */
export function useCustomDomain(uuid?: string) {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.customDomains.detail(uuid || ''),
    queryFn: async (): Promise<CustomDomain> => {
      if (!uuid) {
        throw new Error('Domain UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching custom domain', { domainUuid: uuid, tenantId: tenant.uuid });
      return await getCustomDomain(uuid);
    },
    enabled: !!uuid && !!tenant?.uuid && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Add a new custom domain
 * 
 * React Query mutation hook untuk menambahkan custom domain baru dengan automatic cache invalidation.
 * Domain akan dibuat dengan status 'pending' dan memerlukan verification.
 * 
 * @example
 * ```tsx
 * function AddDomainButton() {
 *   const addDomainMutation = useAddCustomDomain();
 *   
 *   const handleAdd = () => {
 *     addDomainMutation.mutate({ 
 *       domain_name: 'example.com', 
 *       verification_method: 'txt' 
 *     });
 *   };
 *   
 *   return <Button onClick={handleAdd}>Add Domain</Button>;
 * }
 * ```
 * 
 * @returns {UseMutationResult<CustomDomain, Error, AddCustomDomainRequest>} Mutation result object
 */
export function useAddCustomDomain() {
  const { tenant } = useTenantAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddCustomDomainRequest): Promise<CustomDomain> => {
      logger.debug('Adding custom domain', { data, tenantId: tenant?.uuid });
      return await addCustomDomain(data);
    },
    onError: (error: any) => {
      logger.error('Failed to add custom domain', { error: error.message });
      toastHelpers.error(error, 'Gagal menambahkan custom domain');
    },
    onSuccess: (newDomain) => {
      toastHelpers.domainAdded(newDomain.domain_name);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customDomains.list() });
    },
  });
}

/**
 * Verify domain ownership
 * 
 * React Query mutation hook untuk memverifikasi domain ownership dengan DNS/file check.
 * Menampilkan toast notification success/failure dan invalidates cache setelah verification attempt.
 * 
 * @example
 * ```tsx
 * function VerifyButton({ domainUuid }) {
 *   const verifyMutation = useVerifyDomain();
 *   
 *   const handleVerify = () => {
 *     verifyMutation.mutate(domainUuid);
 *   };
 *   
 *   return (
 *     <Button onClick={handleVerify} disabled={verifyMutation.isPending}>
 *       {verifyMutation.isPending ? 'Verifying...' : 'Verify Domain'}
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @returns {UseMutationResult<VerifyDomainResponse, Error, string>} Mutation result object
 */
export function useVerifyDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string): Promise<VerifyDomainResponse> => {
      logger.debug('Verifying domain', { domainUuid: uuid });
      return await verifyDomain(uuid);
    },
    onError: (error: any, uuid) => {
      logger.error('Failed to verify domain', { error: error.message });
      toastHelpers.error(error, 'Verifikasi domain gagal');
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        toastHelpers.domainVerified(response.domain_name || 'Domain');
      } else {
        toastHelpers.verificationFailed(response.domain_name || 'Domain', response.message);
      }
    },
    onSettled: (_data, _error, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customDomains.detail(uuid) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customDomains.list() });
    },
  });
}

/**
 * Get DNS configuration instructions for domain
 */
export function useDnsInstructions(uuid?: string) {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.customDomains.dnsInstructions(uuid || ''),
    queryFn: async (): Promise<DnsInstructions[]> => {
      if (!uuid) {
        throw new Error('Domain UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching DNS instructions', { domainUuid: uuid, tenantId: tenant.uuid });
      return await getDnsInstructions(uuid);
    },
    enabled: !!uuid && !!tenant?.uuid && !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Set a domain as primary
 */
export function useSetPrimaryDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string): Promise<CustomDomain> => {
      logger.debug('Setting primary domain', { domainUuid: uuid });
      return await setPrimaryDomain(uuid);
    },
    onError: (error: any) => {
      logger.error('Failed to set primary domain', { error: error.message });
      toastHelpers.error(error, 'Gagal mengatur primary domain');
    },
    onSuccess: (domain) => {
      toastHelpers.domainSetPrimary(domain.domain_name);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customDomains.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.urlConfiguration });
    },
  });
}

/**
 * Delete a custom domain
 */
export function useDeleteCustomDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string): Promise<void> => {
      logger.debug('Deleting custom domain', { domainUuid: uuid });
      return await deleteCustomDomain(uuid);
    },
    onError: (error: any) => {
      logger.error('Failed to delete custom domain', { error: error.message });
      toastHelpers.error(error, 'Gagal menghapus custom domain');
    },
    onSuccess: (_data, domainName) => {
      toastHelpers.success('Custom domain berhasil dihapus', 'Domain telah dihapus dari konfigurasi.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customDomains.list() });
    },
  });
}

/**
 * Get SSL certificate info for domain
 */
export function useSslCertificateInfo(uuid?: string) {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.customDomains.sslInfo(uuid || ''),
    queryFn: async (): Promise<SslCertificateInfo> => {
      if (!uuid) {
        throw new Error('Domain UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching SSL certificate info', { domainUuid: uuid, tenantId: tenant.uuid });
      return await getSslCertificateInfo(uuid);
    },
    enabled: !!uuid && !!tenant?.uuid && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Renew SSL certificate for domain
 */
export function useRenewSslCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string): Promise<SslCertificateInfo> => {
      logger.debug('Renewing SSL certificate', { domainUuid: uuid });
      return await renewSslCertificate(uuid);
    },
    onError: (error: any) => {
      logger.error('Failed to renew SSL certificate', { error: error.message });
      toastHelpers.error(error, 'Gagal memperbaharui SSL certificate');
    },
    onSuccess: (_data, domainName) => {
      toastHelpers.success('SSL certificate berhasil diperbaharui', 'Certificate telah diperbaharui dan aktif.');
    },
    onSettled: (_data, _error, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customDomains.sslInfo(uuid) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customDomains.detail(uuid) });
    },
  });
}

/**
 * Get verification logs for a domain
 */
export function useDomainVerificationLogs(domainUuid?: string) {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.customDomains.verificationLogs(domainUuid || ''),
    queryFn: async (): Promise<DomainVerificationLog[]> => {
      if (!domainUuid) {
        throw new Error('Domain UUID is required');
      }
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching domain verification logs', { domainUuid, tenantId: tenant.uuid });
      return await getDomainVerificationLogs(domainUuid);
    },
    enabled: !!domainUuid && !!tenant?.uuid && !!user?.id,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

/**
 * Get URL analytics overview
 */
export function useUrlAnalyticsOverview(period: string = '7d') {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.analytics.overview(period),
    queryFn: async (): Promise<UrlAnalyticsOverview> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching URL analytics overview', { period, tenantId: tenant.uuid });
      return await getUrlAnalyticsOverview(period);
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Get access trends data
 */
export function useAccessTrends(period: string = '7d') {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.analytics.trends(period),
    queryFn: async (): Promise<AccessTrendsData> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching access trends', { period, tenantId: tenant.uuid });
      return await getAccessTrends(period);
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Get geographic distribution
 */
export function useGeographicDistribution(period: string = '7d') {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.analytics.geographic(period),
    queryFn: async (): Promise<GeographicDistributionEntry[]> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching geographic distribution', { period, tenantId: tenant.uuid });
      return await getGeographicDistribution(period);
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get performance distribution
 */
export function usePerformanceDistribution(period: string = '7d') {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.analytics.performance(period),
    queryFn: async (): Promise<PerformanceDistribution> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching performance distribution', { period, tenantId: tenant.uuid });
      return await getPerformanceDistribution(period);
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get top referrers
 */
export function useTopReferrers(period: string = '7d', limit: number = 10) {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.analytics.referrers(period, limit),
    queryFn: async (): Promise<TopReferrer[]> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching top referrers', { period, limit, tenantId: tenant.uuid });
      return await getTopReferrers(period, limit);
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get device breakdown
 */
export function useDeviceBreakdown(period: string = '7d') {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.analytics.devices(period),
    queryFn: async (): Promise<DeviceBreakdown> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('Fetching device breakdown', { period, tenantId: tenant.uuid });
      return await getDeviceBreakdown(period);
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
