/**
 * Exchange Rate Notification Event Types
 * 
 * These types define the structure of notification events
 * that can be received from the backend API
 */

export type NotificationEventType = 
  | 'quota_warning'
  | 'quota_critical'
  | 'provider_switched'
  | 'fallback_activated'
  | 'stale_rate_warning';

export interface BaseNotificationEvent {
  type: NotificationEventType;
  timestamp: string;
  tenant_id: string;
}

export interface QuotaWarningEvent extends BaseNotificationEvent {
  type: 'quota_warning';
  provider_name: string;
  remaining_quota: number;
}

export interface QuotaCriticalEvent extends BaseNotificationEvent {
  type: 'quota_critical';
  provider_name: string;
  remaining_quota: number;
  next_provider_name: string;
  next_provider_quota: number;
}

export interface ProviderSwitchedEvent extends BaseNotificationEvent {
  type: 'provider_switched';
  old_provider_name: string;
  new_provider_name: string;
  new_provider_quota: number;
  reason: string;
}

export interface FallbackActivatedEvent extends BaseNotificationEvent {
  type: 'fallback_activated';
  cached_rate: number;
  last_updated: string;
}

export interface StaleRateWarningEvent extends BaseNotificationEvent {
  type: 'stale_rate_warning';
  rate: number;
  days_old: number;
}

export type NotificationEvent = 
  | QuotaWarningEvent
  | QuotaCriticalEvent
  | ProviderSwitchedEvent
  | FallbackActivatedEvent
  | StaleRateWarningEvent;
