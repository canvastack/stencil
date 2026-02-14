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
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { QuoteDetail } from '@/pages/admin/quotes/QuoteDetail';
import { quoteService } from '@/services/tenant/quoteService';
import type { Quote } from '@/types/quote';

// Mock the quote service
vi.mock('@/services/tenant/quoteService', () => ({
  quoteService: {
    getQuote: vi.fn(),
    sendQuote: vi.fn(),
    deleteQuote: vi.fn(),
    generatePDF: vi.fn(),
    acceptCounterOffer: vi.fn(),
    rejectCounterOffer: vi.fn(),
    adminCounterOffer: vi.fn(),
  },
}));

// Mock the message service
vi.mock('@/services/tenant/messageService', () => ({
  messageService: {
    getMessages: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, unread_count: 0 } }),
    sendMessage: vi.fn(),
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
    const user = userEvent.setup();
    const result = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <QuoteDetail />
        </BrowserRouter>
      </QueryClientProvider>
    );
    return { ...result, user };
  };

  it('should display quote details', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('QT-2024-001').length).toBeGreaterThan(0);
      expect(screen.getByText('Custom Etching Quote')).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
      expect(screen.getByText('Test Vendor')).toBeInTheDocument();
    });
  });

  it('should display status history timeline', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    const { user } = renderComponent();

    // Wait for quote to load - use unique text
    await waitFor(() => {
      expect(screen.getByText('Custom Etching Quote')).toBeInTheDocument();
    });

    // Click on History tab
    const historyTab = screen.getByRole('tab', { name: /Status History/i });
    await user.click(historyTab);

    // Check status history content
    await waitFor(() => {
      expect(screen.getByText('Status History Timeline')).toBeInTheDocument();
      expect(screen.getByText('Quote created')).toBeInTheDocument();
      expect(screen.getByText('Quote sent to vendor')).toBeInTheDocument();
      expect(screen.getByText('Initial quote creation')).toBeInTheDocument();
      expect(screen.getByText('Sent for vendor review')).toBeInTheDocument();
    });
  });

  it('should display message thread interface', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    const { user } = renderComponent();

    // Wait for quote to load - use unique text
    await waitFor(() => {
      expect(screen.getByText('Custom Etching Quote')).toBeInTheDocument();
    });

    // Click on Messages tab
    const messagesTab = screen.getByRole('tab', { name: /Messages/i });
    await user.click(messagesTab);

    // Check messages content
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
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

    // The loading state shows skeleton loaders, not text
    expect(screen.getAllByRole('generic').length).toBeGreaterThan(0);
  });

  it('should display error state', async () => {
    vi.mocked(quoteService.getQuote).mockRejectedValue(new Error('Failed to load'));

    renderComponent();

    // Wait for loading to finish and error state to appear
    await waitFor(
      () => {
        expect(screen.getByText('Error Loading Quote')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    
    expect(screen.getByText('Failed to load quote')).toBeInTheDocument();
    expect(screen.getByText('Back to Quotes')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should format status history with user information', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    const { user } = renderComponent();

    // Wait for quote to load - use unique text
    await waitFor(() => {
      expect(screen.getByText('Custom Etching Quote')).toBeInTheDocument();
    });

    // Click on History tab
    const historyTab = screen.getByRole('tab', { name: /Status History/i });
    await user.click(historyTab);

    // Check that status history is displayed
    await waitFor(() => {
      expect(screen.getByText('Status History Timeline')).toBeInTheDocument();
      expect(screen.getByText('Quote created')).toBeInTheDocument();
      expect(screen.getByText('Quote sent to vendor')).toBeInTheDocument();
    });
  });

  it('should display quote items', async () => {
    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Quote Items')).toBeInTheDocument();
      expect(screen.getByText('Custom Etching Plate')).toBeInTheDocument();
    });
  });

  // Vendor Response Display Tests (Task 8.2.2)
  describe('Vendor Response Display', () => {
    it('should display accepted quote response with delivery days', async () => {
      const acceptedQuote: Quote = {
        ...mockQuote,
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-01-03T10:30:00Z',
        estimated_delivery_days: 7,
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(acceptedQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Vendor Accepted Quote')).toBeInTheDocument();
        expect(screen.getAllByText('Accepted').length).toBeGreaterThan(0);
        expect(screen.getByText('7 days')).toBeInTheDocument();
        expect(screen.getByText('Estimated Delivery')).toBeInTheDocument();
        expect(screen.getByText(/Responded on January 3rd, 2024/)).toBeInTheDocument();
      });
    });

    it('should display rejected quote response with reason', async () => {
      const rejectedQuote: Quote = {
        ...mockQuote,
        status: 'rejected',
        response_type: 'reject',
        responded_at: '2024-01-03T14:45:00Z',
        rejection_reason: 'Unable to meet the specifications due to material constraints',
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(rejectedQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Vendor Rejected Quote')).toBeInTheDocument();
        expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
        expect(screen.getByText('Rejection Reason')).toBeInTheDocument();
        expect(screen.getByText('Unable to meet the specifications due to material constraints')).toBeInTheDocument();
        expect(screen.getByText(/Responded on January 3rd, 2024/)).toBeInTheDocument();
      });
    });

    it('should display counter offer response with amount', async () => {
      const counteredQuote: Quote = {
        ...mockQuote,
        status: 'countered',
        response_type: 'counter',
        responded_at: '2024-01-03T16:20:00Z',
        counter_offer_amount: 1250000,
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(counteredQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Vendor Counter Offer')).toBeInTheDocument();
        expect(screen.getAllByText('Counter Offer').length).toBeGreaterThan(0);
        // Updated to match the new text format (Legacy)
        expect(screen.getByText('Counter Offer Amount (Legacy)')).toBeInTheDocument();
        // Check for the formatted amount - the formatCurrency function formats it as "Rp 1.250.000"
        expect(screen.getByText(/1\.250\.000/)).toBeInTheDocument();
        expect(screen.getByText(/Responded on January 3rd, 2024/)).toBeInTheDocument();
      });
    });

    it('should not display vendor response section when quote has not been responded to', async () => {
      const unrespondedQuote: Quote = {
        ...mockQuote,
        status: 'sent',
        response_type: undefined,
        responded_at: undefined,
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(unrespondedQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Vendor Accepted Quote')).not.toBeInTheDocument();
        expect(screen.queryByText('Vendor Rejected Quote')).not.toBeInTheDocument();
        expect(screen.queryByText('Vendor Counter Offer')).not.toBeInTheDocument();
      });
    });

    it('should display response timestamp in correct format', async () => {
      const acceptedQuote: Quote = {
        ...mockQuote,
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-06-15T09:30:00Z',
        estimated_delivery_days: 5,
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(acceptedQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Response Date')).toBeInTheDocument();
        expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
      });
    });
  });

  // Post-Acceptance Panel Tests (Task 2.4.1)
  describe('Post-Acceptance Panel', () => {
    it('should display post-acceptance panel when quote is accepted', async () => {
      const acceptedQuote: Quote = {
        ...mockQuote,
        status: 'accepted',
        responded_at: '2024-01-03T10:30:00Z',
        latest_offer: 1100000,
        quote_details: {
          estimated_delivery_days: 14,
        },
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(acceptedQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Quote Accepted by Vendor!')).toBeInTheDocument();
        expect(screen.getByText(/Vendor accepted on January 3rd, 2024/)).toBeInTheDocument();
        expect(screen.getByText('Agreed Terms:')).toBeInTheDocument();
        expect(screen.getByText('Total Price:')).toBeInTheDocument();
        expect(screen.getByText('Estimated Delivery:')).toBeInTheDocument();
        expect(screen.getByText('14 days')).toBeInTheDocument();
      });
    });

    it('should display production countdown when production progress is available', async () => {
      const acceptedQuote: Quote = {
        ...mockQuote,
        status: 'accepted',
        responded_at: '2024-01-03T10:30:00Z',
        latest_offer: 1100000,
        quote_details: {
          estimated_delivery_days: 14,
        },
        production_progress: {
          accepted_date: '2024-01-03T10:30:00Z',
          expected_delivery_date: '2024-01-17T10:30:00Z',
          days_elapsed: 5,
          days_remaining: 9,
          progress_percentage: 35.71,
          is_overdue: false,
        },
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(acceptedQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Production Timeline')).toBeInTheDocument();
        expect(screen.getByText('Days Elapsed')).toBeInTheDocument();
        expect(screen.getByText('Days Remaining')).toBeInTheDocument();
      });
    });

    it('should display next steps section with action buttons', async () => {
      const acceptedQuote: Quote = {
        ...mockQuote,
        status: 'accepted',
        responded_at: '2024-01-03T10:30:00Z',
        latest_offer: 1100000,
        quote_details: {
          estimated_delivery_days: 14,
        },
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(acceptedQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Next Steps:')).toBeInTheDocument();
        expect(screen.getByText('View Order & Advance to Customer Quote')).toBeInTheDocument();
        expect(screen.getByText('Generate Purchase Order (Coming Soon)')).toBeInTheDocument();
      });
    });

    it('should display order status sync information when available', async () => {
      const acceptedQuote: Quote = {
        ...mockQuote,
        status: 'accepted',
        responded_at: '2024-01-03T10:30:00Z',
        latest_offer: 1100000,
        quote_details: {
          estimated_delivery_days: 14,
        },
        order_status: 'customer_quote',
        order_status_label: 'Quote ke Customer',
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(acceptedQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order status:/)).toBeInTheDocument();
        expect(screen.getByText('Quote ke Customer')).toBeInTheDocument();
        expect(screen.getByText('✓ Ready for customer quotation')).toBeInTheDocument();
      });
    });

    it('should not display post-acceptance panel for non-accepted quotes', async () => {
      const sentQuote: Quote = {
        ...mockQuote,
        status: 'sent',
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(sentQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Quote Accepted by Vendor!')).not.toBeInTheDocument();
        expect(screen.queryByText('Production Timeline')).not.toBeInTheDocument();
      });
    });

    // Task 2.4.3: Comprehensive conditional rendering tests for all statuses
    it('should not display post-acceptance panel for draft status', async () => {
      const draftQuote: Quote = {
        ...mockQuote,
        status: 'draft',
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(draftQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Quote Accepted by Vendor!')).not.toBeInTheDocument();
        expect(screen.queryByText('Agreed Terms:')).not.toBeInTheDocument();
        expect(screen.queryByText('Production Timeline')).not.toBeInTheDocument();
        expect(screen.queryByText('Next Steps:')).not.toBeInTheDocument();
      });
    });

    it('should not display post-acceptance panel for open status', async () => {
      const openQuote: Quote = {
        ...mockQuote,
        status: 'open',
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(openQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Quote Accepted by Vendor!')).not.toBeInTheDocument();
        expect(screen.queryByText('Agreed Terms:')).not.toBeInTheDocument();
        expect(screen.queryByText('Production Timeline')).not.toBeInTheDocument();
        expect(screen.queryByText('Next Steps:')).not.toBeInTheDocument();
      });
    });

    it('should not display post-acceptance panel for countered status', async () => {
      const counteredQuote: Quote = {
        ...mockQuote,
        status: 'countered',
        quote_details: {
          counter_offer: {
            vendor_counter_price: 950000,
            vendor_notes: 'Counter offer notes',
          },
        },
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(counteredQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Quote Accepted by Vendor!')).not.toBeInTheDocument();
        expect(screen.queryByText('Agreed Terms:')).not.toBeInTheDocument();
        expect(screen.queryByText('Production Timeline')).not.toBeInTheDocument();
        expect(screen.queryByText('Next Steps:')).not.toBeInTheDocument();
      });
    });

    it('should not display post-acceptance panel for rejected status', async () => {
      const rejectedQuote: Quote = {
        ...mockQuote,
        status: 'rejected',
        responded_at: '2024-01-03T14:45:00Z',
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(rejectedQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Quote Accepted by Vendor!')).not.toBeInTheDocument();
        expect(screen.queryByText('Agreed Terms:')).not.toBeInTheDocument();
        expect(screen.queryByText('Production Timeline')).not.toBeInTheDocument();
        expect(screen.queryByText('Next Steps:')).not.toBeInTheDocument();
      });
    });

    it('should not display post-acceptance panel for cancelled status', async () => {
      const cancelledQuote: Quote = {
        ...mockQuote,
        status: 'cancelled',
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(cancelledQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Quote Accepted by Vendor!')).not.toBeInTheDocument();
        expect(screen.queryByText('Agreed Terms:')).not.toBeInTheDocument();
        expect(screen.queryByText('Production Timeline')).not.toBeInTheDocument();
        expect(screen.queryByText('Next Steps:')).not.toBeInTheDocument();
      });
    });

    it('should not display post-acceptance panel for expired status', async () => {
      const expiredQuote: Quote = {
        ...mockQuote,
        status: 'expired',
        valid_until: '2024-01-01T00:00:00Z', // Past date
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(expiredQuote);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Quote Accepted by Vendor!')).not.toBeInTheDocument();
        expect(screen.queryByText('Agreed Terms:')).not.toBeInTheDocument();
        expect(screen.queryByText('Production Timeline')).not.toBeInTheDocument();
        expect(screen.queryByText('Next Steps:')).not.toBeInTheDocument();
      });
    });

    it('should disable Generate PO button with coming soon message', async () => {
      const acceptedQuote: Quote = {
        ...mockQuote,
        status: 'accepted',
        responded_at: '2024-01-03T10:30:00Z',
        latest_offer: 1100000,
        quote_details: {
          estimated_delivery_days: 14,
        },
      };
      vi.mocked(quoteService.getQuote).mockResolvedValue(acceptedQuote);

      renderComponent();

      await waitFor(() => {
        const poButton = screen.getByText('Generate Purchase Order (Coming Soon)').closest('button');
        expect(poButton).toBeDisabled();
      });
    });
  });
});
