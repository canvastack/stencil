import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Calendar,
  Package,
  FileText,
  Clock,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { quoteApi } from '@/lib/api/quote';
import { toast } from 'sonner';
import type { Quote } from '@/types/quote';

interface VendorQuoteDetailProps {
  quote: Quote;
  onRespond: () => void;
}

type ResponseType = 'accept' | 'reject' | 'counter';

export function VendorQuoteDetail({ quote, onRespond }: VendorQuoteDetailProps) {
  const [responseType, setResponseType] = useState<ResponseType | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [counterOffer, setCounterOffer] = useState('');
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Accept quote mutation
  const acceptMutation = useMutation({
    mutationFn: (data: { notes?: string; estimated_delivery_days?: number }) =>
      quoteApi.acceptQuote(quote.uuid, data),
    onSuccess: () => {
      toast.success('Quote accepted successfully');
      onRespond();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to accept quote';
      setError(message);
      toast.error(message);
    }
  });

  // Reject quote mutation
  const rejectMutation = useMutation({
    mutationFn: (data: { reason: string }) =>
      quoteApi.rejectQuote(quote.uuid, data),
    onSuccess: () => {
      toast.success('Quote rejected');
      onRespond();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to reject quote';
      setError(message);
      toast.error(message);
    }
  });

  // Counter quote mutation
  const counterMutation = useMutation({
    mutationFn: (data: { counter_offer: number; notes?: string; estimated_delivery_days?: number }) =>
      quoteApi.counterQuote(quote.uuid, data),
    onSuccess: () => {
      toast.success('Counter offer submitted');
      onRespond();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to submit counter offer';
      setError(message);
      toast.error(message);
    }
  });

  const handleSubmitResponse = () => {
    setError(null);

    if (!responseType) {
      setError('Please select a response type');
      return;
    }

    if (responseType === 'reject' && !responseNotes.trim()) {
      setError('Rejection reason is required');
      return;
    }

    if (responseType === 'counter' && !counterOffer) {
      setError('Counter offer amount is required');
      return;
    }

    const deliveryDays = estimatedDeliveryDays ? parseInt(estimatedDeliveryDays) : undefined;

    switch (responseType) {
      case 'accept':
        acceptMutation.mutate({
          notes: responseNotes || undefined,
          estimated_delivery_days: deliveryDays
        });
        break;
      case 'reject':
        rejectMutation.mutate({
          reason: responseNotes
        });
        break;
      case 'counter':
        counterMutation.mutate({
          counter_offer: parseFloat(counterOffer) * 100, // Convert to cents
          notes: responseNotes || undefined,
          estimated_delivery_days: deliveryDays
        });
        break;
    }
  };

  const handleCancelResponse = () => {
    setResponseType(null);
    setResponseNotes('');
    setCounterOffer('');
    setEstimatedDeliveryDays('');
    setError(null);
  };

  const canRespond = quote.status?.value === 'sent' || quote.status?.value === 'pending_response';
  const isExpired = quote.is_expired;
  const isLoading = acceptMutation.isPending || rejectMutation.isPending || counterMutation.isPending;

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: quote.currency || 'IDR'
    }).format(amount / 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{quote.quote_number}</CardTitle>
            <CardDescription className="mt-2">
              Order: {quote.order?.order_number}
            </CardDescription>
          </div>
          <Badge 
            variant="outline"
            className="text-sm"
            style={{
              borderColor: `var(--${quote.status?.color || 'gray'}-500)`,
              color: `var(--${quote.status?.color || 'gray'}-700)`
            }}
          >
            {quote.status?.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Expiration Warning */}
        {isExpired && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This quote has expired and can no longer be responded to.
            </AlertDescription>
          </Alert>
        )}

        {/* Customer Information */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Customer Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Customer Name</p>
              <p className="font-medium">{quote.order?.customer?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contact</p>
              <p className="font-medium">{quote.order?.customer?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quote Details */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Quote Details
          </h3>
          <div className="space-y-3 text-sm">
            {quote.quote_details?.product_name && (
              <div>
                <p className="text-muted-foreground">Product</p>
                <p className="font-medium">{quote.quote_details.product_name}</p>
              </div>
            )}
            
            {quote.quote_details?.quantity && (
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{quote.quote_details.quantity} units</p>
              </div>
            )}

            {quote.initial_offer && (
              <div>
                <p className="text-muted-foreground">Requested Price</p>
                <p className="font-medium text-lg">{formatCurrency(quote.initial_offer)}</p>
              </div>
            )}

            {quote.latest_offer && quote.latest_offer !== quote.initial_offer && (
              <div>
                <p className="text-muted-foreground">Latest Offer</p>
                <p className="font-medium text-lg">{formatCurrency(quote.latest_offer)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Specifications */}
        {quote.quote_details?.specifications && Object.keys(quote.quote_details.specifications).length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Specifications</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(quote.quote_details.specifications).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Additional Notes */}
        {quote.quote_details?.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Additional Notes
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {quote.quote_details.notes}
              </p>
            </div>
          </>
        )}

        {/* Timeline */}
        <Separator />
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {new Date(quote.created_at).toLocaleString()}
              </span>
            </div>
            {quote.sent_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sent to Vendor</span>
                <span className="font-medium">
                  {new Date(quote.sent_at).toLocaleString()}
                </span>
              </div>
            )}
            {quote.expires_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                  {new Date(quote.expires_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Response Form */}
        {canRespond && !isExpired && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-4">Your Response</h3>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!responseType ? (
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => setResponseType('accept')}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    variant="outline"
                  >
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span>Accept Quote</span>
                  </Button>
                  
                  <Button
                    onClick={() => setResponseType('reject')}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    variant="outline"
                  >
                    <XCircle className="h-6 w-6 text-red-600" />
                    <span>Reject Quote</span>
                  </Button>
                  
                  <Button
                    onClick={() => setResponseType('counter')}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    variant="outline"
                  >
                    <DollarSign className="h-6 w-6 text-orange-600" />
                    <span>Counter Offer</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    {responseType === 'accept' && (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Accepting Quote</span>
                      </>
                    )}
                    {responseType === 'reject' && (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-medium">Rejecting Quote</span>
                      </>
                    )}
                    {responseType === 'counter' && (
                      <>
                        <DollarSign className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Counter Offer</span>
                      </>
                    )}
                  </div>

                  {responseType === 'counter' && (
                    <div>
                      <Label htmlFor="counterOffer">
                        Counter Offer Amount <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          {quote.currency || 'IDR'}
                        </span>
                        <Input
                          id="counterOffer"
                          type="number"
                          placeholder="0.00"
                          value={counterOffer}
                          onChange={(e) => setCounterOffer(e.target.value)}
                          className="pl-16"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your counter offer amount
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="responseNotes">
                      {responseType === 'reject' ? 'Rejection Reason' : 'Notes'} 
                      {responseType === 'reject' && <span className="text-red-500"> *</span>}
                    </Label>
                    <Textarea
                      id="responseNotes"
                      placeholder={
                        responseType === 'reject'
                          ? 'Please provide a reason for rejection...'
                          : 'Add any additional notes or comments...'
                      }
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  {(responseType === 'accept' || responseType === 'counter') && (
                    <div>
                      <Label htmlFor="estimatedDelivery">
                        Estimated Delivery (days)
                      </Label>
                      <Input
                        id="estimatedDelivery"
                        type="number"
                        placeholder="e.g., 7"
                        value={estimatedDeliveryDays}
                        onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                        className="mt-1"
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        How many days will it take to complete this order?
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Response'}
                    </Button>
                    <Button
                      onClick={handleCancelResponse}
                      variant="outline"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Previous Response */}
        {quote.response_type && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Previous Response</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Type</span>
                  <Badge variant="outline">
                    {quote.response_type.charAt(0).toUpperCase() + quote.response_type.slice(1)}
                  </Badge>
                </div>
                {quote.responded_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Responded At</span>
                    <span className="font-medium">
                      {new Date(quote.responded_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {quote.response_notes && (
                  <div>
                    <p className="text-muted-foreground mb-1">Notes</p>
                    <p className="font-medium whitespace-pre-wrap">
                      {quote.response_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
