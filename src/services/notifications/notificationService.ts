import { toast } from 'sonner';
import { apiClient } from '../api/client';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  userId: string;
  tenantId: string;
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  pushNotifications: boolean;
  types: {
    orderStatus: boolean;
    paymentUpdates: boolean;
    shipmentTracking: boolean;
    systemAlerts: boolean;
    promotions: boolean;
  };
}

interface NotificationServiceConfig {
  wsUrl?: string;
  pollingInterval?: number;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

class NotificationService {
  private ws: WebSocket | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private wsUrl: string;
  private pollingIntervalMs: number;
  private isConnecting = false;
  private listeners: Set<(notification: Notification) => void> = new Set();
  private preferences: NotificationPreferences | null = null;

  constructor(config: NotificationServiceConfig = {}) {
    this.wsUrl = config.wsUrl || this.getWebSocketUrl();
    this.pollingIntervalMs = config.pollingInterval || 30000; // 30 seconds
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.reconnectInterval = config.reconnectInterval || 5000;
    
    this.loadPreferences();
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/notifications`;
  }

  public async initialize(): Promise<void> {
    try {
      await this.loadPreferences();
      await this.connectWebSocket();
    } catch (error) {
      console.warn('WebSocket connection failed, falling back to polling:', error);
      this.startPolling();
    }
  }

  private async connectWebSocket(): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = localStorage.getItem('auth_token');
      const tenantId = localStorage.getItem('tenant_id');
      
      if (!token || !tenantId) {
        throw new Error('Missing authentication credentials');
      }

      const wsUrl = `${this.wsUrl}?token=${token}&tenant=${tenantId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.stopPolling();
      };

      this.ws.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          this.handleNotification(notification);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.reconnect(), this.reconnectInterval);
        } else {
          console.warn('Max reconnect attempts reached, falling back to polling');
          this.startPolling();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  private async reconnect(): Promise<void> {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    try {
      await this.connectWebSocket();
    } catch (error) {
      console.error('Reconnection failed:', error);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('Max reconnect attempts reached, falling back to polling');
        this.startPolling();
      }
    }
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      return;
    }

    console.log('Starting notification polling');
    this.pollingInterval = setInterval(() => {
      this.pollNotifications();
    }, this.pollingIntervalMs);

    // Poll immediately
    this.pollNotifications();
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Stopped notification polling');
    }
  }

  private async pollNotifications(): Promise<void> {
    try {
      const response = await apiClient.get('/notifications/unread');
      const notifications: Notification[] = response.data || [];
      
      notifications.forEach(notification => {
        this.handleNotification(notification);
      });
    } catch (error) {
      console.error('Failed to poll notifications:', error);
    }
  }

  private handleNotification(notification: Notification): void {
    // Check preferences before showing notification
    if (!this.shouldShowNotification(notification)) {
      return;
    }

    // Show toast notification
    this.showToast(notification);

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  private shouldShowNotification(notification: Notification): boolean {
    if (!this.preferences?.inApp) {
      return false;
    }

    // Check type-specific preferences
    const notificationType = this.getNotificationTypeFromData(notification);
    if (notificationType && !this.preferences.types[notificationType]) {
      return false;
    }

    return true;
  }

  private getNotificationTypeFromData(notification: Notification): keyof NotificationPreferences['types'] | null {
    const data = notification.data;
    
    if (data?.type === 'order_status') return 'orderStatus';
    if (data?.type === 'payment_update') return 'paymentUpdates';
    if (data?.type === 'shipment_tracking') return 'shipmentTracking';
    if (data?.type === 'system_alert') return 'systemAlerts';
    if (data?.type === 'promotion') return 'promotions';
    
    return null;
  }

  private showToast(notification: Notification): void {
    const toastOptions = {
      duration: 5000,
      action: notification.data?.actionUrl ? {
        label: 'View',
        onClick: () => window.open(notification.data.actionUrl, '_blank')
      } : undefined,
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, {
          description: notification.message,
          ...toastOptions,
        });
        break;
      case 'warning':
        toast.warning(notification.title, {
          description: notification.message,
          ...toastOptions,
        });
        break;
      case 'error':
        toast.error(notification.title, {
          description: notification.message,
          ...toastOptions,
        });
        break;
      default:
        toast.info(notification.title, {
          description: notification.message,
          ...toastOptions,
        });
    }
  }

  public subscribe(listener: (notification: Notification) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  public async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch('/notifications/mark-all-read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  public async getNotifications(options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<{ notifications: Notification[]; total: number; hasMore: boolean }> {
    // In demo mode, return mock notifications
    if (this.isDemoMode()) {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Payment Received',
          message: 'Payment of IDR 500,000 has been received for Invoice #INV-001',
          read: false,
          createdAt: new Date().toISOString(),
          userId: 'demo-user',
          tenantId: 'demo-tenant',
          data: { invoiceId: 'inv-001', amount: 500000 }
        },
        {
          id: '2',
          type: 'info',
          title: 'Order Update',
          message: 'Order #ORD-002 has been shipped and is on its way',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          userId: 'demo-user',
          tenantId: 'demo-tenant',
          data: { orderId: 'ord-002' }
        },
        {
          id: '3',
          type: 'warning',
          title: 'Invoice Overdue',
          message: 'Invoice #INV-003 is 5 days overdue',
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          userId: 'demo-user',
          tenantId: 'demo-tenant',
          data: { invoiceId: 'inv-003', daysOverdue: 5 }
        }
      ];

      const filteredNotifications = options.unreadOnly 
        ? mockNotifications.filter(n => !n.read)
        : mockNotifications;
      
      return {
        notifications: filteredNotifications,
        total: filteredNotifications.length,
        hasMore: false,
      };
    }

    try {
      const response = await apiClient.get('/notifications', {
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

  public async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const response = await apiClient.put('/notifications/preferences', preferences);
      this.preferences = response.data;
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  private isDemoMode(): boolean {
    const token = localStorage.getItem('auth_token');
    const isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
    const isDemoToken = token?.startsWith('demo_token_');
    
    return isDemoToken;
  }

  private async loadPreferences(): Promise<void> {
    // In demo mode, skip API calls and use defaults
    if (this.isDemoMode()) {
      console.log('Demo mode: Using default notification preferences');
      this.preferences = {
        inApp: true,
        email: true,
        sms: false,
        pushNotifications: false,
        types: {
          orderStatus: true,
          paymentUpdates: true,
          shipmentTracking: true,
          systemAlerts: true,
          promotions: false,
        }
      };
      return;
    }

    try {
      // Try to load from API first
      const response = await apiClient.get('/notifications/preferences');
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
            orderStatus: true,
            paymentUpdates: true,
            shipmentTracking: true,
            systemAlerts: true,
            promotions: false,
          },
        };
      }
    }
  }

  public getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopPolling();
    this.listeners.clear();
  }

  // Test notification method for development
  public async sendTestNotification(type: Notification['type'] = 'info'): Promise<void> {
    const testNotification: Notification = {
      id: `test-${Date.now()}`,
      type,
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      read: false,
      createdAt: new Date().toISOString(),
      userId: localStorage.getItem('user_id') || 'test-user',
      tenantId: localStorage.getItem('tenant_id') || 'test-tenant',
      data: {
        type: 'system_alert',
        source: 'test',
      },
    };

    this.handleNotification(testNotification);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

export default notificationService;