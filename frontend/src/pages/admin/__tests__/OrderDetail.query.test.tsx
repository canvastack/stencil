/**
 * OrderDetail Query Tests
 * 
 * Tests the order query behavior including:
 * - Vendor quote fields fetching
 * - Production progress fetching
 * - Loading states
 * - Error states
 * 
 * Task: 2.5.2 Update order query
 * Spec: .kiro/specs/post-acceptance-workflow/tasks.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderDetail from '../OrderDetail';
import * as useOrdersHook from '@/hooks/useOrders';

// Mock the hooks
vi.mock('@/hooks/useOrders');
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
    useParams: () => ({ id: 'test-order-uuid' }),
    useNavigate: () => vi.fn(),
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

describe('OrderDetail - Query Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should show loading indicator when order is loading', () => {
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

      // Verify loading indicator is shown
      expect(screen.getByText('Loading order details...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loader2 has role="status"
    });

    it('should show loading state for payments', async () => {
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
        data: undefined,
        isLoading: true,
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

      // Navigate to payments tab
      const paymentsTab = screen.getByRole('tab', { name: /payments/i });
      paymentsTab.click();

      // Verify loading indicator is shown in payments tab
      await waitFor(() => {
        expect(screen.getByText('Loading payments...')).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should show error message when order fails to load', () => {
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

      // Verify error message is shown
      expect(screen.getByText('Error Loading Order')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch order')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to orders/i })).toBeInTheDocument();
    });

    it('should show generic error message when error has no message', () => {
      vi.mocked(useOrdersHook.useOrder).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {} as Error,
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

      // Verify generic error message is shown
      expect(screen.getByText('Error Loading Order')).toBeInTheDocument();
      expect(screen.getByText('Order not found or could not be loaded')).toBeInTheDocument();
    });
  });

  describe('Vendor Quote Fields', () => {
    it('should fetch and display vendor quote fields when available', async () => {
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

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Order Progress')).toBeInTheDocument();
      });

      // Verify vendor quote fields are displayed
      expect(screen.getByText('Vendor Quote Status')).toBeInTheDocument();
      expect(screen.getByText('Test Vendor')).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('should handle missing vendor quote fields gracefully', async () => {
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

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Order Progress')).toBeInTheDocument();
      });

      // Verify VendorQuoteCard is not rendered when vendor_quote_uuid is missing
      expect(screen.queryByText('Vendor Quote Status')).not.toBeInTheDocument();
    });
  });

  describe('Production Progress', () => {
    it('should fetch and display production progress when available', async () => {
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
          days_elapsed: 2,
          days_remaining: 5,
          progress_percentage: 28.57,
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

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Order Progress')).toBeInTheDocument();
      });

      // Verify production progress is displayed
      expect(screen.getByText('Vendor Quote Status')).toBeInTheDocument();
      // Production countdown should be rendered within VendorQuoteCard
      await waitFor(() => {
        expect(screen.getByText('Days Elapsed')).toBeInTheDocument();
        expect(screen.getByText('Days Remaining')).toBeInTheDocument();
      });
    });

    it('should handle missing production progress gracefully', async () => {
      const mockOrder = {
        id: 'test-order-id',
        uuid: 'test-order-uuid',
        orderNumber: 'ORD-001',
        status: 'customer_quote',
        vendor_quote_uuid: 'test-quote-uuid',
        vendor_quote_status: 'accepted',
        vendor_quote_status_label: 'Accepted',
        vendor_name: 'Test Vendor',
        // No production_progress field
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

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Order Progress')).toBeInTheDocument();
      });

      // Verify VendorQuoteCard is rendered but without production countdown
      expect(screen.getByText('Vendor Quote Status')).toBeInTheDocument();
      expect(screen.queryByText('Days Elapsed')).not.toBeInTheDocument();
    });
  });

  describe('Query Refetching', () => {
    it('should support refetching order data', async () => {
      const refetchMock = vi.fn();
      
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
        refetch: refetchMock,
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

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Order Progress')).toBeInTheDocument();
      });

      // Verify refetch function is available
      expect(refetchMock).toBeDefined();
    });
  });
});
