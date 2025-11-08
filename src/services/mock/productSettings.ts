import { ProductSettings } from '@/types/product-settings';
import settingsData from './data/product-settings.json';

class ProductSettingsService {
  private settings: ProductSettings = { ...settingsData };

  async getSettings(): Promise<ProductSettings> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.settings;
  }

  async updateSettings(newSettings: ProductSettings): Promise<ProductSettings> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    this.settings = { ...newSettings };
    return this.settings;
  }

  resetSettings(): void {
    this.settings = { ...settingsData };
  }
}

export const productSettingsService = new ProductSettingsService();