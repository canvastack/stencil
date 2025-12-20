import { tenantApiClient } from '../tenant/tenantApiClient';

export const productSettingsService = {
  async getSettings(): Promise<any> {
    const response = await tenantApiClient.get<any>('/products/settings');
    return response;
  },

  async updateSettings(settings: any): Promise<any> {
    const response = await tenantApiClient.put<any>('/products/settings', settings);
    return response;
  },

  async resetSettings(): Promise<any> {
    const response = await tenantApiClient.post<any>('/products/settings/reset', {});
    return response;
  }
};