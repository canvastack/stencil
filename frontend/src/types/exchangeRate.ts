// Exchange Rate System Types

export interface ExchangeRateSetting {
  uuid: string;
  tenant_id: string;
  mode: 'manual' | 'auto';
  manual_rate: number | null;
  active_provider_id: string | null;
  auto_update_enabled: boolean;
  update_time: string;
  last_updated_at: string | null;
  active_provider?: ExchangeRateProvider;
}

export interface ExchangeRateProvider {
  uuid: string;
  tenant_id: string;
  name: string;
  api_url: string;
  monthly_quota: number;
  priority: number;
  enabled: boolean;
  warning_threshold: number;
  critical_threshold: number;
  quota_status?: QuotaStatus;
}

export interface QuotaStatus {
  provider_id: string;
  provider_name: string;
  monthly_quota: number;
  requests_used: number;
  remaining_quota: number;
  is_unlimited: boolean;
  is_exhausted: boolean;
  is_at_warning: boolean;
  is_at_critical: boolean;
  next_reset_date: string;
}

export interface ExchangeRateHistory {
  uuid: string;
  tenant_id: string;
  rate: number;
  source_currency: string;
  target_currency: string;
  provider: string;
  source: 'manual' | 'api';
  created_at: string;
}

export interface ProviderSwitchEvent {
  uuid: string;
  tenant_id: string;
  old_provider_id: string | null;
  new_provider_id: string;
  reason: string;
  old_provider_name: string;
  new_provider_name: string;
  created_at: string;
}

export interface ExchangeRateSettingsFormData {
  mode: 'manual' | 'auto';
  manual_rate?: number;
  active_provider_id?: string;
  auto_update_enabled: boolean;
  update_time: string;
}

export interface ProviderFormData {
  name: string;
  api_url: string;
  api_key?: string;
  monthly_quota: number;
  priority: number;
  enabled: boolean;
  warning_threshold: number;
  critical_threshold: number;
}

export interface ProviderTestResult {
  success: boolean;
  message: string;
  rate?: number;
}
