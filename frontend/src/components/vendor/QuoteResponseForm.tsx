/**
 * QuoteResponseForm Component
 * 
 * Form for vendors to respond to quotes with accept, reject, or counter offer.
 * Handles form validation and submission for all three response types.
 * Supports item-by-item counter offer pricing.
 * 
 * Requirements: 6.2, 6.3, 6.5, 6.6, 6.8, 6.9, 6.13, 10.6
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import CounterOfferItemForm from './CounterOfferItemForm';
import type { QuoteItem, CounterOfferItemRequest } from '@/types/vendor/portal';

export type ResponseType = 'accept' | 'reject' | 'counter';

export interface QuoteResponseFormProps {
  /**
   * Type of response (accept, reject, counter)
   */
  responseType: ResponseType;
  
  /**
   * Quote items (required for counter offer)
   */
  quoteItems?: QuoteItem[];
  
  /**
   * Whether the quote is expired
   */
  isExpired?: boolean;
  
  /**
   * Whether the quote has already been responded to
   */
  hasResponded?: boolean;
  
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: QuoteResponseData) => void | Promise<void>;
  
  /**
   * Callback when form is cancelled
   */
  onCancel?: () => void;
  
  /**
   * Whether the form is currently submitting
   */
  isSubmitting?: boolean;
  
  /**
   * Original offer amount (for post-rejection acceptance)
   */
  originalOffer?: number;
  
  /**
   * Whether this quote has rejection history
   */
  hasRejectionHistory?: boolean;
  
  /**
   * Admin counter offer amount (when accepting admin counter)
   */
  adminCounterOffer?: number;
  
  /**
   * Whether this is accepting admin counter offer
   */
  isAdminCountered?: boolean;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

export interface QuoteResponseData {
  responseType: ResponseType;
  estimatedDeliveryDays?: number;
  notes?: string;
  rejectionReason?: string;
  counterOfferItems?: CounterOfferItemRequest[];
}

export default function QuoteResponseForm({
  responseType,
  quoteItems = [],
  isExpired = false,
  hasResponded = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
  originalOffer,
  hasRejectionHistory = false,
  adminCounterOffer,
  isAdminCountered = false,
  className,
}: QuoteResponseFormProps) {
  // Form state
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [counterOfferItems, setCounterOfferItems] = useState<any[]>([]);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form based on response type
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (responseType === 'accept') {
      if (estimatedDeliveryDays && parseInt(estimatedDeliveryDays) <= 0) {
        newErrors.estimatedDeliveryDays = 'Delivery days must be greater than 0';
      }
    }

    if (responseType === 'reject') {
      if (!rejectionReason.trim()) {
        newErrors.rejectionReason = 'Rejection reason is required';
      }
    }

    if (responseType === 'counter') {
      // Validate all items have counter prices
      const invalidItems = counterOfferItems.filter(item => !item.counter_unit_price || item.counter_unit_price <= 0);
      if (invalidItems.length > 0) {
        newErrors.counterOfferItems = `${invalidItems.length} item(s) need valid counter prices`;
      }
      
      // Validate at least one item
      if (counterOfferItems.length === 0) {
        newErrors.counterOfferItems = 'At least one item is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data: QuoteResponseData = {
      responseType,
    };

    if (responseType === 'accept') {
      if (estimatedDeliveryDays) {
        data.estimatedDeliveryDays = parseInt(estimatedDeliveryDays);
      }
      if (notes.trim()) {
        data.notes = notes.trim();
      }
    }

    if (responseType === 'reject') {
      data.rejectionReason = rejectionReason.trim();
    }

    if (responseType === 'counter') {
      // Map counter offer items to API format
      data.counterOfferItems = counterOfferItems.map(item => ({
        product_id: item.product_id,
        counter_unit_price: item.counter_unit_price,
        notes: item.notes || undefined,
      }));
      
      if (notes.trim()) {
        data.notes = notes.trim();
      }
      
      if (estimatedDeliveryDays) {
        data.estimatedDeliveryDays = parseInt(estimatedDeliveryDays);
      }
    }

    await onSubmit(data);
  };

  /**
   * Get form configuration based on response type
   */
  const getFormConfig = () => {
    switch (responseType) {
      case 'accept':
        return {
          title: hasRejectionHistory ? 'Terima Harga Asli PT CEX' : 'Accept Quote',
          description: hasRejectionHistory 
            ? 'Konfirmasi penerimaan harga asli dan berikan estimasi pengiriman'
            : 'Confirm your acceptance and provide delivery estimate',
          icon: CheckCircle,
          iconColor: 'text-green-600 dark:text-green-400',
          buttonText: hasRejectionHistory ? 'Terima Harga Asli' : 'Accept Quote',
          buttonVariant: 'default' as const,
        };
      case 'reject':
        return {
          title: 'Reject Quote',
          description: 'Please provide a reason for rejection',
          icon: XCircle,
          iconColor: 'text-red-600 dark:text-red-400',
          buttonText: 'Reject Quote',
          buttonVariant: 'destructive' as const,
        };
      case 'counter':
        return {
          title: hasRejectionHistory ? 'Counter Offer Baru' : 'Counter Offer',
          description: hasRejectionHistory
            ? 'Ajukan harga counter offer yang baru dengan harga yang lebih kompetitif'
            : 'Submit your counter offer amount',
          icon: DollarSign,
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonText: hasRejectionHistory ? 'Kirim Counter Offer Baru' : 'Submit Counter Offer',
          buttonVariant: 'default' as const,
        };
    }
  };

  const config = getFormConfig();
  const Icon = config.icon;

  // Show warning if quote is expired or already responded
  if (isExpired || hasResponded) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isExpired && 'This quote has expired and can no longer be responded to.'}
              {hasResponded && 'You have already responded to this quote.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Icon className={cn('h-6 w-6', config.iconColor)} />
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Accept Form Fields */}
          {responseType === 'accept' && (
            <>
              {/* Show admin counter offer when accepting admin counter */}
              {isAdminCountered && adminCounterOffer && (
                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/50">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-900 dark:text-blue-100">
                    <strong>Anda akan menerima counter offer dari Admin PT CEX:</strong>
                    <div className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">
                      Rp {adminCounterOffer.toLocaleString('id-ID')}
                    </div>
                    <p className="text-sm mt-2 text-blue-700 dark:text-blue-300">
                      Dengan menerima, Anda setuju untuk menyelesaikan order dengan harga yang ditawarkan admin.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Show original offer when accepting after rejection */}
              {!isAdminCountered && hasRejectionHistory && originalOffer && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/50">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-900 dark:text-green-100">
                    <strong>Anda akan menerima harga asli PT CEX:</strong>
                    <div className="text-2xl font-bold mt-2 text-green-600 dark:text-green-400">
                      Rp {originalOffer.toLocaleString('id-ID')}
                    </div>
                    <p className="text-sm mt-2 text-green-700 dark:text-green-300">
                      Ini adalah harga yang ditawarkan PT CEX sebelum negosiasi. 
                      Dengan menerima, Anda setuju untuk menyelesaikan order dengan harga ini.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDays">
                  Estimated Delivery Days (Optional)
                </Label>
                <Input
                  id="estimatedDeliveryDays"
                  type="number"
                  min="1"
                  placeholder="e.g., 14"
                  value={estimatedDeliveryDays}
                  onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                  disabled={isSubmitting}
                  className={errors.estimatedDeliveryDays ? 'border-destructive' : ''}
                />
                {errors.estimatedDeliveryDays && (
                  <p className="text-sm text-destructive">{errors.estimatedDeliveryDays}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes or comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Reject Form Fields */}
          {responseType === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Please explain why you are rejecting this quote..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className={errors.rejectionReason ? 'border-destructive' : ''}
                required
              />
              {errors.rejectionReason && (
                <p className="text-sm text-destructive">{errors.rejectionReason}</p>
              )}
            </div>
          )}

          {/* Counter Offer Form Fields */}
          {responseType === 'counter' && (
            <>
              {/* Item-by-Item Counter Offer Form */}
              <div className="space-y-2">
                <Label>
                  Counter Offer Items <span className="text-destructive">*</span>
                </Label>
                <CounterOfferItemForm
                  items={quoteItems}
                  onItemsChange={setCounterOfferItems}
                  disabled={isSubmitting}
                />
                {errors.counterOfferItems && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.counterOfferItems}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Estimated Delivery Days */}
              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDays">
                  Estimated Delivery Days (Optional)
                </Label>
                <Input
                  id="estimatedDeliveryDays"
                  type="number"
                  min="1"
                  placeholder="e.g., 14"
                  value={estimatedDeliveryDays}
                  onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Global Notes */}
              <div className="space-y-2">
                <Label htmlFor="counterNotes">Global Notes (Optional)</Label>
                <Textarea
                  id="counterNotes"
                  placeholder="Add any additional notes about your counter offer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant={config.buttonVariant}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : config.buttonText}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
