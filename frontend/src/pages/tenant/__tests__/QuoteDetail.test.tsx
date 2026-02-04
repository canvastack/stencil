import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuoteDetail from '../QuoteDetail';
import { quoteService } from '@/services/tenant/quoteService';
import type { Quote } from '@/services/tenant/quoteService';

// Mock dependencies
vi.mock('@/services/tenant/quoteService');
vi.mock('@/components/tenant/quotes/QuoteDetailView', () => ({
  QuoteDetailView: ({ quote, loading }: any) => (
    <div data-testid="quote-detail-view">
      <div>Quote Number: {quote?.quote_number}</div>
      <div>Loading: {loading ? 'true' : 'false'}</div>
    </div>
  ),
}));

vi.mock('@/components/tenant/quotes/QuoteActions', () => ({
  QuoteActions: ({ quote, onActionComplete }: any) => (
    <div data-testid="quote-actions">
      <div>Quote ID: {quote?.id}</div>
      <button onClick={onActionComplete}>Complete Action</button>
    </div>
  ),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('QuoteDetail', () => {
  const mockQuote: Quote = {
    id: 'quote-uuid-123',
    quote_number: 'QT-2024-001',
    order_id: 'order-uuid-123',
    customer_id: 'customer-uuid-123',
    vendor_id: 'vendor-uuid-123',
    title: 'Test Quote',
    description: 'Test description',
    status: 'open',
    total_amount: 1000000,
    tax_amount: 100000,
    grand_total: 1100000,
    currency: 'IDR',
    valid_until: '2024-12-31T23:59:59Z',
    terms_and_conditions: 'Test terms',
    notes: 'Test notes',
    revision_number: 1,
    created_by: 'user-uuid-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    customer: {
      id: 'customer-uuid-123',
      name: 'Test Customer',
      email: 'customer@test.com',
      company: 'Test Company',
    },
    vendor: {
      id: 'vendor-uuid-123',
      name: 'Test Vendor',
      email: 'vendor@test.com',
      company: 'Test Vendor Company',
    },
    items: [
      {
        id: 'item-uuid-1',
        quote_id: 'quote-uuid-123',
        description: 'Test Item',
        quantity: 2,
        unit_price: 500000,
        total_price: 1000000,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching quote', () => {
      vi.mocked(quoteService.getQuote).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading quote details...')).toBeInTheDocument();
    });
  });

  describe('Quote Fetching', () => {
    it('should fetch quote on mount', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(quoteService.getQuote).toHaveBeenCalledWith('quote-uuid-123');
      });
    });

    it('should display quote details after successful fetch', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quote-detail-view')).toBeInTheDocument();
        expect(screen.getByText('Quote Number: QT-2024-001')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display 404 error message when quote not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Quote not found' },
        },
      };
      vi.mocked(quoteService.getQuote).mockRejectedValue(error);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Quote')).toBeInTheDocument();
        expect(
          screen.getByText(/Quote not found. It may have been deleted or you may not have permission to view it./)
        ).toBeInTheDocument();
      });
    });

    it('should display 403 error message when access denied', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Access denied' },
        },
      };
      vi.mocked(quoteService.getQuote).mockRejectedValue(error);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Quote')).toBeInTheDocument();
        expect(
          screen.getByText(/Access denied. You do not have permission to view this quote./)
        ).toBeInTheDocument();
      });
    });

    it('should display generic error message for other errors', async () => {
      const error = new Error('Network error');
      vi.mocked(quoteService.getQuote).mockRejectedValue(error);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Quote')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should have breadcrumb navigation', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Quotes')).toBeInTheDocument();
        expect(screen.getByText('QT-2024-001')).toBeInTheDocument();
      });
    });

    it('should have "Back to Quotes" button', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const backButtons = screen.getAllByText('Back to Quotes');
        expect(backButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Quote Actions', () => {
    it('should render QuoteActions component for non-closed quotes', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quote-actions')).toBeInTheDocument();
      });
    });

    it('should not render QuoteActions for accepted quotes', async () => {
      const acceptedQuote = { ...mockQuote, status: 'accepted' };
      vi.mocked(quoteService.getQuote).mockResolvedValue(acceptedQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('quote-actions')).not.toBeInTheDocument();
      });
    });

    it('should not render QuoteActions for rejected quotes', async () => {
      const rejectedQuote = { ...mockQuote, status: 'rejected' };
      vi.mocked(quoteService.getQuote).mockResolvedValue(rejectedQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('quote-actions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Expired Quote Warning', () => {
    it('should show warning for expired quotes', async () => {
      const expiredQuote = {
        ...mockQuote,
        valid_until: '2020-01-01T00:00:00Z', // Past date
        status: 'open',
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(expiredQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/This quote has expired on/)).toBeInTheDocument();
      });
    });

    it('should not show warning for non-expired quotes', async () => {
      const futureQuote = {
        ...mockQuote,
        valid_until: '2099-12-31T23:59:59Z', // Future date
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(futureQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/This quote has expired on/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Read-Only Notice', () => {
    it('should show read-only notice for accepted quotes', async () => {
      const acceptedQuote = { ...mockQuote, status: 'accepted' };
      vi.mocked(quoteService.getQuote).mockResolvedValue(acceptedQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/This quote is read-only/)).toBeInTheDocument();
        expect(screen.getByText(/This quote has been accepted and cannot be modified/)).toBeInTheDocument();
      });
    });

    it('should show read-only notice for rejected quotes', async () => {
      const rejectedQuote = { ...mockQuote, status: 'rejected' };
      vi.mocked(quoteService.getQuote).mockResolvedValue(rejectedQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123']}>
          <Routes>
            <Route path="/admin/quotes/:id" element={<QuoteDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/This quote is read-only/)).toBeInTheDocument();
        expect(screen.getByText(/This quote has been rejected and cannot be modified/)).toBeInTheDocument();
      });
    });
  });
});
