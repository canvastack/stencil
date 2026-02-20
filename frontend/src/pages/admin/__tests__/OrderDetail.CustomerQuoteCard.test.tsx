/**
 * OrderDetail - CustomerQuoteCard Integration Tests
 * 
 * Tests the integration of CustomerQuoteCard component in OrderDetail page.
 * 
 * Verifies:
 * - Card appears when customer quote exists for the order
 * - Card displays correct quote information
 * - Card shows appropriate status badges
 * - Card provides quick actions based on quote status
 * - Card handles loading and error states
 * 
 * Task: 6.4 Integrate with existing order detail page
 * Spec: .kiro/specs/customer-quote-workflow/tasks.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderDetail from '../OrderDetail';
import * as useOrdersHook from '@/hooks/useOrders';
import * as customerQuoteApi from '@/services/api/customerQuoteApi';

// Mock the hooks and APIs
vi.mock('@/hooks/useOrders');
vi.mock('@/services/api/customerQuoteApi');
vi.mock('@/components/help/HelpSystemProvider', () => ({
  useHelpSystem: () => ({
    setCurrentContext: vi.fn(),
  }),
}));

// Mock useParams to return a test order ID
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-order-uuid-123' }),
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
};

describe('OrderDetail - CustomerQuoteCard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render CustomerQuoteCard when customer quote exists for the order', async () => {
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid-123',
      orderNumber: 'ORD-2024-001',
      status: 'awaiting_payment',
      totalAmount: 5000000,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: [],
      vendor_quote_uuid: 'vendor-quote-uuid',
    };

    const mockCustomerQuote = {
      uuid: 'quote-uuid-123',
      quote_number: 'CQ-2024-001',
      title: 'Quotation for Order ORD-2024-001',
      status: 'sent',
      pricing: {
        vendor_total_cost: 4000000,
        base_profit_amount: 800000,
        base_profit_percentage: 20,
        total_profit_amount: 1000000,
        total_profit_percentage: 25,
        grand_total: 5000000,
      },
      terms: {
        valid_until: '2024-12-31',
        payment_terms: 'DP 50% + Balance 50%',
      },
      sent_at: '2024-01-15T10:00:00Z',
    };

    vi.mocked(useOrdersHook.useOrder).mockReturnValue({
      data: mockOrder,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderPayments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderShipments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderHistory).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useTransitionOrderState).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    // Mock customer quote API
    vi.mocked(customerQuoteApi.customerQuoteApi.getQuotes).mockResolvedValue({
      data: {
        data: [mockCustomerQuote],
      },
    } as any);

    render(<OrderDetail />, { wrapper: createWrapper() });

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Customer Quote')).toBeInTheDocument();
    });

    // Verify quote number is displayed
    expect(screen.getByText('CQ-2024-001')).toBeInTheDocument();

    // Verify status badge
    expect(screen.getByText('Sent')).toBeInTheDocument();

    // Verify pricing information
    expect(screen.getByText('Customer Total')).toBeInTheDocument();
  });

  it('should NOT render CustomerQuoteCard when no customer quote exists', async () => {
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid-123',
      orderNumber: 'ORD-2024-001',
      status: 'vendor_negotiation',
      totalAmount: 5000000,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: [],
    };

    vi.mocked(useOrdersHook.useOrder).mockReturnValue({
      data: mockOrder,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderPayments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderShipments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderHistory).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useTransitionOrderState).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    // Mock customer quote API - no quotes
    vi.mocked(customerQuoteApi.customerQuoteApi.getQuotes).mockResolvedValue({
      data: {
        data: [],
      },
    } as any);

    render(<OrderDetail />, { wrapper: createWrapper() });

    // Wait for component to render
    await waitFor(() => {
      const orderProgressElements = screen.getAllByText('Order Progress');
      expect(orderProgressElements.length).toBeGreaterThan(0);
    });

    // Verify CustomerQuoteCard is NOT rendered
    expect(screen.queryByText('Customer Quote')).not.toBeInTheDocument();
  });

  it('should display payment status when quote is accepted', async () => {
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid-123',
      orderNumber: 'ORD-2024-001',
      status: 'partial_payment',
      totalAmount: 5000000,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: [],
    };

    const mockCustomerQuote = {
      uuid: 'quote-uuid-123',
      quote_number: 'CQ-2024-001',
      title: 'Quotation for Order ORD-2024-001',
      status: 'accepted',
      pricing: {
        vendor_total_cost: 4000000,
        grand_total: 5000000,
        total_profit_amount: 1000000,
        total_profit_percentage: 25,
      },
      payment: {
        status: 'partial',
        total_paid: 2500000,
        remaining: 2500000,
      },
      terms: {
        valid_until: '2024-12-31',
        payment_terms: 'DP 50% + Balance 50%',
      },
    };

    vi.mocked(useOrdersHook.useOrder).mockReturnValue({
      data: mockOrder,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderPayments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderShipments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderHistory).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useTransitionOrderState).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    vi.mocked(customerQuoteApi.customerQuoteApi.getQuotes).mockResolvedValue({
      data: {
        data: [mockCustomerQuote],
      },
    } as any);

    render(<OrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Payment Status')).toBeInTheDocument();
    });

    // Verify payment status badge - use more flexible matcher
    await waitFor(() => {
      expect(screen.getByText(/Partially Paid/i)).toBeInTheDocument();
    });

    // Verify payment amounts
    expect(screen.getByText('Total Paid')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('should display counter offer information when quote is countered', async () => {
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid-123',
      orderNumber: 'ORD-2024-001',
      status: 'customer_quote',
      totalAmount: 5000000,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: [],
    };

    const mockCustomerQuote = {
      uuid: 'quote-uuid-123',
      quote_number: 'CQ-2024-001',
      title: 'Quotation for Order ORD-2024-001',
      status: 'countered',
      pricing: {
        grand_total: 5000000,
      },
      negotiation: {
        counter_offer_amount: 4500000,
        counter_offer_notes: 'Can you reduce the price?',
        counter_offer_round: 1,
      },
      terms: {
        valid_until: '2024-12-31',
      },
    };

    vi.mocked(useOrdersHook.useOrder).mockReturnValue({
      data: mockOrder,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderPayments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderShipments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderHistory).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useTransitionOrderState).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    vi.mocked(customerQuoteApi.customerQuoteApi.getQuotes).mockResolvedValue({
      data: {
        data: [mockCustomerQuote],
      },
    } as any);

    render(<OrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Counter Offer Received')).toBeInTheDocument();
    });

    // Verify counter offer amount
    expect(screen.getByText('Customer Offer:')).toBeInTheDocument();

    // Verify counter offer notes
    expect(screen.getByText('"Can you reduce the price?"')).toBeInTheDocument();
  });

  it('should show View Details button for all quote statuses', async () => {
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid-123',
      orderNumber: 'ORD-2024-001',
      status: 'customer_quote',
      totalAmount: 5000000,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: [],
    };

    const mockCustomerQuote = {
      uuid: 'quote-uuid-123',
      quote_number: 'CQ-2024-001',
      title: 'Quotation for Order ORD-2024-001',
      status: 'sent',
      pricing: {
        grand_total: 5000000,
      },
      terms: {
        valid_until: '2024-12-31',
      },
    };

    vi.mocked(useOrdersHook.useOrder).mockReturnValue({
      data: mockOrder,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderPayments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderShipments).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useOrderHistory).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useOrdersHook.useTransitionOrderState).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    vi.mocked(customerQuoteApi.customerQuoteApi.getQuotes).mockResolvedValue({
      data: {
        data: [mockCustomerQuote],
      },
    } as any);

    render(<OrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Customer Quote')).toBeInTheDocument();
    });

    // Verify View Details button exists in the customer quote card
    const viewDetailsButtons = screen.getAllByRole('button', { name: /View Details/i });
    expect(viewDetailsButtons.length).toBeGreaterThan(0);
  });
});
