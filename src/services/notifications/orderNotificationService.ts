import { notificationService, Notification, NotificationPreferences } from './notificationService';
import { Order } from '@/types/order';
import { apiClient } from '../api/client';

export interface OrderStatusNotificationData {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  customerName: string;
  orderTotal: number;
  notificationChannels: ('inApp' | 'email' | 'sms')[];
  metadata?: Record<string, any>;
}

export interface NotificationChannel {
  type: 'inApp' | 'email' | 'sms';
  enabled: boolean;
  config?: Record<string, any>;
}

export interface CustomerNotificationPreferences {
  orderId: string;
  customerId: string;
  channels: NotificationChannel[];
  preferences: {
    orderCreated: boolean;
    orderConfirmed: boolean;
    orderProcessing: boolean;
    orderShipped: boolean;
    orderDelivered: boolean;
    orderCancelled: boolean;
    orderRefunded: boolean;
  };
}

class OrderNotificationService {
  private statusMessages: Record<string, { title: string; message: (data: any) => string }> = {
    confirmed: {
      title: 'Order Confirmed',
      message: (data) => `Order #${data.orderId} for ${data.customerName} has been confirmed. Total: $${data.orderTotal}`,
    },
    processing: {
      title: 'Order Processing',
      message: (data) => `Order #${data.orderId} is now being processed. We'll notify you when it ships.`,
    },
    shipped: {
      title: 'Order Shipped',
      message: (data) => `Great news! Order #${data.orderId} has been shipped and is on its way.`,
    },
    delivered: {
      title: 'Order Delivered',
      message: (data) => `Order #${data.orderId} has been successfully delivered to ${data.customerName}.`,
    },
    cancelled: {
      title: 'Order Cancelled',
      message: (data) => `Order #${data.orderId} has been cancelled. Any charges will be refunded.`,
    },
    refunded: {
      title: 'Order Refunded',
      message: (data) => `Refund processed for Order #${data.orderId}. Amount: $${data.orderTotal}`,
    },
    failed: {
      title: 'Order Failed',
      message: (data) => `There was an issue with Order #${data.orderId}. Please contact support.`,
    },
  };

  /**
   * Send order status change notification through all configured channels
   */
  async sendOrderStatusNotification(data: OrderStatusNotificationData): Promise<void> {
    try {
      // Get customer notification preferences
      const preferences = await this.getCustomerNotificationPreferences(data.orderId);
      
      // Filter channels based on preferences
      const enabledChannels = this.filterEnabledChannels(data.notificationChannels, preferences);

      // Send notifications through each enabled channel
      const notifications = enabledChannels.map(channel => 
        this.sendNotificationByChannel(channel, data, preferences)
      );

      await Promise.allSettled(notifications);

      // Log notification attempt
      await this.logNotificationActivity({
        orderId: data.orderId,
        notificationType: 'order_status_change',
        channels: enabledChannels,
        status: 'sent',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to send order status notification:', error);
      
      // Log failed notification
      await this.logNotificationActivity({
        orderId: data.orderId,
        notificationType: 'order_status_change',
        channels: data.notificationChannels,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(data: OrderStatusNotificationData): Promise<void> {
    const messageConfig = this.statusMessages[data.newStatus];
    
    if (!messageConfig) {
      console.warn(`No message template found for status: ${data.newStatus}`);
      return;
    }

    const notification: Notification = {
      id: `order-${data.orderId}-${data.newStatus}-${Date.now()}`,
      type: this.getNotificationType(data.newStatus),
      title: messageConfig.title,
      message: messageConfig.message(data),
      read: false,
      createdAt: new Date().toISOString(),
      userId: await this.getUserIdFromOrder(data.orderId),
      tenantId: localStorage.getItem('tenant_id') || '',
      data: {
        type: 'order_status',
        orderId: data.orderId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        actionUrl: `/admin/orders/${data.orderId}`,
        metadata: data.metadata,
      },
    };

    // Send through notification service
    notificationService.subscribe((notification) => {
      // This will trigger the toast
    });

    // Manually trigger the notification (simulating WebSocket/polling)
    // In a real app, this would come from the backend
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
    }, 100);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(data: OrderStatusNotificationData): Promise<void> {
    try {
      await apiClient.post('/notifications/email', {
        orderId: data.orderId,
        type: 'order_status_change',
        status: data.newStatus,
        templateData: {
          customerName: data.customerName,
          orderId: data.orderId,
          orderTotal: data.orderTotal,
          newStatus: data.newStatus,
          previousStatus: data.previousStatus,
        },
      });

      console.log(`Email notification sent for order ${data.orderId}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(data: OrderStatusNotificationData): Promise<void> {
    try {
      const messageConfig = this.statusMessages[data.newStatus];
      const message = messageConfig ? messageConfig.message(data) : 
        `Order #${data.orderId} status updated to ${data.newStatus}`;

      await apiClient.post('/notifications/sms', {
        orderId: data.orderId,
        message: message,
        type: 'order_status_change',
      });

      console.log(`SMS notification sent for order ${data.orderId}`);
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      throw error;
    }
  }

  /**
   * Get notification type based on order status
   */
  private getNotificationType(status: string): Notification['type'] {
    switch (status) {
      case 'delivered':
      case 'confirmed':
        return 'success';
      case 'cancelled':
      case 'failed':
        return 'error';
      case 'processing':
      case 'shipped':
        return 'info';
      case 'refunded':
        return 'warning';
      default:
        return 'info';
    }
  }

  /**
   * Get customer notification preferences for an order
   */
  private async getCustomerNotificationPreferences(orderId: string): Promise<CustomerNotificationPreferences> {
    try {
      const response = await apiClient.get(`/orders/${orderId}/notification-preferences`);
      return response.data;
    } catch (error) {
      console.warn('Failed to get customer notification preferences, using defaults:', error);
      
      // Return default preferences
      return {
        orderId,
        customerId: 'unknown',
        channels: [
          { type: 'inApp', enabled: true },
          { type: 'email', enabled: true },
          { type: 'sms', enabled: false },
        ],
        preferences: {
          orderCreated: true,
          orderConfirmed: true,
          orderProcessing: true,
          orderShipped: true,
          orderDelivered: true,
          orderCancelled: true,
          orderRefunded: true,
        },
      };
    }
  }

  /**
   * Filter channels based on customer preferences
   */
  private filterEnabledChannels(
    requestedChannels: ('inApp' | 'email' | 'sms')[],
    preferences: CustomerNotificationPreferences
  ): ('inApp' | 'email' | 'sms')[] {
    return requestedChannels.filter(channel => {
      const channelConfig = preferences.channels.find(c => c.type === channel);
      return channelConfig?.enabled !== false;
    });
  }

  /**
   * Send notification by specific channel
   */
  private async sendNotificationByChannel(
    channel: 'inApp' | 'email' | 'sms',
    data: OrderStatusNotificationData,
    preferences: CustomerNotificationPreferences
  ): Promise<void> {
    switch (channel) {
      case 'inApp':
        return this.sendInAppNotification(data);
      case 'email':
        return this.sendEmailNotification(data);
      case 'sms':
        return this.sendSmsNotification(data);
      default:
        console.warn(`Unknown notification channel: ${channel}`);
    }
  }

  /**
   * Get user ID from order (for internal tracking)
   */
  private async getUserIdFromOrder(orderId: string): Promise<string> {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data?.customer?.user_id || 'system';
    } catch (error) {
      console.warn('Failed to get user ID from order:', error);
      return localStorage.getItem('user_id') || 'system';
    }
  }

  /**
   * Log notification activity for tracking and debugging
   */
  private async logNotificationActivity(activity: {
    orderId: string;
    notificationType: string;
    channels: string[];
    status: 'sent' | 'failed';
    error?: string;
    timestamp: string;
  }): Promise<void> {
    try {
      await apiClient.post('/notifications/activity-log', activity);
    } catch (error) {
      console.error('Failed to log notification activity:', error);
    }
  }

  /**
   * Update customer notification preferences
   */
  async updateCustomerNotificationPreferences(
    customerId: string,
    preferences: Partial<CustomerNotificationPreferences>
  ): Promise<CustomerNotificationPreferences> {
    try {
      const response = await apiClient.put(`/customers/${customerId}/notification-preferences`, preferences);
      return response.data;
    } catch (error) {
      console.error('Failed to update customer notification preferences:', error);
      throw error;
    }
  }

  /**
   * Bulk send notifications for multiple orders
   */
  async sendBulkOrderNotifications(orders: OrderStatusNotificationData[]): Promise<void> {
    const notifications = orders.map(order => this.sendOrderStatusNotification(order));
    await Promise.allSettled(notifications);
  }

  /**
   * Test notification functionality (development only)
   */
  async sendTestOrderNotification(orderId: string = 'TEST-001'): Promise<void> {
    const testData: OrderStatusNotificationData = {
      orderId,
      previousStatus: 'pending',
      newStatus: 'confirmed',
      customerName: 'John Doe',
      orderTotal: 99.99,
      notificationChannels: ['inApp'],
      metadata: {
        source: 'test',
        timestamp: new Date().toISOString(),
      },
    };

    await this.sendOrderStatusNotification(testData);
  }
}

// Export singleton instance
export const orderNotificationService = new OrderNotificationService();

export default orderNotificationService;