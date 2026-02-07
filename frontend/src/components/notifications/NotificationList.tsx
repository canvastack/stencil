import React from 'react';
import { Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Notification } from '@/services/notificationService';
import { QuoteNotificationItem } from './QuoteNotificationItem';

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  unreadCount?: number;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (notificationId: string) => void;
  onClose?: () => void;
  onViewAll?: () => void;
  className?: string;
  maxHeight?: string;
}

/**
 * NotificationList Component
 * 
 * Displays a list of notifications with actions for marking as read and deleting.
 * Supports different notification types with specialized rendering.
 * 
 * Features:
 * - Scrollable list with configurable max height
 * - Mark individual notifications as read
 * - Mark all notifications as read
 * - Delete individual notifications
 * - Loading state with skeletons
 * - Empty state message
 * - Specialized rendering for quote notifications
 * - Relative timestamps (e.g., "2 hours ago")
 * 
 * @example
 * ```tsx
 * <NotificationList
 *   notifications={notifications}
 *   isLoading={loading}
 *   unreadCount={5}
 *   onMarkAsRead={handleMarkAsRead}
 *   onMarkAllAsRead={handleMarkAllAsRead}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function NotificationList({
  notifications,
  isLoading = false,
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
  onViewAll,
  className,
  maxHeight = '96'
}: NotificationListProps) {
  // Render loading state
  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render empty state
  if (notifications.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <ScrollArea className={`h-${maxHeight}`}>
        <div className="divide-y">
          {notifications.map((notification) => {
            // Use specialized component for quote notifications
            if (notification.type.includes('quote')) {
              return (
                <QuoteNotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                />
              );
            }

            // Default notification rendering
            return (
              <DefaultNotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      {onViewAll && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={onViewAll}
            >
              View All Notifications
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * DefaultNotificationItem Component
 * 
 * Renders a standard notification item for non-quote notifications.
 */
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
}

function DefaultNotificationItem({
  notification,
  onMarkAsRead,
  onDelete
}: NotificationItemProps) {
  const isUnread = !notification.read_at;

  return (
    <div
      className={cn(
        'p-4 hover:bg-muted/50 transition-colors',
        isUnread && 'bg-blue-50/50'
      )}
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
                  Order: {notification.data.order_number}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: idLocale
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              {isUnread && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-6 w-6 p-0"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  title="Delete notification"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
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
              View Order Details →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get icon for notification based on type and status
 */
function getNotificationIcon(notification: Notification): string {
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
}

// Re-export Bell icon for empty state
import { Bell } from 'lucide-react';
