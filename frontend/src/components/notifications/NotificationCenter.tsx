import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { notificationService, type Notification } from '@/services/notificationService';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface NotificationCenterProps {
  className?: string;
}

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
      toast.success('Notifikasi telah dihapus');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Gagal menghapus notifikasi');
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.data.is_critical) {
      return '🚨';
    }
    
    const status = notification.data.new_status;
    switch (status) {
      case 'completed':
      case 'delivered':
        return '✅';
      case 'shipped':
        return '🚚';
      case 'cancelled':
      case 'refunded':
        return '❌';
      case 'in_production':
        return '🔧';
      default:
        return '📋';
    }
  };

  const getNotificationColor = (notification: Notification) => {
    if (notification.data.is_critical) {
      return 'text-red-600';
    }
    
    const status = notification.data.new_status;
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'text-green-600';
      case 'shipped':
        return 'text-blue-600';
      case 'cancelled':
      case 'refunded':
        return 'text-red-600';
      case 'in_production':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifikasi</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Tandai Semua
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Tidak ada notifikasi
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read_at ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getNotificationIcon(notification)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.data.message}
                          </p>
                          
                          {notification.data.order_number && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Pesanan: {notification.data.order_number}
                            </p>
                          )}
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: id
                            })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {notification.data.order_uuid && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs mt-2"
                          onClick={() => {
                            window.location.href = `/admin/orders/${notification.data.order_uuid}`;
                          }}
                        >
                          Lihat Detail Pesanan →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  // Navigate to full notifications page
                  window.location.href = '/admin/notifications';
                }}
              >
                Lihat Semua Notifikasi
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}