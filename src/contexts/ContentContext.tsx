import React, { createContext, useContext, useState, useCallback } from 'react';
import { getPageBySlug } from '@/services/mock/pages';
import { cmsService } from '@/services/cms/cmsService';

interface PageContent {
  id: string;
  pageSlug: string;
  content: Record<string, any>;
  status: string;
  publishedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  uuid?: string;
  title?: string;
  description?: string;
  template?: string;
  meta_data?: Record<string, any>;
}

interface ContentContextType {
  getPageContent: (slug: string) => Promise<PageContent | null>;
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

  const getPageContent = useCallback(async (slug: string): Promise<PageContent | null> => {
    if (cache.has(slug)) {
      return cache.get(slug)!;
    }

    try {
      setLoading(true);
      setError(null);
      
      let data: PageContent | null = null;
      
      // Try Phase 4 CMS API first
      try {
        const apiData = await cmsService.getLegacyPageContent(slug);
        if (apiData) {
          data = apiData;
        }
      } catch (apiError) {
        console.warn(`CMS API failed for ${slug}, falling back to mock data:`, apiError);
        
        // Fallback to mock data
        const page = getPageBySlug(slug);
        if (page) {
          data = {
            id: page.id,
            pageSlug: page.pageSlug,
            content: page.content,
            status: page.status || 'published',
            publishedAt: page.publishedAt,
            version: 1,
            createdAt: page.createdAt || new Date().toISOString(),
            updatedAt: page.updatedAt || new Date().toISOString(),
          };
        }
      }
      
      if (!data) {
        throw new Error(`Failed to load page content for ${slug}`);
      }
      
      cache.set(slug, data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load page content');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const handleUpdatePageContent = useCallback(async (slug: string, content: Record<string, any>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      let success = false;
      
      // Try Phase 4 CMS API first
      try {
        success = await cmsService.updateLegacyPageContent(slug, content);
      } catch (apiError) {
        console.warn(`CMS API update failed for ${slug}, falling back to mock data:`, apiError);
        
        // Fallback to mock data update
        const page = getPageBySlug(slug);
        if (!page) {
          throw new Error(`Page not found: ${slug}`);
        }

        // Update the page content
        page.content = content;
        page.updatedAt = new Date().toISOString();
        
        // Also update localStorage for persistence
        localStorage.setItem(`page-content-${slug}`, JSON.stringify(page));
        success = true;
      }
      
      // Update cache on success
      if (success && cache.has(slug)) {
        const cachedPage = cache.get(slug)!;
        cache.set(slug, {
          ...cachedPage,
          content: content,
          updatedAt: new Date().toISOString()
        });
      }
      
      return success;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update page content');
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cache]);

  return (
    <ContentContext.Provider value={{ getPageContent, updatePageContent: handleUpdatePageContent, loading, error, cache }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

// Hook for specific page
export const usePageContent = (slug: string) => {
  const { getPageContent, updatePageContent, loading, error } = useContent();
  const [content, setContent] = React.useState<PageContent | null>(null);

  React.useEffect(() => {
    getPageContent(slug).then(setContent);
  }, [slug, getPageContent]);

  return { content, loading, error, updatePageContent };
};
