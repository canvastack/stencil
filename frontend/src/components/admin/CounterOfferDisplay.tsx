/**
 * CounterOfferDisplay Component
 * 
 * Displays detailed counter offer information in admin panel.
 * Shows item-by-item breakdown with comparison to original offer.
 * 
 * Features:
 * - Item-by-item breakdown
 * - Original vs Counter comparison
 * - Difference indicators (amount and percentage)
 * - Per-item notes display
 * - Summary section with totals
 * - Estimated delivery information
 * - Global notes display
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingDown, TrendingUp, Calendar, FileText, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CounterOfferItem {
  product_id: string;
  product_name: string;
  quantity: number;
  original_unit_price: number;
  original_total_price: number;
  counter_unit_price: number;
  counter_total_price: number;
  difference_amount: number;
  notes?: string;
}

interface CounterOfferDetails {
  items: CounterOfferItem[];
  total_counter: number;
  notes?: string;
  estimated_delivery_days?: number;
  submitted_at?: string;
}

interface CounterOfferDisplayProps {
  counterOffer: CounterOfferDetails;
  className?: string;
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export default function CounterOfferDisplay({
  counterOffer,
  className,
  onAccept,
  onReject,
  showActions = true,
}: CounterOfferDisplayProps) {
  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  /**
   * Get difference badge
   */
  const getDifferenceBadge = (differenceAmount: number) => {
    if (differenceAmount < 0) {
      return {
        icon: TrendingDown,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: 'Lower',
      };
    } else if (differenceAmount > 0) {
      return {
        icon: TrendingUp,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        label: 'Higher',
      };
    } else {
      return {
        icon: DollarSign,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        label: 'Same',
      };
    }
  };

  /**
   * Calculate summary
   */
  const calculateSummary = () => {
    const totalOriginal = counterOffer.items.reduce((sum, item) => sum + item.original_total_price, 0);
    const totalCounter = counterOffer.total_counter;
    const totalDifference = totalCounter - totalOriginal;
    const totalDifferencePercent = totalOriginal > 0 ? (totalDifference / totalOriginal) * 100 : 0;
    
    return {
      totalOriginal,
      totalCounter,
      totalDifference,
      totalDifferencePercent,
    };
  };

  const summary = calculateSummary();

  return (
    <Card className={cn('border-2 border-blue-200 dark:border-blue-800', className)}>
      <CardHeader className="bg-blue-50 dark:bg-blue-950">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <DollarSign className="h-5 w-5" />
              Vendor Counter Offer
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              {counterOffer.submitted_at && `Submitted on ${formatDate(counterOffer.submitted_at)}`}
            </CardDescription>
          </div>
          <Badge className="bg-blue-600 text-white">
            {counterOffer.items.length} Item{counterOffer.items.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Item Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Item Breakdown
          </h3>
          
          {counterOffer.items.map((item, index) => {
            const badge = getDifferenceBadge(item.difference_amount);
            const BadgeIcon = badge.icon;
            const differencePercent = item.original_total_price > 0
              ? (item.difference_amount / item.original_total_price) * 100
              : 0;
            
            return (
              <Card key={item.product_id} className="border-2">
                <CardContent className="p-4 space-y-3">
                  {/* Item Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base">{item.product_name}</h4>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <Badge className={cn('ml-2', badge.className)}>
                      <BadgeIcon className="h-3 w-3 mr-1" />
                      {badge.label}
                    </Badge>
                  </div>

                  {/* Pricing Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Offer */}
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        PT CEX Offer:
                      </p>
                      <p className="text-sm font-semibold">
                        {formatCurrency(item.original_unit_price)} /unit
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          × {item.quantity} = {formatCurrency(item.original_total_price)}
                        </p>
                      )}
                    </div>

                    {/* Vendor Counter */}
                    <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Vendor Counter:
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(item.counter_unit_price)} /unit
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          × {item.quantity} = {formatCurrency(item.counter_total_price)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Difference */}
                  {item.difference_amount !== 0 && (
                    <div className={cn(
                      'rounded-lg p-2 text-sm',
                      item.difference_amount < 0
                        ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                        : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                    )}>
                      <span className="font-medium">
                        Difference: {formatCurrency(Math.abs(item.difference_amount))}
                      </span>
                      <span className="ml-2">
                        ({Math.abs(differencePercent).toFixed(1)}% {item.difference_amount < 0 ? 'lower' : 'higher'})
                      </span>
                    </div>
                  )}

                  {/* Item Notes */}
                  {item.notes && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Vendor Notes:</span> {item.notes}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Section */}
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-base">
              <span className="text-muted-foreground">Original Total:</span>
              <span className="font-semibold">{formatCurrency(summary.totalOriginal)}</span>
            </div>
            
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Counter Total:</span>
              <span className="font-bold text-primary">
                {formatCurrency(summary.totalCounter)}
              </span>
            </div>
            
            {summary.totalDifference !== 0 && (
              <div className={cn(
                'flex justify-between items-center p-3 rounded-lg font-medium',
                summary.totalDifference < 0
                  ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
                  : 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'
              )}>
                <span>Total {summary.totalDifference < 0 ? 'Savings' : 'Increase'}:</span>
                <span className="font-bold">
                  {formatCurrency(Math.abs(summary.totalDifference))}
                  <span className="text-sm ml-2">
                    ({Math.abs(summary.totalDifferencePercent).toFixed(1)}%)
                  </span>
                </span>
              </div>
            )}

            {/* Estimated Delivery */}
            {counterOffer.estimated_delivery_days && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Estimated Delivery:</span>{' '}
                  {counterOffer.estimated_delivery_days} days
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Notes */}
        {counterOffer.notes && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Vendor Notes:</p>
              <p className="text-sm whitespace-pre-wrap">{counterOffer.notes}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
