import { tenantApiClient } from './api/tenantApiClient';

export interface Notification {
  id: string;
  type: string;
  data: {
    // Order-related fields
    order_id?: number;
    order_uuid?: string;
    order_number?: string;
    old_status?: string;
    new_status?: string;
    message: string;
    is_critical?: boolean;
    changed_by?: string;
    reason?: string;
    
    // Quote-related fields
    quote_uuid?: string;
    quote_number?: string;
    customer_name?: string;
    vendor_name?: string;
    product_name?: string;
    quantity?: number;
    response_type?: 'accept' | 'reject' | 'counter';
    response_notes?: string;
    new_expires_at?: string;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more: boolean;
  };
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface OrderNotificationsResponse {
  notifications: Notification[];
  count: number;
}

class NotificationService {
  /**
   * Get notifications for the current user
   */
  async getNotifications(params?: {
    per_page?: number;
    unread_only?: boolean;
    page?: number;
  }): Promise<NotificationResponse> {
    const response = await tenantApiClient.get('/notifications', { params });
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await tenantApiClient.get('/notifications/unread-count');
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ message: string; unread_count: number }> {
    const response = await tenantApiClient.post(`/notifications/${notificationId}/read`);
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; unread_count: number }> {
    const response = await tenantApiClient.post('/notifications/mark-all-read');
    return response.data;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<{ message: string; unread_count: number }> {
    const response = await tenantApiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  /**
   * Get order-specific notifications
   */
  async getOrderNotifications(orderUuid: string): Promise<OrderNotificationsResponse> {
    const response = await tenantApiClient.get(`/notifications/orders/${orderUuid}`);
    return response.data;
  }

  /**
   * Get quote-specific notifications
   */
  async getQuoteNotifications(quoteUuid: string): Promise<OrderNotificationsResponse> {
    const response = await tenantApiClient.get(`/notifications/quotes/${quoteUuid}`);
    return response.data;
  }
}

export const notificationService = new NotificationService();