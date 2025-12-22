import { PageContent } from "@/types/page-content";
import { tenantApiClient } from '../tenant/tenantApiClient';

export const productPageContentService = {
  async getPageContent(): Promise<PageContent> {
    const response = await tenantApiClient.get<PageContent>('/pages/products');
    return response;
  },

  async updatePageContent(content: Partial<PageContent>): Promise<PageContent> {
    const response = await tenantApiClient.put<PageContent>('/pages/products', content);
    return response;
  },

  async resetPageContent(): Promise<PageContent> {
    const response = await tenantApiClient.post<PageContent>('/pages/products/reset', {});
    return response;
  }
};