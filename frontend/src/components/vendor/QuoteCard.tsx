/**
 * QuoteCard Component
 * 
 * Displays quote information in a card format.
 * Shows quote number, order details, status, dates, and unread messages.
 * 
 * Requirements: 4.5, 13.9
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuoteStatusBadge, { QuoteStatus } from './QuoteStatusBadge';
import { Calendar, MessageCircle, User, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface QuoteCardProps {
  /**
   * Quote UUID for navigation
   */
  uuid: string;
  
  /**
   * Quote number (e.g., "Q-2024-001")
   */
  quoteNumber: string;
  
  /**
   * Order number (e.g., "ORD-2024-001")
   */
  orderNumber?: string;
  
  /**
   * Customer name
   */
  customerName?: string;
  
  /**
   * Quote status
   */
  status: QuoteStatus;
  
  /**
   * Quote creation date
   */
  createdAt: string | Date;
  
  /**
   * Quote expiration date
   */
  expiresAt?: string | Date | null;
  
  /**
   * Number of unread messages
   */
  unreadMessageCount?: number;
  
  /**
   * Click handler for navigation
   */
  onClick?: (uuid: string) => void;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

export default function QuoteCard({
  uuid,
  quoteNumber,
  orderNumber,
  customerName,
  status,
  createdAt,
  expiresAt,
  unreadMessageCount = 0,
  onClick,
  className,
}: QuoteCardProps) {
  // Check if quote is expired
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  
  // Format dates
  const createdDate = new Date(createdAt);
  const expirationDate = expiresAt ? new Date(expiresAt) : null;
  
  const handleClick = () => {
    if (onClick) {
      onClick(uuid);
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-primary/50',
        'relative overflow-hidden',
        className
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {unreadMessageCount > 0 && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full m-2" />
      )}
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header: Quote Number and Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-lg">{quoteNumber}</h3>
            </div>
            <QuoteStatusBadge status={status} isExpired={isExpired} />
          </div>

          {/* Order and Customer Info */}
          <div className="space-y-1 text-sm text-muted-foreground">
            {orderNumber && (
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                <span>Order: {orderNumber}</span>
              </div>
            )}
            {customerName && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>Customer: {customerName}</span>
              </div>
            )}
          </div>

          {/* Footer: Dates and Messages */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(createdDate, { addSuffix: true })}</span>
              </div>
              {expirationDate && (
                <div className={cn(
                  'flex items-center gap-1',
                  isExpired && 'text-red-600 dark:text-red-400 font-medium'
                )}>
                  <Calendar className="h-3 w-3" />
                  <span>
                    {isExpired ? 'Expired' : 'Expires'}: {formatDistanceToNow(expirationDate, { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
            
            {unreadMessageCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{unreadMessageCount} new</span>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
