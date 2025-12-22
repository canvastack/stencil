import React, { useEffect, useState } from 'react';
import { Bell, BellRing, X, Check, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { ScrollArea } from './scroll-area';
import { Separator } from './separator';
import { notificationService, Notification } from '../../services/notifications/notificationService';
import { formatDistanceToNow } from 'date-fns';

interface NotificationToastProps {
  className?: string;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
  const iconClass = "h-4 w-4";
  
  switch (type) {
    case 'success':
      return <CheckCircle className={`${iconClass} text-green-500`} />;
    case 'warning':
      return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
    case 'error':
      return <AlertCircle className={`${iconClass} text-red-500`} />;
    default:
      return <Info className={`${iconClass} text-blue-500`} />;
  }
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}> = ({ notification, onMarkAsRead }) => {
  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div 
      className={`p-3 rounded-lg border transition-colors ${
        notification.read 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-white border-blue-200 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <NotificationIcon type={notification.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </h4>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                onClick={handleMarkAsRead}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            {notification.data?.actionUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => window.open(notification.data.actionUrl, '_blank')}
              >
                View
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep only latest 20
      setUnreadCount(prev => prev + 1);
    });

    // Load initial notifications
    loadNotifications();

    return () => {
      unsubscribe();
      notificationService.disconnect();
    };
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await notificationService.getNotifications({ limit: 20 });
      setNotifications(result.notifications);
      setUnreadCount(result.notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleTestNotification = () => {
    notificationService.sendTestNotification('info');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative p-2 ${className}`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-blue-600" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          
          <div className="flex items-center gap-2">
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-gray-500"
                onClick={handleTestNotification}
              >
                Test
              </Button>
            )}
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <ScrollArea className="h-96">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />
        
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm text-gray-600"
            onClick={() => {
              setIsOpen(false);
              // Navigate to notifications page if exists
              // router.push('/admin/notifications');
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationToast;