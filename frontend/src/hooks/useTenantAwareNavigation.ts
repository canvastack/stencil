import { usePublicTenant } from '@/contexts/PublicTenantContext';

/**
 * Hook untuk navigation yang tenant-aware
 * Otomatis menambah tenant slug ke URL jika user sedang dalam konteks tenant
 */
export const useTenantAwareNavigation = () => {
  let tenantSlug: string | null = null;
  
  try {
    const tenantContext = usePublicTenant();
    tenantSlug = tenantContext.tenantSlug;
  } catch (error) {
    // Hook called outside PublicTenantProvider context
    tenantSlug = null;
  }

  const getUrl = (path: string): string => {
    // Remove leading slash if exists
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // If we have tenant context, prepend tenant slug
    if (tenantSlug) {
      return `/${tenantSlug}/${cleanPath}`;
    }
    
    // Return global path
    return `/${cleanPath}`;
  };

  return { getUrl, tenantSlug };
};