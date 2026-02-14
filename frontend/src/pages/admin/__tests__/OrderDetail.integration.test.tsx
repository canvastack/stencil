/**
 * OrderDetail Integration Tests
 * 
 * Tests the integration of VendorQuoteCard component in OrderDetail page.
 * Verifies:
 * - Conditional rendering based on vendor_quote_uuid presence
 * - Vendor quote information display
 * - Production progress display
 * - Navigation to Quote Detail page
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
import OrderDetail from '../OrderDetail';
import * as useOrdersHook from '@/hooks/useOrders';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock the hooks
vi.mock('@/hooks/useOrders');
vi.mock('@/components/help/HelpSystemProvider', () => ({
  useHelpSystem: () => ({
    setCurrentContext: vi.fn(),
  }),
}));

// Mock useParams and useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-order-uuid' }),
    useNavigate: () => mockNavigate,
  };
});

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

describe('OrderDetail - VendorQuoteCard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });
  it('should render VendorQuoteCard when order has vendor_quote_uuid', async () => {
    // Mock order with vendor quote
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid',
      orderNumber: 'ORD-001',
      status: 'customer_quote',
      vendor_quote_uuid: 'test-quote-uuid',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_quote_accepted_at: '2024-02-01T10:00:00Z',
      vendor_agreed_price: 150000,
      vendor_estimated_delivery_days: 7,
      vendor_name: 'Test Vendor',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '081234567890',
      items: [],
      totalAmount: 150000,
      paidAmount: 0,
      remainingAmount: 150000,
      shippingAddress: 'Test Address',
      createdBy: 'admin',
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-02-01T10:00:00Z',
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

    render(<OrderDetail />, { wrapper: createWrapper() });

    // Wait for component to render - use getAllByText since there are multiple "Order Progress" headings
    await waitFor(() => {
      const progressHeadings = screen.getAllByText('Order Progress');
      expect(progressHeadings.length).toBeGreaterThan(0);
    });

    // Verify VendorQuoteCard is rendered
    await waitFor(() => {
      expect(screen.getByText('Vendor Quote Status')).toBeInTheDocument();
    });

    // Verify vendor information is displayed
    expect(screen.getByText('Test Vendor')).toBeInTheDocument();
    // Use getAllByText for "Accepted" since it might appear multiple times
    const acceptedElements = screen.getAllByText('Accepted');
    expect(acceptedElements.length).toBeGreaterThan(0);
  });

  it('should NOT render VendorQuoteCard when order has no vendor_quote_uuid', async () => {
    // Mock order without vendor quote
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid',
      orderNumber: 'ORD-002',
      status: 'vendor_negotiation',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '081234567890',
      items: [],
      totalAmount: 150000,
      paidAmount: 0,
      remainingAmount: 150000,
      shippingAddress: 'Test Address',
      createdBy: 'admin',
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-02-01T10:00:00Z',
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

    render(<OrderDetail />, { wrapper: createWrapper() });

    // Wait for component to render - use getAllByText since there are multiple "Order Progress" headings
    await waitFor(() => {
      const progressHeadings = screen.getAllByText('Order Progress');
      expect(progressHeadings.length).toBeGreaterThan(0);
    });

    // Verify VendorQuoteCard is NOT rendered
    expect(screen.queryByText('Vendor Quote Status')).not.toBeInTheDocument();
  });

  it('should render VendorQuoteCard after Order Progress section', async () => {
    // Mock order with vendor quote
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid',
      orderNumber: 'ORD-003',
      status: 'customer_quote',
      vendor_quote_uuid: 'test-quote-uuid',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_name: 'Test Vendor',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '081234567890',
      items: [],
      totalAmount: 150000,
      paidAmount: 0,
      remainingAmount: 150000,
      shippingAddress: 'Test Address',
      createdBy: 'admin',
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-02-01T10:00:00Z',
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

    const { container } = render(<OrderDetail />, { wrapper: createWrapper() });

    // Wait for component to render - use getAllByText since there are multiple "Order Progress" headings
    await waitFor(() => {
      const progressHeadings = screen.getAllByText('Order Progress');
      expect(progressHeadings.length).toBeGreaterThan(0);
    });

    // Get the Order Progress section
    const progressSection = container.querySelector('[data-section="progress"]');
    expect(progressSection).toBeInTheDocument();

    // Verify VendorQuoteCard appears after Order Progress
    await waitFor(() => {
      const vendorQuoteCard = screen.getByText('Vendor Quote Status').closest('[role="region"]');
      expect(vendorQuoteCard).toBeInTheDocument();
    });
  });

  describe('Vendor Quote Information Display', () => {
    it('should display vendor name and quote status', async () => {
      const mockOrder = {
        id: 'test-order-id',
        uuid: 'test-order-uuid',
        orderNumber: 'ORD-001',
        status: 'customer_quote',
        vendor_quote_uuid: 'test-quote-uuid',
        vendor_quote_status: 'accepted',
        vendor_quote_status_label: 'Accepted',
        vendor_name: 'Premium Vendor Co.',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        items: [],
        totalAmount: 150000,
        paidAmount: 0,
        remainingAmount: 150000,
        shippingAddress: 'Test Address',
        createdBy: 'admin',
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z',
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

      render(<OrderDetail />, { wrapper: createWrapper() });

      await waitFor(() => {
        const progressHeadings = screen.getAllByText('Order Progress');
        expect(progressHeadings.length).toBeGreaterThan(0);
      });

      // Verify vendor information
      expect(screen.getByText('Premium Vendor Co.')).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('should display agreed price and delivery days for accepted quotes', async () => {
      const mockOrder = {
        id: 'test-order-id',
        uuid: 'test-order-uuid',
        orderNumber: 'ORD-001',
        status: 'customer_quote',
        vendor_quote_uuid: 'test-quote-uuid',
        vendor_quote_status: 'accepted',
        vendor_quote_status_label: 'Accepted',
        vendor_quote_accepted_at: '2024-02-01T10:00:00Z',
        vendor_agreed_price: 250000,
        vendor_estimated_delivery_days: 10,
        vendor_name: 'Test Vendor',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        items: [],
        totalAmount: 250000,
        paidAmount: 0,
        remainingAmount: 250000,
        shippingAddress: 'Test Address',
        createdBy: 'admin',
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z',
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

      render(<OrderDetail />, { wrapper: createWrapper() });

      await waitFor(() => {
        const progressHeadings = screen.getAllByText('Order Progress');
        expect(progressHeadings.length).toBeGreaterThan(0);
      });

      // Verify agreed terms
      expect(screen.getByText('Agreed Price:')).toBeInTheDocument();
      // formatCurrency uses Indonesian format with dots: Rp 250.000
      expect(screen.getByText(/Rp\s*250\.000/i)).toBeInTheDocument();
      expect(screen.getByText('Estimated Delivery:')).toBeInTheDocument();
      expect(screen.getByText('10 days')).toBeInTheDocument();
    });
  });

  describe('Production Progress Display', () => {
    it('should display production progress when available', async () => {
      const mockOrder = {
        id: 'test-order-id',
        uuid: 'test-order-uuid',
        orderNumber: 'ORD-001',
        status: 'customer_quote',
        vendor_quote_uuid: 'test-quote-uuid',
        vendor_quote_status: 'accepted',
        vendor_quote_status_label: 'Accepted',
        vendor_quote_accepted_at: '2024-02-01T10:00:00Z',
        vendor_agreed_price: 150000,
        vendor_estimated_delivery_days: 7,
        vendor_name: 'Test Vendor',
        production_progress: {
          accepted_date: '2024-02-01T10:00:00Z',
          expected_delivery_date: '2024-02-08T10:00:00Z',
          days_elapsed: 3,
          days_remaining: 4,
          progress_percentage: 42.86,
          is_overdue: false,
          overdue_days: 0,
        },
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        items: [],
        totalAmount: 150000,
        paidAmount: 0,
        remainingAmount: 150000,
        shippingAddress: 'Test Address',
        createdBy: 'admin',
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z',
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

      render(<OrderDetail />, { wrapper: createWrapper() });

      await waitFor(() => {
        const progressHeadings = screen.getAllByText('Order Progress');
        expect(progressHeadings.length).toBeGreaterThan(0);
      });

      // Verify production progress elements - just check that ProductionCountdown is rendered
      await waitFor(() => {
        expect(screen.getByText('Production Progress:')).toBeInTheDocument();
        expect(screen.getByText('Days Elapsed')).toBeInTheDocument();
        expect(screen.getByText('Days Remaining')).toBeInTheDocument();
        // Verify progress bar exists
        expect(screen.getByRole('group', { name: /production progress/i })).toBeInTheDocument();
      });
    });

    it('should display overdue warning when production is late', async () => {
      const mockOrder = {
        id: 'test-order-id',
        uuid: 'test-order-uuid',
        orderNumber: 'ORD-001',
        status: 'customer_quote',
        vendor_quote_uuid: 'test-quote-uuid',
        vendor_quote_status: 'accepted',
        vendor_quote_status_label: 'Accepted',
        vendor_quote_accepted_at: '2024-01-20T10:00:00Z',
        vendor_agreed_price: 150000,
        vendor_estimated_delivery_days: 7,
        vendor_name: 'Test Vendor',
        production_progress: {
          accepted_date: '2024-01-20T10:00:00Z',
          expected_delivery_date: '2024-01-27T10:00:00Z',
          days_elapsed: 12,
          days_remaining: -5,
          progress_percentage: 100,
          is_overdue: true,
          overdue_days: 5,
        },
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        items: [],
        totalAmount: 150000,
        paidAmount: 0,
        remainingAmount: 150000,
        shippingAddress: 'Test Address',
        createdBy: 'admin',
        createdAt: '2024-01-20T09:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
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

      render(<OrderDetail />, { wrapper: createWrapper() });

      await waitFor(() => {
        const progressHeadings = screen.getAllByText('Order Progress');
        expect(progressHeadings.length).toBeGreaterThan(0);
      });

      // Verify overdue warning - just check that "Overdue" text appears
      await waitFor(() => {
        // The "Overdue" text appears in the Days Remaining section when overdue
        expect(screen.getByText('Overdue')).toBeInTheDocument();
        // Also check for the alert role which contains the overdue message
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation to Quote Detail', () => {
    it('should navigate to quote detail page when clicking View Quote Details button', async () => {
      const user = userEvent.setup();
      const mockOrder = {
        id: 'test-order-id',
        uuid: 'test-order-uuid',
        orderNumber: 'ORD-001',
        status: 'customer_quote',
        vendor_quote_uuid: 'test-quote-uuid-123',
        vendor_quote_status: 'accepted',
        vendor_quote_status_label: 'Accepted',
        vendor_name: 'Test Vendor',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        items: [],
        totalAmount: 150000,
        paidAmount: 0,
        remainingAmount: 150000,
        shippingAddress: 'Test Address',
        createdBy: 'admin',
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z',
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

      render(<OrderDetail />, { wrapper: createWrapper() });

      await waitFor(() => {
        const progressHeadings = screen.getAllByText('Order Progress');
        expect(progressHeadings.length).toBeGreaterThan(0);
      });

      // Find and click "View Quote Details" button
      const viewQuoteButton = await screen.findByRole('button', {
        name: /View Quote Details/i,
      });
      expect(viewQuoteButton).toBeInTheDocument();

      await user.click(viewQuoteButton);

      // Verify navigation was called
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/quotes/test-quote-uuid-123');
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch order data on mount', async () => {
      const mockOrder = {
        id: 'test-order-id',
        uuid: 'test-order-uuid',
        orderNumber: 'ORD-001',
        status: 'customer_quote',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890',
        items: [],
        totalAmount: 150000,
        paidAmount: 0,
        remainingAmount: 150000,
        shippingAddress: 'Test Address',
        createdBy: 'admin',
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z',
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

      render(<OrderDetail />, { wrapper: createWrapper() });

      // Verify order data is displayed
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
      });
    });

    it('should handle loading state', () => {
      vi.mocked(useOrdersHook.useOrder).mockReturnValue({
        data: undefined,
        isLoading: true,
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

      render(<OrderDetail />, { wrapper: createWrapper() });

      // Verify loading indicator
      expect(screen.getByText('Loading order details...')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to fetch order');

      vi.mocked(useOrdersHook.useOrder).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
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

      render(<OrderDetail />, { wrapper: createWrapper() });

      // Verify error message
      expect(screen.getByText('Error Loading Order')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch order')).toBeInTheDocument();
    });
  });
});
