import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Filter,
  Loader2,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { notificationService } from '@/services/api/notifications';
import type { Notification } from '@/types/notification';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons: Record<string, React.ReactNode> = {
    comment: <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    approval_request: <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />,
    approval_response: <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />,
    product_update: <Info className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
    mention: <MessageSquare className="h-4 w-4 text-pink-600 dark:text-pink-400" />,
    system: <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
  };

  return icons[type] || icons.system;
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}> = ({ notification, onMarkRead, onDelete, onClick }) => {
  return (
    <div
      className={`p-4 border-b hover:bg-accent/50 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          <NotificationIcon type={notification.type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{notification.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {notification.message}
              </p>
            </div>

            {!notification.isRead && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>

            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', filterCategory, filterRead],
    queryFn: () => notificationService.getNotifications(1, 50, {
      category: filterCategory !== 'all' ? [filterCategory] : undefined,
      isRead: filterRead === 'unread' ? false : filterRead === 'read' ? true : undefined,
    }),
    refetchInterval: 60000, // 1 minute - aligned with realtimeConfig
    refetchIntervalInBackground: false, // Don't poll when tab is not visible
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 60000, // 1 minute - aligned with realtimeConfig
    refetchIntervalInBackground: false, // Don't poll when tab is not visible
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: (error: any) => {
      toast.error('Failed to mark as read', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error('Failed to mark all as read', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Notification deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete notification', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notificationService.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('All notifications deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete all notifications', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setOpen(false);
    }
  };

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToRealtimeNotifications((notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });

      toast.info(notification.title, {
        description: notification.message,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const notifications = notificationsData?.notifications || [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {(unreadCount ?? 0) > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount! > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {(unreadCount ?? 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  className="gap-2 h-7 text-xs"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAllMutation.mutate()}
                  className="gap-2 h-7 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="approvals">Approvals</SelectItem>
                <SelectItem value="comments">Comments</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
