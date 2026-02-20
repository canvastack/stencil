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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RejectQuoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting?: boolean;
}

const REJECTION_REASONS = [
  { value: 'price_too_high', label: 'Price too high' },
  { value: 'delivery_too_long', label: 'Delivery time too long' },
  { value: 'changed_requirements', label: 'Changed requirements' },
  { value: 'found_alternative', label: 'Found alternative supplier' },
  { value: 'other', label: 'Other (please specify)' },
];

export function RejectQuoteModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: RejectQuoteModalProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      reason_type: 'price_too_high',
      additional_notes: '',
    },
  });

  const reasonType = watch('reason_type');
  const showAdditionalNotes = reasonType === 'other';

  const onFormSubmit = (data: any) => {
    const reasonLabel = REJECTION_REASONS.find(r => r.value === data.reason_type)?.label || data.reason_type;
    const fullReason = showAdditionalNotes && data.additional_notes
      ? `${reasonLabel}: ${data.additional_notes}`
      : reasonLabel;
    onSubmit(fullReason);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reject Quote</DialogTitle>
          <DialogDescription>
            Please let us know why you're declining this quotation. Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label>Reason for Rejection *</Label>
            <RadioGroup
              defaultValue="price_too_high"
              onValueChange={(value) => {
                const event = { target: { name: 'reason_type', value } };
                register('reason_type').onChange(event);
              }}
            >
              {REJECTION_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {showAdditionalNotes && (
            <div>
              <Label htmlFor="additional_notes">Additional Details *</Label>
              <Textarea
                id="additional_notes"
                rows={3}
                placeholder="Please provide more details..."
                {...register('additional_notes', {
                  required: showAdditionalNotes ? 'Please provide details' : false,
                  minLength: showAdditionalNotes ? { value: 10, message: 'Please provide at least 10 characters' } : undefined,
                })}
              />
              {errors.additional_notes && (
                <p className="text-sm text-red-500 mt-1">{errors.additional_notes.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
