import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { usePublicTenant } from '@/contexts/PublicTenantContext';
import { anonymousApiClient } from '@/services/api/anonymousApiClient';
import { tenantApiClient } from '@/services/api/tenantApiClient';
import { platformApiClient } from '@/services/api/platformApiClient';

interface PageContent {
  id: string;
  pageSlug: string;
  content: Record<string, any>;
  status: string;
  publishedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface ContentContextType {
  getPageContent: (slug: string, tenantSlug?: string) => Promise<PageContent | null>;
  updatePageContent: (slug: string, content: Record<string, any>) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
  cache: Map<string, PageContent>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cache] = useState<Map<string, PageContent>>(new Map());
  const globalContext = useGlobalContext();

  const getPageContent = useCallback(async (slug: string, providedTenantSlug?: string): Promise<PageContent | null> => {
    // Create initial cache key, we'll update it after processing
    let cacheKey = `${globalContext.userType}-${slug}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    try {
      setLoading(true);
      setError(null);
      
      let response;
      let pageData;
      
      console.log('ContentContext: Processing slug:', { slug, providedTenantSlug });
      
      // CLEAR LOGIC: Determine if this is a tenant-specific route
      let finalSlug = slug;
      
      // If we have a providedTenantSlug but the slug doesn't include it, combine them
      if (providedTenantSlug && !slug.includes('/')) {
        finalSlug = `${providedTenantSlug}/${slug}`;
        console.log('ContentContext: Combined tenant slug with page slug:', finalSlug);
      }
      
      const slugParts = finalSlug.split('/').filter(part => part.length > 0); // Remove empty parts
      const isTenantRoute = slugParts.length > 1; // e.g., "etchinx/products"
      
      console.log('ContentContext: Analyzed slug:', { originalSlug: slug, finalSlug, slugParts, isTenantRoute });
      
      // Update cache key to use the final processed slug
      cacheKey = `${globalContext.userType}-${finalSlug}`;
      
      // Check cache again with the corrected key
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }
      
      // Determine route context - admin routes should use authenticated APIs, public routes should use anonymous API
      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath.includes('/admin/');
      
      // Use authenticated API for admin routes only, anonymous API for public routes
      if (isAdminRoute && globalContext.userType === 'platform') {
        // Platform admin - use platform API
        try {
          const response = await platformApiClient.get(`/platform/content/pages/${slugParts[0]}`);
          if (response.data) {
            pageData = response.data;
          } else {
            throw new Error('Platform content not found');
          }
        } catch (error) {
          if (import.meta.env.MODE === 'development') {
            console.warn(`ContentContext: Failed to load platform content for ${slugParts[0]}, using fallback for development`);
            pageData = getPlatformFallbackContent(slugParts[0]);
          } else {
            console.error(`ContentContext: Failed to load platform content for ${slugParts[0]}:`, error);
            throw new Error(`Failed to load platform content: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else if (isAdminRoute && globalContext.userType === 'tenant') {
        // Tenant admin accessing admin routes - use tenant API
        try {
          if (isTenantRoute && slugParts.length >= 2) {
            // For tenant routes like etchinx/home -> tenant admin accesses their own content as just "home"
            const [tenantSlug, pageSlug] = slugParts;
            const response = await tenantApiClient.get(`/tenant/content/pages/${pageSlug}`);
            console.log('ContentContext: Tenant API response:', response);
            if (response && (response.id || (response.success && response.data))) {
              // Response could be direct content object or wrapped in success/data structure
              pageData = response.data || response;
            } else {
              throw new Error('Tenant content not found');
            }
          } else {
            // For single page routes like home -> /tenant/content/pages/home
            const response = await tenantApiClient.get(`/tenant/content/pages/${slugParts[0]}`);
            console.log('ContentContext: Tenant API single response:', response);
            if (response && (response.id || (response.success && response.data))) {
              // Response could be direct content object or wrapped in success/data structure
              pageData = response.data || response;
            } else {
              throw new Error('Tenant content not found');
            }
          }
        } catch (error) {
          const pageName = isTenantRoute && slugParts.length >= 2 ? `${slugParts[0]}/${slugParts[1]}` : slugParts[0];
          if (import.meta.env.MODE === 'development') {
            console.warn(`ContentContext: Failed to load tenant content for ${pageName}, using fallback for development`);
            pageData = getTenantFallbackContent(isTenantRoute ? slugParts[0] : 'unknown', isTenantRoute ? slugParts[1] : slugParts[0]);
          } else {
            console.error(`ContentContext: Failed to load tenant content for ${pageName}:`, error);
            throw new Error(`Failed to load tenant content: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else {
        // Anonymous users - use public API
        if (isTenantRoute) {
          // Tenant-specific content: etchinx/products
          const [tenantSlug, pageSlug] = slugParts;
          
          try {
            const anonymousResponse = await anonymousApiClient.getTenantContent(tenantSlug, pageSlug);
            if (anonymousResponse.success && anonymousResponse.data) {
              pageData = anonymousResponse.data;
            } else {
              throw new Error('Tenant content not found');
            }
          } catch (error) {
            if (import.meta.env.MODE === 'development') {
              console.warn(`ContentContext: Failed to load tenant content for ${tenantSlug}/${pageSlug}, using fallback for development`);
              pageData = getTenantFallbackContent(tenantSlug, pageSlug);
            } else {
              console.error(`ContentContext: Failed to load tenant content for ${tenantSlug}/${pageSlug}:`, error);
              throw new Error(`Failed to load tenant content: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } else {
          // General platform content: about, faq, contact
          try {
            const anonymousResponse = await anonymousApiClient.getPlatformContent('pages', slugParts[0]);
            if (anonymousResponse.success && anonymousResponse.data) {
              pageData = anonymousResponse.data;
            } else {
              throw new Error('Platform content not found');
            }
          } catch (error) {
            if (import.meta.env.MODE === 'development') {
              console.warn(`ContentContext: Failed to load platform content for ${slugParts[0]}, using fallback for development`);
              pageData = getPlatformFallbackContent(slugParts[0]);
            } else {
              console.error(`ContentContext: Failed to load platform content for ${slugParts[0]}:`, error);
              throw new Error(`Failed to load platform content: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }
      
      const data: PageContent = {
        id: pageData.id || `page-${finalSlug.replace('/', '-')}-1`,
        pageSlug: isTenantRoute ? slugParts[1] : slugParts[0],
        content: pageData.content || pageData,
        status: pageData.status || 'published',
        publishedAt: pageData.published_at,
        version: pageData.version || 1,
        createdAt: pageData.created_at || new Date().toISOString(),
        updatedAt: pageData.updated_at || new Date().toISOString(),
      };
      
      cache.set(cacheKey, data);
      return data;
      
    } catch (err) {
      console.error(`ContentProvider: Failed to load page content for ${slug}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to load page content'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [cache, globalContext.userType]);

  const handleUpdatePageContent = useCallback(async (slug: string, content: Record<string, any>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (globalContext.userType === 'platform') {
        response = await platformApiClient.put(`/platform/content/pages/${slug}`, { content });
      } else if (globalContext.userType === 'tenant') {
        response = await tenantApiClient.put(`/content/pages/${slug}`, { content });
      } else {
        throw new Error('Content updates not supported for anonymous users');
      }
      
      if (response.data) {
        // Update cache
        const cacheKey = `${globalContext.userType}-${slug}`;
        const existingData = cache.get(cacheKey);
        if (existingData) {
          const updatedData = {
            ...existingData,
            content,
            updatedAt: new Date().toISOString(),
          };
          cache.set(cacheKey, updatedData);
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error(`ContentProvider: Failed to update page content for ${slug}:`, err);
      const error = err instanceof Error ? err : new Error('Failed to update page content');
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cache, globalContext.userType]);

  const contextValue: ContentContextType = {
    getPageContent,
    updatePageContent: handleUpdatePageContent,
    loading,
    error,
    cache,
  };

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

// Add the usePageContent hook
export const usePageContent = (slugOverride?: string) => {
  const location = useLocation();
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getPageContent, updatePageContent } = useContent();
  
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
        
        let path: string;
        if (slugOverride) {
          path = slugOverride;
          console.log('usePageContent: Using slug override:', path);
        } else {
          // Extract path from location, preserving internal slashes but removing leading/trailing ones
          path = location.pathname.replace(/^\/+|\/+$/g, '') || 'home';
          console.log('usePageContent: Extracted path from location:', { 
            originalPathname: location.pathname, 
            extractedPath: path 
          });
        }
        
        console.log('usePageContent: Calling getPageContent with:', { path, tenantSlug });
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
  }, [location.pathname, getPageContent, tenantSlug, slugOverride]);

  return { 
    pageContent, 
    content: pageContent?.content, 
    loading, 
    error,
    updatePageContent
  };
};

// Helper functions for fallback content
function getTenantFallbackContent(tenantSlug: string, pageSlug: string): any {
  const fallbackData: Record<string, any> = {
    products: {
      hero: {
        title: { prefix: 'Semua', highlight: 'Produk' },
        subtitle: 'Temukan produk etching berkualitas tinggi dengan presisi sempurna.',
        typingTexts: ['Etching Berkualitas', 'Produk Terbaik', 'Layanan Professional']
      }
    },
    about: {
      hero: {
        title: { prefix: 'Tentang', highlight: tenantSlug.toUpperCase() },
        subtitle: `Pelajari lebih lanjut tentang ${tenantSlug} dan layanan kami.`,
        content: 'Informasi tentang perusahaan dan layanan yang kami tawarkan.'
      }
    },
    faq: {
      hero: {
        title: { prefix: 'Pertanyaan', highlight: 'Umum' },
        subtitle: 'Temukan jawaban untuk pertanyaan yang sering diajukan',
      },
      faqs: [
        { question: 'Apa itu etching?', answer: 'Etching adalah proses mengukir permukaan material...' },
        { question: 'Berapa lama waktu pengerjaan?', answer: 'Waktu pengerjaan bervariasi tergantung kompleksitas...' }
      ]
    },
    contact: {
      hero: {
        title: { prefix: 'Hubungi', highlight: 'Kami' },
        subtitle: 'Dapatkan konsultasi gratis untuk kebutuhan etching Anda',
      },
      contactInfo: {
        email: 'info@' + tenantSlug.toLowerCase() + '.com',
        phone: '+62 812-3456-7890',
        address: 'Jalan Industri No. 123, Jakarta'
      }
    }
  };
  
  return {
    id: `page-${tenantSlug}-${pageSlug}-1`,
    content: fallbackData[pageSlug] || { 
      title: 'Page Not Found', 
      subtitle: 'Content coming soon...',
      message: `Page "${pageSlug}" untuk tenant "${tenantSlug}" sedang dalam pengembangan.`
    }
  };
}

function getPlatformFallbackContent(slug: string): any {
  const fallbackData: Record<string, any> = {
    about: {
      title: 'About CanvaStencil',
      subtitle: 'Professional Multi-Tenant CMS Platform',
      content: 'CanvaStencil provides enterprise-grade CMS solutions for modern businesses.',
      hero: {
        title: { prefix: 'Tentang', highlight: 'CanvaStencil' },
        subtitle: 'Platform CMS Multi-Tenant Profesional untuk Bisnis Modern',
        description: 'Solusi enterprise terdepan untuk manajemen konten yang scalable.'
      }
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to common questions',
      hero: {
        title: { prefix: 'Pertanyaan', highlight: 'Umum' },
        subtitle: 'Temukan jawaban untuk pertanyaan yang sering diajukan',
      },
      faqs: [
        { question: 'What is CanvaStencil?', answer: 'A multi-tenant CMS platform for modern businesses.' },
        { question: 'How to get started?', answer: 'Contact our team for consultation and setup.' }
      ]
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'Get in Touch',
      hero: {
        title: { prefix: 'Hubungi', highlight: 'Kami' },
        subtitle: 'Dapatkan konsultasi gratis tentang solusi CMS yang tepat',
      },
      contactInfo: {
        email: 'info@canvastencil.com',
        phone: '+62 21-1234-5678', 
        address: 'Jakarta, Indonesia'
      }
    }
  };
  
  return {
    id: `page-${slug}-1`,
    content: fallbackData[slug] || { 
      title: 'Page Not Found', 
      subtitle: 'Content coming soon...',
      message: `Platform page "${slug}" sedang dalam pengembangan.`
    }
  };
}