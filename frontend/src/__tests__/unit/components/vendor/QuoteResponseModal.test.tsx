/**
 * QuoteResponseModal Component Tests
 * 
 * Tests for the QuoteResponseModal component covering:
 * - Accept modal validation
 * - Reject modal validation
 * - Counter offer modal validation
 * 
 * Requirements: 6.2, 6.3, 6.5, 6.6, 6.8, 6.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuoteResponseModal from '@/components/vendor/QuoteResponseModal';

describe('QuoteResponseModal', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Accept Modal Validation', () => {
    it('should render accept modal with form fields', () => {
      render(
        <QuoteResponseModal
          open={true}
          responseType="accept"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/estimated delivery days/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes \(optional\)/i)).toBeInTheDocument();
    });

    it('should allow submission with valid estimated delivery days', async () => {
      const user = userEvent.setup();
      
      render(
        <QuoteResponseModal
          open={true}
          responseType="accept"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in estimated delivery days
      const deliveryInput = screen.getByLabelText(/estimated delivery days/i);
      await user.clear(deliveryInput);
      await user.type(deliveryInput, '14');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /accept quote/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          responseType: 'accept',
          estimatedDeliveryDays: 14,
        });
      });
    });

    it('should allow submission with optional notes', async () => {
      const user = userEvent.setup();
      
      render(
        <QuoteResponseModal
          open={true}
          responseType="accept"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in notes
      const notesInput = screen.getByLabelText(/notes \(optional\)/i);
      await user.type(notesInput, 'We can deliver within the specified timeframe');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /accept quote/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          responseType: 'accept',
          notes: 'We can deliver within the specified timeframe',
        });
      });
    });
  });

  describe('Reject Modal Validation', () => {
    it('should render reject modal with form fields', () => {
      render(
        <QuoteResponseModal
          open={true}
          responseType="reject"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/rejection reason/i)).toBeInTheDocument();
    });

    it('should allow submission with valid rejection reason', async () => {
      const user = userEvent.setup();
      
      render(
        <QuoteResponseModal
          open={true}
          responseType="reject"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in rejection reason
      const reasonInput = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonInput, 'Price is too high for our current budget');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /reject quote/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          responseType: 'reject',
          rejectionReason: 'Price is too high for our current budget',
        });
      });
    });

    it('should not allow submission with empty rejection reason', async () => {
      const user = userEvent.setup();
      
      render(
        <QuoteResponseModal
          open={true}
          responseType="reject"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in rejection reason with only whitespace
      const reasonInput = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonInput, '   ');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /reject quote/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/rejection reason is required/i)).toBeInTheDocument();
      });

      // Should not call onSubmit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Counter Offer Modal Validation', () => {
    it('should render counter offer modal with form fields', () => {
      render(
        <QuoteResponseModal
          open={true}
          responseType="counter"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/counter offer amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes \(optional\)/i)).toBeInTheDocument();
    });

    it('should allow submission with valid counter offer amount', async () => {
      const user = userEvent.setup();
      
      render(
        <QuoteResponseModal
          open={true}
          responseType="counter"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in counter offer amount
      const amountInput = screen.getByLabelText(/counter offer amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '15000');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit counter offer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          responseType: 'counter',
          counterOfferAmount: 15000,
        });
      });
    });

    it('should allow submission with optional notes', async () => {
      const user = userEvent.setup();
      
      render(
        <QuoteResponseModal
          open={true}
          responseType="counter"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in counter offer amount and notes
      const amountInput = screen.getByLabelText(/counter offer amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '12500');

      const notesInput = screen.getByLabelText(/notes \(optional\)/i);
      await user.type(notesInput, 'This is our best price considering material costs');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit counter offer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          responseType: 'counter',
          counterOfferAmount: 12500,
          notes: 'This is our best price considering material costs',
        });
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should close modal on cancel', async () => {
      const user = userEvent.setup();
      
      render(
        <QuoteResponseModal
          open={true}
          responseType="accept"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should close modal after successful submission', async () => {
      const user = userEvent.setup();
      
      render(
        <QuoteResponseModal
          open={true}
          responseType="accept"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Submit form
      const submitButton = screen.getByRole('button', { name: /accept quote/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should disable form inputs when submitting', () => {
      render(
        <QuoteResponseModal
          open={true}
          responseType="accept"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const deliveryInput = screen.getByLabelText(/estimated delivery days/i);
      expect(deliveryInput).toBeDisabled();

      const submitButton = screen.getByRole('button', { name: /submitting/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show expired warning when quote is expired', () => {
      render(
        <QuoteResponseModal
          open={true}
          responseType="accept"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          isExpired={true}
        />
      );

      expect(screen.getByText(/this quote has expired/i)).toBeInTheDocument();
    });

    it('should show already responded warning when quote has been responded to', () => {
      render(
        <QuoteResponseModal
          open={true}
          responseType="accept"
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          hasResponded={true}
        />
      );

      expect(screen.getByText(/you have already responded to this quote/i)).toBeInTheDocument();
    });
  });
});
