import { PageContent } from "@/types/page-content";
import { ProductSettings } from "@/types/product-settings";

export const productPageContentService = {
  getContent: async (): Promise<PageContent> => {
    // TODO: Replace with actual API call
    const response = await fetch('/api/products/page-content');
    return response.json();
  },

  updateContent: async (content: PageContent): Promise<void> => {
    // TODO: Replace with actual API call
    await fetch('/api/products/page-content', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    });
  },

  getSettings: async (): Promise<ProductSettings> => {
    // TODO: Replace with actual API call
    const response = await fetch('/api/products/settings');
    return response.json();
  },

  updateSettings: async (settings: ProductSettings): Promise<void> => {
    // TODO: Replace with actual API call
    await fetch('/api/products/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
  },
};