import { useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useContent } from '@/contexts/ContentContext';
import { usePublicTenant } from '@/contexts/PublicTenantContext';

// Use the ContentContext's own PageContent interface by creating the proper return type
interface PageContentData {
  id: string;
  pageSlug: string;
  content: Record<string, any>;
  status: string;
  publishedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export const usePageContent = (pageSlug?: string) => {
  const location = useLocation();
  const [pageContent, setPageContent] = useState<PageContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getPageContent } = useContent();
  
  // Get tenant context safely
  let tenantSlug: string | null = null;
  try {
    const publicTenantContext = usePublicTenant();
    tenantSlug = publicTenantContext.tenantSlug;
  } catch (error) {
    console.log('usePageContent: No tenant context available');
  }

  useEffect(() => {
    const loadPageContent = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use provided pageSlug or extract from location
        let path: string;
        if (pageSlug) {
          // If pageSlug is provided, use it directly
          path = pageSlug;
        } else {
          // Extract from location pathname
          path = location.pathname.replace(/^\/+|\/+$/g, '') || 'home';
          
          // Special handling: if path is just tenant slug (e.g., "etchinx"), 
          // treat it as tenant home page
          if (tenantSlug && path === tenantSlug) {
            path = `${tenantSlug}/home`;
          }
        }
        
        console.log('usePageContent (hooks): Extracted path from location:', { 
          originalPathname: location.pathname, 
          extractedPath: path,
          tenantSlug,
          providedPageSlug: pageSlug
        });
        const content = await getPageContent(path, tenantSlug || undefined);
        setPageContent(content);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load page content');
        setError(error);
        console.error('Failed to load page content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPageContent();
  }, [location.pathname, getPageContent, tenantSlug, pageSlug]);

  return { pageContent, loading, error };
};