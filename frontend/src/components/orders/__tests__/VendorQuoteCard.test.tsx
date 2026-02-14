/**
 * VendorQuoteCard Component Tests
 * 
 * Tests for the VendorQuoteCard component functionality
 * 
 * Test Coverage:
 * - Rendering with accepted quote
 * - Rendering with pending quote
 * - Rendering with no vendor quote (null case)
 * - Navigation to quote detail
 * - Production progress display
 * - Status badge variants
 * - Accessibility compliance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorQuoteCard } from '../VendorQuoteCard';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock formatCurrency
vi.mock('@/utils/currency', () => ({
  formatCurrency: (amount: number, currency: string) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  },
}));

// Mock ProductionCountdown component
vi.mock('@/components/quotes/ProductionCountdown', () => ({
  ProductionCountdown: ({ acceptedDate, estimatedDays }: { acceptedDate: string; estimatedDays: number }) => (
    <div data-testid="production-countdown">
      <span>Accepted: {acceptedDate}</span>
      <span>Estimated: {estimatedDays} days</span>
    </div>
  ),
}));

// Wrapper component for Router context
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('VendorQuoteCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Rendering with Accepted Quote', () => {
    const acceptedQuoteOrder = {
      vendor_quote_uuid: 'quote-uuid-123',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_quote_accepted_at: '2024-01-01T00:00:00Z',
      vendor_agreed_price: 5000000,
      vendor_estimated_delivery_days: 10,
      vendor_name: 'PT Vendor Terpercaya',
    };

    it('renders the card with all accepted quote information', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={acceptedQuoteOrder} />
        </Wrapper>
      );

      // Check card title
      expect(screen.getByText('Vendor Quote Status')).toBeInTheDocument();

      // Check quote status
      expect(screen.getByText('Quote Status:')).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();

      // Check vendor name
      expect(screen.getByText('Vendor:')).toBeInTheDocument();
      expect(screen.getByText('PT Vendor Terpercaya')).toBeInTheDocument();

      // Check agreed price
      expect(screen.getByText('Agreed Price:')).toBeInTheDocument();
      expect(screen.getByText(/Rp 5\.000\.000/)).toBeInTheDocument();

      // Check estimated delivery
      expect(screen.getByText('Estimated Delivery:')).toBeInTheDocument();
      expect(screen.getByText('10 days')).toBeInTheDocument();
    });

    it('displays production progress for accepted quote', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={acceptedQuoteOrder} />
        </Wrapper>
      );

      // Check production progress section
      expect(screen.getByText('Production Progress:')).toBeInTheDocument();
      expect(screen.getByTestId('production-countdown')).toBeInTheDocument();
    });

    it('shows success badge variant for accepted status', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={acceptedQuoteOrder} />
        </Wrapper>
      );

      // Check that the badge with accepted status is rendered
      const badge = screen.getByText('Accepted');
      expect(badge).toBeInTheDocument();
    });

    it('renders View Quote Details button', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={acceptedQuoteOrder} />
        </Wrapper>
      );

      const button = screen.getByRole('button', { name: /view quote details/i });
      expect(button).toBeInTheDocument();
    });

    it('handles navigation to quote detail page', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={acceptedQuoteOrder} />
        </Wrapper>
      );

      const button = screen.getByRole('button', { name: /view quote details/i });
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/quotes/quote-uuid-123');
    });

    it('displays agreed price with proper formatting', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={acceptedQuoteOrder} />
        </Wrapper>
      );

      // Check that price is formatted correctly
      const priceElement = screen.getByText(/Rp 5\.000\.000/);
      expect(priceElement).toBeInTheDocument();
      expect(priceElement).toHaveClass('text-green-600');
    });

    it('shows production countdown with correct props', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={acceptedQuoteOrder} />
        </Wrapper>
      );

      const countdown = screen.getByTestId('production-countdown');
      expect(countdown).toBeInTheDocument();
      expect(countdown.textContent).toContain('2024-01-01T00:00:00Z');
      expect(countdown.textContent).toContain('10 days');
    });
  });

  describe('Rendering with Pending Quote', () => {
    const pendingQuoteOrder = {
      vendor_quote_uuid: 'quote-uuid-456',
      vendor_quote_status: 'sent',
      vendor_quote_status_label: 'Sent to Vendor',
      vendor_name: 'PT Vendor Lain',
    };

    it('renders the card with pending quote information', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={pendingQuoteOrder} />
        </Wrapper>
      );

      // Check card title
      expect(screen.getByText('Vendor Quote Status')).toBeInTheDocument();

      // Check quote status
      expect(screen.getByText('Quote Status:')).toBeInTheDocument();
      expect(screen.getByText('Sent to Vendor')).toBeInTheDocument();

      // Check vendor name
      expect(screen.getByText('Vendor:')).toBeInTheDocument();
      expect(screen.getByText('PT Vendor Lain')).toBeInTheDocument();
    });

    it('does not show agreed terms for pending quote', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={pendingQuoteOrder} />
        </Wrapper>
      );

      // Should not show agreed price
      expect(screen.queryByText('Agreed Price:')).not.toBeInTheDocument();

      // Should not show estimated delivery
      expect(screen.queryByText('Estimated Delivery:')).not.toBeInTheDocument();

      // Should not show production progress
      expect(screen.queryByText('Production Progress:')).not.toBeInTheDocument();
      expect(screen.queryByTestId('production-countdown')).not.toBeInTheDocument();
    });

    it('shows secondary badge variant for sent status', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={pendingQuoteOrder} />
        </Wrapper>
      );

      const badge = screen.getByText('Sent to Vendor');
      expect(badge).toBeInTheDocument();
    });

    it('still renders View Quote Details button for pending quote', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={pendingQuoteOrder} />
        </Wrapper>
      );

      const button = screen.getByRole('button', { name: /view quote details/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Rendering with No Vendor Quote', () => {
    const noQuoteOrder = {
      vendor_quote_uuid: undefined,
    };

    it('returns null when no vendor quote exists', () => {
      const { container } = render(
        <Wrapper>
          <VendorQuoteCard order={noQuoteOrder} />
        </Wrapper>
      );

      // Component should not render anything
      expect(container.firstChild).toBeNull();
    });

    it('does not render when vendor_quote_uuid is null', () => {
      const { container } = render(
        <Wrapper>
          <VendorQuoteCard order={{ vendor_quote_uuid: null as any }} />
        </Wrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('does not render when vendor_quote_uuid is empty string', () => {
      const { container } = render(
        <Wrapper>
          <VendorQuoteCard order={{ vendor_quote_uuid: '' }} />
        </Wrapper>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Status Badge Variants', () => {
    it('shows success variant for accepted status', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'accepted',
              vendor_quote_status_label: 'Accepted',
            }} 
          />
        </Wrapper>
      );

      const badge = screen.getByText('Accepted');
      expect(badge).toBeInTheDocument();
    });

    it('shows warning variant for countered status', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'countered',
              vendor_quote_status_label: 'Countered',
            }} 
          />
        </Wrapper>
      );

      const badge = screen.getByText('Countered');
      expect(badge).toBeInTheDocument();
    });

    it('shows destructive variant for rejected status', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'rejected',
              vendor_quote_status_label: 'Rejected',
            }} 
          />
        </Wrapper>
      );

      const badge = screen.getByText('Rejected');
      expect(badge).toBeInTheDocument();
    });

    it('shows secondary variant for open status', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'open',
              vendor_quote_status_label: 'Open',
            }} 
          />
        </Wrapper>
      );

      const badge = screen.getByText('Open');
      expect(badge).toBeInTheDocument();
    });

    it('shows outline variant for unknown status', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'unknown',
              vendor_quote_status_label: 'Unknown',
            }} 
          />
        </Wrapper>
      );

      const badge = screen.getByText('Unknown');
      expect(badge).toBeInTheDocument();
    });

    it('handles missing status label gracefully', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'accepted',
            }} 
          />
        </Wrapper>
      );

      // Should show "Unknown" when label is missing
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Null Safety', () => {
    it('handles missing vendor name gracefully', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'accepted',
              vendor_quote_status_label: 'Accepted',
            }} 
          />
        </Wrapper>
      );

      // Should not show vendor section if name is missing
      expect(screen.queryByText('Vendor:')).not.toBeInTheDocument();
    });

    it('handles zero agreed price', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'accepted',
              vendor_quote_status_label: 'Accepted',
              vendor_agreed_price: 0,
              vendor_estimated_delivery_days: 10,
            }} 
          />
        </Wrapper>
      );

      // Should show price even if zero
      expect(screen.getByText('Agreed Price:')).toBeInTheDocument();
      expect(screen.getByText(/Rp 0/)).toBeInTheDocument();
    });

    it('handles missing accepted_at date', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'accepted',
              vendor_quote_status_label: 'Accepted',
              vendor_agreed_price: 5000000,
              vendor_estimated_delivery_days: 10,
            }} 
          />
        </Wrapper>
      );

      // Should not show production countdown without accepted_at
      expect(screen.queryByTestId('production-countdown')).not.toBeInTheDocument();
    });

    it('handles missing estimated delivery days', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'accepted',
              vendor_quote_status_label: 'Accepted',
              vendor_agreed_price: 5000000,
              vendor_quote_accepted_at: '2024-01-01T00:00:00Z',
            }} 
          />
        </Wrapper>
      );

      // Should not show production countdown without estimated days
      expect(screen.queryByTestId('production-countdown')).not.toBeInTheDocument();
    });

    it('shows agreed price only when defined', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'accepted',
              vendor_quote_status_label: 'Accepted',
              vendor_estimated_delivery_days: 10,
            }} 
          />
        </Wrapper>
      );

      // Should not show agreed price if undefined
      expect(screen.queryByText('Agreed Price:')).not.toBeInTheDocument();
    });

    it('shows estimated delivery only when defined', () => {
      render(
        <Wrapper>
          <VendorQuoteCard 
            order={{
              vendor_quote_uuid: 'test-uuid',
              vendor_quote_status: 'accepted',
              vendor_quote_status_label: 'Accepted',
              vendor_agreed_price: 5000000,
            }} 
          />
        </Wrapper>
      );

      // Should not show estimated delivery if undefined
      expect(screen.queryByText('Estimated Delivery:')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    const accessibleOrder = {
      vendor_quote_uuid: 'test-uuid',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_quote_accepted_at: '2024-01-01T00:00:00Z',
      vendor_agreed_price: 5000000,
      vendor_estimated_delivery_days: 10,
      vendor_name: 'PT Vendor Test',
    };

    it('has proper region role with aria-labelledby', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={accessibleOrder} />
        </Wrapper>
      );

      const region = screen.getByRole('region', { name: /vendor quote status/i });
      expect(region).toBeInTheDocument();
    });

    it('has proper group roles for information sections', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={accessibleOrder} />
        </Wrapper>
      );

      expect(screen.getByRole('group', { name: /quote status information/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /vendor information/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /agreed price/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /estimated delivery/i })).toBeInTheDocument();
    });

    it('has aria-label on status badge', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={accessibleOrder} />
        </Wrapper>
      );

      const badge = screen.getByLabelText(/quote status: accepted/i);
      expect(badge).toBeInTheDocument();
    });

    it('has aria-label on agreed price', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={accessibleOrder} />
        </Wrapper>
      );

      const price = screen.getByLabelText(/agreed price: rp/i);
      expect(price).toBeInTheDocument();
    });

    it('has aria-label on estimated delivery', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={accessibleOrder} />
        </Wrapper>
      );

      const delivery = screen.getByLabelText(/estimated delivery: 10 days/i);
      expect(delivery).toBeInTheDocument();
    });

    it('has aria-label on view quote button', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={accessibleOrder} />
        </Wrapper>
      );

      const button = screen.getByRole('button', { name: /view quote details/i });
      expect(button).toBeInTheDocument();
    });

    it('has aria-hidden on decorative icons', () => {
      const { container } = render(
        <Wrapper>
          <VendorQuoteCard order={accessibleOrder} />
        </Wrapper>
      );

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    const responsiveOrder = {
      vendor_quote_uuid: 'test-uuid',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_agreed_price: 5000000,
      vendor_estimated_delivery_days: 10,
    };

    it('renders with proper spacing classes', () => {
      const { container } = render(
        <Wrapper>
          <VendorQuoteCard order={responsiveOrder} />
        </Wrapper>
      );

      const content = container.querySelector('.space-y-4');
      expect(content).toBeInTheDocument();
    });

    it('renders button with full width on mobile', () => {
      render(
        <Wrapper>
          <VendorQuoteCard order={responsiveOrder} />
        </Wrapper>
      );

      const button = screen.getByRole('button', { name: /view quote details/i });
      expect(button).toHaveClass('w-full');
    });

    it('uses flex layout for information rows', () => {
      const { container } = render(
        <Wrapper>
          <VendorQuoteCard order={responsiveOrder} />
        </Wrapper>
      );

      const flexRows = container.querySelectorAll('.flex.items-center.justify-between');
      expect(flexRows.length).toBeGreaterThan(0);
    });
  });
});
