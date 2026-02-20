import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthenticatedQuote } from '@/hooks/useAuthenticatedQuote';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { CustomerQuoteView } from '@/components/customer-portal/CustomerQuoteView';
import { CounterOfferModal } from '@/components/customer-portal/CounterOfferModal';
import { RejectQuoteModal } from '@/components/customer-portal/RejectQuoteModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const {
    quote,
    isLoading,
    error,
    acceptQuote,
    rejectQuote,
    counterOffer,
    isAccepting,
    isRejecting,
    isCountering,
  } = useAuthenticatedQuote(id!);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-12 text-center">
          <p className="text-lg mb-4">Please login to view this quote</p>
          <Button onClick={() => navigate('/customer/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  const handleAccept = () => {
    if (confirm('Accept this quote? You will receive payment instructions after approval.')) {
      acceptQuote();
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleRejectSubmit = (reason: string) => {
    rejectQuote(reason);
    setShowRejectModal(false);
  };

  const handleCounterOffer = () => {
    setShowCounterModal(true);
  };

  const handleCounterSubmit = (amount: number, notes: string) => {
    counterOffer(amount, notes);
    setShowCounterModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-semibold">Loading quote...</p>
        </Card>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="p-12 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Quote Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This quote could not be found or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/customer/quotes')}>
            Back to My Quotes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header with Back Button */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/customer/quotes')}
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Quotes
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Quote Details</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Review and respond to your quotation
          </p>
        </div>
      </div>

      {/* Quote View */}
      <CustomerQuoteView
        quote={quote}
        onAccept={handleAccept}
        onReject={handleReject}
        onCounterOffer={handleCounterOffer}
        isAccepting={isAccepting}
        isRejecting={isRejecting}
      />

      {/* Modals */}
      <CounterOfferModal
        open={showCounterModal}
        onClose={() => setShowCounterModal(false)}
        onSubmit={handleCounterSubmit}
        currentAmount={quote.pricing.grand_total}
        currency={quote.pricing.currency}
        isSubmitting={isCountering}
      />

      <RejectQuoteModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSubmit={handleRejectSubmit}
        isSubmitting={isRejecting}
      />

      {/* Help Text */}
      <Alert>
        <AlertDescription>
          Need help? Contact us at support@example.com or call +62 123 456 7890
        </AlertDescription>
      </Alert>
    </div>
  );
}
