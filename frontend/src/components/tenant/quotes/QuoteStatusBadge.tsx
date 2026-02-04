import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type QuoteStatus = 'draft' | 'open' | 'sent' | 'countered' | 'accepted' | 'rejected' | 'cancelled' | 'revised' | 'expired';

interface StatusConfig {
  label: string;
  color: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  bgColor: string;
  textColor: string;
  icon: LucideIcon;
  description: string;
}

const statusConfig: Record<QuoteStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    color: 'secondary',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: FileText,
    description: 'Quote is being prepared and has not been sent yet',
  },
  open: {
    label: 'Open',
    color: 'outline',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: FileText,
    description: 'Quote is open and awaiting response',
  },
  sent: {
    label: 'Sent',
    color: 'outline',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Send,
    description: 'Quote has been sent and is awaiting response',
  },
  countered: {
    label: 'Countered',
    color: 'warning',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-300',
    icon: RefreshCw,
    description: 'Quote has been countered with a different price or terms',
  },
  accepted: {
    label: 'Accepted',
    color: 'success',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
    icon: CheckCircle,
    description: 'Quote has been accepted and order is proceeding',
  },
  rejected: {
    label: 'Rejected',
    color: 'destructive',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: XCircle,
    description: 'Quote has been rejected and will not proceed',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'secondary',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: XCircle,
    description: 'Quote has been cancelled and is no longer valid',
  },
  revised: {
    label: 'Revised',
    color: 'warning',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: RefreshCw,
    description: 'Quote has been revised with updated terms or pricing',
  },
  expired: {
    label: 'Expired',
    color: 'secondary',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: Clock,
    description: 'Quote validity period has expired',
  },
};

// Read-only statuses (closed quotes)
const readOnlyStatuses: QuoteStatus[] = ['accepted', 'rejected', 'expired', 'cancelled'];

// Active statuses (current negotiation)
const activeStatuses: QuoteStatus[] = ['open', 'sent', 'countered'];

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  className?: string;
  showIndicator?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const QuoteStatusBadge = ({
  status,
  className,
  showIndicator = true,
  size = 'md',
}: QuoteStatusBadgeProps) => {
  const config = statusConfig[status];
  const isReadOnly = readOnlyStatuses.includes(status);
  const isActive = activeStatuses.includes(status);

  const Icon = config.icon;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2">
            <Badge
              variant={config.color}
              className={cn(
                'inline-flex items-center gap-1.5 font-medium',
                config.bgColor,
                config.textColor,
                sizeClasses[size],
                className
              )}
            >
              <Icon className={iconSizes[size]} />
              <span>{config.label}</span>
            </Badge>

            {/* Indicator badges */}
            {showIndicator && isReadOnly && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs px-2 py-0.5 border-gray-300 dark:border-gray-600',
                  'text-gray-600 dark:text-gray-400'
                )}
              >
                Read-Only
              </Badge>
            )}

            {showIndicator && isActive && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs px-2 py-0.5 border-blue-300 dark:border-blue-600',
                  'text-blue-600 dark:text-blue-400 animate-pulse'
                )}
              >
                Active
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{config.label}</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {config.description}
            </p>
            {isReadOnly && (
              <p className="text-xs text-muted-foreground italic mt-2">
                This quote is closed and cannot be modified
              </p>
            )}
            {isActive && (
              <p className="text-xs text-blue-600 dark:text-blue-400 italic mt-2">
                This quote is currently active in negotiation
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Export helper functions for external use
export const isQuoteReadOnly = (status: QuoteStatus): boolean => {
  return readOnlyStatuses.includes(status);
};

export const isQuoteActive = (status: QuoteStatus): boolean => {
  return activeStatuses.includes(status);
};

export const getQuoteStatusConfig = (status: QuoteStatus): StatusConfig => {
  return statusConfig[status];
};
