/**
 * Unit Tests for VendorNegotiationActions Component
 * 
 * Tests the vendor negotiation actions functionality including:
 * - Button display for orders with/without active quotes
 * - Button display for orders with/without accepted quotes
 * - Navigation with order_id parameter
 * - Stage advancement trigger
 * 
 * Requirements: 1.1, 1.5, 3.5
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
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

describe('VendorNegotiationActions', () => {
  const baseOrder: Order = {
    id: 'order-123',
    uuid: 'order-uuid-123',
    orderNumber: 'ORD-001',
    customerId: 'customer-123',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '08123456789',
    items: [],
    totalAmount: 1000000,
    paidAmount: 0,
    remainingAmount: 1000000,
    status: OrderStatus.VendorNegotiation,
    productionType: ProductionType.Vendor,
    paymentStatus: PaymentStatus.Unpaid,
    shippingAddress: 'Test Address',
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockOnAdvanceStage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Display - No Active Quotes', () => {
    it('should display "Create Quote" button when no active quotes exist', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 0,
        acceptedQuote: undefined,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Create Quote')).toBeInTheDocument();
    });

    it('should not display "Proceed to Customer Quote" button when no accepted quote', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 0,
        acceptedQuote: undefined,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.queryByText('Proceed to Customer Quote')).not.toBeInTheDocument();
    });
  });

  describe('Button Display - With Active Quotes', () => {
    it('should display "Manage Quotes (N)" button when active quotes exist', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 3,
        acceptedQuote: undefined,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Manage Quotes (3)')).toBeInTheDocument();
    });

    it('should display correct count for single active quote', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 1,
        acceptedQuote: undefined,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Manage Quotes (1)')).toBeInTheDocument();
    });
  });

  describe('Button Display - With Accepted Quote', () => {
    it('should display "Proceed to Customer Quote" button when accepted quote exists', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 1,
        acceptedQuote: 'quote-uuid-123',
        vendorQuotedPrice: 10000000,
        quotationAmount: 13500000,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Proceed to Customer Quote')).toBeInTheDocument();
    });

    it('should display accepted quote information card', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 1,
        acceptedQuote: 'quote-uuid-123',
        vendorQuotedPrice: 10000000,
        quotationAmount: 13500000,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Vendor Price:')).toBeInTheDocument();
      expect(screen.getByText('Customer Quote:')).toBeInTheDocument();
      expect(screen.getByText('Markup:')).toBeInTheDocument();
    });

    it('should display formatted currency values', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 1,
        acceptedQuote: 'quote-uuid-123',
        vendorQuotedPrice: 10000000,
        quotationAmount: 13500000,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      // Check for formatted currency (Indonesian Rupiah format)
      expect(screen.getByText(/Rp.*10\.000\.000/)).toBeInTheDocument();
      expect(screen.getByText(/Rp.*13\.500\.000/)).toBeInTheDocument();
    });

    it('should display correct markup percentage', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 1,
        acceptedQuote: 'quote-uuid-123',
        vendorQuotedPrice: 10000000,
        quotationAmount: 13500000,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('35%')).toBeInTheDocument();
    });

    it('should display accepted quote ID', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 1,
        acceptedQuote: 'quote-uuid-123456789',
        vendorQuotedPrice: 10000000,
        quotationAmount: 13500000,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Accepted Quote ID:')).toBeInTheDocument();
      expect(screen.getByText(/quote-uu/)).toBeInTheDocument();
    });
  });

  describe('Navigation with Order ID Parameter', () => {
    it('should navigate to quotes page with order_id parameter when "Create Quote" is clicked', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 0,
        acceptedQuote: undefined,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      const createQuoteButton = screen.getByText('Create Quote');
      fireEvent.click(createQuoteButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/quotes?order_id=order-uuid-123');
    });

    it('should navigate to quotes page with order_id parameter when "Manage Quotes" is clicked', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 3,
        acceptedQuote: undefined,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      const manageQuotesButton = screen.getByText('Manage Quotes (3)');
      fireEvent.click(manageQuotesButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/quotes?order_id=order-uuid-123');
    });
  });

  describe('Stage Advancement Trigger', () => {
    it('should call onAdvanceStage with customer_quote when "Proceed to Customer Quote" is clicked', async () => {
      const order = {
        ...baseOrder,
        activeQuotes: 1,
        acceptedQuote: 'quote-uuid-123',
        vendorQuotedPrice: 10000000,
        quotationAmount: 13500000,
      };

      mockOnAdvanceStage.mockResolvedValue(undefined);

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      const proceedButton = screen.getByText('Proceed to Customer Quote');
      fireEvent.click(proceedButton);

      await waitFor(() => {
        expect(mockOnAdvanceStage).toHaveBeenCalledWith('customer_quote');
      });
    });

    it('should disable buttons when isAdvancing is true', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 1,
        acceptedQuote: 'quote-uuid-123',
        vendorQuotedPrice: 10000000,
        quotationAmount: 13500000,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
            isAdvancing={true}
          />
        </BrowserRouter>
      );

      const manageQuotesButton = screen.getByText('Manage Quotes (1)');
      const proceedButton = screen.getByText('Proceed to Customer Quote');

      expect(manageQuotesButton).toBeDisabled();
      expect(proceedButton).toBeDisabled();
    });
  });

  describe('Guidance Messages', () => {
    it('should display guidance message when no accepted quote exists', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 0,
        acceptedQuote: undefined,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Vendor Negotiation Required')).toBeInTheDocument();
      expect(screen.getByText(/Create and accept a vendor quote/)).toBeInTheDocument();
    });

    it('should display success guidance message when accepted quote exists', () => {
      const order = {
        ...baseOrder,
        activeQuotes: 1,
        acceptedQuote: 'quote-uuid-123',
        vendorQuotedPrice: 10000000,
        quotationAmount: 13500000,
      };

      render(
        <BrowserRouter>
          <VendorNegotiationActions
            order={order}
            onAdvanceStage={mockOnAdvanceStage}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Vendor Negotiation Required')).toBeInTheDocument();
      expect(screen.getByText(/You have accepted a vendor quote/)).toBeInTheDocument();
    });
  });
});
