import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { notificationService, type Notification } from '@/services/notificationService';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { toast } from 'sonner';
import { NotificationBell } from './NotificationBell';
import { NotificationList } from './NotificationList';

interface NotificationCenterProps {
  className?: string;
}

/**
 * NotificationCenter Component
 * 
 * Complete notification center with bell icon, popover, and notification list.
 * Integrates real-time notifications and provides full notification management.
 * 
 * Features:
 * - Bell icon with unread count badge
 * - Popover with notification list
 * - Real-time notification updates
 * - Mark as read functionality
 * - Delete notifications
 * - Toast notifications for new items
 * - Navigation to notification details
 * 
 * @example
 * ```tsx
 * <NotificationCenter className="ml-4" />
 * ```
 */
export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Set up real-time notifications
  useRealTimeNotifications({
    onNotificationReceived: (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    enableToasts: true,
    enableSound: true,
  });

  // Load notifications when popover opens
  const loadNotifications = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await notificationService.getNotifications({ per_page: 20 });
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Gagal memuat notifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  // Load unread count on mount
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        setUnreadCount(response.unread_count);
      } catch (error) {
        console.error('Failed to load unread count:', error);
      }
    };

    loadUnreadCount();
  }, []);

  // Load notifications when popover opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
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
      toast.error('Gagal menandai notifikasi sebagai dibaca');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      toast.success('Semua notifikasi telah ditandai sebagai dibaca');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Gagal menandai semua notifikasi sebagai dibaca');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      setUnreadCount(response.unread_count);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    window.location.href = '/admin/notifications';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div>
          <NotificationBell
            unreadCount={unreadCount}
            onClick={() => setIsOpen(!isOpen)}
            className={className}
          />
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDeleteNotification}
          onClose={() => setIsOpen(false)}
          onViewAll={handleViewAll}
        />
      </PopoverContent>
    </Popover>
  );
}