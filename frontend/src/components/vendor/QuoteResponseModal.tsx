/**
 * QuoteResponseModal Component
 * 
 * Modal wrapper for QuoteResponseForm to handle accept, reject, and counter offer actions.
 * Provides a dialog interface for responding to quotes.
 * 
 * Requirements: 6.2, 6.3, 6.5, 6.6, 6.8, 6.9
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import QuoteResponseForm, { type QuoteResponseData, type ResponseType } from './QuoteResponseForm';

export interface QuoteResponseModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  
  /**
   * Type of response (accept, reject, counter)
   */
  responseType: ResponseType;
  
  /**
   * Whether the quote is expired
   */
  isExpired?: boolean;
  
  /**
   * Whether the quote has already been responded to
   */
  hasResponded?: boolean;
  
  /**
   * Callback when modal should close
   */
  onOpenChange: (open: boolean) => void;
  
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: QuoteResponseData) => void | Promise<void>;
  
  /**
   * Whether the form is currently submitting
   */
  isSubmitting?: boolean;
}

export default function QuoteResponseModal({
  open,
  responseType,
  isExpired = false,
  hasResponded = false,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: QuoteResponseModalProps) {
  /**
   * Get modal title based on response type
   */
  const getModalTitle = () => {
    switch (responseType) {
      case 'accept':
        return 'Accept Quote';
      case 'reject':
        return 'Reject Quote';
      case 'counter':
        return 'Submit Counter Offer';
    }
  };

  /**
   * Get modal description based on response type
   */
  const getModalDescription = () => {
    switch (responseType) {
      case 'accept':
        return 'Confirm your acceptance and provide delivery estimate';
      case 'reject':
        return 'Please provide a reason for rejection';
      case 'counter':
        return 'Submit your counter offer amount';
    }
  };

  /**
   * Handle form submission and close modal on success
   */
  const handleSubmit = async (data: QuoteResponseData) => {
    await onSubmit(data);
    // Close modal after successful submission
    onOpenChange(false);
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>

        <QuoteResponseForm
          responseType={responseType}
          isExpired={isExpired}
          hasResponded={hasResponded}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
