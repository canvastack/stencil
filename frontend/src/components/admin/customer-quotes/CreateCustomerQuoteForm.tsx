import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';

interface CreateCustomerQuoteFormProps {
  orderId: number;
  vendorQuoteId: number;
  vendorData: {
    vendor_total_cost: number;
    base_profit_amount: number;
    base_profit_percentage: number;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function CreateCustomerQuoteForm({
  orderId,
  vendorQuoteId,
  vendorData,
  onSubmit,
  onCancel,
}: CreateCustomerQuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: 'Customer Quotation',
      handling_fee: 0,
      shipping_cost: 0,
      insurance: 0,
      other_costs: 0,
      other_costs_description: '',
      tax_rate: 11.00,
      valid_days: 7,
      payment_terms: 'DP 50% + Balance 50%',
      delivery_timeline: '14 working days',
      terms_and_conditions: '',
    },
  });

  const watchedValues = watch();

  // Calculate totals
  const additionalCosts = 
    (watchedValues.handling_fee || 0) +
    (watchedValues.shipping_cost || 0) +
    (watchedValues.insurance || 0) +
    (watchedValues.other_costs || 0);

  const subtotal = vendorData.vendor_total_cost + vendorData.base_profit_amount + additionalCosts;
  const taxAmount = Math.round(subtotal * (watchedValues.tax_rate / 100));
  const grandTotal = subtotal + taxAmount;
  const totalProfit = vendorData.base_profit_amount + additionalCosts;
  const totalProfitPercentage = ((totalProfit / vendorData.vendor_total_cost) * 100).toFixed(2);

  const onFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        order_id: orderId,
        vendor_quote_id: vendorQuoteId,
        ...data,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quote Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title', { required: true })} />
            {errors.title && <span className="text-sm text-red-500">Title is required</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Vendor Cost</p>
              <p className="text-lg font-semibold">{formatCurrency(vendorData.vendor_total_cost)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Base Profit ({vendorData.base_profit_percentage}%)</p>
              <p className="text-lg font-semibold">{formatCurrency(vendorData.base_profit_amount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="handling_fee">Handling Fee</Label>
              <Input id="handling_fee" type="number" {...register('handling_fee', { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="shipping_cost">Shipping Cost</Label>
              <Input id="shipping_cost" type="number" {...register('shipping_cost', { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="insurance">Insurance</Label>
              <Input id="insurance" type="number" {...register('insurance', { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="other_costs">Other Costs</Label>
              <Input id="other_costs" type="number" {...register('other_costs', { valueAsNumber: true })} />
            </div>
          </div>

          {watchedValues.other_costs > 0 && (
            <div>
              <Label htmlFor="other_costs_description">Other Costs Description</Label>
              <Input id="other_costs_description" {...register('other_costs_description')} />
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tax ({watchedValues.tax_rate}%)</span>
              <span className="font-semibold">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Total Profit</span>
              <span>{formatCurrency(totalProfit)} ({totalProfitPercentage}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valid_days">Valid For (days)</Label>
              <Input id="valid_days" type="number" {...register('valid_days', { required: true, valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="delivery_timeline">Delivery Timeline</Label>
              <Input id="delivery_timeline" {...register('delivery_timeline')} />
            </div>
          </div>

          <div>
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input id="payment_terms" {...register('payment_terms', { required: true })} />
          </div>

          <div>
            <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
            <Textarea id="terms_and_conditions" rows={4} {...register('terms_and_conditions')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Quote'}
        </Button>
      </div>
    </form>
  );
}
