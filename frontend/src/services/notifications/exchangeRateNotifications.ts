import { toast } from 'sonner';

/**
 * Exchange Rate Notification Service
 * 
 * Provides specialized toast notifications for the exchange rate system
 * with color-coded severity levels and auto-dismiss functionality.
 */

export type NotificationColor = 'orange' | 'red' | 'green' | 'yellow';

interface NotificationOptions {
  duration?: number;
  dismissible?: boolean;
}

const DEFAULT_DURATION = 5000; // 5 seconds
const MAX_NOTIFICATIONS = 5;

// Track active notifications for queue management
let activeNotifications: string[] = [];

/**
 * Display a quota warning notification (orange)
 * Shown when remaining quota reaches 50 requests
 */
export function showQuotaWarning(
  providerName: string,
  remainingQuota: number,
  options: NotificationOptions = {}
): void {
  const message = `API quota running low: ${providerName} has ${remainingQuota} requests left this month`;
  
  manageNotificationQueue(() => {
    const id = toast.warning(message, {
      duration: options.duration ?? DEFAULT_DURATION,
      dismissible: options.dismissible ?? true,
      className: 'border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-900 dark:text-orange-100',
    });
    
    if (id) {
      activeNotifications.push(id as string);
    }
  });
}

/**
 * Display a critical quota warning notification (red)
 * Shown when remaining quota reaches 20 requests
 */
export function showCriticalQuotaWarning(
  providerName: string,
  remainingQuota: number,
  nextProviderName: string,
  nextProviderQuota: number,
  options: NotificationOptions = {}
): void {
  const message = `API quota critical: ${providerName} has ${remainingQuota} requests left. Will switch to ${nextProviderName} (${nextProviderQuota} remaining)`;
  
  manageNotificationQueue(() => {
    const id = toast.error(message, {
      duration: options.duration ?? DEFAULT_DURATION,
      dismissible: options.dismissible ?? true,
      className: 'border-red-500 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100',
    });
    
    if (id) {
      activeNotifications.push(id as string);
    }
  });
}

/**
 * Display a provider switched notification (green)
 * Shown when system automatically switches to a new provider
 */
export function showProviderSwitched(
  newProviderName: string,
  availableQuota: number,
  options: NotificationOptions = {}
): void {
  const quotaText = availableQuota === Number.MAX_SAFE_INTEGER 
    ? 'unlimited' 
    : `${availableQuota}`;
  const message = `Switched to ${newProviderName} API (${quotaText} requests remaining)`;
  
  manageNotificationQueue(() => {
    const id = toast.success(message, {
      duration: options.duration ?? DEFAULT_DURATION,
      dismissible: options.dismissible ?? true,
      className: 'border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100',
    });
    
    if (id) {
      activeNotifications.push(id as string);
    }
  });
}

/**
 * Display a fallback notification (yellow)
 * Shown when all API quotas are exhausted and cached rate is used
 */
export function showFallbackNotification(
  cachedRate: number,
  lastUpdated: string,
  options: NotificationOptions = {}
): void {
  const message = `All API quotas exhausted. Using last known rate: 1 USD = Rp ${cachedRate.toLocaleString('id-ID')} (updated: ${lastUpdated})`;
  
  manageNotificationQueue(() => {
    const id = toast.info(message, {
      duration: options.duration ?? DEFAULT_DURATION,
      dismissible: options.dismissible ?? true,
      className: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100',
    });
    
    if (id) {
      activeNotifications.push(id as string);
    }
  });
}

/**
 * Display a stale rate warning notification (yellow)
 * Shown when cached rate is older than 7 days
 */
export function showStaleRateWarning(
  rate: number,
  daysOld: number,
  options: NotificationOptions = {}
): void {
  const message = `Warning: Exchange rate is ${daysOld} days old (1 USD = Rp ${rate.toLocaleString('id-ID')}). Consider updating manually.`;
  
  manageNotificationQueue(() => {
    const id = toast.warning(message, {
      duration: options.duration ?? DEFAULT_DURATION,
      dismissible: options.dismissible ?? true,
      className: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100',
    });
    
    if (id) {
      activeNotifications.push(id as string);
    }
  });
}

/**
 * Display a generic error notification
 */
export function showErrorNotification(
  message: string,
  options: NotificationOptions = {}
): void {
  manageNotificationQueue(() => {
    const id = toast.error(message, {
      duration: options.duration ?? DEFAULT_DURATION,
      dismissible: options.dismissible ?? true,
    });
    
    if (id) {
      activeNotifications.push(id as string);
    }
  });
}

/**
 * Display a generic success notification
 */
export function showSuccessNotification(
  message: string,
  options: NotificationOptions = {}
): void {
  manageNotificationQueue(() => {
    const id = toast.success(message, {
      duration: options.duration ?? DEFAULT_DURATION,
      dismissible: options.dismissible ?? true,
    });
    
    if (id) {
      activeNotifications.push(id as string);
    }
  });
}

/**
 * Manage notification queue to ensure max 5 notifications
 * Dismisses oldest notification if queue is full
 */
function manageNotificationQueue(showNotification: () => void): void {
  // Clean up dismissed notifications from tracking
  activeNotifications = activeNotifications.filter(id => {
    // Check if notification still exists in DOM
    const element = document.querySelector(`[data-sonner-toast][data-toast-id="${id}"]`);
    return element !== null;
  });
  
  // If at max capacity, dismiss oldest notification
  if (activeNotifications.length >= MAX_NOTIFICATIONS) {
    const oldestId = activeNotifications.shift();
    if (oldestId) {
      toast.dismiss(oldestId);
    }
  }
  
  // Show new notification
  showNotification();
}

/**
 * Dismiss all active notifications
 */
export function dismissAllNotifications(): void {
  toast.dismiss();
  activeNotifications = [];
}

/**
 * Get count of active notifications
 */
export function getActiveNotificationCount(): number {
  return activeNotifications.length;
}

/**
 * Export notification functions for use in components
 * These can be called directly when handling API responses
 */
export const exchangeRateNotifications = {
  showQuotaWarning,
  showCriticalQuotaWarning,
  showProviderSwitched,
  showFallbackNotification,
  showStaleRateWarning,
  showError: showErrorNotification,
  showSuccess: showSuccessNotification,
  dismissAll: dismissAllNotifications,
  getActiveCount: getActiveNotificationCount,
};
