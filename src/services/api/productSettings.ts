import { productSettingsService as mockService } from "@/services/mock/productSettings";

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const productSettingsService = {
  async getSettings(): Promise<any> {
    if (USE_MOCK) {
      return mockService.getSettings();
    }
    
    try {
      // Context-aware API endpoint determination would go here
      // For now, fallback to mock
      return mockService.getSettings();
    } catch (error) {
      console.error('Product settings API call failed, falling back to mock data:', error);
      return mockService.getSettings();
    }
  },

  async updateSettings(settings: any): Promise<any> {
    if (USE_MOCK) {
      return mockService.updateSettings(settings);
    }
    
    try {
      // Context-aware API endpoint determination would go here
      // For now, fallback to mock
      return mockService.updateSettings(settings);
    } catch (error) {
      console.error('Product settings API call failed, falling back to mock data:', error);
      return mockService.updateSettings(settings);
    }
  },

  async resetSettings(): Promise<any> {
    if (USE_MOCK) {
      return mockService.resetSettings();
    }
    
    try {
      // Context-aware API endpoint determination would go here
      // For now, fallback to mock
      return mockService.resetSettings();
    } catch (error) {
      console.error('Product settings API call failed, falling back to mock data:', error);
      return mockService.resetSettings();
    }
  }
};