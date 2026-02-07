import { useNavigate } from 'react-router-dom';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Eye, 
  Send, 
  ArrowLeft,
  FileText,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { QuoteStatusBadge } from './QuoteStatusBadge';

interface QuoteSuccessModalProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendToVendor?: () => Promise<void>;
  sendingToVendor?: boolean;
}

export const QuoteSuccessModal = ({
  quote,
  open,
  onOpenChange,
  onSendToVendor,
  sendingToVendor = false,
}: QuoteSuccessModalProps) => {
  const navigate = useNavigate();

  const handleViewQuote = () => {
    if (quote) {
      navigate(`/admin/quotes/${quote.id}`);
      onOpenChange(false);
    }
  };

  const handleSendToVendor = async () => {
    if (onSendToVendor) {
      await onSendToVendor();
      onOpenChange(false);
    }
  };

  const handleBackToOrder = () => {
    if (quote?.order_id) {
      navigate(`/admin/orders/${quote.order_id}`);
      onOpenChange(false);
    }
  };

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Quote Created Successfully
          </DialogTitle>
          <DialogDescription>
            Your quote has been created and saved
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quote Summary Card */}
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Quote Number
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {quote.quote_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Status
                  </p>
                  <div className="mt-1">
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-green-200 dark:border-green-800 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                    Total Amount
                  </p>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {formatCurrency(quote.grand_total, quote.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                    Valid Until
                  </p>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    {format(new Date(quote.valid_until), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                  Vendor
                </p>
                <p className="font-medium text-green-700 dark:text-green-300">
                  {quote.vendor.name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {quote.vendor.email}
                </p>
              </div>
            </div>
          </div>

          {/* What's Next Section */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <FileText className="h-4 w-4 text-blue-600" />
            <AlertDescription className="ml-2">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What's Next?
              </p>
              <ul className="space-y-1.5 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Review the quote details and ensure all information is correct</span>
                </li>
                <li className="flex items-start gap-2">
                  <Send className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Send the quote to the vendor to request pricing and availability</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Track the quote status and vendor responses in the dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Monitor the quote expiration date and follow up as needed</span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button 
              onClick={handleViewQuote} 
              className="w-full"
              size="lg"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Quote Details
            </Button>
            
            {onSendToVendor && (
              <Button 
                onClick={handleSendToVendor} 
                variant="outline" 
                className="w-full"
                size="lg"
                disabled={sendingToVendor}
              >
                {sendingToVendor ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to Vendor Now
                  </>
                )}
              </Button>
            )}
            
            {quote.order_id && (
              <Button 
                onClick={handleBackToOrder} 
                variant="ghost" 
                className="w-full"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Order
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <p className="text-xs text-muted-foreground">
            You can access this quote anytime from the Quotes dashboard
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
