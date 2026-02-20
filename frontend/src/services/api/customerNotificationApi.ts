import { api } from './customerPortalApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface CustomerNotification {
  uuid: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  customer_quote_id?: number;
  order_id?: number;
  is_read: boolean;
  read_at?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  action_text?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  data: CustomerNotification[];
  unread_count?: number;
}

export interface PaginatedNotificationResponse {
  data: CustomerNotification[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const customerNotificationApi = {
  /**
   * Get all notifications for authenticated customer
   */
  async getAll(page = 1, perPage = 20): Promise<PaginatedNotificationResponse> {
    const response = await api.get('/public/customers/notifications', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  /**
   * Get unread notifications
   */
  async getUnread(limit = 10): Promise<NotificationResponse> {
    const response = await api.get('/public/customers/notifications/unread', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ unread_count: number }> {
    const response = await api.get('/public/customers/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(uuid: string): Promise<{ message: string }> {
    const response = await api.post(`/public/customers/notifications/${uuid}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    const response = await api.post('/public/customers/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Delete notification
   */
  async deleteNotification(uuid: string): Promise<{ message: string }> {
    const response = await api.delete(`/public/customers/notifications/${uuid}`);
    return response.data;
  },
};
