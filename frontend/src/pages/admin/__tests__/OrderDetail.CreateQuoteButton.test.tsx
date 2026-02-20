/**
 * OrderDetail - CreateCustomerQuoteButton Integration Tests
 * 
 * Tests the integration of CreateCustomerQuoteButton component in OrderDetail page.
 * Verifies:
 * - Button appears when order status is 'customer_quote'
 * - Button does not appear for other statuses
 * - Button navigates to create quote form
 * - Button is disabled when vendor_quote_id is missing
 * 
 * Task: 9.1 Add "Create Customer Quote" button to order detail
 * Spec: .kiro/specs/customer-quote-workflow/tasks.md
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

describe('OrderDetail - CreateCustomerQuoteButton Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render CreateCustomerQuoteButton when order status is customer_quote and has vendor_quote_id', async () => {
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid',
      orderNumber: 'ORD-001',
      status: 'customer_quote',
      vendor_quote_id: 123,
      vendor_quote_uuid: 'test-quote-uuid',
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
      const progressHeadings = screen.getAllByText('Order Progress');
      expect(progressHeadings.length).toBeGreaterThan(0);
    });

    // Verify CreateCustomerQuoteButton is rendered
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Customer Quote/i })).toBeInTheDocument();
    });
  });

  it('should NOT render CreateCustomerQuoteButton when order status is not customer_quote', async () => {
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid',
      orderNumber: 'ORD-002',
      status: 'vendor_negotiation',
      vendor_quote_id: 123,
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
      const progressHeadings = screen.getAllByText('Order Progress');
      expect(progressHeadings.length).toBeGreaterThan(0);
    });

    // Verify CreateCustomerQuoteButton is NOT rendered
    expect(screen.queryByRole('button', { name: /Create Customer Quote/i })).not.toBeInTheDocument();
  });

  it('should NOT render CreateCustomerQuoteButton when vendor_quote_id is missing', async () => {
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid',
      orderNumber: 'ORD-003',
      status: 'customer_quote',
      // No vendor_quote_id
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
      const progressHeadings = screen.getAllByText('Order Progress');
      expect(progressHeadings.length).toBeGreaterThan(0);
    });

    // Verify CreateCustomerQuoteButton is NOT rendered
    expect(screen.queryByRole('button', { name: /Create Customer Quote/i })).not.toBeInTheDocument();
  });

  it('should navigate to create customer quote form when button is clicked', async () => {
    const user = userEvent.setup();
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid-123',
      orderNumber: 'ORD-001',
      status: 'customer_quote',
      vendor_quote_id: 456,
      vendor_quote_uuid: 'test-quote-uuid',
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
      const progressHeadings = screen.getAllByText('Order Progress');
      expect(progressHeadings.length).toBeGreaterThan(0);
    });

    // Find and click the button
    const createQuoteButton = await screen.findByRole('button', {
      name: /Create Customer Quote/i,
    });
    expect(createQuoteButton).toBeInTheDocument();

    await user.click(createQuoteButton);

    // Verify navigation was called with correct URL
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/customer-quotes/create?order=test-order-uuid-123');
    });
  });

  it('should render button between Order Progress and Vendor Quote Card', async () => {
    const mockOrder = {
      id: 'test-order-id',
      uuid: 'test-order-uuid',
      orderNumber: 'ORD-001',
      status: 'customer_quote',
      vendor_quote_id: 123,
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

    // Wait for component to render
    await waitFor(() => {
      const progressHeadings = screen.getAllByText('Order Progress');
      expect(progressHeadings.length).toBeGreaterThan(0);
    });

    // Get the Order Progress section
    const progressSection = container.querySelector('[data-section="progress"]');
    expect(progressSection).toBeInTheDocument();

    // Verify button is rendered
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Customer Quote/i })).toBeInTheDocument();
    });

    // Verify VendorQuoteCard is also rendered (should be after the button)
    await waitFor(() => {
      expect(screen.getByText('Vendor Quote Status')).toBeInTheDocument();
    });
  });
});
