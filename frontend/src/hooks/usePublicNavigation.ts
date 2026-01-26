import { useQuery } from '@tanstack/react-query';
import { publicNavigationService } from '../services/tenant/navigationService';
import { usePublicTenant } from '../contexts/PublicTenantContext';

export const usePublicHeaderConfig = () => {
  let tenantSlug: string | null = null;
  
  try {
    const tenantContext = usePublicTenant();
    tenantSlug = tenantContext.tenantSlug;
  } catch (error) {
    tenantSlug = null;
  }

  return useQuery({
    queryKey: ['public', 'navigation', 'header', tenantSlug || 'platform'],
    queryFn: async () => {
      if (!tenantSlug) {
        console.log('[usePublicHeaderConfig] No tenant slug - returning default config');
        return null;
      }
      try {
        const result = await publicNavigationService.getHeader(tenantSlug);
        return result || null;
      } catch (error: any) {
        console.log('[usePublicNavigation] Header error:', error);
        if (error?.response?.status === 404 || error?.status === 404) {
          return null;
        }
        console.warn('[usePublicNavigation] Returning null due to error:', error?.message);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const usePublicFooterConfig = () => {
  let tenantSlug: string | null = null;
  
  try {
    const tenantContext = usePublicTenant();
    tenantSlug = tenantContext.tenantSlug;
  } catch (error) {
    tenantSlug = null;
  }

  return useQuery({
    queryKey: ['public', 'navigation', 'footer', tenantSlug || 'platform'],
    queryFn: async () => {
      if (!tenantSlug) {
        console.log('[usePublicFooterConfig] No tenant slug - returning default config');
        return null;
      }
      try {
        const result = await publicNavigationService.getFooter(tenantSlug);
        return result || null;
      } catch (error: any) {
        console.log('[usePublicNavigation] Footer error:', error);
        if (error?.response?.status === 404 || error?.status === 404) {
          return null;
        }
        console.warn('[usePublicNavigation] Returning null due to error:', error?.message);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const usePublicMenus = (location?: 'header' | 'footer' | 'mobile' | 'all') => {
  let tenantSlug: string | null = null;
  
  try {
    const tenantContext = usePublicTenant();
    tenantSlug = tenantContext.tenantSlug;
  } catch (error) {
    tenantSlug = null;
  }

  return useQuery({
    queryKey: ['public', 'navigation', 'menus', tenantSlug || 'platform', location],
    queryFn: async () => {
      if (!tenantSlug) {
        console.log('[usePublicMenus] No tenant slug - returning default menus');
        return [
          { uuid: '1', label: 'Beranda', path: '/', sort_order: 1, is_active: true, location: 'header', target: '_self', is_external: false, children: [] },
          { uuid: '2', label: 'Produk', path: '/products', sort_order: 2, is_active: true, location: 'header', target: '_self', is_external: false, children: [] },
          { uuid: '3', label: 'Tentang', path: '/about', sort_order: 3, is_active: true, location: 'header', target: '_self', is_external: false, children: [] },
          { uuid: '4', label: 'Kontak', path: '/contact', sort_order: 4, is_active: true, location: 'header', target: '_self', is_external: false, children: [] },
        ];
      }
      try {
        const result = await publicNavigationService.getMenus(tenantSlug, location);
        return result || [];
      } catch (error: any) {
        console.log('[usePublicNavigation] Menus error:', error);
        if (error?.response?.status === 404 || error?.status === 404) {
          return [];
        }
        console.warn('[usePublicNavigation] Returning [] due to error:', error?.message);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
