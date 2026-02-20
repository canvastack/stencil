import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerNotificationApi, CustomerNotification } from '@/services/api/customerNotificationApi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck, Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread notifications
  const { data: unreadData, refetch: refetchUnread } = useQuery({
    queryKey: ['customer-notifications-unread'],
    queryFn: () => customerNotificationApi.getUnread(10),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: countData, refetch: refetchCount } = useQuery({
    queryKey: ['customer-notifications-count'],
    queryFn: () => customerNotificationApi.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadNotifications = unreadData?.data || [];
  const unreadCount = countData?.unread_count || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (uuid: string) => customerNotificationApi.markAsRead(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => customerNotificationApi.markAllAsRead(),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['customer-notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (uuid: string) => customerNotificationApi.deleteNotification(uuid),
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['customer-notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
    },
  });

  const handleNotificationClick = (notification: CustomerNotification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.uuid);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      setIsOpen(false);
      navigate(notification.action_url);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent, uuid: string) => {
    e.stopPropagation();
    markAsReadMutation.mutate(uuid);
  };

  const handleDelete = (e: React.MouseEvent, uuid: string) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(uuid);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {unreadNotifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No new notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            {unreadNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.uuid}
                className={`flex flex-col items-start p-4 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMarkAsRead(e, notification.uuid)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleDelete(e, notification.uuid)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                {notification.action_text && (
                  <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                    <Eye className="h-3 w-3 mr-1" />
                    {notification.action_text}
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center cursor-pointer"
          onClick={() => {
            setIsOpen(false);
            navigate('/customer/notifications');
          }}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
