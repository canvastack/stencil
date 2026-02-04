import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuoteEdit from '../QuoteEdit';
import { quoteService } from '@/services/tenant/quoteService';
import type { Quote } from '@/services/tenant/quoteService';

// Mock dependencies
vi.mock('@/services/tenant/quoteService');
vi.mock('@/components/tenant/quotes/QuoteForm', () => ({
  QuoteForm: ({ mode, initialData, onSubmit, onCancel, loading }: any) => (
    <div data-testid="quote-form">
      <div>Mode: {mode}</div>
      <div>Quote Number: {initialData?.quote_number}</div>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <button onClick={() => onSubmit({ title: 'Updated Quote' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
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

describe('QuoteEdit', () => {
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
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading quote...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Quote Fetching', () => {
    it('should fetch quote on mount', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(quoteService.getQuote).toHaveBeenCalledWith('quote-uuid-123');
      });

      await waitFor(() => {
        expect(screen.getByTestId('quote-form')).toBeInTheDocument();
        expect(screen.getByText('Mode: edit')).toBeInTheDocument();
        expect(screen.getByText('Quote Number: QT-2024-001')).toBeInTheDocument();
      });
    });

    it('should show error when quote not found', async () => {
      vi.mocked(quoteService.getQuote).mockRejectedValue({
        response: { status: 404 },
      });

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Cannot Edit Quote')).toBeInTheDocument();
        expect(screen.getByText(/Quote not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Validation', () => {
    it('should allow editing open quotes', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue({
        ...mockQuote,
        status: 'open',
      });

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quote-form')).toBeInTheDocument();
      });
    });

    it('should allow editing countered quotes', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue({
        ...mockQuote,
        status: 'countered',
      });

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quote-form')).toBeInTheDocument();
        expect(screen.getByText(/has been countered/i)).toBeInTheDocument();
      });
    });

    it('should not allow editing accepted quotes', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue({
        ...mockQuote,
        status: 'accepted',
      });

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Cannot Edit Quote')).toBeInTheDocument();
        expect(screen.getByText(/Only quotes with status "open" or "countered" can be edited/i)).toBeInTheDocument();
      });
    });

    it('should not allow editing rejected quotes', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue({
        ...mockQuote,
        status: 'rejected',
      });

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Cannot Edit Quote')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form and redirect to detail page', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);
      vi.mocked(quoteService.updateQuote).mockResolvedValue(mockQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
            <Route path="/admin/quotes/:id" element={<div>Quote Detail Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quote-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(quoteService.updateQuote).toHaveBeenCalledWith('quote-uuid-123', { title: 'Updated Quote' });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/quotes/quote-uuid-123');
      });
    });

    it('should show error toast on submission failure', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);
      vi.mocked(quoteService.updateQuote).mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quote-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(quoteService.updateQuote).toHaveBeenCalled();
      });
    });
  });

  describe('Cancel Button', () => {
    it('should navigate back to detail page when cancel is clicked without changes', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
            <Route path="/admin/quotes/:id" element={<div>Quote Detail Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quote-form')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/quotes/quote-uuid-123');
      });
    });
  });

  describe('Routing', () => {
    it('should be accessible at /admin/quotes/:id/edit', async () => {
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(
        <MemoryRouter initialEntries={['/admin/quotes/quote-uuid-123/edit']}>
          <Routes>
            <Route path="/admin/quotes/:id/edit" element={<QuoteEdit />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Quote')).toBeInTheDocument();
      });
    });
  });
});
