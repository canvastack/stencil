import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface AcceptQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes?: string) => Promise<void>;
  loading?: boolean;
}

export const AcceptQuoteDialog = ({
  quote,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: AcceptQuoteDialogProps) => {
  const [notes, setNotes] = useState('');

  const handleConfirm = async () => {
    await onConfirm(notes || undefined);
    setNotes(''); // Reset notes after confirmation
  };

  const handleCancel = () => {
    setNotes('');
    onOpenChange(false);
  };

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Accept Quote
          </DialogTitle>
          <DialogDescription>
            Review the quote details before accepting
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
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(quote.grand_total, quote.currency)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-1">Vendor</p>
              <p className="font-medium">{quote.vendor.name}</p>
              <p className="text-sm text-muted-foreground">{quote.vendor.email}</p>
            </div>

            {quote.items && quote.items.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                <div className="space-y-1">
                  {quote.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.description} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.total_price, quote.currency)}
                      </span>
                    </div>
                  ))}
                  {quote.items.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{quote.items.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Impact Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <p className="font-medium mb-1">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Accept this quote and mark it as the selected vendor offer</li>
                <li>Automatically reject all other quotes for this order</li>
                <li>Advance the order to <strong>"Customer Quote"</strong> stage</li>
                <li>Update order pricing with vendor quoted amounts</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="accept-notes">
              Notes (Optional)
            </Label>
            <Textarea
              id="accept-notes"
              placeholder="Add any notes about this acceptance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              These notes will be added to the quote history
            </p>
          </div>

          {/* Confirmation Message */}
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Ready to proceed?
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Once accepted, you can proceed with the order and notify the customer
                  of the final pricing.
                </p>
              </div>
            </div>
          </div>
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
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept Quote
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
