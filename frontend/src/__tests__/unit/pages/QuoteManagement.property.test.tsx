/**
 * Property-Based Tests for QuoteManagement Page - Order Context Filtering
 * 
 * Property 3: Order Context Filtering
 * Validates: Requirements 1.3
 * 
 * For any order_id parameter, the QuoteManagement page should display only quotes
 * where quote.order_id equals the parameter value.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import fc from 'fast-check';
import QuoteManagement from '@/pages/admin/QuoteManagement';
import { ordersService } from '@/services/api/orders';
import { quotesService } from '@/services/api/quotes';
import { Order, OrderStatus, ProductionType, PaymentStatus } from '@/types/order';
import type { OrderQuote } from '@/types/quote';

// Mock services
vi.mock('@/services/api/orders', () => ({
  ordersService: {
    getOrderById: vi.fn(),
  },
}));

vi.mock('@/services/api/quotes', () => ({
  quotesService: {
    getQuotes: vi.fn(),
    acceptQuote: vi.fn(),
    rejectQuote: vi.fn(),
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Feature: vendor-negotiation-integration, Property 3: Order Context Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Arbitrary generator for Order UUID
   */
  const orderIdArbitrary = fc.uuid();

  /**
   * Arbitrary generator for Order
   */
  const orderArbitrary = (orderId: string) => fc.record({
    id: fc.constant(orderId),
    uuid: fc.constant(orderId),
    orderNumber: fc.string({ minLength: 5, maxLength: 20 }).map(s => `ORD-${s}`),
    customerId: fc.uuid(),
    customerName: fc.string({ minLength: 3, maxLength: 50 }),
    customerEmail: fc.emailAddress(),
    customerPhone: fc.string({ minLength: 10, maxLength: 15 }),
    items: fc.constant([]),
    totalAmount: fc.integer({ min: 100000, max: 100000000 }),
    paidAmount: fc.constant(0),
    remainingAmount: fc.integer({ min: 100000, max: 100000000 }),
    status: fc.constant(OrderStatus.VendorNegotiation),
    productionType: fc.constant(ProductionType.Vendor),
    paymentStatus: fc.constant(PaymentStatus.Unpaid),
    shippingAddress: fc.string({ minLength: 10, maxLength: 100 }),
    createdBy: fc.string({ minLength: 3, maxLength: 20 }),
    createdAt: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
    updatedAt: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
  });

  /**
   * Arbitrary generator for Quote
   */
  const quoteArbitrary = (orderId: string) => fc.record({
    id: fc.uuid(),
    order_id: fc.constant(orderId),
    order: fc.record({
      order_number: fc.string({ minLength: 5, maxLength: 20 }).map(s => `ORD-${s}`),
    }),
    type: fc.constantFrom('vendor_to_company', 'company_to_customer'),
    vendor: fc.record({
      name: fc.string({ minLength: 3, maxLength: 50 }),
      email: fc.emailAddress(),
    }),
    quoted_price: fc.integer({ min: 1000000, max: 50000000 }),
    quantity: fc.integer({ min: 1, max: 100 }),
    status: fc.constantFrom('pending', 'accepted', 'rejected', 'revised', 'expired'),
    created_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
    updated_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
  });

  it('should apply order_id filter to quote queries when order_id parameter is present', async () => {
    await fc.assert(
      fc.asyncProperty(
        orderIdArbitrary,
        async (orderId) => {
          // Setup mocks
          const mockOrder = await fc.sample(orderArbitrary(orderId), 1)[0];
          const mockQuotes = await fc.sample(fc.array(quoteArbitrary(orderId), { minLength: 1, maxLength: 5 }), 1)[0];

          vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder as Order);
          vi.mocked(quotesService.getQuotes).mockResolvedValue({
            data: mockQuotes as OrderQuote[],
            total: mockQuotes.length,
            per_page: 10,
            current_page: 1,
            last_page: 1,
          });

          // Render component with order_id parameter
          const { unmount } = render(
            <MemoryRouter initialEntries={[`/admin/quotes?order_id=${orderId}`]}>
              <QuoteManagement />
            </MemoryRouter>
          );

          // Wait for quotes service to be called
          await waitFor(() => {
            expect(quotesService.getQuotes).toHaveBeenCalled();
          }, { timeout: 3000 });

          // Property: quotesService.getQuotes should be called with order_id filter
          const calls = vi.mocked(quotesService.getQuotes).mock.calls;
          const propertyHolds = calls.some(call => 
            call[0] && call[0].order_id === orderId
          );

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 20 } // Reduced runs for async tests
    );
  }, 30000); // Increased timeout for property test

  it('should display order context banner when order_id parameter is present', async () => {
    await fc.assert(
      fc.asyncProperty(
        orderIdArbitrary,
        async (orderId) => {
          // Setup mocks
          const mockOrder = await fc.sample(orderArbitrary(orderId), 1)[0];
          const mockQuotes = await fc.sample(fc.array(quoteArbitrary(orderId), { minLength: 0, maxLength: 3 }), 1)[0];

          vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder as Order);
          vi.mocked(quotesService.getQuotes).mockResolvedValue({
            data: mockQuotes as OrderQuote[],
            total: mockQuotes.length,
            per_page: 10,
            current_page: 1,
            last_page: 1,
          });

          // Render component with order_id parameter
          const { unmount } = render(
            <MemoryRouter initialEntries={[`/admin/quotes?order_id=${orderId}`]}>
              <QuoteManagement />
            </MemoryRouter>
          );

          // Wait for order context to load
          await waitFor(() => {
            expect(ordersService.getOrderById).toHaveBeenCalledWith(orderId);
          }, { timeout: 3000 });

          // Property: Order context banner should be displayed
          await waitFor(() => {
            const orderContextTitle = screen.queryByText('Order Context');
            expect(orderContextTitle).not.toBeNull();
          }, { timeout: 3000 });

          const orderContextTitle = screen.queryByText('Order Context');
          const propertyHolds = orderContextTitle !== null;

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('should display order number in banner for any valid order', async () => {
    await fc.assert(
      fc.asyncProperty(
        orderIdArbitrary,
        async (orderId) => {
          // Setup mocks
          const mockOrder = await fc.sample(orderArbitrary(orderId), 1)[0];
          const mockQuotes = await fc.sample(fc.array(quoteArbitrary(orderId), { minLength: 0, maxLength: 3 }), 1)[0];

          vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder as Order);
          vi.mocked(quotesService.getQuotes).mockResolvedValue({
            data: mockQuotes as OrderQuote[],
            total: mockQuotes.length,
            per_page: 10,
            current_page: 1,
            last_page: 1,
          });

          // Render component with order_id parameter
          const { unmount } = render(
            <MemoryRouter initialEntries={[`/admin/quotes?order_id=${orderId}`]}>
              <QuoteManagement />
            </MemoryRouter>
          );

          // Wait for order context to load
          await waitFor(() => {
            expect(ordersService.getOrderById).toHaveBeenCalledWith(orderId);
          }, { timeout: 3000 });

          // Property: Order number should be displayed in banner
          // Escape special regex characters in order number
          const escapedOrderNumber = mockOrder.orderNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          await waitFor(() => {
            const orderNumberPattern = new RegExp(`#${escapedOrderNumber}`);
            const orderNumberElement = screen.queryByText(orderNumberPattern);
            expect(orderNumberElement).not.toBeNull();
          }, { timeout: 3000 });

          const escapedOrderNumber2 = mockOrder.orderNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const orderNumberPattern = new RegExp(`#${escapedOrderNumber2}`);
          const orderNumberElement = screen.queryByText(orderNumberPattern);
          const propertyHolds = orderNumberElement !== null;

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 10 } // Further reduced for this specific test
    );
  }, 60000); // Increased timeout to 60 seconds

  it('should not display order context banner when no order_id parameter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(undefined),
        async () => {
          // Setup mocks for no order context
          vi.mocked(quotesService.getQuotes).mockResolvedValue({
            data: [],
            total: 0,
            per_page: 10,
            current_page: 1,
            last_page: 1,
          });

          // Render component without order_id parameter
          const { unmount } = render(
            <MemoryRouter initialEntries={['/admin/quotes']}>
              <QuoteManagement />
            </MemoryRouter>
          );

          // Wait for component to render
          await waitFor(() => {
            expect(screen.getByText('Quote Management')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Property: Order context banner should NOT be displayed
          const orderContextTitle = screen.queryByText('Order Context');
          const propertyHolds = orderContextTitle === null;

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('should fetch order details when order_id parameter is present', async () => {
    await fc.assert(
      fc.asyncProperty(
        orderIdArbitrary,
        async (orderId) => {
          // Setup mocks
          const mockOrder = await fc.sample(orderArbitrary(orderId), 1)[0];
          const mockQuotes = await fc.sample(fc.array(quoteArbitrary(orderId), { minLength: 0, maxLength: 3 }), 1)[0];

          vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder as Order);
          vi.mocked(quotesService.getQuotes).mockResolvedValue({
            data: mockQuotes as OrderQuote[],
            total: mockQuotes.length,
            per_page: 10,
            current_page: 1,
            last_page: 1,
          });

          // Render component with order_id parameter
          const { unmount } = render(
            <MemoryRouter initialEntries={[`/admin/quotes?order_id=${orderId}`]}>
              <QuoteManagement />
            </MemoryRouter>
          );

          // Wait for order service to be called
          await waitFor(() => {
            expect(ordersService.getOrderById).toHaveBeenCalledWith(orderId);
          }, { timeout: 3000 });

          // Property: ordersService.getOrderById should be called with correct order_id
          const propertyHolds = vi.mocked(ordersService.getOrderById).mock.calls.some(
            call => call[0] === orderId
          );

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);
});
