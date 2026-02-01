import { useExchangeRateNotificationSystem } from '@/hooks/useExchangeRateNotifications';

/**
 * Exchange Rate Notification Monitor Component
 * 
 * This component monitors exchange rate quota status and displays
 * notifications when thresholds are reached. It should be mounted
 * in the admin layout to enable system-wide notifications.
 * 
 * Features:
 * - Polls quota status every 60 seconds
 * - Checks for stale rates every 5 minutes
 * - Displays color-coded toast notifications
 * - Manages notification queue (max 5)
 */
export function ExchangeRateNotificationMonitor() {
  // Enable the notification system
  useExchangeRateNotificationSystem({
    enabled: true,
    quotaPollingInterval: 60000, // Poll every 60 seconds
    staleCheckInterval: 300000,  // Check every 5 minutes
  });

  // This component doesn't render anything visible
  // It only manages the notification system
  return null;
}
