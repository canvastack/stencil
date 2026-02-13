/**
 * QuoteStatusBadge Component
 * 
 * Displays quote status with appropriate color coding.
 * Supports all quote statuses and shows expired indicator.
 * 
 * Requirements: 5.8, 10.5
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export type QuoteStatus = 
  | 'draft'
  | 'sent'
  | 'pending_response'
  | 'accepted'
  | 'rejected'
  | 'countered'
  | 'expired'
  | 'cancelled';

export interface QuoteStatusBadgeProps {
  /**
   * Current status of the quote
   */
  status: QuoteStatus;
  
  /**
   * Whether the quote has expired
   */
  isExpired?: boolean;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Get badge variant based on quote status
 */
const getStatusVariant = (status: QuoteStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'accepted':
      return 'default'; // Green
    case 'rejected':
    case 'cancelled':
    case 'expired':
      return 'destructive'; // Red
    case 'sent':
    case 'pending_response':
      return 'secondary'; // Orange/Yellow
    case 'countered':
      return 'outline'; // Gray outline
    case 'draft':
    default:
      return 'outline'; // Gray outline
  }
};

/**
 * Format status text for display
 */
const formatStatusText = (status: QuoteStatus): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get custom color classes for specific statuses
 */
const getCustomColorClasses = (status: QuoteStatus): string => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800';
    case 'expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800';
    case 'sent':
    case 'pending_response':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800';
    case 'countered':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    case 'draft':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  }
};

export default function QuoteStatusBadge({
  status,
  isExpired = false,
  className,
}: QuoteStatusBadgeProps) {
  // If expired, override status display
  const displayStatus = isExpired ? 'expired' : status;
  const variant = getStatusVariant(displayStatus);
  const customColors = getCustomColorClasses(displayStatus);

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Badge 
        variant={variant}
        className={cn(customColors)}
      >
        {formatStatusText(displayStatus)}
      </Badge>
      {isExpired && status !== 'expired' && (
        <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
      )}
    </div>
  );
}
