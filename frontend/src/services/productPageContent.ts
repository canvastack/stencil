import { PageContent } from "@/types/page-content";
import { ProductSettings } from "@/types/product-settings";
import { tenantApiClient } from "@/services/tenant/tenantApiClient";
import { anonymousApiClient } from "@/services/anonymous/anonymousApiClient";

export const productPageContentService = {
  getContent: async (): Promise<PageContent> => {
    try {
      const response = await tenantApiClient.get('/content/pages/products');
      // Handle wrapped responses: { data: {...} } or direct object
      const pageData = response?.data || response;
      
      if (!pageData) {
        throw new Error('Products page content not found');
      }
      
      return {
        id: pageData.id || 'products-page-1',
        pageSlug: 'products',
        content: pageData.content || pageData,
        status: pageData.status || 'published',
        publishedAt: pageData.published_at,
        version: pageData.version || 1,
        createdAt: pageData.created_at || new Date().toISOString(),
        updatedAt: pageData.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using fallback for development:', error);
        // Fallback content for development
        return {
          id: 'products-page-fallback',
          pageSlug: 'products',
          content: {
            hero: {
              title: { prefix: "Semua", highlight: "Produk", suffix: "" },
              subtitle: "Temukan produk etching berkualitas tinggi dengan presisi sempurna"
            }
          },
          status: 'published',
          publishedAt: new Date().toISOString(),
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        console.error('Failed to load products page content:', error);
        throw new Error(`Failed to load products page content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  updateContent: async (content: PageContent): Promise<void> => {
    try {
      await tenantApiClient.put('/content/pages/products', {
        content: content.content,
        status: content.status,
        version: content.version,
      });
    } catch (error) {
      console.error('Failed to update products page content:', error);
      throw new Error(`Failed to update products page content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  getSettings: async (): Promise<ProductSettings> => {
    try {
      const response = await tenantApiClient.get('/settings/products');
      return response?.data || response || {
        enableReviews: true,
        enableComparisons: true,
        enableWishlist: true,
        productsPerPage: 12,
        defaultSortOrder: 'newest',
        enableFiltering: true,
        enableSearch: true,
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using fallback settings for development:', error);
        return {
          enableReviews: true,
          enableComparisons: true,
          enableWishlist: true,
          productsPerPage: 12,
          defaultSortOrder: 'newest',
          enableFiltering: true,
          enableSearch: true,
        };
      } else {
        console.error('Failed to load product settings:', error);
        throw new Error(`Failed to load product settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  updateSettings: async (settings: ProductSettings): Promise<void> => {
    try {
      await tenantApiClient.put('/settings/products', settings);
    } catch (error) {
      console.error('Failed to update product settings:', error);
      throw new Error(`Failed to update product settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};