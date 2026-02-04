import { useState, useEffect } from 'react';
import { Quote } from '@/services/tenant/quoteService';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface CounterOfferDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (price: number, notes?: string) => Promise<void>;
  loading?: boolean;
}

export const CounterOfferDialog = ({
  quote,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: CounterOfferDialogProps) => {
  const [newPrice, setNewPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Reset form when dialog opens with new quote
  useEffect(() => {
    if (open && quote) {
      setNewPrice('');
      setNotes('');
      setError('');
    }
  }, [open, quote]);

  const handleConfirm = async () => {
    const price = parseFloat(newPrice);

    // Validation
    if (!newPrice || isNaN(price)) {
      setError('Please enter a valid price');
      return;
    }

    if (price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (quote && price === quote.grand_total) {
      setError('New price must be different from current price');
      return;
    }

    setError('');
    await onConfirm(price, notes || undefined);
    setNewPrice('');
    setNotes('');
  };

  const handleCancel = () => {
    setNewPrice('');
    setNotes('');
    setError('');
    onOpenChange(false);
  };

  const handlePriceChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^\d.]/g, '');
    setNewPrice(sanitized);
    if (error) setError('');
  };

  if (!quote) return null;

  const currentPrice = quote.grand_total;
  const proposedPrice = parseFloat(newPrice) || 0;
  const difference = proposedPrice - currentPrice;
  const percentageChange = currentPrice > 0 ? (difference / currentPrice) * 100 : 0;
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-orange-600" />
            Counter Offer
          </DialogTitle>
          <DialogDescription>
            Propose a different price for this quote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quote Summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quote Number</p>
                <p className="text-lg font-semibold">{quote.quote_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(currentPrice, quote.currency)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-1">Vendor</p>
              <p className="font-medium">{quote.vendor.name}</p>
              <p className="text-sm text-muted-foreground">{quote.vendor.email}</p>
            </div>

            {quote.round !== undefined && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Negotiation Round: <span className="font-medium">{quote.round}</span>
                  {quote.round >= 4 && (
                    <span className="ml-2 text-orange-600">(Maximum 5 rounds)</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* New Price Input */}
          <div className="space-y-2">
            <Label htmlFor="counter-price">
              Proposed Price <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {quote.currency === 'IDR' ? 'Rp' : '$'}
              </span>
              <Input
                id="counter-price"
                type="text"
                placeholder="0.00"
                value={newPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                disabled={loading}
                className={`pl-12 ${error ? 'border-red-500' : ''}`}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Price Difference Display */}
          {proposedPrice > 0 && proposedPrice !== currentPrice && (
            <div className={`rounded-lg p-4 border ${
              isIncrease 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isIncrease ? (
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      isIncrease ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'
                    }`}>
                      {isIncrease ? 'Price Increase' : 'Price Decrease'}
                    </p>
                    <p className={`text-sm ${
                      isIncrease ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
                    }`}>
                      {formatCurrency(Math.abs(difference), quote.currency)} 
                      ({Math.abs(percentageChange).toFixed(2)}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">New Total</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(proposedPrice, quote.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="counter-notes">
              Notes (Optional)
            </Label>
            <Textarea
              id="counter-notes"
              placeholder="Explain the reason for this counter offer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              These notes will help the vendor understand your counter offer
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <p className="text-sm">
                The vendor will be notified of your counter offer and can choose to accept, 
                reject, or propose another price. Maximum 5 negotiation rounds allowed.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !newPrice || parseFloat(newPrice) <= 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Send Counter Offer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
