import { useState, useEffect, useCallback } from 'react';
import { notificationService, type Notification } from '@/services/notificationService';
import { toast } from 'sonner';

interface UseQuoteNotificationsOptions {
  quoteUuid?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseQuoteNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useQuoteNotifications Hook
 * 
 * Custom hook for managing quote-related notifications.
 * Provides notification data, loading states, and actions.
 * 
 * Features:
 * - Fetch all notifications or quote-specific notifications
 * - Auto-refresh with configurable interval
 * - Mark as read functionality
 * - Delete notifications
 * - Error handling with toast notifications
 * - Loading states
 * 
 * @example
 * ```tsx
 * function QuoteDetail({ quoteUuid }) {
 *   const {
 *     notifications,
 *     unreadCount,
 *     markAsRead,
 *     refresh
 *   } = useQuoteNotifications({ quoteUuid });
 *   
 *   return (
 *     <div>
 *       <h2>Notifications ({unreadCount})</h2>
 *       {notifications.map(n => (
 *         <NotificationItem key={n.id} notification={n} onMarkAsRead={markAsRead} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useQuoteNotifications(
  options: UseQuoteNotificationsOptions = {}
): UseQuoteNotificationsReturn {
  const {
    quoteUuid,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (quoteUuid) {
        // Fetch quote-specific notifications
        const response = await notificationService.getQuoteNotifications(quoteUuid);
        setNotifications(response.notifications);
        setUnreadCount(response.notifications.filter(n => !n.read_at).length);
      } else {
        // Fetch all notifications
        const response = await notificationService.getNotifications({ per_page: 50 });
        setNotifications(response.notifications);
        setUnreadCount(response.unread_count);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch notifications');
      setError(error);
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [quoteUuid]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      setUnreadCount(response.unread_count);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
      throw error;
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
      throw error;
    }
  }, []);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      setUnreadCount(response.unread_count);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
      throw error;
    }
  }, []);

  /**
   * Refresh notifications
   */
  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  };
}
