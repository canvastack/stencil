import { Page, PageContent, PageFilters } from '@/types/page';
import homeContentData from './data/page-content-home.json';
import aboutContentData from './data/page-content-about.json';
import contactContentData from './data/page-content-contact.json';
import faqContentData from './data/page-content-faq.json';

interface PageContentData {
  id: string;
  pageSlug: string;
  content: PageContent;
  status?: string;
  publishedAt?: string;
  version?: number;
  previousVersion?: string | null;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

const initialPages: PageContentData[] = [
  homeContentData as PageContentData,
  aboutContentData as PageContentData,
  contactContentData as PageContentData,
  faqContentData as PageContentData,
];

let mockPages: Page[] = initialPages.map(page => ({
  id: page.id,
  slug: page.pageSlug,
  title: page.pageSlug.charAt(0).toUpperCase() + page.pageSlug.slice(1),
  pageSlug: page.pageSlug,
  content: page.content,
  seo: page.content.seo,
  status: (page.status as 'draft' | 'published' | 'archived') || 'published',
  publishedAt: page.publishedAt,
  createdAt: page.createdAt,
  updatedAt: page.updatedAt,
}));

export function getPages(filters?: PageFilters): Page[] {
  let filtered = [...mockPages];

  if (!filters) return filtered;

  if (filters.status) {
    filtered = filtered.filter(p => p.status === filters.status);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(searchLower) ||
      p.slug.toLowerCase().includes(searchLower)
    );
  }

  if (filters.offset !== undefined) {
    filtered = filtered.slice(filters.offset);
  }

  if (filters.limit !== undefined) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function getPageById(id: string): Page | undefined {
  return mockPages.find(p => p.id === id);
}

export function getPageBySlug(slug: string): Page | undefined {
  return mockPages.find(p => p.pageSlug === slug || p.slug === slug);
}

export function getPageContent(slug: string): PageContent | undefined {
  const page = getPageBySlug(slug);
  return page?.content;
}

export function createPage(data: Partial<Page>): Page {
  const newPage: Page = {
    id: `page-${Date.now()}`,
    slug: data.slug || '',
    title: data.title || '',
    pageSlug: data.pageSlug || data.slug || '',
    content: data.content || {},
    seo: data.seo,
    status: data.status || 'draft',
    publishedAt: data.publishedAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockPages.push(newPage);
  return newPage;
}

export function updatePage(id: string, data: Partial<Page>): Page {
  const index = mockPages.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error(`Page with id ${id} not found`);
  }
  
  const updatedPage: Page = {
    ...mockPages[index],
    ...data,
    id: mockPages[index].id,
    updatedAt: new Date().toISOString(),
  };
  
  mockPages[index] = updatedPage;
  return updatedPage;
}

export function updatePageContent(slug: string, content: PageContent): Page {
  const page = getPageBySlug(slug);
  if (!page) {
    throw new Error(`Page with slug ${slug} not found`);
  }
  
  return updatePage(page.id, { content });
}

export function deletePage(id: string): boolean {
  const index = mockPages.findIndex(p => p.id === id);
  if (index === -1) {
    return false;
  }
  
  mockPages.splice(index, 1);
  return true;
}

export function resetPages(): void {
  mockPages = initialPages.map(page => ({
    id: page.id,
    slug: page.pageSlug,
    title: page.pageSlug.charAt(0).toUpperCase() + page.pageSlug.slice(1),
    pageSlug: page.pageSlug,
    content: page.content,
    seo: page.content.seo,
    status: (page.status as 'draft' | 'published' | 'archived') || 'published',
    publishedAt: page.publishedAt,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  }));
}
