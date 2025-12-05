import React, { createContext, useContext, useState, useCallback } from 'react';
import { useGlobalContext } from '@/contexts/GlobalContext';
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
  const globalContext = useGlobalContext();

  const getPageContent = useCallback(async (slug: string): Promise<PageContent | null> => {
    const cacheKey = `${globalContext.userType}-${slug}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      // Use context-aware API client
      if (globalContext.userType === 'anonymous') {
        const anonymousResponse = await anonymousApiClient.getPlatformContent('pages', slug);
        // Anonymous client returns {data: actualContent, success: boolean, message?: string}
        if (!anonymousResponse.success || !anonymousResponse.data) {
          throw new Error(`Failed to load page content for ${slug}`);
        }
        response = { data: anonymousResponse.data };
      } else if (globalContext.userType === 'platform') {
        response = await platformApiClient.get(`/platform/content/pages/${slug}`);
      } else if (globalContext.userType === 'tenant') {
        try {
          response = await tenantApiClient.get(`/tenant/content/pages/${slug}`);
        } catch (tenantError: any) {
          // If tenant auth fails, fall back to anonymous content
          if (tenantError.response?.status === 401 || tenantError.response?.status === 403) {
            console.log('ContentContext: Tenant auth failed, falling back to anonymous content');
            const anonymousResponse = await anonymousApiClient.getPlatformContent('pages', slug);
            if (!anonymousResponse.success || !anonymousResponse.data) {
              throw new Error(`Failed to load page content for ${slug}`);
            }
            response = { data: anonymousResponse.data };
          } else {
            throw tenantError;
          }
        }
      } else {
        throw new Error('Unknown user context');
      }
      
      if (!response.data) {
        throw new Error(`Failed to load page content for ${slug}`);
      }
      
      const pageData = response.data;
      const data: PageContent = {
        id: pageData.id || pageData.uuid,
        pageSlug: slug,
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
      const error = err instanceof Error ? err : new Error('Failed to load page content');
      setError(error);
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
      
      // Use context-aware API client for updates
      if (globalContext.userType === 'platform') {
        response = await platformApiClient.put(`/platform/content/pages/${slug}`, { content });
      } else if (globalContext.userType === 'tenant') {
        response = await tenantApiClient.put(`/tenant/content/pages/${slug}`, { content });
      } else {
        throw new Error('Anonymous users cannot update content');
      }
      
      if (!response.success) {
        throw new Error('Failed to update page content');
      }
      
      // Update cache
      const cacheKey = `${globalContext.userType}-${slug}`;
      if (cache.has(cacheKey)) {
        const cachedPage = cache.get(cacheKey)!;
        cache.set(cacheKey, {
          ...cachedPage,
          content: content,
          updatedAt: new Date().toISOString()
        });
      }
      
      return true;
    } catch (err) {
      console.error(`ContentProvider: Failed to update page content for ${slug}:`, err);
      const error = err instanceof Error ? err : new Error('Failed to update page content');
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [cache, globalContext.userType]);

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
