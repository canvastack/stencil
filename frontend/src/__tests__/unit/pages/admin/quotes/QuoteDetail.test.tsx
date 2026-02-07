/**
 * Unit tests for QuoteDetail page
 * 
 * Tests the enhanced QuoteDetail page with:
 * - Status history timeline display
 * - Message thread interface
 * - Available actions based on status
 * 
 * Requirements: 8.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { QuoteDetail } from '@/pages/admin/quotes/QuoteDetail';
import { quoteService } from '@/services/tenant/quoteService';
import type { Quote } from '@/services/tenant/quoteService';

// Mock the quote service
vi.mock('@/services/tenant/quoteService', () => ({
  quoteService: {
    getQuote: vi.fn(),
    sendQuote: vi.fn(),
    deleteQuote: vi.fn(),
    generatePDF: vi.fn(),
  },
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-quote-uuid' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockQuote: Quote = {
  id: 'test-quote-uuid',
  quote_number: 'QT-2024-001',
  order_id: 'order-uuid',
  customer_id: 'customer-uuid',
  vendor_id: 'vendor-uuid',
  title: 'Custom Etching Quote',
  description: 'Test quote description',
  status: 'sent',
  total_amount: 1000000,
  tax_amount: 100000,
  grand_total: 1100000,
  currency: 'IDR',
  valid_until: '2024-12-31',
  terms_and_conditions: 'Test terms',
  notes: 'Test notes',
  revision_number: 1,
  created_by: 'admin-uuid',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  customer: {
    id: 'customer-uuid',
    name: 'Test Customer',
    email: 'customer@test.com',
    company: 'Test Company',
  },
  vendor: {
    id: 'vendor-uuid',
    name: 'Test Vendor',
    email: 'vendor@test.com',
    company: 'Vendor Company',
  },
  items: [
    {
      id: 'item-uuid',
      quote_id: 'test-quote-uuid',
      description: 'Custom Etching Plate',
      quantity: 2,
      unit_price: 500000,
      vendor_cost: 300000,
      total_vendor_cost: 600000,
      total_unit_price: 1000000,
      total_price: 1000000,
      profit_per_piece: 200000,
      profit_per_piece_percent: 40,
      profit_total: 400000,
      profit_total_percent: 40,
      specifications: {
        material: 'stainless_steel',
        dimensions: '10x15cm',
      },
    },
  ],
  history: [
    {
      action: 'Quote created',
      user_name: 'Admin User',
      timestamp: '2024-01-01T00:00:00Z',
      notes: 'Initial quote creation',
    },
    {
      action: 'Quote sent to vendor',
      user_name: 'Admin User',
      timestamp: '2024-01-02T00:00:00Z',
      notes: 'Sent for vendor review',
    },
  ],
};

describe('QuoteDetail', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <QuoteDetail />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should display quote details', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('QT-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Custom Etching Quote')).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
      expect(screen.getByText('Test Vendor')).toBeInTheDocument();
    });
  });

  it('should display status history timeline', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Status History')).toBeInTheDocument();
      expect(screen.getByText('Quote created')).toBeInTheDocument();
      expect(screen.getByText('Quote sent to vendor')).toBeInTheDocument();
      expect(screen.getByText('Initial quote creation')).toBeInTheDocument();
      expect(screen.getByText('Sent for vendor review')).toBeInTheDocument();
    });
  });

  it('should display message thread interface', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type your message to the vendor...')).toBeInTheDocument();
      expect(screen.getByText('Send Message')).toBeInTheDocument();
    });
  });

  it('should show available actions based on status', async () => {
    const draftQuote = { ...mockQuote, status: 'draft' as const };
    vi.mocked(quoteService.getQuote).mockResolvedValue(draftQuote);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Send to Vendor')).toBeInTheDocument();
      expect(screen.getByText('Delete Quote')).toBeInTheDocument();
    });
  });

  it('should not show send to vendor button for sent quotes', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText('Send to Vendor')).not.toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    vi.mocked(quoteService.getQuote).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderComponent();

    expect(screen.getByText('Loading quote...')).toBeInTheDocument();
  });

  it('should display error state', async () => {
    vi.mocked(quoteService.getQuote).mockRejectedValue(new Error('Failed to load'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load quote')).toBeInTheDocument();
      expect(screen.getByText('Back to Quotes')).toBeInTheDocument();
    });
  });

  it('should format status history with user information', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Admin User')).toHaveLength(2);
    });
  });

  it('should display quote items', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('Custom Etching Plate')).toBeInTheDocument();
    });
  });
});
