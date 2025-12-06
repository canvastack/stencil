import { toast } from 'sonner';
import { tenantApiClient } from '../api/tenantApiClient';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  pushNotifications: boolean;
  types: {
    [key: string]: boolean;
  };
}

export interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
}

class NotificationService {
  private preferences: NotificationPreferences | null = null;
  private isInitialized = false;
  private pollingInterval: number = 30000; // 30 seconds
  private pollingTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private subscribers: ((notification: Notification) => void)[] = [];
  private lastNotificationId: string | null = null;

  constructor() {
    this.preferences = {
      inApp: true,
      email: true,
      sms: false,
      pushNotifications: false,
      types: {
        order_updates: true,
        payment_updates: true,
        system_updates: true,
        marketing: false,
      }
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadPreferences();
      this.startPolling();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize notification service:', error);
      // Continue with default settings
      this.isInitialized = true;
    }
  }

  async loadPreferences(): Promise<void> {
    try {
      // Try to load from API first
      const response = await tenantApiClient.get('/tenant/notifications/preferences');
      this.preferences = response.data;
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to load notification preferences from API, using local storage or defaults');
      
      // Fallback to local storage
      const stored = localStorage.getItem('notification_preferences');
      if (stored) {
        this.preferences = JSON.parse(stored);
      } else {
        // Use default preferences
        this.preferences = {
          inApp: true,
          email: true,
          sms: false,
          pushNotifications: false,
          types: {
            order_updates: true,
            payment_updates: true,
            system_updates: true,
            marketing: false,
          }
        };
      }
    }
  }

  async getNotifications(options: GetNotificationsOptions = {}): Promise<NotificationResponse> {
    if (!tenantApiClient.validateTenantContext()) {
      return { notifications: [], total: 0, hasMore: false };
    }

    try {
      const response = await tenantApiClient.get('/tenant/notifications', {
        params: {
          page: options.page || 1,
          limit: options.limit || 20,
          unread_only: options.unreadOnly || false,
        },
      });

      return {
        notifications: response.data || [],
        total: response.meta?.total || 0,
        hasMore: response.meta?.hasMore || false,
      };
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return { notifications: [], total: 0, hasMore: false };
    }
  }

  private startPolling(): void {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.pollNotifications();
    this.pollingTimer = setInterval(() => {
      this.pollNotifications();
    }, this.pollingInterval);
  }

  private async pollNotifications(): Promise<void> {
    try {
      // Get recent notifications
      const response = await tenantApiClient.get('/tenant/notifications', {
        params: { limit: 10, unread_only: true }
      });
      
      const notifications: Notification[] = response.data?.data || [];
      
      // Notify subscribers about new notifications
      notifications.forEach(notification => {
        // Only notify if this is a new notification we haven't seen before
        if (!this.lastNotificationId || notification.id !== this.lastNotificationId) {
          this.notifySubscribers(notification);
        }
      });
      
      // Update last notification ID
      if (notifications.length > 0) {
        this.lastNotificationId = notifications[0].id;
      }
      
      // Also check unread count for logging
      const countResponse = await tenantApiClient.get('/tenant/notifications/unread-count');
      const count = countResponse.data?.count || 0;
      
      if (count > 0) {
        console.log(`You have ${count} unread notifications`);
      }
    } catch (error) {
      console.warn('Failed to poll notifications:', error);
    }
  }

  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isPolling = false;
  }

  async markAsRead(notificationId: string): Promise<void> {
    if (!tenantApiClient.validateTenantContext()) {
      return;
    }

    try {
      await tenantApiClient.post(`/tenant/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    if (!tenantApiClient.validateTenantContext()) {
      return;
    }

    try {
      await tenantApiClient.post('/tenant/notifications/mark-all-read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  showToast(notification: Notification): void {
    if (!this.preferences?.inApp) {
      return;
    }

    const toastOptions = {
      duration: 5000,
      action: notification.actionUrl ? {
        label: 'View',
        onClick: () => {
          if (notification.actionUrl) {
            window.open(notification.actionUrl, '_blank');
          }
        }
      } : undefined,
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      case 'error':
        toast.error(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      case 'warning':
        toast.warning(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      default:
        toast(notification.title, {
          description: notification.message,
          ...toastOptions
        });
    }
  }

  getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    if (!tenantApiClient.validateTenantContext()) {
      return;
    }

    try {
      const response = await tenantApiClient.put('/tenant/notifications/preferences', preferences);
      this.preferences = response.data;
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  subscribe(callback: (notification: Notification) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  disconnect(): void {
    this.subscribers = [];
  }

  private notifySubscribers(notification: Notification): void {
    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification subscriber:', error);
      }
    });
  }

  destroy(): void {
    this.stopPolling();
    this.disconnect();
    this.isInitialized = false;
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export the class for testing purposes
export { NotificationService };