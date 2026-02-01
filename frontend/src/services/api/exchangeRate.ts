import { tenantApiClient } from '../tenant/tenantApiClient';
import {
  ExchangeRateSetting,
  ExchangeRateProvider,
  ExchangeRateHistory,
  QuotaStatus,
  ExchangeRateSettingsFormData,
  ProviderFormData,
  ProviderTestResult,
} from '@/types/exchangeRate';

export const exchangeRateService = {
  // Settings endpoints
  async getSettings(): Promise<ExchangeRateSetting> {
    const response = await tenantApiClient.get<{ data: ExchangeRateSetting }>('/settings/exchange-rate-settings');
    return response.data || response;
  },

  async updateSettings(data: ExchangeRateSettingsFormData): Promise<ExchangeRateSetting> {
    const response = await tenantApiClient.put<{ data: ExchangeRateSetting }>('/settings/exchange-rate-settings', data);
    return response.data || response;
  },

  // Provider endpoints
  async getProviders(): Promise<ExchangeRateProvider[]> {
    const response = await tenantApiClient.get<{ data: ExchangeRateProvider[] }>('/settings/exchange-rate-providers');
    return response.data || response;
  },

  async createProvider(data: ProviderFormData): Promise<ExchangeRateProvider> {
    const response = await tenantApiClient.post<ExchangeRateProvider>('/settings/exchange-rate-providers', data);
    return response;
  },

  async updateProvider(uuid: string, data: Partial<ProviderFormData>): Promise<ExchangeRateProvider> {
    const response = await tenantApiClient.put<ExchangeRateProvider>(`/settings/exchange-rate-providers/${uuid}`, data);
    return response;
  },

  async deleteProvider(uuid: string): Promise<void> {
    await tenantApiClient.delete(`/settings/exchange-rate-providers/${uuid}`);
  },

  async testProviderConnection(uuid: string): Promise<ProviderTestResult> {
    const response = await tenantApiClient.post<ProviderTestResult>(`/settings/exchange-rate-providers/${uuid}/test`, {});
    return response;
  },

  // Quota monitoring endpoints
  async getQuotaStatus(): Promise<QuotaStatus[]> {
    const response = await tenantApiClient.get<{ data: QuotaStatus[] }>('/settings/exchange-rate-providers/quota-status');
    return response.data || response;
  },

  // History endpoints
  async getHistory(params?: {
    start_date?: string;
    end_date?: string;
    provider?: string;
    source?: 'manual' | 'api';
    page?: number;
    per_page?: number;
  }): Promise<{
    data: ExchangeRateHistory[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }> {
    const response = await tenantApiClient.get('/settings/exchange-rate-history', { params });
    return response;
  },
};
