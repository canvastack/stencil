import { Page, PageContent, PageFilters } from '@/types/page';
import apiClient from './client';
import * as mockPages from '@/services/mock/pages';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export async function getPages(filters?: PageFilters): Promise<Page[]> {
  if (USE_MOCK) {
    return Promise.resolve(mockPages.getPages(filters));
  }
  
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get<Page[]>(`/admin/pages?${params.toString()}`);
    return response as unknown as Page[];
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockPages.getPages(filters);
  }
}

export async function getPageById(id: string): Promise<Page | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockPages.getPageById(id));
  }
  
  try {
    const response = await apiClient.get<Page>(`/admin/pages/${id}`);
    return response as unknown as Page;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockPages.getPageById(id);
  }
}

export async function getPageBySlug(slug: string): Promise<Page | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockPages.getPageBySlug(slug));
  }
  
  try {
    const response = await apiClient.get<Page>(`/admin/pages/slug/${slug}`);
    return response as unknown as Page;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockPages.getPageBySlug(slug);
  }
}

export async function getPageContent(slug: string): Promise<PageContent | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockPages.getPageContent(slug));
  }
  
  try {
    const response = await apiClient.get<PageContent>(`/admin/pages/slug/${slug}/content`);
    return response as unknown as PageContent;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockPages.getPageContent(slug);
  }
}

export async function createPage(data: Partial<Page>): Promise<Page> {
  if (USE_MOCK) {
    return Promise.resolve(mockPages.createPage(data));
  }
  
  try {
    const response = await apiClient.post<Page>('/admin/pages', data);
    return response as unknown as Page;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockPages.createPage(data);
  }
}

export async function updatePage(id: string, data: Partial<Page>): Promise<Page> {
  if (USE_MOCK) {
    const updated = mockPages.updatePage(id, data);
    if (!updated) throw new Error('Page not found');
    return Promise.resolve(updated);
  }
  
  try {
    const response = await apiClient.put<Page>(`/admin/pages/${id}`, data);
    return response as unknown as Page;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    const updated = mockPages.updatePage(id, data);
    if (!updated) throw new Error('Page not found');
    return updated;
  }
}

export async function updatePageContent(slug: string, content: PageContent): Promise<Page> {
  if (USE_MOCK) {
    const updated = mockPages.updatePageContent(slug, content);
    if (!updated) throw new Error('Page not found');
    return Promise.resolve(updated);
  }
  
  try {
    const response = await apiClient.put<Page>(`/admin/pages/slug/${slug}/content`, { content });
    return response as unknown as Page;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    const updated = mockPages.updatePageContent(slug, content);
    if (!updated) throw new Error('Page not found');
    return updated;
  }
}

export async function deletePage(id: string): Promise<boolean> {
  if (USE_MOCK) {
    return Promise.resolve(mockPages.deletePage(id));
  }
  
  try {
    await apiClient.delete(`/admin/pages/${id}`);
    return true;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockPages.deletePage(id);
  }
}

export function resetPages(): void {
  if (USE_MOCK) {
    mockPages.resetPages();
  }
}
