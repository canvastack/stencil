import { tenantApiClient } from './tenantApiClient';
import type {
  Notification,
  NotificationPreference,
  NotificationListResponse,
  NotificationPreferencesResponse,
  NotificationStatsResponse,
  UpdatePreferenceRequest,
  NotificationFilterOptions,
} from '@/types/notification';

class NotificationService {
  async getNotifications(
    page = 1,
    perPage = 20,
    filters?: NotificationFilterOptions
  ): Promise<NotificationListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (filters?.type && filters.type.length > 0) {
        params.append('type', filters.type.join(','));
      }
      if (filters?.category && filters.category.length > 0) {
        params.append('category', filters.category.join(','));
      }
      if (filters?.isRead !== undefined) {
        params.append('is_read', filters.isRead.toString());
      }
      if (filters?.priority && filters.priority.length > 0) {
        params.append('priority', filters.priority.join(','));
      }
      if (filters?.dateFrom) {
        params.append('date_from', filters.dateFrom);
      }
      if (filters?.dateTo) {
        params.append('date_to', filters.dateTo);
      }

      const response = await tenantApiClient.get<NotificationListResponse>(
        `/notifications?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async getNotification(notificationId: string): Promise<Notification> {
    try {
      const response = await tenantApiClient.get<{ notification: Notification }>(
        `/notifications/${notificationId}`
      );
      
      return response.data.notification;
    } catch (error) {
      console.error('Failed to get notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await tenantApiClient.post<{ notification: Notification }>(
        `/notifications/${notificationId}/read`
      );
      
      return response.data.notification;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await tenantApiClient.post('/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await tenantApiClient.delete('/notifications');
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await tenantApiClient.get<{ count: number }>(
        '/notifications/unread-count'
      );
      
      return response.data.count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }

  async getStats(): Promise<NotificationStatsResponse> {
    try {
      const response = await tenantApiClient.get<NotificationStatsResponse>(
        '/notifications/stats'
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  async getPreferences(): Promise<NotificationPreferencesResponse> {
    try {
      const response = await tenantApiClient.get<NotificationPreferencesResponse>(
        '/notifications/preferences'
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  async updatePreference(request: UpdatePreferenceRequest): Promise<NotificationPreference> {
    try {
      const response = await tenantApiClient.put<{ preference: NotificationPreference }>(
        '/notifications/preferences',
        request
      );
      
      return response.data.preference;
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      throw error;
    }
  }

  async subscribeToRealtimeNotifications(callback: (notification: Notification) => void): () => void {
    const eventSource = new EventSource(`${tenantApiClient.getBaseURL()}/notifications/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        callback(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }
}

export const notificationService = new NotificationService();
