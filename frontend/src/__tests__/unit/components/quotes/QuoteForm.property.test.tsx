import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuoteForm } from '@/components/tenant/quotes/QuoteForm';
import { ordersService } from '@/services/api/orders';
import { quoteService } from '@/services/tenant/quoteService';
import { Order, OrderStatus, PaymentStatus, ProductionType } from '@/types/order';
import fc from 'fast-check';

// Mock services
vi.mock('@/services/api/orders', () => ({
  ordersService: {
    getOrderById: vi.fn(),
  },
}));

vi.mock('@/services/tenant/quoteService', () => ({
  quoteService: {
    getAvailableCustomers: vi.fn(),
    getAvailableVendors: vi.fn(),
    getAvailableProducts: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Helper function to create a complete mock Order
const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: overrides.id || 'order-uuid-123',
  uuid: overrides.uuid || overrides.id || 'order-uuid-123',
  orderNumber: overrides.orderNumber || 'ORD-2024-001',
  customerId: overrides.customerId || 'customer-uuid-456',
  customerName: overrides.customerName || 'Test Customer',
  customerEmail: overrides.customerEmail || 'test@example.com',
  customerPhone: overrides.customerPhone || '+1234567890',
  items: overrides.items || [],
  totalAmount: overrides.totalAmount || 1000,
  paidAmount: overrides.paidAmount || 0,
  remainingAmount: overrides.remainingAmount || 1000,
  status: overrides.status || OrderStatus.VendorNegotiation,
  productionType: overrides.productionType || ProductionType.Vendor,
  paymentStatus: overrides.paymentStatus || PaymentStatus.Unpaid,
  shippingAddress: overrides.shippingAddress || '123 Test St',
  createdBy: overrides.createdBy || 'user-uuid',
  createdAt: overrides.createdAt || new Date().toISOString(),
  updatedAt: overrides.updatedAt || new Date().toISOString(),
  ...overrides,
  // Add snake_case version for component compatibility
  order_number: overrides.orderNumber || 'ORD-2024-001',
  customer_id: overrides.customerId || 'customer-uuid-456',
} as any); // Use 'as any' to allow snake_case properties

describe('QuoteForm - Property-Based Tests', () => {
  const mockCustomers = [
    { id: 'customer-uuid-456', name: 'John Doe', email: 'john@acme.com', company: 'Acme Corp' },
    { id: 'customer-uuid-789', name: 'Jane Smith', email: 'jane@tech.com', company: 'Tech Inc' },
  ];

  const mockVendors = [
    { id: 'vendor-uuid-111', name: 'Vendor A', email: 'contact@vendora.com', company: 'Vendor A Co' },
    { id: 'vendor-uuid-222', name: 'Vendor B', email: 'contact@vendorb.com', company: 'Vendor B Co' },
  ];

  const mockProducts = [
    { id: 'product-uuid-aaa', name: 'Product 1', sku: 'SKU-001', unit: 'pcs' },
    { id: 'product-uuid-bbb', name: 'Product 2', sku: 'SKU-002', unit: 'pcs' },
  ];

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(quoteService.getAvailableCustomers).mockResolvedValue(mockCustomers);
    vi.mocked(quoteService.getAvailableVendors).mockResolvedValue(mockVendors);
    vi.mocked(quoteService.getAvailableProducts).mockResolvedValue(mockProducts);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 16a: Order Service Called with Correct ID
   * 
   * For any valid order_id in URL parameters, the order service should be called
   * with that exact order_id to fetch order details
   * 
   * Validates: Requirements 5.1 (partial)
   */
  it('Property 16a: should call order service with correct order_id', async () => {
    const orderIdArbitrary = fc.uuid();

    await fc.assert(
      fc.asyncProperty(orderIdArbitrary, async (orderId) => {
        const mockOrder = createMockOrder({
          id: orderId,
          uuid: orderId,
          customerId: fc.sample(fc.uuid(), 1)[0],
        });

        vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

        const { unmount } = render(
          <MemoryRouter initialEntries={[`/quotes/new?order_id=${orderId}`]}>
            <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
          </MemoryRouter>
        );

        try {
          await waitFor(
            () => {
              expect(ordersService.getOrderById).toHaveBeenCalledWith(orderId);
            },
            { timeout: 3000 }
          );
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 5,
        timeout: 10000,
      }
    );
  }, 20000);

  /**
   * Property 16b: Customer Field Disabled with Order Context
   * 
   * For any order with a customer_id, the customer field should be disabled
   * when the form is loaded with order context
   * 
   * Validates: Requirements 5.2 (partial)
   */
  it('Property 16b: should disable customer field when order context exists', async () => {
    const orderArbitrary = fc.record({
      id: fc.uuid(),
      order_number: fc.string({ minLength: 5, maxLength: 20 }).map(s => `ORD-${s}`),
      customer_id: fc.uuid(),
    });

    await fc.assert(
      fc.asyncProperty(orderArbitrary, async (orderData) => {
        const mockOrder = createMockOrder({
          id: orderData.id,
          uuid: orderData.id,
          orderNumber: orderData.order_number,
          customerId: orderData.customer_id,
        });

        vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

        const { unmount } = render(
          <MemoryRouter initialEntries={[`/quotes/new?order_id=${orderData.id}`]}>
            <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
          </MemoryRouter>
        );

        try {
          await waitFor(
            () => {
              const customerSelect = screen.getByRole('combobox', { name: /customer/i });
              expect(customerSelect).toBeDisabled();
            },
            { timeout: 3000 }
          );
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 5,
        timeout: 10000,
      }
    );
  }, 20000);

  /**
   * Property 16c: Order Context Description Displayed
   * 
   * For any order with an order_number, the form should display a description
   * indicating the quote is being created for that specific order
   * 
   * Validates: Requirements 5.1, 5.2 (partial)
   */
  it('Property 16c: should display order context description', async () => {
    const orderArbitrary = fc.record({
      id: fc.uuid(),
      order_number: fc.string({ minLength: 5, maxLength: 20 })
        .filter(s => s.trim().length > 0) // Ensure non-empty after trim
        .map(s => `ORD-${s.trim()}`),
      customer_id: fc.uuid(),
    });

    await fc.assert(
      fc.asyncProperty(orderArbitrary, async (orderData) => {
        const mockOrder = createMockOrder({
          id: orderData.id,
          uuid: orderData.id,
          orderNumber: orderData.order_number,
          customerId: orderData.customer_id,
        });

        vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

        const { unmount } = render(
          <MemoryRouter initialEntries={[`/quotes/new?order_id=${orderData.id}`]}>
            <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
          </MemoryRouter>
        );

        try {
          // Wait for both order service call AND customer field to be disabled
          // This ensures orderContext state has been set
          await waitFor(
            () => {
              expect(ordersService.getOrderById).toHaveBeenCalledWith(orderData.id);
              const customerSelect = screen.getByRole('combobox', { name: /customer/i });
              expect(customerSelect).toBeDisabled();
            },
            { timeout: 3000 }
          );

          // Now the description should be visible
          const description = screen.queryByText(
            new RegExp(`Pre-filled from Order #${orderData.order_number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
          );
          expect(description).toBeInTheDocument();
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 3, // Reduced to 3 for faster execution
        timeout: 8000,
      }
    );
  }, 15000);

  /**
   * Property: Customer field should always be disabled when order context exists
   * 
   * This property verifies that for any order with a customer_id,
   * the customer field in the form is disabled to prevent modification
   */
  it('Property: customer field disabled state matches order context presence', async () => {
    const orderIdArbitrary = fc.option(fc.uuid(), { nil: null });

    await fc.assert(
      fc.asyncProperty(orderIdArbitrary, async (orderId) => {
        if (orderId) {
          // Create a mock order
          const mockOrder = createMockOrder({
            id: orderId,
            uuid: orderId,
            customerId: fc.sample(fc.uuid(), 1)[0],
          });

          vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);
        }

        const url = orderId ? `/quotes/new?order_id=${orderId}` : '/quotes/new';
        const { unmount } = render(
          <MemoryRouter initialEntries={[url]}>
            <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
          </MemoryRouter>
        );

        try {
          if (orderId) {
            // With order_id: customer field should be disabled
            await waitFor(
              () => {
                expect(ordersService.getOrderById).toHaveBeenCalledWith(orderId);
              },
              { timeout: 5000 }
            );

            await waitFor(
              () => {
                const customerSelect = screen.getByRole('combobox', { name: /customer/i });
                expect(customerSelect).toBeDisabled();
              },
              { timeout: 5000 }
            );
          } else {
            // Without order_id: customer field should be enabled
            await waitFor(
              () => {
                expect(quoteService.getAvailableCustomers).toHaveBeenCalled();
              },
              { timeout: 5000 }
            );

            await waitFor(
              () => {
                const customerSelect = screen.getByRole('combobox', { name: /customer/i });
                expect(customerSelect).not.toBeDisabled();
              },
              { timeout: 5000 }
            );
          }
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 10,
        timeout: 20000,
      }
    );
  }, 40000); // 40 second timeout for the entire test

  /**
   * Property: Order context should never be loaded when editing existing quote
   * 
   * This property verifies that even if order_id is in the URL,
   * the order context is not loaded when editing an existing quote
   */
  it('Property: order context not loaded when quote exists', async () => {
    const quoteArbitrary = fc.record({
      id: fc.uuid(),
      quote_number: fc.string({ minLength: 5, maxLength: 20 }).map(s => `QT-${s}`),
      customer_id: fc.uuid(),
      vendor_id: fc.uuid(),
      title: fc.string({ minLength: 5, maxLength: 100 }),
    });

    await fc.assert(
      fc.asyncProperty(quoteArbitrary, fc.uuid(), async (quoteData, orderId) => {
        // Clear all mocks before each iteration
        vi.clearAllMocks();
        
        // Reset mock implementations
        vi.mocked(quoteService.getAvailableCustomers).mockResolvedValue(mockCustomers);
        vi.mocked(quoteService.getAvailableVendors).mockResolvedValue(mockVendors);
        vi.mocked(quoteService.getAvailableProducts).mockResolvedValue(mockProducts);

        const mockQuote = {
          id: quoteData.id,
          quote_number: quoteData.quote_number,
          customer_id: quoteData.customer_id,
          vendor_id: quoteData.vendor_id,
          title: quoteData.title,
          status: 'draft' as const,
          total_amount: 1000,
          tax_amount: 100,
          grand_total: 1100,
          currency: 'IDR',
          valid_until: '2024-12-31T00:00:00Z',
          revision_number: 1,
          created_by: 'user-uuid',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          customer: {
            id: mockCustomers[0]?.id || 'customer-uuid-456',
            name: mockCustomers[0]?.name || 'John Doe',
            email: mockCustomers[0]?.email || 'john@acme.com',
            company: mockCustomers[0]?.company,
          },
          vendor: {
            id: mockVendors[0]?.id || 'vendor-uuid-111',
            name: mockVendors[0]?.name || 'Vendor A',
            email: mockVendors[0]?.email || 'contact@vendora.com',
            company: mockVendors[0]?.company || 'Vendor A Co',
          },
          items: [],
        };

        const { unmount } = render(
          <MemoryRouter initialEntries={[`/quotes/edit/${quoteData.id}?order_id=${orderId}`]}>
            <QuoteForm quote={mockQuote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
          </MemoryRouter>
        );

        try {
          // Wait for initial load
          await waitFor(
            () => {
              expect(quoteService.getAvailableCustomers).toHaveBeenCalled();
            },
            { timeout: 3000 }
          );

          // Verify order service was NOT called
          expect(ordersService.getOrderById).not.toHaveBeenCalled();

          // Customer field should not be disabled
          await waitFor(
            () => {
              const customerSelect = screen.getByRole('combobox', { name: /customer/i });
              expect(customerSelect).not.toBeDisabled();
            },
            { timeout: 2000 }
          );
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 5,
        timeout: 15000,
      }
    );
  }, 30000); // 30 second timeout for the entire test
});
