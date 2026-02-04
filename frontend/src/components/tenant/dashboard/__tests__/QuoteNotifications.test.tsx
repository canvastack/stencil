import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuoteNotifications } from '../QuoteNotifications';
import { useQuoteStore } from '@/stores/quoteStore';

// Mock the quote store
vi.mock('@/stores/quoteStore');

// Mock the QuoteStatusBadge component
vi.mock('../../quotes/QuoteStatusBadge', () => ({
  QuoteStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

const mockQuotes = [
  {
    id: '1',
    quote_number: 'Q-000123',
    status: 'open',
    grand_total: 5000000,
    currency: 'IDR',
    valid_until: '2026-03-01',
    vendor: {
      id: 'v1',
      name: 'PT Vendor ABC',
      email: 'vendor@abc.com',
      company: 'PT Vendor ABC',
    },
    customer: {
      id: 'c1',
      name: 'Customer 1',
      email: 'customer@example.com',
    },
  },
  {
    id: '2',
    quote_number: 'Q-000124',
    status: 'countered',
    grand_total: 3000000,
    currency: 'IDR',
    valid_until: '2026-03-05',
    vendor: {
      id: 'v2',
      name: 'PT Vendor XYZ',
      email: 'vendor@xyz.com',
      company: 'PT Vendor XYZ',
    },
    customer: {
      id: 'c1',
      name: 'Customer 1',
      email: 'customer@example.com',
    },
  },
  {
    id: '3',
    quote_number: 'Q-000125',
    status: 'accepted',
    grand_total: 2000000,
    currency: 'IDR',
    valid_until: '2026-03-10',
    vendor: {
      id: 'v3',
      name: 'PT Vendor 123',
      email: 'vendor@123.com',
      company: 'PT Vendor 123',
    },
    customer: {
      id: 'c1',
      name: 'Customer 1',
      email: 'customer@example.com',
    },
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <QuoteNotifications />
    </BrowserRouter>
  );
};

describe('QuoteNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: [],
      quotesLoading: true,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByText('Pending Quotes')).toBeInTheDocument();
    expect(screen.getByText('Quotes awaiting your action')).toBeInTheDocument();
  });

  it('fetches pending quotes on mount', () => {
    const mockFetchQuotes = vi.fn();
    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: [],
      quotesLoading: false,
      fetchQuotes: mockFetchQuotes,
    } as any);

    renderComponent();

    expect(mockFetchQuotes).toHaveBeenCalledWith({
      status: ['open', 'countered'],
      per_page: 5,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  });

  it('displays empty state when no pending quotes', () => {
    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: [mockQuotes[2]], // Only accepted quote
      quotesLoading: false,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByText('No pending quotes')).toBeInTheDocument();
    expect(screen.getByText('All quotes have been reviewed')).toBeInTheDocument();
  });

  it('displays pending quotes (open and countered)', () => {
    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: mockQuotes,
      quotesLoading: false,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    // Should show 2 pending quotes (open + countered)
    expect(screen.getByText('Q-000123')).toBeInTheDocument();
    expect(screen.getByText('Q-000124')).toBeInTheDocument();
    expect(screen.getByText('PT Vendor ABC')).toBeInTheDocument();
    expect(screen.getByText('PT Vendor XYZ')).toBeInTheDocument();

    // Should NOT show accepted quote
    expect(screen.queryByText('Q-000125')).not.toBeInTheDocument();
  });

  it('displays quote details correctly', () => {
    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: [mockQuotes[0]],
      quotesLoading: false,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByText('Q-000123')).toBeInTheDocument();
    expect(screen.getByText('PT Vendor ABC')).toBeInTheDocument();
    expect(screen.getByText(/Rp 5,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/Valid until:/)).toBeInTheDocument();
  });

  it('displays badge with pending count', () => {
    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: mockQuotes,
      quotesLoading: false,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    // Should show badge with count of 2 (open + countered)
    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
  });

  it('renders review button for each quote', () => {
    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: [mockQuotes[0], mockQuotes[1]],
      quotesLoading: false,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    const reviewButtons = screen.getAllByText('Review');
    expect(reviewButtons).toHaveLength(2);
  });

  it('renders view all link', () => {
    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: mockQuotes,
      quotesLoading: false,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    const viewAllLink = screen.getByText('View All');
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink.closest('a')).toHaveAttribute('href', '/admin/quotes');
  });

  it('limits display to 5 quotes', () => {
    const manyQuotes = Array.from({ length: 10 }, (_, i) => ({
      ...mockQuotes[0],
      id: `quote-${i}`,
      quote_number: `Q-00${i.toString().padStart(4, '0')}`,
    }));

    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: manyQuotes,
      quotesLoading: false,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    const reviewButtons = screen.getAllByText('Review');
    expect(reviewButtons).toHaveLength(5);
  });

  it('renders status badge for each quote', () => {
    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: [mockQuotes[0], mockQuotes[1]],
      quotesLoading: false,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    const statusBadges = screen.getAllByTestId('status-badge');
    expect(statusBadges).toHaveLength(2);
    expect(statusBadges[0]).toHaveTextContent('open');
    expect(statusBadges[1]).toHaveTextContent('countered');
  });

  it('handles quotes without valid_until date', () => {
    const quoteWithoutDate = {
      ...mockQuotes[0],
      valid_until: null,
    };

    vi.mocked(useQuoteStore).mockReturnValue({
      quotes: [quoteWithoutDate],
      quotesLoading: false,
      fetchQuotes: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.queryByText(/Valid until:/)).not.toBeInTheDocument();
  });
});
