import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from '@/contexts/TenantAuthContext';

interface TenantRedirectWrapperProps {
  children: React.ReactNode;
}

export const TenantRedirectWrapper: React.FC<TenantRedirectWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, isAuthenticated, isLoading } = useTenantAuth();

  useEffect(() => {
    // Wait for auth to complete loading
    if (isLoading) return;
    
    // Only redirect if user is authenticated as tenant
    if (!isAuthenticated || !tenant) return;
    
    const currentPath = location.pathname;
    const tenantSlug = tenant.slug;
    
    // Don't redirect if already on tenant-scoped URL or admin/auth pages
    if (currentPath.startsWith(`/${tenantSlug}/`) || 
        currentPath.startsWith('/admin') || 
        currentPath.startsWith('/platform') ||
        currentPath.startsWith('/login') ||
        currentPath.startsWith('/register')) {
      return;
    }
    
    // Redirect from global pages to tenant-scoped pages
    const redirectPaths = {
      '/': `/${tenantSlug}/`,
      '/about': `/${tenantSlug}/about`,
      '/contact': `/${tenantSlug}/contact`, 
      '/products': `/${tenantSlug}/products`,
      '/cart': `/${tenantSlug}/cart`,
      '/faq': `/${tenantSlug}/faq`
    };
    
    // Handle product detail pages (with slug parameter)
    if (currentPath.startsWith('/products/')) {
      const productSlug = currentPath.replace('/products/', '');
      navigate(`/${tenantSlug}/products/${productSlug}`, { replace: true });
      return;
    }
    
    // Handle mapped redirects
    if (redirectPaths[currentPath]) {
      navigate(redirectPaths[currentPath], { replace: true });
    }
    
  }, [navigate, location.pathname, tenant, isAuthenticated, isLoading]);

  return <>{children}</>;
};