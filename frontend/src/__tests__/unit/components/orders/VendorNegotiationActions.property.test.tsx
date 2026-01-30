/**
 * Property-Based Tests for VendorNegotiationActions Component
 * 
 * Property 12: Stage Advancement Button Visibility
 * Validates: Requirements 3.5
 * 
 * For any order in vendor_negotiation stage, the "Proceed to Customer Quote" button
 * should be visible if and only if an accepted quote exists.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
import { VendorNegotiationActions } from '@/components/orders/VendorNegotiationActions';
import { Order, OrderStatus, ProductionType, PaymentStatus } from '@/types/order';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Feature: vendor-negotiation-integration, Property 12: Stage Advancement Button Visibility', () => {
  const mockOnAdvanceStage = vi.fn();

  /**
   * Arbitrary generator for Order with vendor negotiation fields
   */
  const orderArbitrary = fc.record({
    id: fc.uuid(),
    uuid: fc.uuid(),
    orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
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
    // Vendor negotiation specific fields
    activeQuotes: fc.integer({ min: 0, max: 10 }),
    acceptedQuote: fc.option(fc.uuid(), { nil: undefined }),
    vendorQuotedPrice: fc.option(fc.integer({ min: 1000000, max: 50000000 }), { nil: undefined }),
    quotationAmount: fc.option(fc.integer({ min: 1000000, max: 100000000 }), { nil: undefined }),
  });

  it('should display "Proceed to Customer Quote" button if and only if accepted quote exists', () => {
    fc.assert(
      fc.property(
        orderArbitrary,
        (order) => {
          // Render component
          const { unmount } = render(
            <BrowserRouter>
              <VendorNegotiationActions
                order={order as Order}
                onAdvanceStage={mockOnAdvanceStage}
              />
            </BrowserRouter>
          );

          // Check button visibility
          const proceedButton = screen.queryByText('Proceed to Customer Quote');
          const hasAcceptedQuote = !!order.acceptedQuote;

          // Property: Button is visible if and only if accepted quote exists
          const buttonVisible = proceedButton !== null;
          const propertyHolds = buttonVisible === hasAcceptedQuote;

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display accepted quote information card if and only if accepted quote exists with pricing', () => {
    fc.assert(
      fc.property(
        orderArbitrary,
        (order) => {
          // Render component
          const { unmount } = render(
            <BrowserRouter>
              <VendorNegotiationActions
                order={order as Order}
                onAdvanceStage={mockOnAdvanceStage}
              />
            </BrowserRouter>
          );

          // Check information card visibility
          const vendorPriceLabel = screen.queryByText('Vendor Price:');
          const hasAcceptedQuoteWithPricing = 
            !!order.acceptedQuote && 
            !!order.vendorQuotedPrice && 
            !!order.quotationAmount;

          // Property: Information card is visible if and only if accepted quote exists with pricing
          const cardVisible = vendorPriceLabel !== null;
          const propertyHolds = cardVisible === hasAcceptedQuoteWithPricing;

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display correct button text based on active quotes count', () => {
    fc.assert(
      fc.property(
        orderArbitrary,
        (order) => {
          // Render component
          const { unmount } = render(
            <BrowserRouter>
              <VendorNegotiationActions
                order={order as Order}
                onAdvanceStage={mockOnAdvanceStage}
              />
            </BrowserRouter>
          );

          // Check button text
          const hasActiveQuotes = (order.activeQuotes ?? 0) > 0;
          
          let propertyHolds = false;
          if (hasActiveQuotes) {
            const expectedText = `Manage Quotes (${order.activeQuotes})`;
            propertyHolds = screen.queryByText(expectedText) !== null;
          } else {
            propertyHolds = screen.queryByText('Create Quote') !== null;
          }

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always display guidance alert regardless of quote status', () => {
    fc.assert(
      fc.property(
        orderArbitrary,
        (order) => {
          // Render component
          const { unmount } = render(
            <BrowserRouter>
              <VendorNegotiationActions
                order={order as Order}
                onAdvanceStage={mockOnAdvanceStage}
              />
            </BrowserRouter>
          );

          // Check guidance alert is always present
          const guidanceTitle = screen.queryByText('Vendor Negotiation Required');
          const propertyHolds = guidanceTitle !== null;

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display appropriate guidance message based on accepted quote status', () => {
    fc.assert(
      fc.property(
        orderArbitrary,
        (order) => {
          // Render component
          const { unmount } = render(
            <BrowserRouter>
              <VendorNegotiationActions
                order={order as Order}
                onAdvanceStage={mockOnAdvanceStage}
              />
            </BrowserRouter>
          );

          // Check guidance message
          const hasAcceptedQuote = !!order.acceptedQuote;
          
          let propertyHolds = false;
          if (hasAcceptedQuote) {
            propertyHolds = screen.queryByText(/You have accepted a vendor quote/) !== null;
          } else {
            propertyHolds = screen.queryByText(/Create and accept a vendor quote/) !== null;
          }

          // Cleanup
          unmount();

          return propertyHolds;
        }
      ),
      { numRuns: 100 }
    );
  });
});
