import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  User,
  DollarSign,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';

interface QuoteHistoryEntry {
  action: string;
  user_id?: string;
  user_name?: string;
  vendor_id?: string;
  timestamp: string;
  old_value?: any;
  new_value?: any;
  notes?: string;
  ip_address?: string;
  previous_offer?: number;
  new_offer?: number;
  offer?: number;
  rejection_reason?: string;
}

interface QuoteHistoryProps {
  history: QuoteHistoryEntry[];
  currency?: string;
  className?: string;
  maxVisibleEntries?: number;
}

// Action configuration for icons and labels
const actionConfig: Record<string, {
  label: string;
  icon: typeof Clock;
  color: string;
  bgColor: string;
}> = {
  created: {
    label: 'Quote Created',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  initial_quote: {
    label: 'Initial Quote',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  sent: {
    label: 'Sent to Vendor',
    icon: Send,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  countered: {
    label: 'Counter Offer',
    icon: RefreshCw,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  accepted: {
    label: 'Quote Accepted',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  rejected: {
    label: 'Quote Rejected',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  expired: {
    label: 'Quote Expired',
    icon: Clock,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  cancelled: {
    label: 'Quote Cancelled',
    icon: XCircle,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  revised: {
    label: 'Quote Revised',
    icon: RefreshCw,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  price_updated: {
    label: 'Price Updated',
    icon: DollarSign,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

const getActionConfig = (action: string) => {
  return actionConfig[action] || {
    label: action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    icon: FileText,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  };
};

const formatTimestamp = (timestamp: string): string => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    return timestamp;
  }
};

const formatFullDate = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return timestamp;
  }
};

export const QuoteHistory = ({
  history = [],
  currency = 'IDR',
  className,
  maxVisibleEntries = 5,
}: QuoteHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort history by timestamp (newest first)
  const sortedHistory = [...history].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Determine visible entries
  const visibleHistory = isExpanded
    ? sortedHistory
    : sortedHistory.slice(0, maxVisibleEntries);
  const hasMore = sortedHistory.length > maxVisibleEntries;

  if (!history || history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Negotiation History
          </CardTitle>
          <CardDescription>No history entries yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground">
              History will appear here as actions are taken on this quote
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Negotiation History
        </CardTitle>
        <CardDescription>
          Complete timeline of all quote actions ({sortedHistory.length} {sortedHistory.length === 1 ? 'entry' : 'entries'})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleHistory.map((entry, index) => {
            const config = getActionConfig(entry.action);
            const Icon = config.icon;
            const isLast = index === visibleHistory.length - 1 && !hasMore;

            return (
              <div key={index} className="flex gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      config.bgColor
                    )}
                  >
                    <Icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 h-full min-h-[40px] bg-border mt-2" />
                  )}
                </div>

                {/* Entry content */}
                <div className="flex-1 pb-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h4 className="font-medium text-base">{config.label}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {entry.user_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{entry.user_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span title={formatFullDate(entry.timestamp)}>
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatFullDate(entry.timestamp).split(',')[0]}
                    </Badge>
                  </div>

                  {/* Price changes for counter offers */}
                  {(entry.previous_offer || entry.new_offer || entry.offer) && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2">
                      {entry.previous_offer && entry.new_offer && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Previous Offer:</span>
                            <span className="font-medium line-through">
                              {formatCurrency(entry.previous_offer, currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">New Offer:</span>
                            <span className="font-bold text-primary">
                              {formatCurrency(entry.new_offer, currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground">Difference:</span>
                            <span
                              className={cn(
                                'font-medium',
                                entry.new_offer > entry.previous_offer
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-green-600 dark:text-green-400'
                              )}
                            >
                              {entry.new_offer > entry.previous_offer ? '+' : ''}
                              {formatCurrency(
                                entry.new_offer - entry.previous_offer,
                                currency
                              )}
                              {' '}
                              (
                              {(
                                ((entry.new_offer - entry.previous_offer) /
                                  entry.previous_offer) *
                                100
                              ).toFixed(1)}
                              %)
                            </span>
                          </div>
                        </>
                      )}
                      {entry.offer && !entry.previous_offer && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Offer Amount:</span>
                          <span className="font-bold text-primary">
                            {formatCurrency(entry.offer, currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Old/New value changes */}
                  {entry.old_value && entry.new_value && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Previous:</span>
                        <span className="font-medium line-through">
                          {typeof entry.old_value === 'number'
                            ? formatCurrency(entry.old_value, currency)
                            : String(entry.old_value)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="font-bold text-primary">
                          {typeof entry.new_value === 'number'
                            ? formatCurrency(entry.new_value, currency)
                            : String(entry.new_value)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {entry.action === 'rejected' && (entry.notes || entry.rejection_reason) && (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                            Rejection Reason
                          </p>
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {entry.notes || entry.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General notes */}
                  {entry.notes && entry.action !== 'rejected' && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {entry.notes}
                      </p>
                    </div>
                  )}

                  {/* IP address for vendor responses (if available) */}
                  {entry.ip_address && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      IP: {entry.ip_address}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Expand/Collapse button */}
          {hasMore && (
            <div className="flex justify-center pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show {sortedHistory.length - maxVisibleEntries} More{' '}
                    {sortedHistory.length - maxVisibleEntries === 1 ? 'Entry' : 'Entries'}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
