import { useQuery } from '@tanstack/react-query';
import { publicNavigationService } from '../services/tenant/navigationService';
import { usePublicTenant } from '../contexts/PublicTenantContext';

export const usePublicHeaderConfig = () => {
  const { tenantSlug } = usePublicTenant();

  return useQuery({
    queryKey: ['public', 'navigation', 'header', tenantSlug],
    queryFn: async () => {
      if (!tenantSlug) return null;
      try {
        const result = await publicNavigationService.getHeader(tenantSlug);
        return result || null;
      } catch (error: any) {
        console.log('[usePublicNavigation] Header error:', error);
        // Return null for 404 (no config exists yet)
        if (error?.response?.status === 404 || error?.status === 404) {
          return null;
        }
        // Return null for any other error to prevent undefined
        console.warn('[usePublicNavigation] Returning null due to error:', error?.message);
        return null;
      }
    },
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const usePublicFooterConfig = () => {
  const { tenantSlug } = usePublicTenant();

  return useQuery({
    queryKey: ['public', 'navigation', 'footer', tenantSlug],
    queryFn: async () => {
      if (!tenantSlug) return null;
      try {
        const result = await publicNavigationService.getFooter(tenantSlug);
        return result || null;
      } catch (error: any) {
        console.log('[usePublicNavigation] Footer error:', error);
        // Return null for 404 (no config exists yet)
        if (error?.response?.status === 404 || error?.status === 404) {
          return null;
        }
        // Return null for any other error to prevent undefined
        console.warn('[usePublicNavigation] Returning null due to error:', error?.message);
        return null;
      }
    },
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const usePublicMenus = (location?: 'header' | 'footer' | 'mobile' | 'all') => {
  const { tenantSlug } = usePublicTenant();

  return useQuery({
    queryKey: ['public', 'navigation', 'menus', tenantSlug, location],
    queryFn: async () => {
      if (!tenantSlug) return [];
      try {
        const result = await publicNavigationService.getMenus(tenantSlug, location);
        return result || [];
      } catch (error: any) {
        console.log('[usePublicNavigation] Menus error:', error);
        // Return empty array for 404 (no menus exist yet)
        if (error?.response?.status === 404 || error?.status === 404) {
          return [];
        }
        // Return empty array for any other error to prevent undefined
        console.warn('[usePublicNavigation] Returning [] due to error:', error?.message);
        return [];
      }
    },
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
