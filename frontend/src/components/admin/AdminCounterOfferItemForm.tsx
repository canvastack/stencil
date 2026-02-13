/**
 * AdminCounterOfferItemForm Component
 * 
 * Form for admin to input counter offer pricing per item.
 * Shows vendor's counter price and allows admin to counter back.
 * 
 * Features:
 * - Display vendor's counter price (read-only)
 * - Input for admin's counter price
 * - Real-time total calculation
 * - Validation (must be different from vendor counter)
 * - Optional notes per item
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingDown, TrendingUp, AlertCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CounterOfferItem {
  product_id: string;
  product_name: string;
  quantity: number;
  counter_unit_price: number;
  counter_total_price: number;
}

interface AdminCounterOfferItemFormProps {
  item: CounterOfferItem;
  value: {
    admin_counter_unit_price: number;
    notes?: string;
  };
  onChange: (value: { admin_counter_unit_price: number; notes?: string }) => void;
  currency?: string;
  disabled?: boolean;
}

export default function AdminCounterOfferItemForm({
  item,
  value,
  onChange,
  currency = 'IDR',
  disabled = false,
}: AdminCounterOfferItemFormProps) {
  const [adminPrice, setAdminPrice] = useState<string>(value.admin_counter_unit_price.toString());
  const [notes, setNotes] = useState<string>(value.notes || '');
  const [error, setError] = useState<string | null>(null);

  // Update local state when value prop changes
  useEffect(() => {
    setAdminPrice(value.admin_counter_unit_price.toString());
    setNotes(value.notes || '');
  }, [value]);

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
   * Handle price change
   */
  const handlePriceChange = (newPrice: string) => {
    setAdminPrice(newPrice);
    
    const priceNum = parseFloat(newPrice) || 0;
    
    // Validation
    if (priceNum <= 0) {
      setError('Price must be greater than 0');
    } else if (priceNum === item.counter_unit_price) {
      setError('Admin counter must be different from vendor counter');
    } else {
      setError(null);
    }
    
    onChange({
      admin_counter_unit_price: priceNum,
      notes,
    });
  };

  /**
   * Handle notes change
   */
  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    onChange({
      admin_counter_unit_price: parseFloat(adminPrice) || 0,
      notes: newNotes || undefined,
    });
  };

  /**
   * Calculate difference
   */
  const calculateDifference = () => {
    const adminPriceNum = parseFloat(adminPrice) || 0;
    const vendorPrice = item.counter_unit_price;
    const difference = adminPriceNum - vendorPrice;
    const differencePercent = vendorPrice > 0 ? (difference / vendorPrice) * 100 : 0;
    
    return {
      amount: difference,
      percent: differencePercent,
      isLower: difference < 0,
      isHigher: difference > 0,
      isSame: difference === 0,
    };
  };

  const diff = calculateDifference();
  const adminTotal = (parseFloat(adminPrice) || 0) * item.quantity;

  return (
    <Card className={cn(
      'border-2',
      error ? 'border-red-200 dark:border-red-800' : 'border-blue-200 dark:border-blue-800'
    )}>
      <CardContent className="pt-6 space-y-4">
        {/* Item Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Package className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-base">{item.product_name}</h4>
              <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
            </div>
          </div>
          {diff.isSame ? (
            <Badge variant="outline" className="text-muted-foreground">
              Same Price
            </Badge>
          ) : diff.isLower ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <TrendingDown className="h-3 w-3 mr-1" />
              Lower
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              Higher
            </Badge>
          )}
        </div>

        {/* Pricing Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vendor Counter (Read-only) */}
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3 border border-orange-200 dark:border-orange-800">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Vendor Counter:
            </p>
            <p className="text-sm font-bold text-orange-600">
              {formatCurrency(item.counter_unit_price)} /unit
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                × {item.quantity} = {formatCurrency(item.counter_total_price)}
              </p>
            )}
          </div>

          {/* Admin Counter (Editable) */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-200 dark:border-blue-800">
            <Label htmlFor={`admin_price_${item.product_id}`} className="text-xs font-medium text-muted-foreground mb-1 block">
              Admin Counter: <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`admin_price_${item.product_id}`}
              type="number"
              min="0"
              step="1000"
              placeholder="e.g., 5000000"
              value={adminPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              disabled={disabled}
              className={cn(
                'text-sm font-bold',
                error ? 'border-destructive' : 'border-blue-300 dark:border-blue-700'
              )}
            />
            {item.quantity > 1 && adminTotal > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                × {item.quantity} = {formatCurrency(adminTotal)}
              </p>
            )}
          </div>
        </div>

        {/* Difference Display */}
        {!diff.isSame && adminTotal > 0 && (
          <div className={cn(
            'rounded-lg p-2 text-sm',
            diff.isLower
              ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
          )}>
            <span className="font-medium">
              Difference: {formatCurrency(Math.abs(diff.amount))} /unit
            </span>
            <span className="ml-2">
              ({Math.abs(diff.percent).toFixed(1)}% {diff.isLower ? 'lower' : 'higher'})
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor={`notes_${item.product_id}`} className="text-sm">
            Notes (Optional)
          </Label>
          <Textarea
            id={`notes_${item.product_id}`}
            placeholder="e.g., Price adjusted based on market conditions..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            disabled={disabled}
            className="min-h-[60px] text-sm"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {notes.length}/500 characters
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
