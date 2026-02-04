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
import { Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface RejectQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  loading?: boolean;
}

export const RejectQuoteDialog = ({
  quote,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: RejectQuoteDialogProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    // Validate reason
    if (reason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters');
      return;
    }

    setError('');
    await onConfirm(reason.trim());
    setReason(''); // Reset after confirmation
  };

  const handleCancel = () => {
    setReason('');
    setError('');
    onOpenChange(false);
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    if (error && value.trim().length >= 10) {
      setError('');
    }
  };

  if (!quote) return null;

  const characterCount = reason.trim().length;
  const isValid = characterCount >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Reject Quote
          </DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this quote
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
                <p className="text-lg font-semibold">
                  {formatCurrency(quote.grand_total, quote.currency)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-1">Vendor</p>
              <p className="font-medium">{quote.vendor.name}</p>
              <p className="text-sm text-muted-foreground">{quote.vendor.email}</p>
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="flex items-center justify-between">
              <span>
                Rejection Reason <span className="text-red-500">*</span>
              </span>
              <span className={`text-xs ${
                isValid ? 'text-green-600' : characterCount > 0 ? 'text-orange-600' : 'text-muted-foreground'
              }`}>
                {characterCount}/10 minimum
              </span>
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why this quote is being rejected (minimum 10 characters)..."
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              rows={4}
              disabled={loading}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This reason will be saved in the quote history and may be shared with the vendor
            </p>
          </div>

          {/* Impact Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <p className="font-medium mb-1">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Mark this quote as rejected</li>
                <li>Save the rejection reason to quote history</li>
                <li>Make this quote read-only (cannot be edited)</li>
                <li>If all quotes are rejected, order will revert to "Vendor Sourcing" stage</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Examples */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium mb-2">Example rejection reasons:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• "Price exceeds our budget by 20%"</li>
              <li>• "Delivery timeline is too long for customer requirements"</li>
              <li>• "Quality specifications do not meet our standards"</li>
              <li>• "Found a better offer from another vendor"</li>
            </ul>
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
            disabled={loading || !isValid}
            variant="destructive"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Quote
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
