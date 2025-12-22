import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationService, NotificationPreferences } from '../services/notifications/notificationService';
import { queryKeys, realtimeConfig } from '../lib/react-query';

// Get notifications with real-time updates
export const useNotifications = (options: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  enablePolling?: boolean;
} = {}) => {
  const { enablePolling = true, ...queryOptions } = options;
  
  return useQuery({
    queryKey: queryKeys.notifications.list(queryOptions),
    queryFn: () => notificationService.getNotifications(queryOptions),
    staleTime: realtimeConfig.staleTime.notifications,
    refetchInterval: enablePolling ? realtimeConfig.polling.notifications : false,
    refetchIntervalInBackground: false, // Don't poll when tab is not visible
  });
};

// Get unread notifications count
export const useUnreadNotifications = (enablePolling: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.notifications.unread(),
    queryFn: () => notificationService.getNotifications({ unreadOnly: true, limit: 100 }),
    staleTime: realtimeConfig.staleTime.notifications,
    refetchInterval: enablePolling ? realtimeConfig.polling.notifications : false,
    refetchIntervalInBackground: false, // Don't poll when tab is not visible
    select: (data) => ({
      count: data.notifications.length,
      notifications: data.notifications,
    }),
  });
};

// Get notification preferences
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notificationService.getPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mark notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      // Update notifications in cache
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      
      // Update unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
    },
    onError: (error) => {
      toast.error('Failed to mark notification as read', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};

// Mark all notifications as read
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error('Failed to mark all notifications as read', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};

// Update notification preferences
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) => 
      notificationService.updatePreferences(preferences),
    onSuccess: (data) => {
      // Update preferences in cache
      queryClient.setQueryData(queryKeys.notifications.preferences(), data);
      
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error('Failed to update notification preferences', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};