import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exchangeRateService } from '@/services/api/exchangeRate';
import {
  showQuotaWarning,
  showCriticalQuotaWarning,
  showProviderSwitched,
  showFallbackNotification,
  showStaleRateWarning,
} from '@/services/notifications/exchangeRateNotifications';
import type { QuotaStatus } from '@/types/exchangeRate';

/**
 * Hook to monitor exchange rate quota status and display notifications
 * 
 * This hook polls the quota status endpoint and triggers notifications
 * when thresholds are reached (warning at 50, critical at 20)
 */
export function useExchangeRateNotifications(options?: {
  enabled?: boolean;
  pollingInterval?: number;
}) {
  const { enabled = true, pollingInterval = 60000 } = options || {}; // Default: poll every 60 seconds

  // Query quota status
  const { data: quotaStatuses } = useQuery({
    queryKey: ['exchange-rate-quota-status'],
    queryFn: () => exchangeRateService.getQuotaStatus(),
    enabled,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
  });

  // Check quota levels and trigger notifications
  useEffect(() => {
    if (!quotaStatuses || quotaStatuses.length === 0) {
      return;
    }

    quotaStatuses.forEach((status: QuotaStatus) => {
      // Skip unlimited providers
      if (status.is_unlimited) {
        return;
      }

      // Critical level notification (20 or fewer remaining)
      if (status.is_at_critical && !status.is_exhausted) {
        // Find next available provider
        const nextProvider = quotaStatuses.find(
          (s: QuotaStatus) => 
            s.provider_id !== status.provider_id && 
            !s.is_exhausted && 
            s.remaining_quota > 0
        );

        if (nextProvider) {
          showCriticalQuotaWarning(
            status.provider_name,
            status.remaining_quota,
            nextProvider.provider_name,
            nextProvider.remaining_quota
          );
        }
      }
      // Warning level notification (50 or fewer remaining, but not critical)
      else if (status.is_at_warning && !status.is_at_critical && !status.is_exhausted) {
        showQuotaWarning(status.provider_name, status.remaining_quota);
      }
      // All quotas exhausted
      else if (status.is_exhausted) {
        const allExhausted = quotaStatuses.every((s: QuotaStatus) => s.is_exhausted || s.is_unlimited);
        
        if (allExhausted) {
          // This would trigger fallback to cached rate
          // The actual cached rate info would come from settings
          // For now, we just note that quotas are exhausted
          console.warn('All API quotas exhausted, system will use cached rate');
        }
      }
    });
  }, [quotaStatuses]);

  return {
    quotaStatuses,
  };
}

/**
 * Hook to listen for provider switch events
 * 
 * This can be used in components that need to react to provider switches
 */
export function useProviderSwitchListener(
  onProviderSwitch?: (oldProvider: string, newProvider: string) => void
) {
  const handleProviderSwitch = useCallback(
    (oldProviderName: string, newProviderName: string, newProviderQuota: number) => {
      showProviderSwitched(newProviderName, newProviderQuota);
      
      if (onProviderSwitch) {
        onProviderSwitch(oldProviderName, newProviderName);
      }
    },
    [onProviderSwitch]
  );

  return {
    handleProviderSwitch,
  };
}

/**
 * Hook to check for stale cached rates
 * 
 * Displays warning if cached rate is older than 7 days
 */
export function useStaleRateCheck(options?: {
  enabled?: boolean;
  checkInterval?: number;
}) {
  const { enabled = true, checkInterval = 300000 } = options || {}; // Default: check every 5 minutes

  const { data: settings } = useQuery({
    queryKey: ['exchange-rate-settings'],
    queryFn: () => exchangeRateService.getSettings(),
    enabled,
    refetchInterval: checkInterval,
  });

  useEffect(() => {
    if (!settings || !settings.last_updated_at) {
      return;
    }

    const lastUpdated = new Date(settings.last_updated_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

    // Show warning if rate is older than 7 days
    if (daysDiff > 7 && settings.mode === 'auto') {
      const currentRate = settings.manual_rate || 0;
      showStaleRateWarning(currentRate, daysDiff);
    }
  }, [settings]);

  return {
    settings,
  };
}

/**
 * Combined hook that enables all notification monitoring
 * 
 * Use this in the main app component to enable all notifications
 */
export function useExchangeRateNotificationSystem(options?: {
  enabled?: boolean;
  quotaPollingInterval?: number;
  staleCheckInterval?: number;
}) {
  const { enabled = true, quotaPollingInterval, staleCheckInterval } = options || {};

  const quotaMonitoring = useExchangeRateNotifications({
    enabled,
    pollingInterval: quotaPollingInterval,
  });

  const staleRateCheck = useStaleRateCheck({
    enabled,
    checkInterval: staleCheckInterval,
  });

  const providerSwitchListener = useProviderSwitchListener();

  return {
    quotaStatuses: quotaMonitoring.quotaStatuses,
    settings: staleRateCheck.settings,
    handleProviderSwitch: providerSwitchListener.handleProviderSwitch,
  };
}
