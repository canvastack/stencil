/**
 * AcceptCounterOfferModal Component
 * 
 * Modal for accepting vendor counter offer with customer pricing input.
 * Allows admin to set customer price and automatically calculates profit margin.
 * 
 * Features:
 * - Display vendor counter offer summary
 * - Input field for customer price
 * - Real-time profit margin calculation
 * - Validation: customer price >= vendor price
 * - Suggested markup (30-35%)
 * - Preview section with all calculations
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CounterOfferItem {
  product_name: string;
  quantity: number;
  counter_unit_price: number;
  counter_total_price: number;
}

interface AcceptCounterOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorCounterOffer: {
    items: CounterOfferItem[];
    total_counter: number;
  };
  onAccept: (customerPrice: number, notes?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function AcceptCounterOfferModal({
  open,
  onOpenChange,
  vendorCounterOffer,
  onAccept,
  isSubmitting = false,
}: AcceptCounterOfferModalProps) {
  const [customerPrice, setCustomerPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Calculate suggested markup (35%)
  const suggestedMarkup = 0.35;
  const suggestedPrice = vendorCounterOffer.total_counter * (1 + suggestedMarkup);

  // Initialize with suggested price
  useEffect(() => {
    if (open) {
      setCustomerPrice(Math.round(suggestedPrice).toString());
      setNotes('');
      setError(null);
    }
  }, [open, suggestedPrice]);

  /**
   * Calculate profit metrics
   */
  const calculateProfit = () => {
    const customerPriceNum = parseFloat(customerPrice) || 0;
    const vendorCost = vendorCounterOffer.total_counter;
    
    if (customerPriceNum < vendorCost) {
      return {
        profitAmount: 0,
        profitPercent: 0,
        isValid: false,
      };
    }
    
    const profitAmount = customerPriceNum - vendorCost;
    const profitPercent = (profitAmount / vendorCost) * 100;
    
    return {
      profitAmount,
      profitPercent,
      isValid: true,
    };
  };

  const profit = calculateProfit();

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
   * Handle accept
   */
  const handleAccept = async () => {
    // Validation
    if (!customerPrice || parseFloat(customerPrice) <= 0) {
      setError('Customer price is required');
      return;
    }
    
    if (!profit.isValid) {
      setError('Customer price must be greater than or equal to vendor cost');
      return;
    }
    
    try {
      setError(null);
      await onAccept(parseFloat(customerPrice), notes || undefined);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to accept counter offer');
    }
  };

  /**
   * Get profit badge color
   */
  const getProfitBadgeColor = () => {
    if (!profit.isValid) return 'destructive';
    if (profit.profitPercent < 20) return 'secondary';
    if (profit.profitPercent < 30) return 'default';
    return 'default';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Accept Counter Offer & Set Customer Pricing
          </DialogTitle>
          <DialogDescription>
            Review vendor's counter offer and set the price for customer quotation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vendor Counter Offer Summary */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Vendor Counter Offer Summary
              </h3>
              
              <div className="space-y-2">
                {vendorCounterOffer.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.counter_total_price)}
                    </span>
                  </div>
                ))}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-semibold">
                  <span>Total Vendor Cost:</span>
                  <span className="text-lg">
                    {formatCurrency(vendorCounterOffer.total_counter)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Pricing Input */}
          <div className="space-y-2">
            <Label htmlFor="customer_price">
              Customer Price (Rp) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer_price"
              type="number"
              min={vendorCounterOffer.total_counter}
              step="1000"
              placeholder="e.g., 89100000"
              value={customerPrice}
              onChange={(e) => {
                setCustomerPrice(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
              className={error ? 'border-destructive' : ''}
            />
            
            {/* Suggested Price */}
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <strong>Suggested:</strong> {formatCurrency(suggestedPrice)} 
                <span className="text-sm ml-2">
                  ({(suggestedMarkup * 100).toFixed(0)}% markup)
                </span>
              </AlertDescription>
            </Alert>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Profit Calculation Preview */}
          {customerPrice && parseFloat(customerPrice) > 0 && (
            <Card className={cn(
              'border-2',
              profit.isValid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
            )}>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Profit Calculation
                  <Badge variant={getProfitBadgeColor()} className="ml-auto">
                    {profit.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vendor Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(vendorCounterOffer.total_counter)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer Price:</span>
                    <span className="font-medium">
                      {formatCurrency(parseFloat(customerPrice) || 0)}
                    </span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between font-semibold text-green-600 dark:text-green-400">
                    <span>Profit Margin:</span>
                    <span>{profit.profitPercent.toFixed(2)}%</span>
                  </div>
                  
                  <div className="flex justify-between font-semibold text-green-600 dark:text-green-400">
                    <span>Profit Amount:</span>
                    <span className="text-lg">
                      {formatCurrency(profit.profitAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
              placeholder="e.g., Approved with 35% markup for operational costs..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/1000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isSubmitting || !profit.isValid}
          >
            {isSubmitting ? 'Processing...' : 'Accept & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
