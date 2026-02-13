/**
 * QuoteResponseForm Component Tests
 * 
 * Tests for the quote response form component.
 * 
 * Requirements: 6.2, 6.3, 6.5, 6.6, 6.8, 6.9, 6.13, 10.6
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuoteResponseForm from '@/components/vendor/QuoteResponseForm';

describe('QuoteResponseForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Accept Form', () => {
    it('should render accept form with correct title', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Accept Quote')).toBeInTheDocument();
      expect(screen.getByText('Confirm your acceptance and provide delivery estimate')).toBeInTheDocument();
    });

    it('should render estimated delivery days input', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/Estimated Delivery Days/i)).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
    });

    it('should submit with delivery days and notes', async () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
        />
      );

      const deliveryInput = screen.getByLabelText(/Estimated Delivery Days/i);
      const notesInput = screen.getByLabelText(/Notes/i);
      const submitButton = screen.getByText('Accept Quote');

      fireEvent.change(deliveryInput, { target: { value: '14' } });
      fireEvent.change(notesInput, { target: { value: 'Can deliver in 2 weeks' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          responseType: 'accept',
          estimatedDeliveryDays: 14,
          notes: 'Can deliver in 2 weeks',
        });
      });
    });

    it('should submit without optional fields', async () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText('Accept Quote');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          responseType: 'accept',
        });
      });
    });

    it('should show error for negative delivery days', async () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
        />
      );

      const deliveryInput = screen.getByLabelText(/Estimated Delivery Days/i);
      const submitButton = screen.getByText('Accept Quote');

      fireEvent.change(deliveryInput, { target: { value: '-5' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Reject Form', () => {
    it('should render reject form with correct title', () => {
      render(
        <QuoteResponseForm
          responseType="reject"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Reject Quote')).toBeInTheDocument();
      expect(screen.getByText('Please provide a reason for rejection')).toBeInTheDocument();
    });

    it('should render rejection reason textarea', () => {
      render(
        <QuoteResponseForm
          responseType="reject"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
    });

    it('should submit with rejection reason', async () => {
      render(
        <QuoteResponseForm
          responseType="reject"
          onSubmit={mockOnSubmit}
        />
      );

      const reasonInput = screen.getByLabelText(/Rejection Reason/i);
      const submitButton = screen.getByText('Reject Quote');

      fireEvent.change(reasonInput, { target: { value: 'Cannot meet specifications' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          responseType: 'reject',
          rejectionReason: 'Cannot meet specifications',
        });
      });
    });

    it('should show error for empty rejection reason', async () => {
      render(
        <QuoteResponseForm
          responseType="reject"
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText('Reject Quote');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Rejection reason is required/i)).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Counter Offer Form', () => {
    it('should render counter offer form with correct title', () => {
      render(
        <QuoteResponseForm
          responseType="counter"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Counter Offer')).toBeInTheDocument();
      expect(screen.getByText('Submit your counter offer amount')).toBeInTheDocument();
    });

    it('should render counter offer amount input', () => {
      render(
        <QuoteResponseForm
          responseType="counter"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/Counter Offer Amount/i)).toBeInTheDocument();
    });

    it('should submit with counter offer amount and notes', async () => {
      render(
        <QuoteResponseForm
          responseType="counter"
          onSubmit={mockOnSubmit}
        />
      );

      const amountInput = screen.getByLabelText(/Counter Offer Amount/i);
      const notesInput = screen.getByLabelText(/Notes/i);
      const submitButton = screen.getByText('Submit Counter Offer');

      fireEvent.change(amountInput, { target: { value: '15000' } });
      fireEvent.change(notesInput, { target: { value: 'Best price we can offer' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          responseType: 'counter',
          counterOfferAmount: 15000,
          notes: 'Best price we can offer',
        });
      });
    });

    it('should show error for zero counter offer amount', async () => {
      render(
        <QuoteResponseForm
          responseType="counter"
          onSubmit={mockOnSubmit}
        />
      );

      const amountInput = screen.getByLabelText(/Counter Offer Amount/i);
      const submitButton = screen.getByText('Submit Counter Offer');

      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should show error for empty counter offer amount', async () => {
      render(
        <QuoteResponseForm
          responseType="counter"
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText('Submit Counter Offer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Expired Quote', () => {
    it('should show expired warning when isExpired is true', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          isExpired={true}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText(/This quote has expired/i)).toBeInTheDocument();
      expect(screen.queryByText('Accept Quote')).not.toBeInTheDocument();
    });

    it('should not show form when expired', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          isExpired={true}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByLabelText(/Estimated Delivery Days/i)).not.toBeInTheDocument();
    });
  });

  describe('Already Responded', () => {
    it('should show responded warning when hasResponded is true', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          hasResponded={true}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText(/You have already responded/i)).toBeInTheDocument();
      expect(screen.queryByText('Accept Quote')).not.toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not render cancel button when onCancel is not provided', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should disable form when isSubmitting is true', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const deliveryInput = screen.getByLabelText(/Estimated Delivery Days/i);
      const submitButton = screen.getByText('Submitting...');

      expect(deliveryInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('should show submitting text when isSubmitting is true', () => {
      render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });
  });

  describe('Icons and Styling', () => {
    it('should render accept icon for accept form', () => {
      const { container } = render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
        />
      );

      const icon = container.querySelector('.text-green-600');
      expect(icon).toBeInTheDocument();
    });

    it('should render reject icon for reject form', () => {
      const { container } = render(
        <QuoteResponseForm
          responseType="reject"
          onSubmit={mockOnSubmit}
        />
      );

      const icon = container.querySelector('.text-red-600');
      expect(icon).toBeInTheDocument();
    });

    it('should render counter icon for counter form', () => {
      const { container } = render(
        <QuoteResponseForm
          responseType="counter"
          onSubmit={mockOnSubmit}
        />
      );

      const icon = container.querySelector('.text-blue-600');
      expect(icon).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <QuoteResponseForm
          responseType="accept"
          onSubmit={mockOnSubmit}
          className="custom-class"
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });
  });
});
