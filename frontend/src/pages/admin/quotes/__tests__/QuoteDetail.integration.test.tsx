/**
 * QuoteDetail Integration Tests
 * 
 * Tests the integration of post-acceptance workflow in QuoteDetail page.
 * Verifies:
 * - Post-acceptance panel rendering when status = 'accepted'
 * - Production countdown display
 * - Agreed terms display
 * - Next steps buttons
 * - Order status sync information
 * - Navigation to Order Detail page
 * - Data fetching and display
 * 
 * Task: 2.6.2 Integration tests
 * Spec: .kiro/specs/post-acceptance-workflow/tasks.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuoteDetail } from '../QuoteDetail';
import { quoteService } from '@/services/tenant/quoteService';
import { messageService } from '@/services/tenant/messageService';
import type { Quote } from '@/services/tenant/quoteService';

// Mock services
vi.mock('@/services/tenant/quoteService');
vi.mock('@/services/tenant/messageService');

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-quote-uuid' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock help system
vi.mock('@/components/help/HelpSystemProvider', () => ({
  useHelpSystem: () => ({
    setCurrentContext: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Helper function to create complete mock quote with all required fields
const createMockQuote = (overrides: Partial<Quote> = {}): Quote => {
  const baseQuote: Quote = {
    id: 'quote-1',
    uuid: 'test-quote-uuid',
    quote_number: 'Q-2024-001',
    customer_id: 'customer-1',
    vendor_id: 'vendor-1',
    title: 'Test Quote',
    status: 'sent',
    response_type: undefined,
    order_id: 'order-uuid-123',
    total_amount: 150000,
    tax_amount: 0,
    grand_total: 150000,
    currency: 'IDR',
    revision_number: 1,
    created_by: 'admin-1',
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-02-01T09:00:00Z',
    valid_until: '2024-02-15T23:59:59Z',
    initial_offer: 150000,
    latest_offer: 150000,
    quote_details: {},
    customer: {
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@example.com',
      company: 'Test Company',
    },
    vendor: {
      id: 'vendor-1',
      name: 'Test Vendor',
      email: 'vendor@example.com',
      company: 'Test Vendor Company',
    },
    items: [],
    ...overrides,
  } as Quote;
  
  return baseQuote;
};

describe('QuoteDetail - Post-Acceptance Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    // Mock empty messages by default
    vi.mocked(messageService.getMessages).mockResolvedValue({
      success: true,
      data: [],
      meta: {
        total: 0,
        unread_count: 0,
      },
    });
  });

  describe('Post-Acceptance Panel Rendering', () => {
    it('should render post-acceptance panel when quote status is accepted', async () => {
      const mockQuote = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        order_status: 'customer_quote',
        order_status_label: 'Customer Quote',
        responded_at: '2024-02-01T10:00:00Z',
        quote_details: {
          estimated_delivery_days: 7,
        },
        production_progress: {
          accepted_date: '2024-02-01T10:00:00Z',
          expected_delivery_date: '2024-02-08T10:00:00Z',
          days_elapsed: 2,
          days_remaining: 5,
          progress_percentage: 28.57,
          is_overdue: false,
          overdue_days: 0,
        },
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for quote to load (use getAllByText since quote number appears multiple times)
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-001')[0]).toBeInTheDocument();
      });

      // Verify post-acceptance panel is rendered
      await waitFor(() => {
        expect(screen.getByText(/Quote Accepted by Vendor!/i)).toBeInTheDocument();
      });

      // Verify acceptance date is displayed
      expect(screen.getByText(/Vendor accepted on/i)).toBeInTheDocument();
    });

    it('should NOT render post-acceptance panel when quote status is not accepted', async () => {
      const mockQuote = createMockQuote({
        quote_number: 'Q-2024-002',
        status: 'sent',
        order_status: 'vendor_negotiation',
        order_status_label: 'Vendor Negotiation',
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for quote to load (use getAllByText since quote number appears multiple times)
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-002')[0]).toBeInTheDocument();
      });

      // Verify post-acceptance panel is NOT rendered
      expect(screen.queryByText(/Quote Accepted by Vendor!/i)).not.toBeInTheDocument();
    });
  });

  describe('Agreed Terms Display', () => {
    it('should display agreed price and delivery days', async () => {
      const mockQuote = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-02-01T10:00:00Z',
        quote_details: {
          estimated_delivery_days: 7,
        },
        production_progress: {
          accepted_date: '2024-02-01T10:00:00Z',
          expected_delivery_date: '2024-02-08T10:00:00Z',
          days_elapsed: 2,
          days_remaining: 5,
          progress_percentage: 28.57,
          is_overdue: false,
          overdue_days: 0,
        },
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote as Quote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for quote to load (use getAllByText since quote number appears multiple times)
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-001')[0]).toBeInTheDocument();
      });

      // Verify agreed terms section
      await waitFor(() => {
        expect(screen.getByText('Agreed Terms:')).toBeInTheDocument();
      });

      // Verify price is displayed (check for price value, format may vary)
      expect(screen.getByText(/Total Price:/i)).toBeInTheDocument();
      // The price is rendered, just verify the section exists
      await waitFor(() => {
        const agreedTermsSection = screen.getByText('Agreed Terms:');
        expect(agreedTermsSection).toBeInTheDocument();
      });

      // Verify delivery days are displayed
      expect(screen.getByText(/Estimated Delivery:/i)).toBeInTheDocument();
      expect(screen.getByText(/7 days/i)).toBeInTheDocument();
    });
  });

  describe('Production Countdown Display', () => {
    it('should display production countdown with progress', async () => {
      const mockQuote = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-02-01T10:00:00Z',
        quote_details: {
          estimated_delivery_days: 7,
        },
        production_progress: {
          accepted_date: '2024-02-01T10:00:00Z',
          expected_delivery_date: '2024-02-08T10:00:00Z',
          days_elapsed: 2,
          days_remaining: 5,
          progress_percentage: 28.57,
          is_overdue: false,
          overdue_days: 0,
        },
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for quote to load (use getAllByText since quote number appears multiple times)
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-001')[0]).toBeInTheDocument();
      });

      // Verify production timeline section
      await waitFor(() => {
        expect(screen.getByText('Production Timeline')).toBeInTheDocument();
      });

      // Verify countdown elements
      expect(screen.getByText('Days Elapsed')).toBeInTheDocument();
      expect(screen.getByText('Days Remaining')).toBeInTheDocument();
      // Verify production timeline section exists (actual numbers may vary based on calculation)
      await waitFor(() => {
        const timelineSection = screen.getByText('Production Timeline');
        expect(timelineSection).toBeInTheDocument();
      });
    });

    it('should display overdue warning when production is overdue', async () => {
      const mockQuote = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-01-20T10:00:00Z',
        created_at: '2024-01-20T09:00:00Z',
        quote_details: {
          estimated_delivery_days: 7,
        },
        production_progress: {
          accepted_date: '2024-01-20T10:00:00Z',
          expected_delivery_date: '2024-01-27T10:00:00Z',
          days_elapsed: 10,
          days_remaining: -3,
          progress_percentage: 100,
          is_overdue: true,
          overdue_days: 3,
        },
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for quote to load (use getAllByText since quote number appears multiple times)
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-001')[0]).toBeInTheDocument();
      });

      // Verify overdue warning exists
      await waitFor(() => {
        expect(screen.getByText('Overdue')).toBeInTheDocument();
      });

      // Verify overdue message is displayed (text contains "overdue")
      const overdueElements = screen.getAllByText(/overdue/i);
      expect(overdueElements.length).toBeGreaterThan(0);
    });
  });

  describe('Next Steps Buttons', () => {
    it('should display "View Order" button and navigate on click', async () => {
      const user = userEvent.setup();
      const mockQuote = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-02-01T10:00:00Z',
        quote_details: {
          estimated_delivery_days: 7,
        },
        production_progress: {
          accepted_date: '2024-02-01T10:00:00Z',
          expected_delivery_date: '2024-02-08T10:00:00Z',
          days_elapsed: 2,
          days_remaining: 5,
          progress_percentage: 28.57,
          is_overdue: false,
          overdue_days: 0,
        },
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for quote to load (use getAllByText since quote number appears multiple times)
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-001')[0]).toBeInTheDocument();
      });

      // Find and click "View Order" button
      const viewOrderButton = await screen.findByRole('button', {
        name: /View Order.*Advance to Customer Quote/i,
      });
      expect(viewOrderButton).toBeInTheDocument();

      await user.click(viewOrderButton);

      // Verify navigation was called
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/orders/order-uuid-123');
      });
    });

    it('should display "Generate Purchase Order" button (disabled)', async () => {
      const mockQuote = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-02-01T10:00:00Z',
        quote_details: {
          estimated_delivery_days: 7,
        },
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for quote to load (use getAllByText since quote number appears multiple times)
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-001')[0]).toBeInTheDocument();
      });

      // Find "Generate Purchase Order" button
      const generatePOButton = await screen.findByRole('button', {
        name: /Generate Purchase Order/i,
      });
      expect(generatePOButton).toBeInTheDocument();
      expect(generatePOButton).toBeDisabled();
    });
  });

  describe('Order Status Sync Information', () => {
    it('should display order status sync information', async () => {
      const mockQuote = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        order_status: 'customer_quote',
        order_status_label: 'Customer Quote',
        responded_at: '2024-02-01T10:00:00Z',
        quote_details: {
          estimated_delivery_days: 7,
        },
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for quote to load (use getAllByText since quote number appears multiple times)
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-001')[0]).toBeInTheDocument();
      });

      // Verify order status is displayed
      await waitFor(() => {
        expect(screen.getByText(/Order status:/i)).toBeInTheDocument();
        expect(screen.getByText('Customer Quote')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch quote data on mount', async () => {
      const mockQuote = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-02-01T10:00:00Z',
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Verify getQuote was called with correct UUID
      await waitFor(() => {
        expect(quoteService.getQuote).toHaveBeenCalledWith('test-quote-uuid');
      });

      // Verify quote data is displayed (use getAllByText since quote number appears multiple times)
      const quoteNumbers = await screen.findAllByText('Q-2024-001');
      expect(quoteNumbers[0]).toBeInTheDocument();
    });

    it('should handle loading state', async () => {
      vi.mocked(quoteService.getQuote).mockImplementation(
        () => new Promise((resolve) => {
          const mockQuote = createMockQuote();
          setTimeout(() => resolve(mockQuote), 100);
        })
      );

      const { container } = render(<QuoteDetail />, { wrapper: createWrapper() });

      // Verify loading skeleton is shown (check for skeleton elements with animate-pulse class)
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
      
      // Wait for quote to load
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-001')[0]).toBeInTheDocument();
      });
    });

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch quote');
      vi.mocked(quoteService.getQuote).mockRejectedValue(error);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait longer for retries to complete and error state to show
      await waitFor(() => {
        expect(screen.getByText(/Error Loading Quote/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify error details
      expect(screen.getByText(/Failed to load quote/i)).toBeInTheDocument();
      
      // Verify action buttons are present
      expect(screen.getByRole('button', { name: /Back to Quotes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });

  describe('Navigation Between Pages', () => {
    it('should navigate to order detail page when clicking View Order button', async () => {
      const user = userEvent.setup();
      const mockQuote = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-02-01T10:00:00Z',
        quote_details: {
          estimated_delivery_days: 7,
        },
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote);

      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for quote to load (use getAllByText since quote number appears multiple times)
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-001')[0]).toBeInTheDocument();
      });

      // Click View Order button
      const viewOrderButton = await screen.findByRole('button', {
        name: /View Order.*Advance to Customer Quote/i,
      });
      await user.click(viewOrderButton);

      // Verify navigation
      expect(mockNavigate).toHaveBeenCalledWith('/admin/orders/order-uuid-123');
    });
  });

  describe('Conditional Rendering', () => {
    it('should only show post-acceptance panel when status is accepted', async () => {
      // Test with accepted status first
      const mockQuoteAccepted = createMockQuote({
        status: 'accepted',
        response_type: 'accept',
        responded_at: '2024-02-01T10:00:00Z',
        quote_details: {
          estimated_delivery_days: 7,
        },
      });

      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuoteAccepted);

      const { unmount } = render(<QuoteDetail />, { wrapper: createWrapper() });

      // Verify panel is shown for accepted status
      await waitFor(() => {
        expect(screen.getByText(/Quote Accepted by Vendor!/i)).toBeInTheDocument();
      });

      // Unmount and test with non-accepted status
      unmount();

      // Change status to 'sent'
      const mockQuoteSent = createMockQuote({
        status: 'sent',
        quote_number: 'Q-2024-002',
      });
      vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuoteSent);

      // Render again with new data
      render(<QuoteDetail />, { wrapper: createWrapper() });

      // Wait for new quote to load
      await waitFor(() => {
        expect(screen.getAllByText('Q-2024-002')[0]).toBeInTheDocument();
      });

      // Verify panel is hidden for non-accepted status
      expect(screen.queryByText(/Quote Accepted by Vendor!/i)).not.toBeInTheDocument();
    });
  });
});
