import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { Clock, CheckCircle2, XCircle, Send, Eye, DollarSign, AlertCircle } from 'lucide-react';

interface CustomerQuoteDetailProps {
  quote: any;
}

export function CustomerQuoteDetail({ quote }: CustomerQuoteDetailProps) {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: any }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800', icon: Clock },
      sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800', icon: Send },
      viewed: { label: 'Viewed', className: 'bg-purple-100 text-purple-800', icon: Eye },
      pending_approval: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600', icon: Clock },
    };
    const { label, className, icon: Icon } = config[status] || config.draft;
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: any }> = {
      not_applicable: { label: 'N/A', className: 'bg-gray-100 text-gray-600', icon: Clock },
      unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-800', icon: AlertCircle },
      partial: { label: 'Partially Paid', className: 'bg-yellow-100 text-yellow-800', icon: DollarSign },
      paid: { label: 'Fully Paid', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      unknown: { label: 'Unknown', className: 'bg-gray-100 text-gray-600', icon: AlertCircle },
    };
    const { label, className, icon: Icon } = config[status] || config.unknown;
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{quote.quote_number}</CardTitle>
            {getStatusBadge(quote.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Title</p>
            <p className="font-medium">{quote.title}</p>
          </div>
          {quote.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p>{quote.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vendor Cost</span>
            <span>{formatCurrency(quote.pricing.vendor_total_cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Profit ({quote.pricing.base_profit_percentage}%)</span>
            <span>{formatCurrency(quote.pricing.base_profit_amount)}</span>
          </div>
          {quote.pricing.handling_fee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Handling Fee</span>
              <span>{formatCurrency(quote.pricing.handling_fee)}</span>
            </div>
          )}
          {quote.pricing.shipping_cost > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping Cost</span>
              <span>{formatCurrency(quote.pricing.shipping_cost)}</span>
            </div>
          )}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCurrency(quote.pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({quote.pricing.tax_rate}%)</span>
              <span className="font-semibold">{formatCurrency(quote.pricing.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Grand Total</span>
              <span>{formatCurrency(quote.pricing.grand_total)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Total Profit</span>
              <span>{formatCurrency(quote.pricing.total_profit_amount)} ({quote.pricing.total_profit_percentage}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Valid Until</p>
            <p className="font-medium">{format(new Date(quote.terms.valid_until), 'MMMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Terms</p>
            <p>{quote.terms.payment_terms}</p>
          </div>
          {quote.terms.delivery_timeline && (
            <div>
              <p className="text-sm text-muted-foreground">Delivery Timeline</p>
              <p>{quote.terms.delivery_timeline}</p>
            </div>
          )}
          {quote.terms.terms_and_conditions && (
            <div>
              <p className="text-sm text-muted-foreground">Terms & Conditions</p>
              <p className="whitespace-pre-wrap">{quote.terms.terms_and_conditions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {quote.negotiation.counter_offer_amount && (
        <Card>
          <CardHeader>
            <CardTitle>Negotiation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Counter Offer Amount</p>
              <p className="text-xl font-bold">{formatCurrency(quote.negotiation.counter_offer_amount)}</p>
            </div>
            {quote.negotiation.counter_offer_notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p>{quote.negotiation.counter_offer_notes}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Round</p>
              <p>{quote.negotiation.counter_offer_round} / {quote.negotiation.max_negotiation_rounds}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {quote.payment && quote.status === 'accepted' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment Status</CardTitle>
              {getPaymentStatusBadge(quote.payment.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold">{formatCurrency(quote.pricing.grand_total)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(quote.payment.total_paid)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(quote.payment.remaining)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Progress</p>
                <p className="text-lg font-bold">
                  {quote.payment.total_paid > 0 
                    ? `${Math.round((quote.payment.total_paid / quote.pricing.grand_total) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>

            {quote.payment.summary && (
              <>
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Down Payment (50%)</h4>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">{formatCurrency(quote.payment.summary.down_payment.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={
                        quote.payment.summary.down_payment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {quote.payment.summary.down_payment.status}
                      </Badge>
                    </div>
                    {quote.payment.summary.down_payment.due_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Due Date</span>
                        <span>{format(new Date(quote.payment.summary.down_payment.due_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {quote.payment.summary.down_payment.paid_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid At</span>
                        <span className="text-green-600">{format(new Date(quote.payment.summary.down_payment.paid_at), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {quote.payment.summary.down_payment.method && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Method</span>
                        <span className="capitalize">{quote.payment.summary.down_payment.method.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Balance Payment (50%)</h4>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">{formatCurrency(quote.payment.summary.balance_payment.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={
                        quote.payment.summary.balance_payment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {quote.payment.summary.balance_payment.status}
                      </Badge>
                    </div>
                    {quote.payment.summary.balance_payment.due_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Due Date</span>
                        <span>{format(new Date(quote.payment.summary.balance_payment.due_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {quote.payment.summary.balance_payment.paid_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid At</span>
                        <span className="text-green-600">{format(new Date(quote.payment.summary.balance_payment.paid_at), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {quote.payment.summary.balance_payment.method && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Method</span>
                        <span className="capitalize">{quote.payment.summary.balance_payment.method.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
