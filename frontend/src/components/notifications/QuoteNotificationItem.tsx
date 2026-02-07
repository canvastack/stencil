import React from 'react';
import { Check, Trash2, FileText, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Notification } from '@/services/notificationService';
import { useNavigate } from 'react-router-dom';

interface QuoteNotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
}

/**
 * QuoteNotificationItem Component
 * 
 * Specialized notification item for quote-related notifications.
 * Displays quote-specific information and provides quick actions.
 * 
 * Supported notification types:
 * - quote_received: New quote request from admin
 * - quote_response: Vendor responded to quote (accept/reject/counter)
 * - quote_expired: Quote expired without response
 * - quote_extended: Quote expiration date extended
 * 
 * Features:
 * - Type-specific icons and colors
 * - Quote number and vendor/customer information
 * - Quick navigation to quote details
 * - Mark as read and delete actions
 * - Visual distinction for unread notifications
 * 
 * @example
 * ```tsx
 * <QuoteNotificationItem
 *   notification={quoteNotification}
 *   onMarkAsRead={handleMarkAsRead}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function QuoteNotificationItem({
  notification,
  onMarkAsRead,
  onDelete
}: QuoteNotificationItemProps) {
  const navigate = useNavigate();
  const isUnread = !notification.read_at;

  const handleViewQuote = () => {
    if (notification.data.quote_uuid) {
      navigate(`/admin/quotes/${notification.data.quote_uuid}`);
    }
  };

  const { icon, color, badgeVariant } = getQuoteNotificationStyle(notification);

  return (
    <div
      className={cn(
        'p-4 hover:bg-muted/50 transition-colors cursor-pointer',
        isUnread && 'bg-blue-50/50 border-l-4 border-l-blue-500'
      )}
      onClick={handleViewQuote}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('mt-0.5', color)}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Title */}
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900">
                  {getNotificationTitle(notification)}
                </p>
                {getNotificationBadge(notification, badgeVariant)}
              </div>
              
              {/* Message */}
              <p className="text-sm text-gray-700 mb-2">
                {notification.data.message || notification.message}
              </p>
              
              {/* Quote Details */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {notification.data.quote_number && (
                  <span className="font-medium">
                    Quote: #{notification.data.quote_number}
                  </span>
                )}
                
                {notification.data.customer_name && (
                  <span>
                    Customer: {notification.data.customer_name}
                  </span>
                )}
                
                {notification.data.vendor_name && (
                  <span>
                    Vendor: {notification.data.vendor_name}
                  </span>
                )}
                
                {notification.data.product_name && (
                  <span>
                    Product: {notification.data.product_name}
                  </span>
                )}
                
                {notification.data.quantity && (
                  <span>
                    Qty: {notification.data.quantity}
                  </span>
                )}
              </div>
              
              {/* Response Notes (for quote_response type) */}
              {notification.data.response_notes && (
                <p className="text-xs text-gray-600 mt-2 italic">
                  Note: {notification.data.response_notes}
                </p>
              )}
              
              {/* Timestamp */}
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: idLocale
                })}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {isUnread && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-7 w-7 p-0"
                  title="Mark as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                  title="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Action Button */}
          {notification.data.quote_uuid && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs mt-2 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                handleViewQuote();
              }}
            >
              View Quote Details →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get notification title based on type
 */
function getNotificationTitle(notification: Notification): string {
  const type = notification.type;
  
  if (type.includes('quote_received')) {
    return 'New Quote Request';
  }
  
  if (type.includes('quote_response')) {
    const responseType = notification.data.response_type;
    if (responseType === 'accept') return 'Quote Accepted';
    if (responseType === 'reject') return 'Quote Rejected';
    if (responseType === 'counter') return 'Counter Offer Received';
    return 'Vendor Response';
  }
  
  if (type.includes('quote_expired')) {
    return 'Quote Expired';
  }
  
  if (type.includes('quote_extended')) {
    return 'Quote Extended';
  }
  
  return 'Quote Notification';
}

/**
 * Get notification badge based on type and response
 */
function getNotificationBadge(
  notification: Notification,
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
): React.ReactNode {
  const type = notification.type;
  
  if (type.includes('quote_received')) {
    return <Badge variant="default" className="text-xs">New</Badge>;
  }
  
  if (type.includes('quote_response')) {
    const responseType = notification.data.response_type;
    if (responseType === 'accept') {
      return <Badge variant="success" className="text-xs bg-green-100 text-green-800">Accepted</Badge>;
    }
    if (responseType === 'reject') {
      return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
    }
    if (responseType === 'counter') {
      return <Badge variant="warning" className="text-xs bg-orange-100 text-orange-800">Counter</Badge>;
    }
  }
  
  if (type.includes('quote_expired')) {
    return <Badge variant="secondary" className="text-xs">Expired</Badge>;
  }
  
  if (type.includes('quote_extended')) {
    return <Badge variant="outline" className="text-xs">Extended</Badge>;
  }
  
  return null;
}

/**
 * Get icon and color styling based on notification type
 */
function getQuoteNotificationStyle(notification: Notification): {
  icon: React.ReactNode;
  color: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
} {
  const type = notification.type;
  
  if (type.includes('quote_received')) {
    return {
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600',
      badgeVariant: 'default'
    };
  }
  
  if (type.includes('quote_response')) {
    const responseType = notification.data.response_type;
    
    if (responseType === 'accept') {
      return {
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'text-green-600',
        badgeVariant: 'success'
      };
    }
    
    if (responseType === 'reject') {
      return {
        icon: <XCircle className="h-5 w-5" />,
        color: 'text-red-600',
        badgeVariant: 'destructive'
      };
    }
    
    if (responseType === 'counter') {
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        color: 'text-orange-600',
        badgeVariant: 'warning'
      };
    }
  }
  
  if (type.includes('quote_expired')) {
    return {
      icon: <Clock className="h-5 w-5" />,
      color: 'text-gray-600',
      badgeVariant: 'secondary'
    };
  }
  
  if (type.includes('quote_extended')) {
    return {
      icon: <Clock className="h-5 w-5" />,
      color: 'text-blue-600',
      badgeVariant: 'outline'
    };
  }
  
  // Default
  return {
    icon: <FileText className="h-5 w-5" />,
    color: 'text-gray-600',
    badgeVariant: 'default'
  };
}
