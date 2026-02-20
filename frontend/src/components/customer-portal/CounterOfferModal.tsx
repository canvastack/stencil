import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/utils/currency';

interface CounterOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number, notes: string) => void;
  currentAmount: number;
  currency?: string;
  isSubmitting?: boolean;
}

export function CounterOfferModal({
  open,
  onClose,
  onSubmit,
  currentAmount,
  currency = 'IDR',
  isSubmitting,
}: CounterOfferModalProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      counter_amount: currentAmount,
      notes: '',
    },
  });

  const counterAmount = watch('counter_amount');
  const difference = currentAmount - (counterAmount || 0);
  const percentageDiff = ((difference / currentAmount) * 100).toFixed(2);

  const onFormSubmit = (data: any) => {
    onSubmit(data.counter_amount, data.notes);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Counter Offer</DialogTitle>
          <DialogDescription>
            Propose a different price for this quotation. Our team will review your offer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label>Current Quote Amount</Label>
            <div className="text-2xl font-bold text-muted-foreground">
              {formatCurrency(currentAmount, currency)}
            </div>
          </div>

          <div>
            <Label htmlFor="counter_amount">Your Counter Offer *</Label>
            <Input
              id="counter_amount"
              type="number"
              step="0.01"
              {...register('counter_amount', {
                required: 'Counter amount is required',
                min: { value: 1, message: 'Amount must be positive' },
                max: { value: currentAmount, message: 'Counter offer cannot exceed original amount' },
              })}
            />
            {errors.counter_amount && (
              <p className="text-sm text-red-500 mt-1">{errors.counter_amount.message}</p>
            )}
            {counterAmount && counterAmount < currentAmount && (
              <p className="text-sm text-green-600 mt-1">
                Discount: {formatCurrency(difference, currency)} ({percentageDiff}%)
              </p>
            )}
            {counterAmount && counterAmount > currentAmount && (
              <p className="text-sm text-orange-600 mt-1">
                Warning: Your counter offer is higher than the original quote
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Reason for Counter Offer *</Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Please explain why you're requesting this price..."
              {...register('notes', {
                required: 'Reason is required',
                minLength: { value: 20, message: 'Please provide at least 20 characters' },
              })}
            />
            {errors.notes && (
              <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Counter Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
