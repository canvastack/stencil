/**
 * CounterOfferItemForm Component
 * 
 * Form for item-by-item counter offer pricing.
 * Displays each quote item with input for counter price and auto-calculates totals.
 * 
 * Features:
 * - Item-by-item pricing input
 * - Real-time calculation of totals
 * - Difference indicators (amount and percentage)
 * - Optional notes per item
 * - Summary section with grand totals
 * - Validation for all required fields
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuoteItem } from '@/types/vendor/portal';

interface CounterOfferItemData {
  product_id: string;
  product_name: string;
  quantity: number;
  original_unit_price: number;
  original_total_price: number;
  counter_unit_price: number;
  counter_total_price: number;
  difference_amount: number;
  difference_percent: number;
  notes?: string;
}

interface CounterOfferItemFormProps {
  items: QuoteItem[];
  onItemsChange: (items: CounterOfferItemData[]) => void;
  disabled?: boolean;
}

export default function CounterOfferItemForm({
  items,
  onItemsChange,
  disabled = false,
}: CounterOfferItemFormProps) {
  const [counterItems, setCounterItems] = useState<CounterOfferItemData[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize counter items from quote items
  useEffect(() => {
    const initialItems: CounterOfferItemData[] = items.map((item) => {
      // SECURITY: ONLY use vendor_cost, NEVER use unit_price (customer pricing)
      // Exposing unit_price reveals PT CEX's profit margin to vendors
      const originalUnitPrice = item.vendor_cost || 0;
      const originalTotalPrice = item.total_vendor_cost || (originalUnitPrice * item.quantity);
      
      return {
        product_id: item.product_id,
        product_name: item.product_name || item.description || 'Unknown Product',
        quantity: item.quantity,
        original_unit_price: originalUnitPrice,
        original_total_price: originalTotalPrice,
        counter_unit_price: originalUnitPrice, // Default to original price
        counter_total_price: originalTotalPrice,
        difference_amount: 0,
        difference_percent: 0,
        notes: '',
      };
    });
    
    setCounterItems(initialItems);
    onItemsChange(initialItems);
  }, [items]);

  /**
   * Handle counter price change for an item
   */
  const handlePriceChange = (index: number, value: string) => {
    const newItems = [...counterItems];
    const item = newItems[index];
    
    // Parse and validate price
    const counterUnitPrice = parseFloat(value) || 0;
    
    // Calculate totals
    const counterTotalPrice = counterUnitPrice * item.quantity;
    const differenceAmount = counterTotalPrice - item.original_total_price;
    const differencePercent = item.original_total_price > 0
      ? (differenceAmount / item.original_total_price) * 100
      : 0;
    
    // Update item
    newItems[index] = {
      ...item,
      counter_unit_price: counterUnitPrice,
      counter_total_price: counterTotalPrice,
      difference_amount: differenceAmount,
      difference_percent: differencePercent,
    };
    
    setCounterItems(newItems);
    onItemsChange(newItems);
    
    // Clear error for this item
    const newErrors = { ...errors };
    delete newErrors[`item_${index}`];
    setErrors(newErrors);
  };

  /**
   * Handle notes change for an item
   */
  const handleNotesChange = (index: number, value: string) => {
    const newItems = [...counterItems];
    newItems[index] = {
      ...newItems[index],
      notes: value,
    };
    
    setCounterItems(newItems);
    onItemsChange(newItems);
  };

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
   * Get difference badge variant
   */
  const getDifferenceBadge = (differencePercent: number) => {
    if (differencePercent < 0) {
      return {
        variant: 'default' as const,
        icon: TrendingDown,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: 'Lower',
      };
    } else if (differencePercent > 0) {
      return {
        variant: 'destructive' as const,
        icon: TrendingUp,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        label: 'Higher',
      };
    } else {
      return {
        variant: 'secondary' as const,
        icon: DollarSign,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        label: 'Same',
      };
    }
  };

  /**
   * Calculate summary totals
   */
  const calculateSummary = () => {
    const totalOriginal = counterItems.reduce((sum, item) => sum + item.original_total_price, 0);
    const totalCounter = counterItems.reduce((sum, item) => sum + item.counter_total_price, 0);
    const totalDifference = totalCounter - totalOriginal;
    const totalDifferencePercent = totalOriginal > 0 ? (totalDifference / totalOriginal) * 100 : 0;
    const allItemsPriced = counterItems.every(item => item.counter_unit_price > 0);
    
    return {
      totalOriginal,
      totalCounter,
      totalDifference,
      totalDifferencePercent,
      allItemsPriced,
    };
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-4">
      {/* Items */}
      {counterItems.map((item, index) => {
        const badge = getDifferenceBadge(item.difference_percent);
        const BadgeIcon = badge.icon;
        
        return (
          <Card key={item.product_id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.product_name}</CardTitle>
                  <CardDescription>Quantity: {item.quantity}</CardDescription>
                </div>
                {item.counter_unit_price > 0 && (
                  <Badge className={cn('ml-2', badge.className)}>
                    <BadgeIcon className="h-3 w-3 mr-1" />
                    {badge.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vendor Cost (PT CEX's offer to vendor) */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Biaya Vendor (Penawaran PT CEX ke Anda):
                </p>
                <p className="text-base font-semibold">
                  {formatCurrency(item.original_unit_price)} per unit
                  {item.quantity > 1 && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      × {item.quantity} = {formatCurrency(item.original_total_price)}
                    </span>
                  )}
                </p>
              </div>

              {/* Counter Price Input */}
              <div className="space-y-2">
                <Label htmlFor={`counter_price_${index}`}>
                  Harga Counter Anda per Unit <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`counter_price_${index}`}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="contoh: 11000000"
                  value={item.counter_unit_price || ''}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  disabled={disabled}
                  className={errors[`item_${index}`] ? 'border-destructive' : ''}
                />
                {errors[`item_${index}`] && (
                  <p className="text-sm text-destructive">{errors[`item_${index}`]}</p>
                )}
              </div>

              {/* Calculated Total */}
              {item.counter_unit_price > 0 && (
                <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total untuk item ini:
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(item.counter_total_price)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kalkulasi: {formatCurrency(item.counter_unit_price)} × {item.quantity}
                  </p>
                </div>
              )}

              {/* Difference Indicator */}
              {item.counter_unit_price > 0 && item.difference_amount !== 0 && (
                <div className={cn(
                  'rounded-lg p-3 border',
                  item.difference_amount < 0
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                )}>
                  <p className="text-sm font-medium">
                    Selisih: {formatCurrency(Math.abs(item.difference_amount))}
                    <span className="ml-2">
                      ({Math.abs(item.difference_percent).toFixed(1)}% {item.difference_amount < 0 ? 'lebih rendah' : 'lebih tinggi'})
                    </span>
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor={`notes_${index}`}>Catatan untuk item ini (Opsional)</Label>
                <Textarea
                  id={`notes_${index}`}
                  placeholder="contoh: Bisa kirim dalam 10 hari, diskon bulk diterapkan..."
                  value={item.notes || ''}
                  onChange={(e) => handleNotesChange(index, e.target.value)}
                  disabled={disabled}
                  rows={2}
                  maxLength={500}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Summary */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Ringkasan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Biaya Vendor (Penawaran PT CEX):</span>
            <span className="font-semibold">{formatCurrency(summary.totalOriginal)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Counter Offer Anda:</span>
            <span className="font-bold text-lg text-primary">
              {formatCurrency(summary.totalCounter)}
            </span>
          </div>
          
          {summary.totalDifference !== 0 && (
            <div className={cn(
              'flex justify-between items-center p-2 rounded-lg',
              summary.totalDifference < 0
                ? 'bg-green-50 dark:bg-green-950'
                : 'bg-red-50 dark:bg-red-950'
            )}>
              <span className="font-medium">Total Selisih:</span>
              <span className="font-bold">
                {formatCurrency(Math.abs(summary.totalDifference))}
                <span className="text-sm ml-2">
                  ({Math.abs(summary.totalDifferencePercent).toFixed(1)}% {summary.totalDifference < 0 ? 'lebih rendah' : 'lebih tinggi'})
                </span>
              </span>
            </div>
          )}
          
          {/* Status Indicator */}
          <Alert variant={summary.allItemsPriced ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {summary.allItemsPriced
                ? '✓ Semua item sudah diberi harga'
                : `⚠ ${counterItems.filter(i => i.counter_unit_price <= 0).length} item perlu diberi harga`
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
