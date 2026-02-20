/**
 * CustomerQuoteCard Component
 * 
 * Displays customer quote information on Order Detail page.
 * Shows quote status, pricing, payment status, and quick actions.
 * 
 * Features:
 * - Quote status badge with color coding
 * - Pricing breakdown (vendor cost, profit, total)
 * - Payment tracking (DP and balance)
 * - Quick actions (view details, send quote, approve/reject)
 * - Responsive design
 * 
 * Integration: Phase 6.4 - Integrate with existing order detail page
 * Spec: .kiro/specs/customer-quote-workflow/tasks.md
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Send, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign,
  AlertCircle,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { customerQuoteApi } from '@/services/api/customerQuoteApi';
import { toast } from 'sonner';

interface CustomerQuoteCardProps {
  orderUuid: string;
}

export function CustomerQuoteCard({ orderUuid }: CustomerQuoteCardProps) {
  const navigate = useNavigate();

  // Fetch customer quote for this order
  const { data: quotes, isLoading, error } = useQuery({
    queryKey: ['customer-quotes-by-order', orderUuid],
    queryFn: async () => {
      const response = await customerQuoteApi.getQuotes({ order_uuid: orderUuid });
      return response.data.data || [];
    },
    enabled: !!orderUuid,
  });

  // Get the latest quote (most recent)
  const quote = quotes && quotes.length > 0 ? quotes[0] : null;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800', icon: Clock },
      sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800', icon: Send },
      viewed: { label: 'Viewed', className: 'bg-purple-100 text-purple-800', icon: Eye },
      countered: { label: 'Countered', className: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      pending_approval: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600', icon: Clock },
    };
    return configs[status] || configs.draft;
  };

  const getPaymentStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      not_applicable: { label: 'N/A', className: 'bg-gray-100 text-gray-600', icon: Clock },
      unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-800', icon: AlertCircle },
      partial: { label: 'Partially Paid', className: 'bg-yellow-100 text-yellow-800', icon: DollarSign },
      paid: { label: 'Fully Paid', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      unknown: { label: 'Unknown', className: 'bg-gray-100 text-gray-600', icon: AlertCircle },
    };
    return configs[status] || configs.unknown;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Failed to load customer quote information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return null; // No quote exists for this order yet
  }

  const statusConfig = getStatusConfig(quote.status);
  const StatusIcon = statusConfig.icon;

  const paymentStatus = quote.payment?.status || 'not_applicable';
  const paymentConfig = getPaymentStatusConfig(paymentStatus);
  const PaymentIcon = paymentConfig.icon;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Customer Quote</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{quote.quote_number}</p>
            </div>
          </div>
          <Badge className={statusConfig.className}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quote Title */}
        <div>
          <p className="text-sm font-medium">{quote.title}</p>
          {quote.description && (
            <p className="text-xs text-muted-foreground mt-1">{quote.description}</p>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
          <div>
            <p className="text-xs text-muted-foreground">Vendor Cost</p>
            <p className="text-sm font-semibold">{formatCurrency(quote.pricing?.vendor_total_cost || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Profit ({quote.pricing?.total_profit_percentage || 0}%)
            </p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(quote.pricing?.total_profit_amount || 0)}
            </p>
          </div>
          <div className="col-span-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">Customer Total</p>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(quote.pricing?.grand_total || 0)}
            </p>
          </div>
        </div>

        {/* Payment Status (if accepted) */}
        {quote.status === 'accepted' && quote.payment && (
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Payment Status</p>
              <Badge className={paymentConfig.className}>
                <PaymentIcon className="w-3 h-3 mr-1" />
                {paymentConfig.label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(quote.payment.total_paid || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-semibold text-orange-600">
                  {formatCurrency(quote.payment.remaining || 0)}
                </p>
              </div>
            </div>
            {quote.payment.total_paid > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>
                    {Math.round((quote.payment.total_paid / quote.pricing.grand_total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((quote.payment.total_paid / quote.pricing.grand_total) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Terms */}
        <div className="text-sm space-y-2">
          {quote.terms?.valid_until && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid Until:</span>
              <span className="font-medium">
                {format(new Date(quote.terms.valid_until), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
          {quote.terms?.payment_terms && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Terms:</span>
              <span className="font-medium">{quote.terms.payment_terms}</span>
            </div>
          )}
        </div>

        {/* Negotiation Info (if countered) */}
        {quote.status === 'countered' && quote.negotiation?.counter_offer_amount && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs font-medium text-orange-800 mb-1">Counter Offer Received</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-orange-700">Customer Offer:</span>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(quote.negotiation.counter_offer_amount)}
              </span>
            </div>
            {quote.negotiation.counter_offer_notes && (
              <p className="text-xs text-orange-700 mt-2 italic">
                "{quote.negotiation.counter_offer_notes}"
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/admin/customer-quotes/${quote.uuid}`)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </Button>
          
          {quote.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await customerQuoteApi.sendQuote(quote.uuid);
                  toast.success('Quote sent to customer');
                  // Refetch will happen automatically via React Query
                } catch (error) {
                  toast.error('Failed to send quote');
                }
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          )}

          {quote.status === 'pending_approval' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/approvals/pending`)}
            >
              <Clock className="w-4 h-4 mr-2" />
              Review
            </Button>
          )}
        </div>

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          {quote.sent_at && (
            <div className="flex justify-between">
              <span>Sent:</span>
              <span>{format(new Date(quote.sent_at), 'MMM dd, yyyy HH:mm')}</span>
            </div>
          )}
          {quote.viewed_at && (
            <div className="flex justify-between">
              <span>Viewed:</span>
              <span>{format(new Date(quote.viewed_at), 'MMM dd, yyyy HH:mm')}</span>
            </div>
          )}
          {quote.responded_at && (
            <div className="flex justify-between">
              <span>Responded:</span>
              <span>{format(new Date(quote.responded_at), 'MMM dd, yyyy HH:mm')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
