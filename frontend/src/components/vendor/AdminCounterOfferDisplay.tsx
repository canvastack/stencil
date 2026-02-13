/**
 * AdminCounterOfferDisplay Component
 * 
 * Displays admin's counter offer to vendor's counter offer.
 * Shows comparison between vendor counter and admin counter.
 * 
 * Features:
 * - Blue card design (admin counter theme)
 * - Item-by-item comparison
 * - Total comparison
 * - Admin notes display
 * - Round counter
 * - Clear call-to-action
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingDown, TrendingUp, FileText, Package, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminCounterItem {
  product_id: string;
  product_name: string;
  quantity: number;
  vendor_counter_unit_price: number;
  vendor_counter_total_price: number;
  admin_counter_unit_price: number;
  admin_counter_total_price: number;
  difference_amount: number;
  notes?: string;
}

interface AdminCounterOfferDetails {
  items: AdminCounterItem[];
  total_admin_counter: number;
  total_vendor_counter: number;
  total_difference: number;
  notes?: string;
  submitted_at?: string;
  round: number;
}

interface AdminCounterOfferDisplayProps {
  adminCounterOffer: AdminCounterOfferDetails;
  currentRound: number;
  maxRounds: number;
  className?: string;
}

export default function AdminCounterOfferDisplay({
  adminCounterOffer,
  currentRound,
  maxRounds,
  className,
}: AdminCounterOfferDisplayProps) {
  /**
   * Safely convert to number
   */
  const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number | string): string => {
    const numAmount = toNumber(amount);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
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
  const getDifferenceBadge = (differenceAmount: number | string) => {
    const diff = toNumber(differenceAmount);
    if (diff < 0) {
      return {
        icon: TrendingDown,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: 'Lower',
      };
    } else if (diff > 0) {
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

  return (
    <Card className={cn('border-2 border-blue-200 dark:border-blue-800', className)}>
      <CardHeader className="bg-blue-50 dark:bg-blue-950">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <RefreshCw className="h-5 w-5" />
              Counter Offer dari Admin PT CEX
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              {adminCounterOffer.submitted_at && `Dikirim pada ${formatDate(adminCounterOffer.submitted_at)}`}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-blue-600 text-white">
              Round {currentRound} dari {maxRounds}
            </Badge>
            <Badge variant="outline" className="border-blue-600 text-blue-600">
              {adminCounterOffer.items.length} Item{adminCounterOffer.items.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Total Comparison - Prominent Display */}
        <Card className="border-2 border-blue-600 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Your Counter */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Counter Offer Anda:</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {formatCurrency(adminCounterOffer.total_vendor_counter)}
                </p>
              </div>

              {/* Admin Counter */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Counter Offer Admin:</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(adminCounterOffer.total_admin_counter)}
                </p>
              </div>
            </div>

            {/* Difference */}
            {toNumber(adminCounterOffer.total_difference) !== 0 && (
              <div className={cn(
                'mt-4 p-3 rounded-lg font-medium text-center',
                toNumber(adminCounterOffer.total_difference) < 0
                  ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
                  : 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'
              )}>
                <span>
                  Admin menawarkan {formatCurrency(Math.abs(toNumber(adminCounterOffer.total_difference)))}{' '}
                  {toNumber(adminCounterOffer.total_difference) < 0 ? 'lebih rendah' : 'lebih tinggi'} dari counter Anda
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Notes */}
        {adminCounterOffer.notes && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              <p className="font-medium mb-1 text-blue-900 dark:text-blue-100">Catatan dari Admin:</p>
              <p className="text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">
                {adminCounterOffer.notes}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Item Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Perbandingan Per Item
          </h3>
          
          {adminCounterOffer.items.map((item) => {
            const badge = getDifferenceBadge(item.difference_amount);
            const BadgeIcon = badge.icon;
            
            // Safe number conversions
            const vendorTotal = toNumber(item.vendor_counter_total_price);
            const diffAmount = toNumber(item.difference_amount);
            const differencePercent = vendorTotal > 0
              ? (diffAmount / vendorTotal) * 100
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
                    {/* Your Counter */}
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Counter Anda:
                      </p>
                      <p className="text-sm font-semibold">
                        {formatCurrency(item.vendor_counter_unit_price)} /unit
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          × {item.quantity} = {formatCurrency(item.vendor_counter_total_price)}
                        </p>
                      )}
                    </div>

                    {/* Admin Counter */}
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Counter Admin:
                      </p>
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(item.admin_counter_unit_price)} /unit
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          × {item.quantity} = {formatCurrency(item.admin_counter_total_price)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Difference */}
                  {diffAmount !== 0 && (
                    <div className={cn(
                      'rounded-lg p-2 text-sm',
                      diffAmount < 0
                        ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                        : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                    )}>
                      <span className="font-medium">
                        Selisih: {formatCurrency(Math.abs(diffAmount))}
                      </span>
                      <span className="ml-2">
                        ({Math.abs(differencePercent).toFixed(1)}% {diffAmount < 0 ? 'lebih rendah' : 'lebih tinggi'})
                      </span>
                    </div>
                  )}

                  {/* Item Notes */}
                  {item.notes && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Catatan Admin:</span> {item.notes}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Info */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-2">Pilihan Anda:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Terima Counter Admin</strong> - Setujui harga yang ditawarkan admin</li>
              <li><strong>Counter Lagi</strong> - Ajukan harga baru (tersisa {maxRounds - currentRound} round)</li>
              <li><strong>Tolak</strong> - Tolak penawaran ini</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
