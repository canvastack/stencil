import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote } from '@/services/tenant/quoteService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuoteStore } from '@/stores/quoteStore';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit,
  ArrowRight,
} from 'lucide-react';
import { AcceptQuoteDialog } from './AcceptQuoteDialog';
import { RejectQuoteDialog } from './RejectQuoteDialog';
import { CounterOfferDialog } from './CounterOfferDialog';

interface QuoteActionsProps {
  quote: Quote;
  onActionComplete?: () => void;
}

export const QuoteActions = ({ quote, onActionComplete }: QuoteActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { acceptQuote, rejectQuote, counterQuote } = useQuoteStore();

  // Dialog states
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);

  // Loading states
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [counterLoading, setCounterLoading] = useState(false);

  // Check if quote is expired
  const isExpired = (validUntil: string): boolean => {
    return new Date(validUntil) < new Date();
  };

  // Button visibility logic
  const canAccept = ['open', 'countered'].includes(quote.status) && !isExpired(quote.valid_until);
  const canReject = ['open', 'countered'].includes(quote.status);
  const canCounter = ['open'].includes(quote.status) && (quote.revision_number || 0) < 5;
  const canEdit = ['open'].includes(quote.status);
  const isReadOnly = ['accepted', 'rejected', 'expired', 'cancelled'].includes(quote.status);

  // If read-only, don't show any actions
  if (isReadOnly) {
    return null;
  }

  // Accept Quote Handler
  const handleAccept = async (notes?: string) => {
    setAcceptLoading(true);
    try {
      const result = await acceptQuote(quote.id, notes);

      if (result) {
        toast({
          title: '✅ Quote Accepted',
          description: `Quote ${quote.quote_number} has been accepted successfully.`,
          action: quote.order_id ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/orders/${quote.order_id}`)}
            >
              View Order <ArrowRight className="ml-1 w-3 h-3" />
            </Button>
          ) : undefined,
        });

        setAcceptDialogOpen(false);

        // Redirect to order page after short delay
        if (quote.order_id) {
          setTimeout(() => {
            toast({
              title: 'ℹ️ Redirecting...',
              description: 'Taking you to the order page',
            });
            navigate(`/admin/orders/${quote.order_id}`);
          }, 2000);
        } else if (onActionComplete) {
          onActionComplete();
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept quote';
      
      // Specific error handling
      if (errorMessage.includes('expired')) {
        toast({
          title: '❌ Quote Expired',
          description: 'This quote has expired and cannot be accepted.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('already accepted')) {
        toast({
          title: '❌ Already Accepted',
          description: 'This quote has already been accepted.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '❌ Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setAcceptLoading(false);
    }
  };

  // Reject Quote Handler
  const handleReject = async (reason: string) => {
    setRejectLoading(true);
    try {
      const result = await rejectQuote(quote.id, reason);

      if (result) {
        // Check if all quotes rejected (would be in API response)
        const allQuotesRejected = false; // TODO: Get from API response

        if (allQuotesRejected) {
          toast({
            title: '⚠️ All Quotes Rejected',
            description: 'All quotes for this order have been rejected. Order status reverted to Vendor Sourcing.',
            variant: 'default',
          });
        } else {
          toast({
            title: '✅ Quote Rejected',
            description: `Quote ${quote.quote_number} has been rejected.`,
          });
        }

        setRejectDialogOpen(false);

        if (onActionComplete) {
          onActionComplete();
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject quote';
      
      toast({
        title: '❌ Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setRejectLoading(false);
    }
  };

  // Counter Offer Handler
  const handleCounter = async (price: number, notes?: string) => {
    setCounterLoading(true);
    try {
      const result = await counterQuote(quote.id, price, notes);

      if (result) {
        toast({
          title: '✅ Counter Offer Sent',
          description: `Counter offer sent successfully. Vendor will be notified.`,
        });

        setCounterDialogOpen(false);

        if (onActionComplete) {
          onActionComplete();
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send counter offer';
      
      // Specific error handling
      if (errorMessage.includes('maximum rounds')) {
        toast({
          title: '❌ Maximum Rounds Reached',
          description: 'You have reached the maximum number of negotiation rounds (5).',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '❌ Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setCounterLoading(false);
    }
  };

  // Edit Handler
  const handleEdit = () => {
    navigate(`/admin/quotes/${quote.id}/edit`);
  };

  return (
    <div className="flex flex-wrap gap-3 justify-end">
      {/* Edit Button */}
      {canEdit && (
        <Button variant="outline" onClick={handleEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Quote
        </Button>
      )}

      {/* Counter Offer Button */}
      {canCounter && (
        <Button variant="outline" onClick={() => setCounterDialogOpen(true)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Counter Offer
        </Button>
      )}

      {/* Reject Button */}
      {canReject && (
        <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
          <XCircle className="w-4 h-4 mr-2" />
          Reject Quote
        </Button>
      )}

      {/* Accept Button */}
      {canAccept && (
        <Button onClick={() => setAcceptDialogOpen(true)}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Accept Quote
        </Button>
      )}

      {/* Accept Dialog */}
      <AcceptQuoteDialog
        quote={quote}
        open={acceptDialogOpen}
        onOpenChange={setAcceptDialogOpen}
        onConfirm={handleAccept}
        loading={acceptLoading}
      />

      {/* Reject Dialog */}
      <RejectQuoteDialog
        quote={quote}
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleReject}
        loading={rejectLoading}
      />

      {/* Counter Offer Dialog */}
      <CounterOfferDialog
        quote={quote}
        open={counterDialogOpen}
        onOpenChange={setCounterDialogOpen}
        onConfirm={handleCounter}
        loading={counterLoading}
      />
    </div>
  );
};
