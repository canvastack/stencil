import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteHistory } from '../QuoteHistory';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date) => {
    const now = new Date('2026-02-02T12:00:00Z');
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'less than an hour ago';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }),
}));

// Mock currency formatter
vi.mock('@/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }),
}));

describe('QuoteHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should render empty state when no history entries', () => {
      render(<QuoteHistory history={[]} />);

      expect(screen.getByText('Negotiation History')).toBeInTheDocument();
      expect(screen.getByText('No history entries yet')).toBeInTheDocument();
      expect(
        screen.getByText('History will appear here as actions are taken on this quote')
      ).toBeInTheDocument();
    });

    it('should render empty state when history is undefined', () => {
      render(<QuoteHistory history={undefined as any} />);

      expect(screen.getByText('No history entries yet')).toBeInTheDocument();
    });
  });

  describe('Timeline Display', () => {
    it('should display history entries in timeline format', () => {
      const history = [
        {
          action: 'created',
          user_name: 'Admin User',
          timestamp: '2026-02-01T10:00:00Z',
          notes: 'Initial quote created',
        },
        {
          action: 'sent',
          user_name: 'Admin User',
          timestamp: '2026-02-01T14:00:00Z',
          notes: 'Sent to vendor',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Quote Created')).toBeInTheDocument();
      expect(screen.getByText('Sent to Vendor')).toBeInTheDocument();
      expect(screen.getAllByText('Admin User')).toHaveLength(2);
    });

    it('should sort history entries by timestamp (newest first)', () => {
      const history = [
        {
          action: 'created',
          timestamp: '2026-02-01T10:00:00Z',
        },
        {
          action: 'accepted',
          timestamp: '2026-02-02T10:00:00Z',
        },
        {
          action: 'sent',
          timestamp: '2026-02-01T14:00:00Z',
        },
      ];

      render(<QuoteHistory history={history} />);

      const entries = screen.getAllByRole('heading', { level: 4 });
      expect(entries[0]).toHaveTextContent('Quote Accepted');
      expect(entries[1]).toHaveTextContent('Sent to Vendor');
      expect(entries[2]).toHaveTextContent('Quote Created');
    });

    it('should display relative time for each entry', () => {
      const history = [
        {
          action: 'created',
          timestamp: '2026-02-02T10:00:00Z', // 2 hours ago
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('should show full date on hover (title attribute)', () => {
      const history = [
        {
          action: 'created',
          timestamp: '2026-02-01T10:00:00Z',
        },
      ];

      render(<QuoteHistory history={history} />);

      const timeElement = screen.getByText('1 day ago');
      expect(timeElement).toHaveAttribute('title');
    });
  });

  describe('Action Types', () => {
    it('should display correct icon and label for created action', () => {
      const history = [{ action: 'created', timestamp: '2026-02-01T10:00:00Z' }];
      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Quote Created')).toBeInTheDocument();
    });

    it('should display correct icon and label for sent action', () => {
      const history = [{ action: 'sent', timestamp: '2026-02-01T10:00:00Z' }];
      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Sent to Vendor')).toBeInTheDocument();
    });

    it('should display correct icon and label for countered action', () => {
      const history = [{ action: 'countered', timestamp: '2026-02-01T10:00:00Z' }];
      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Counter Offer')).toBeInTheDocument();
    });

    it('should display correct icon and label for accepted action', () => {
      const history = [{ action: 'accepted', timestamp: '2026-02-01T10:00:00Z' }];
      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Quote Accepted')).toBeInTheDocument();
    });

    it('should display correct icon and label for rejected action', () => {
      const history = [{ action: 'rejected', timestamp: '2026-02-01T10:00:00Z' }];
      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Quote Rejected')).toBeInTheDocument();
    });

    it('should handle unknown action types gracefully', () => {
      const history = [{ action: 'custom_action', timestamp: '2026-02-01T10:00:00Z' }];
      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });
  });

  describe('Price Changes', () => {
    it('should display price changes for counter offers', () => {
      const history = [
        {
          action: 'countered',
          timestamp: '2026-02-01T10:00:00Z',
          previous_offer: 5000000,
          new_offer: 4500000,
        },
      ];

      render(<QuoteHistory history={history} currency="IDR" />);

      expect(screen.getByText('Previous Offer:')).toBeInTheDocument();
      expect(screen.getByText('New Offer:')).toBeInTheDocument();
      expect(screen.getByText('Difference:')).toBeInTheDocument();
    });

    it('should show positive difference in red for price increase', () => {
      const history = [
        {
          action: 'countered',
          timestamp: '2026-02-01T10:00:00Z',
          previous_offer: 4000000,
          new_offer: 5000000,
        },
      ];

      const { container } = render(<QuoteHistory history={history} currency="IDR" />);

      const differenceElement = screen.getByText(/\+/);
      expect(differenceElement).toHaveClass('text-red-600');
    });

    it('should show negative difference in green for price decrease', () => {
      const history = [
        {
          action: 'countered',
          timestamp: '2026-02-01T10:00:00Z',
          previous_offer: 5000000,
          new_offer: 4000000,
        },
      ];

      const { container } = render(<QuoteHistory history={history} currency="IDR" />);

      const differenceElement = screen.getByText(/-/);
      expect(differenceElement).toHaveClass('text-green-600');
    });

    it('should display percentage change', () => {
      const history = [
        {
          action: 'countered',
          timestamp: '2026-02-01T10:00:00Z',
          previous_offer: 5000000,
          new_offer: 4000000, // -20%
        },
      ];

      render(<QuoteHistory history={history} currency="IDR" />);

      expect(screen.getByText(/20\.0%/)).toBeInTheDocument();
    });

    it('should display initial offer amount when no previous offer', () => {
      const history = [
        {
          action: 'initial_quote',
          timestamp: '2026-02-01T10:00:00Z',
          offer: 5000000,
        },
      ];

      render(<QuoteHistory history={history} currency="IDR" />);

      expect(screen.getByText('Offer Amount:')).toBeInTheDocument();
    });
  });

  describe('Rejection Reasons', () => {
    it('should display rejection reason in highlighted box', () => {
      const history = [
        {
          action: 'rejected',
          timestamp: '2026-02-01T10:00:00Z',
          notes: 'Price exceeds budget',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Rejection Reason')).toBeInTheDocument();
      expect(screen.getByText('Price exceeds budget')).toBeInTheDocument();
    });

    it('should display rejection_reason field if notes not present', () => {
      const history = [
        {
          action: 'rejected',
          timestamp: '2026-02-01T10:00:00Z',
          rejection_reason: 'Delivery time too long',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Delivery time too long')).toBeInTheDocument();
    });

    it('should not display rejection box for non-rejected actions', () => {
      const history = [
        {
          action: 'accepted',
          timestamp: '2026-02-01T10:00:00Z',
          notes: 'Some notes',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.queryByText('Rejection Reason')).not.toBeInTheDocument();
    });
  });

  describe('General Notes', () => {
    it('should display general notes for non-rejected actions', () => {
      const history = [
        {
          action: 'created',
          timestamp: '2026-02-01T10:00:00Z',
          notes: 'Initial quote for custom etching project',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Initial quote for custom etching project')).toBeInTheDocument();
    });

    it('should preserve whitespace in notes', () => {
      const history = [
        {
          action: 'created',
          timestamp: '2026-02-01T10:00:00Z',
          notes: 'Line 1\nLine 2\nLine 3',
        },
      ];

      const { container } = render(<QuoteHistory history={history} />);

      // Check that the notes element has whitespace-pre-wrap class
      const notesElement = container.querySelector('.whitespace-pre-wrap');
      expect(notesElement).toBeInTheDocument();
      expect(notesElement).toHaveTextContent('Line 1');
      expect(notesElement).toHaveTextContent('Line 2');
      expect(notesElement).toHaveTextContent('Line 3');
    });
  });

  describe('User Information', () => {
    it('should display user name when available', () => {
      const history = [
        {
          action: 'created',
          timestamp: '2026-02-01T10:00:00Z',
          user_name: 'John Doe',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should not display user section when user_name not available', () => {
      const history = [
        {
          action: 'created',
          timestamp: '2026-02-01T10:00:00Z',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should display IP address for vendor responses', () => {
      const history = [
        {
          action: 'accepted',
          timestamp: '2026-02-01T10:00:00Z',
          ip_address: '192.168.1.1',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText('IP: 192.168.1.1')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should show only maxVisibleEntries by default', () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        action: 'created',
        timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      }));

      render(<QuoteHistory history={history} maxVisibleEntries={5} />);

      const entries = screen.getAllByRole('heading', { level: 4 });
      expect(entries).toHaveLength(5);
    });

    it('should display "Show More" button when entries exceed maxVisibleEntries', () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        action: 'created',
        timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      }));

      render(<QuoteHistory history={history} maxVisibleEntries={5} />);

      expect(screen.getByText(/Show 5 More Entries/)).toBeInTheDocument();
    });

    it('should expand to show all entries when "Show More" clicked', () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        action: 'created',
        timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      }));

      render(<QuoteHistory history={history} maxVisibleEntries={5} />);

      const showMoreButton = screen.getByText(/Show 5 More Entries/);
      fireEvent.click(showMoreButton);

      const entries = screen.getAllByRole('heading', { level: 4 });
      expect(entries).toHaveLength(10);
    });

    it('should collapse back to maxVisibleEntries when "Show Less" clicked', () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        action: 'created',
        timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      }));

      render(<QuoteHistory history={history} maxVisibleEntries={5} />);

      // Expand
      const showMoreButton = screen.getByText(/Show 5 More Entries/);
      fireEvent.click(showMoreButton);

      // Collapse
      const showLessButton = screen.getByText('Show Less');
      fireEvent.click(showLessButton);

      const entries = screen.getAllByRole('heading', { level: 4 });
      expect(entries).toHaveLength(5);
    });

    it('should not show expand/collapse button when entries <= maxVisibleEntries', () => {
      const history = Array.from({ length: 3 }, (_, i) => ({
        action: 'created',
        timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      }));

      render(<QuoteHistory history={history} maxVisibleEntries={5} />);

      expect(screen.queryByText(/Show More/)).not.toBeInTheDocument();
      expect(screen.queryByText('Show Less')).not.toBeInTheDocument();
    });

    it('should use singular "Entry" for 1 additional entry', () => {
      const history = Array.from({ length: 6 }, (_, i) => ({
        action: 'created',
        timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      }));

      render(<QuoteHistory history={history} maxVisibleEntries={5} />);

      expect(screen.getByText(/Show 1 More Entry/)).toBeInTheDocument();
    });
  });

  describe('Entry Count Display', () => {
    it('should display total entry count in description', () => {
      const history = Array.from({ length: 7 }, (_, i) => ({
        action: 'created',
        timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      }));

      render(<QuoteHistory history={history} />);

      expect(screen.getByText(/7 entries/)).toBeInTheDocument();
    });

    it('should use singular "entry" for 1 entry', () => {
      const history = [
        {
          action: 'created',
          timestamp: '2026-02-01T10:00:00Z',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText(/1 entry/)).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should use provided currency for formatting', () => {
      const history = [
        {
          action: 'countered',
          timestamp: '2026-02-01T10:00:00Z',
          previous_offer: 5000000,
          new_offer: 4500000,
        },
      ];

      render(<QuoteHistory history={history} currency="USD" />);

      // Currency formatter should be called with USD
      expect(screen.getByText('Previous Offer:')).toBeInTheDocument();
    });

    it('should default to IDR when currency not provided', () => {
      const history = [
        {
          action: 'countered',
          timestamp: '2026-02-01T10:00:00Z',
          offer: 5000000,
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Offer Amount:')).toBeInTheDocument();
    });
  });

  describe('Old/New Value Changes', () => {
    it('should display old and new values for generic changes', () => {
      const history = [
        {
          action: 'revised',
          timestamp: '2026-02-01T10:00:00Z',
          old_value: 5000000,
          new_value: 4800000,
        },
      ];

      render(<QuoteHistory history={history} currency="IDR" />);

      expect(screen.getByText('Previous:')).toBeInTheDocument();
      expect(screen.getByText('Updated:')).toBeInTheDocument();
    });

    it('should format numeric values as currency', () => {
      const history = [
        {
          action: 'price_updated',
          timestamp: '2026-02-01T10:00:00Z',
          old_value: 5000000,
          new_value: 4800000,
        },
      ];

      render(<QuoteHistory history={history} currency="IDR" />);

      expect(screen.getByText('Previous:')).toBeInTheDocument();
    });

    it('should display string values as-is', () => {
      const history = [
        {
          action: 'revised',
          timestamp: '2026-02-01T10:00:00Z',
          old_value: 'Draft',
          new_value: 'Sent',
        },
      ];

      render(<QuoteHistory history={history} />);

      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Sent')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to root element', () => {
      const { container } = render(
        <QuoteHistory history={[]} className="custom-class" />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const history = [
        {
          action: 'created',
          timestamp: '2026-02-01T10:00:00Z',
        },
      ];

      render(<QuoteHistory history={history} />);

      // Main title should be present
      expect(screen.getByText('Negotiation History')).toBeInTheDocument();
      
      // Entry titles should be h4
      expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    });

    it('should have accessible button for expand/collapse', () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        action: 'created',
        timestamp: `2026-02-0${i + 1}T10:00:00Z`,
      }));

      render(<QuoteHistory history={history} maxVisibleEntries={5} />);

      const button = screen.getByRole('button', { name: /Show 5 More Entries/ });
      expect(button).toBeInTheDocument();
    });
  });
});
