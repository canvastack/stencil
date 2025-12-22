import { useEffect } from 'react';
import { useGlobalContext } from '@/contexts/GlobalContext';

interface TenantTheme {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  name?: string;
}

export const useTenantTheme = (): TenantTheme => {
  const { tenant } = useGlobalContext();

  useEffect(() => {
    if (!tenant) return;

    const root = document.documentElement;

    if (tenant.theme?.primaryColor) {
      root.style.setProperty('--primary', tenant.theme.primaryColor);
    } else {
      root.style.removeProperty('--primary');
    }

    if (tenant.theme?.secondaryColor) {
      root.style.setProperty('--secondary', tenant.theme.secondaryColor);
    } else {
      root.style.removeProperty('--secondary');
    }

    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon && tenant.logo) {
      favicon.href = tenant.logo;
    }

    if (tenant.name) {
      document.title = `${tenant.name} - Product Catalog`;
    }

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
    };
  }, [tenant]);

  return {
    primaryColor: tenant?.theme?.primaryColor,
    secondaryColor: tenant?.theme?.secondaryColor,
    logo: tenant?.logo,
    name: tenant?.name,
  };
};
