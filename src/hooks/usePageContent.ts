import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageContent } from '@/types/page';
import { getPageContent } from '@/services/mock/pages';

export const usePageContent = () => {
  const location = useLocation();
  const [pageContent, setPageContent] = useState<PageContent | undefined>();

  useEffect(() => {
    const path = location.pathname.replace('/', '') || 'home';
    const content = getPageContent(path);
    setPageContent(content);
  }, [location.pathname]);

  return { pageContent };
};