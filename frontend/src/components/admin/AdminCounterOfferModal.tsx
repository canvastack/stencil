/**
 * AdminCounterOfferModal Component
 * 
 * Modal for admin to counter vendor's counter offer.
 * Allows item-by-item pricing with notes and negotiation history.
 * 
 * Features:
 * - Display vendor's counter offer summary
 * - Item-by-item counter pricing form
 * - Real-time total calculation
 * - Negotiation history timeline
 * - Round counter display
 * - Validation (must be different from vendor counter)
 * - Loading states
 * - Error handling
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  AlertCircle, 
  RefreshCw,
  Package,
  FileText,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminCounterOfferItemForm from './AdminCounterOfferItemForm';
import NegotiationTimeline from './NegotiationTimeline';

interface CounterOfferItem {
  product_id: string;
  product_name: string;
  quantity: number;
  original_unit_price: number;
  original_total_price: number;
  counter_unit_price: number;
  counter_total_price: number;
  difference_amount: number;
  notes?: string;
}

interface QuoteDetail {
  uuid: string;
  quote_number: string;
  status: string;
  round: number;
  quote_details?: {
    counter_offer?: {
      items: CounterOfferItem[];
      total_counter: number;
      notes?: string;
      submitted_at?: string;
    };
    negotiation_history?: any[];
    max_rounds?: number;
  };
  currency: string;
}

interface AdminCounterOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteDetail;
  onSuccess: () => void;
  onSubmit?: (data: {
    counter_offer_amount: number;
    items: Array<{
      product_id: string;
      admin_counter_unit_price: number;
      notes?: string;
    }>;
    notes?: string;
  }) => Promise<void>;
}

export default function AdminCounterOfferModal({
  isOpen,
  onClose,
  quote,
  onSuccess,
  onSubmit,
}: AdminCounterOfferModalProps) {
  const [items, setItems] = useState<Record<string, { admin_counter_unit_price: number; notes?: string }>>({});
  const [globalNotes, setGlobalNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const counterOffer = quote.quote_details?.counter_offer;
  const negotiationHistory = quote.quote_details?.negotiation_history || [];
  const maxRounds = quote.quote_details?.max_rounds || 5;
  const currentRound = quote.round || 1;

  // Initialize items with vendor counter prices
  useEffect(() => {
    if (isOpen && counterOffer?.items) {
      const initialItems: Record<string, { admin_counter_unit_price: number; notes?: string }> = {};
      counterOffer.items.forEach(item => {
        // Initialize with vendor counter price (admin can adjust)
        initialItems[item.product_id] = {
          admin_counter_unit_price: item.counter_unit_price,
          notes: undefined,
        };
      });
      setItems(initialItems);
      setGlobalNotes('');
      setError(null);
    }
  }, [isOpen, counterOffer]);

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Calculate total admin counter
   */
  const calculateTotal = () => {
    if (!counterOffer?.items) return 0;
    
    return counterOffer.items.reduce((sum, item) => {
      const itemData = items[item.product_id];
      if (!itemData) return sum;
      return sum + (itemData.admin_counter_unit_price * item.quantity);
    }, 0);
  };

  const totalAdminCounter = calculateTotal();

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (!counterOffer?.items) {
      setError('No counter offer items found');
      return false;
    }

    // Check if all items have prices
    for (const item of counterOffer.items) {
      const itemData = items[item.product_id];
      if (!itemData || itemData.admin_counter_unit_price <= 0) {
        setError(`Please enter a valid price for ${item.product_name}`);
        return false;
      }

      // Check if price is different from vendor counter
      if (itemData.admin_counter_unit_price === item.counter_unit_price) {
        setError(`Admin counter for ${item.product_name} must be different from vendor counter`);
        return false;
      }
    }

    // Check if total is different from vendor total
    if (totalAdminCounter === counterOffer.total_counter) {
      setError('Total admin counter must be different from vendor counter total');
      return false;
    }

    // Check max rounds
    if (currentRound >= maxRounds) {
      setError(`Maximum negotiation rounds (${maxRounds}) reached`);
      return false;
    }

    setError(null);
    return true;
  };

  /**
   * Handle submit
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Prepare data for API
      const itemsArray = counterOffer!.items.map(item => ({
        product_id: item.product_id,
        admin_counter_unit_price: items[item.product_id].admin_counter_unit_price,
        notes: items[item.product_id].notes,
      }));

      const requestData = {
        counter_offer_amount: totalAdminCounter,
        items: itemsArray,
        notes: globalNotes || undefined,
      };

      // Call onSubmit if provided, otherwise call onSuccess
      if (onSubmit) {
        await onSubmit(requestData);
      } else {
        await onSuccess();
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit admin counter offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle item change
   */
  const handleItemChange = (productId: string, value: { admin_counter_unit_price: number; notes?: string }) => {
    setItems(prev => ({
      ...prev,
      [productId]: value,
    }));
    setError(null);
  };

  if (!counterOffer) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Admin Counter Offer
          </DialogTitle>
          <DialogDescription>
            Counter vendor's offer with your pricing. Round {currentRound} of {maxRounds}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pricing" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pricing">
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Pricing */}
          <TabsContent value="pricing" className="space-y-4">
            {/* Vendor Counter Offer Summary */}
            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardHeader className="bg-orange-50 dark:bg-orange-950/20">
                <CardTitle className="text-base flex items-center gap-2 text-orange-900 dark:text-orange-100">
                  <Package className="h-5 w-5" />
                  Vendor Counter Offer Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {counterOffer.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.counter_total_price)}
                      </span>
                    </div>
                  ))}
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Vendor Total:</span>
                    <span className="text-lg text-orange-600">
                      {formatCurrency(counterOffer.total_counter)}
                    </span>
                  </div>
                </div>

                {counterOffer.notes && (
                  <Alert className="mt-4">
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">Vendor Notes:</span> {counterOffer.notes}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Admin Counter Offer Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Your Counter Offer
              </h3>

              {/* Item Forms */}
              {counterOffer.items.map((item) => (
                <AdminCounterOfferItemForm
                  key={item.product_id}
                  item={item}
                  value={items[item.product_id] || { admin_counter_unit_price: item.counter_unit_price }}
                  onChange={(value) => handleItemChange(item.product_id, value)}
                  currency={quote.currency}
                  disabled={isSubmitting}
                />
              ))}
            </div>

            {/* Total Summary */}
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-muted-foreground">Vendor Total:</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(counterOffer.total_counter)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium">Your Counter Total:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(totalAdminCounter)}
                    </span>
                  </div>
                  
                  {totalAdminCounter !== counterOffer.total_counter && (
                    <div className={cn(
                      'flex justify-between items-center p-3 rounded-lg font-medium',
                      totalAdminCounter < counterOffer.total_counter
                        ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
                        : 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'
                    )}>
                      <span>Difference:</span>
                      <span className="font-bold">
                        {formatCurrency(Math.abs(totalAdminCounter - counterOffer.total_counter))}
                        <span className="text-sm ml-2">
                          ({((Math.abs(totalAdminCounter - counterOffer.total_counter) / counterOffer.total_counter) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Global Notes */}
            <div className="space-y-2">
              <Label htmlFor="global_notes">Global Notes (Optional)</Label>
              <Textarea
                id="global_notes"
                placeholder="e.g., Price adjusted based on market conditions and vendor capacity..."
                value={globalNotes}
                onChange={(e) => setGlobalNotes(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[100px]"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {globalNotes.length}/1000 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Tab 2: History */}
          <TabsContent value="history">
            <NegotiationTimeline
              history={negotiationHistory}
              currentRound={currentRound}
              maxRounds={maxRounds}
              currency={quote.currency}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !!error}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Counter Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
