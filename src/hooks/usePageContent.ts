import { useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useContent } from '@/contexts/ContentContext';

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

export const usePageContent = () => {
  const location = useLocation();
  const [pageContent, setPageContent] = useState<PageContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getPageContent } = useContent();

  useEffect(() => {
    const loadPageContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const path = location.pathname.replace('/', '') || 'home';
        const content = await getPageContent(path);
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
  }, [location.pathname, getPageContent]);

  return { pageContent, loading, error };
};