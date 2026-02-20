import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuotePricingBreakdown } from './QuotePricingBreakdown';
import { QuoteTermsDisplay } from './QuoteTermsDisplay';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { QuoteItemsList } from './QuoteItemsList';
import { CheckCircle2, XCircle, RefreshCw, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface CustomerQuoteViewProps {
  quote: any;
  onAccept: () => void;
  onReject: () => void;
  onCounterOffer: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

export function CustomerQuoteView({
  quote,
  onAccept,
  onReject,
  onCounterOffer,
  isAccepting,
  isRejecting,
}: CustomerQuoteViewProps) {
  const navigate = useNavigate();
  const isExpired = quote.is_expired;
  const canAccept = quote.can_be_accepted;
  const canCounter = quote.can_be_countered;
  const daysUntilExpiry = differenceInDays(new Date(quote.terms.valid_until), new Date());

  const handleProceedToPayment = () => {
    navigate(`/customer/quotes/${quote.uuid}/payment`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{quote.quote_number}</CardTitle>
              <p className="text-muted-foreground mt-1">{quote.title}</p>
            </div>
            <QuoteStatusBadge status={quote.status} />
          </div>
        </CardHeader>
      </Card>

      {/* Expiry Warning */}
      {!isExpired && daysUntilExpiry <= 2 && (
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            This quote expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}!
            Please respond before {format(new Date(quote.terms.valid_until), 'MMMM dd, yyyy')}.
          </AlertDescription>
        </Alert>
      )}

      {/* Expired Notice */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quote expired on {format(new Date(quote.terms.valid_until), 'MMMM dd, yyyy')}.
            Please contact us for a new quotation.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Messages */}
      {quote.status === 'pending_approval' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your acceptance is being reviewed by our team. You'll receive payment instructions within 24 hours.
          </AlertDescription>
        </Alert>
      )}

      {quote.status === 'accepted' && !quote.metadata?.payment_submitted && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 flex items-center justify-between">
            <span>Quote accepted! Please proceed with payment to confirm your order.</span>
            <Button 
              onClick={handleProceedToPayment}
              className="ml-4 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Payment
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {quote.status === 'accepted' && quote.metadata?.payment_submitted && quote.metadata?.awaiting_verification && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Payment proof submitted successfully! We are verifying your payment. You will receive confirmation within 1-2 hours.
          </AlertDescription>
        </Alert>
      )}

      {quote.status === 'accepted' && quote.metadata?.payment_verified && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Payment verified! Your order is now being processed.
          </AlertDescription>
        </Alert>
      )}

      {quote.status === 'rejected' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            This quote has been rejected. {quote.rejection_reason && `Reason: ${quote.rejection_reason}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Pricing */}
      <QuotePricingBreakdown pricing={quote.pricing} />

      {/* Order Items */}
      {quote.order?.items && (
        <QuoteItemsList 
          items={quote.order.items} 
          currency={quote.pricing?.currency || 'IDR'} 
        />
      )}

      {/* Terms */}
      <QuoteTermsDisplay terms={quote.terms} />

      {/* Negotiation Info */}
      {quote.negotiation.counter_offer_amount && (
        <Card>
          <CardHeader>
            <CardTitle>Your Counter Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Counter Amount:</span>
                <span className="font-semibold">{quote.negotiation.counter_offer_amount}</span>
              </div>
              {quote.negotiation.counter_offer_notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Notes:</span>
                  <p className="text-sm">{quote.negotiation.counter_offer_notes}</p>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Round {quote.negotiation.counter_offer_round} of {quote.negotiation.max_negotiation_rounds}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!isExpired && canAccept && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button
                onClick={onAccept}
                disabled={isAccepting}
                className="flex-1"
                size="lg"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isAccepting ? 'Processing...' : 'Accept Quote'}
              </Button>
              {canCounter && (
                <Button
                  onClick={onCounterOffer}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Counter Offer
                </Button>
              )}
              <Button
                onClick={onReject}
                disabled={isRejecting}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isRejecting ? 'Processing...' : 'Reject'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Button for Accepted Quotes */}
      {quote.status === 'accepted' && !quote.metadata?.payment_submitted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Ready to Proceed with Payment
                </h3>
                <p className="text-sm text-green-700">
                  Your quote has been accepted. Complete the payment to confirm your order.
                </p>
              </div>
              <Button
                onClick={handleProceedToPayment}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Proceed to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Submitted - Awaiting Verification */}
      {quote.status === 'accepted' && quote.metadata?.payment_submitted && quote.metadata?.awaiting_verification && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Clock className="w-16 h-16 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Payment Verification in Progress
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                  We have received your payment proof and are currently verifying it.
                </p>
                <p className="text-xs text-blue-600">
                  Reference: {quote.metadata.payment_reference || 'N/A'}
                </p>
                <p className="text-xs text-blue-600">
                  Submitted: {quote.metadata.payment_submitted_at ? new Date(quote.metadata.payment_submitted_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700">
                  ⏱️ Verification typically takes 1-2 hours during business hours.
                  You will receive an email notification once your payment is confirmed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
