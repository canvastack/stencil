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

// Cache for config values
let configCache: {
  default_exchange_rate?: number;
  default_currency?: string;
  secondary_currency?: string;
} | null = null;

export const exchangeRateService = {
  // Get configuration from backend
  async getConfig(): Promise<{
    default_exchange_rate: number;
    default_currency: string;
    secondary_currency: string;
  }> {
    if (configCache) {
      return configCache;
    }
    
    try {
      const response = await tenantApiClient.get<{
        data: {
          default_exchange_rate: number;
          default_currency: string;
          secondary_currency: string;
        }
      }>('/config/exchange-rate');
      
      configCache = response.data;
      return response.data;
    } catch (error) {
      console.error('Failed to fetch exchange rate config from backend:', error);
      // Fallback to hardcoded defaults
      return {
        default_exchange_rate: 15750,
        default_currency: 'IDR',
        secondary_currency: 'USD',
      };
    }
  },

  // Settings endpoints
  async getSettings(): Promise<ExchangeRateSetting> {
    const response = await tenantApiClient.get<{ data: ExchangeRateSetting }>('/settings/exchange-rate-settings');
    return response.data || response;
  },

  async updateSettings(data: ExchangeRateSettingsFormData): Promise<ExchangeRateSetting> {
    const response = await tenantApiClient.put<{ data: ExchangeRateSetting }>('/settings/exchange-rate-settings', data);
    return response.data || response;
  },

  // Get current exchange rate
  async getCurrentRate(): Promise<number> {
    try {
      const settings = await this.getSettings();
      
      // If manual mode, use manual_rate
      if (settings.mode === 'manual' && settings.manual_rate) {
        return settings.manual_rate;
      }
      
      // Otherwise, get latest rate from history
      const history = await this.getHistory({ per_page: 1 });
      if (history.data && history.data.length > 0) {
        return history.data[0].rate;
      }
      
      // Fallback to backend config default rate
      const config = await this.getConfig();
      return config.default_exchange_rate;
    } catch (error) {
      console.error('Failed to get current exchange rate:', error);
      // Final fallback to backend config
      const config = await this.getConfig();
      return config.default_exchange_rate;
    }
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
