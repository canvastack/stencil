import { create } from "zustand";
import { PageContent } from "@/types/page-content";
import { ProductSettings } from "@/types/product-settings";
import { productPageContentService } from "@/services/productPageContent";

interface ProductPageState {
  content: PageContent | null;
  settings: ProductSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchContent: () => Promise<void>;
  updateContent: (content: PageContent) => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: ProductSettings) => Promise<void>;
}

export const useProductPageStore = create<ProductPageState>((set) => ({
  content: null,
  settings: null,
  isLoading: false,
  error: null,

  fetchContent: async () => {
    set({ isLoading: true, error: null });
    try {
      const content = await productPageContentService.getContent();
      set({ content, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch content', isLoading: false });
    }
  },

  updateContent: async (content) => {
    set({ isLoading: true, error: null });
    try {
      await productPageContentService.updateContent(content);
      set({ content, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to update content', isLoading: false });
    }
  },

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await productPageContentService.getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch settings', isLoading: false });
    }
  },

  updateSettings: async (settings) => {
    set({ isLoading: true, error: null });
    try {
      await productPageContentService.updateSettings(settings);
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to update settings', isLoading: false });
    }
  },
}));