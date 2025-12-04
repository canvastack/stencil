import { productPageContentService as mockService } from "@/services/mock/productPageContent";
import { PageContent } from "@/types/page-content";
import { useGlobalContext } from '@/contexts/GlobalContext';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const productPageContentService = {
  async getPageContent(): Promise<PageContent> {
    if (USE_MOCK) {
      return mockService.getPageContent();
    }
    
    try {
      // Context-aware API endpoint determination would go here
      // For now, fallback to mock
      return mockService.getPageContent();
    } catch (error) {
      console.error('Product page content API call failed, falling back to mock data:', error);
      return mockService.getPageContent();
    }
  },

  async updatePageContent(content: Partial<PageContent>): Promise<PageContent> {
    if (USE_MOCK) {
      return mockService.updatePageContent(content);
    }
    
    try {
      // Context-aware API endpoint determination would go here
      // For now, fallback to mock
      return mockService.updatePageContent(content);
    } catch (error) {
      console.error('Product page content API call failed, falling back to mock data:', error);
      return mockService.updatePageContent(content);
    }
  },

  async resetPageContent(): Promise<PageContent> {
    if (USE_MOCK) {
      return mockService.resetPageContent();
    }
    
    try {
      // Context-aware API endpoint determination would go here
      // For now, fallback to mock
      return mockService.resetPageContent();
    } catch (error) {
      console.error('Product page content API call failed, falling back to mock data:', error);
      return mockService.resetPageContent();
    }
  }
};