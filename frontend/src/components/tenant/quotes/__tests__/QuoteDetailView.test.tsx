import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuoteDetailView } from '../QuoteDetailView';
import { Quote } from '@/services/tenant/quoteService';

// Mock quote data factory
const createMockQuote = (overrides?: Partial<Quote>): Quote => ({
  id: 'quote-uuid-123',
  quote_number: 'Q-000123',
  order_id: 'order-uuid-456',
  customer_id: 'customer-uuid-789',
  vendor_id: 'vendor-uuid-012',
  title: 'Custom Etching Plate Quote',
  description: 'Quote for custom metal etching plates with company logo',
  status: 'open',
  total_amount: 5000000,
  tax_amount: 500000,
  grand_total: 5500000,
  currency: 'IDR',
  valid_until: '2026-12-31T23:59:59Z',
  terms_and_conditions: '<p>Payment terms: 50% upfront, 50% on delivery</p><p>Delivery: 14 working days</p>',
  notes: 'Internal note: Customer prefers stainless steel material',
  revision_number: 1,
  created_by: 'admin-uuid',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  customer: {
    id: 'customer-uuid-789',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'ABC Corporation',
  },
  vendor: {
    id: 'vendor-uuid-012',
    name: 'Jane Smith',
    email: 'jane@vendor.com',
    company: 'XYZ Manufacturing',
  },
  items: [
    {
      id: 'item-uuid-1',
      quote_id: 'quote-uuid-123',
      product_id: 'product-uuid-1',
      description: 'Stainless Steel Etching Plate 10x15cm',
      quantity: 10,
      unit_price: 500000,
      vendor_cost: 350000,
      total_price: 5000000,
      product: {
        id: 'product-uuid-1',
        name: 'Etching Plate',
        sku: 'EP-10X15-SS',
        unit: 'pcs',
      },
    },
  ],
  ...overrides,
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('QuoteDetailView', () => {
  describe('Loading State', () => {
    it('should display loading skeleton when loading is true', () => {
      renderWithRouter(<QuoteDetailView quote={null} loading={true} />);
      
      // Check for skeleton elements by class name
      const { container } = render(<QuoteDetailView quote={null} loading={true} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should display "Quote not found" when quote is null and not loading', () => {
      renderWithRouter(<QuoteDetailView quote={null} loading={false} />);
      
      expect(screen.getByText('Quote not found')).toBeInTheDocument();
    });
  });

  describe('Quote Header', () => {
    it('should display quote number and status', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Q-000123')).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should display total amount in IDR and USD', () => {
      const quote = createMockQuote({ grand_total: 5500000 });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      // IDR format (with spaces as thousand separator) - appears multiple times
      const idrAmounts = screen.getAllByText(/5\.500\.000/);
      expect(idrAmounts.length).toBeGreaterThan(0);
      // USD conversion (5500000 / 15750 ≈ $349.21) - also appears multiple times
      const usdAmounts = screen.getAllByText(/349\.21/);
      expect(usdAmounts.length).toBeGreaterThan(0);
    });

    it('should display "Read-Only" badge for accepted quotes', () => {
      const quote = createMockQuote({ status: 'accepted' });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Read-Only')).toBeInTheDocument();
    });

    it('should display "Read-Only" badge for rejected quotes', () => {
      const quote = createMockQuote({ status: 'rejected' });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Read-Only')).toBeInTheDocument();
    });
  });

  describe('Quote Details Section', () => {
    it('should display quote title and description', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Custom Etching Plate Quote')).toBeInTheDocument();
      expect(screen.getByText(/Quote for custom metal etching plates/)).toBeInTheDocument();
    });

    it('should not render section if title and description are empty', () => {
      const quote = createMockQuote({ title: '', description: undefined });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.queryByText('Quote Details')).not.toBeInTheDocument();
    });
  });

  describe('Order Information Section', () => {
    it('should display order information with link when order_id exists', () => {
      const quote = createMockQuote({ order_id: 'order-uuid-456' });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Order Information')).toBeInTheDocument();
      expect(screen.getByText(/Order #order-uuid-456/)).toBeInTheDocument();
      
      const viewOrderLink = screen.getByRole('link', { name: /View Order/i });
      expect(viewOrderLink).toHaveAttribute('href', '/admin/orders/order-uuid-456');
    });

    it('should not render section if order_id is not present', () => {
      const quote = createMockQuote({ order_id: undefined });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.queryByText('Order Information')).not.toBeInTheDocument();
    });
  });

  describe('Customer Information Section', () => {
    it('should display customer name, company, and email', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('ABC Corporation')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should make email clickable', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      const emailLink = screen.getByRole('link', { name: 'john@example.com' });
      expect(emailLink).toHaveAttribute('href', 'mailto:john@example.com');
    });
  });

  describe('Vendor Information Section', () => {
    it('should display vendor name, company, and email', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Vendor Information')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('XYZ Manufacturing')).toBeInTheDocument();
      expect(screen.getByText('jane@vendor.com')).toBeInTheDocument();
    });

    it('should make email clickable', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      const emailLink = screen.getByRole('link', { name: 'jane@vendor.com' });
      expect(emailLink).toHaveAttribute('href', 'mailto:jane@vendor.com');
    });
  });

  describe('Quote Items Table', () => {
    it('should display all quote items with details', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Quote Items')).toBeInTheDocument();
      expect(screen.getByText('1 item in this quote')).toBeInTheDocument();
      expect(screen.getByText('Stainless Steel Etching Plate 10x15cm')).toBeInTheDocument();
      expect(screen.getByText('SKU: EP-10X15-SS')).toBeInTheDocument();
    });

    it('should display quantity with unit', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('10 pcs')).toBeInTheDocument();
    });

    it('should display unit price in IDR and USD', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      // Unit price: 500000 IDR (with spaces) - appears multiple times
      const idrPrices = screen.getAllByText(/500\.000/);
      expect(idrPrices.length).toBeGreaterThan(0);
      // USD conversion - also appears multiple times
      const usdPrices = screen.getAllByText(/31\.75/);
      expect(usdPrices.length).toBeGreaterThan(0);
    });

    it('should display vendor cost when available', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      // Vendor cost: 350000 IDR (with spaces)
      expect(screen.getByText(/350\.000/)).toBeInTheDocument();
    });

    it('should display total price in IDR and USD', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      // Total: 5000000 IDR (with spaces) - appears multiple times
      const idrTotals = screen.getAllByText(/5\.000\.000/);
      expect(idrTotals.length).toBeGreaterThan(0);
    });

    it('should display profit margin when vendor cost is available', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Profit Margin')).toBeInTheDocument();
      // Profit: (500000 - 350000) * 10 = 1,500,000 (with spaces)
      expect(screen.getByText(/1\.500\.000/)).toBeInTheDocument();
      // Percentage: (1500000 / 5000000) * 100 = 30%
      expect(screen.getByText(/30\.0%/)).toBeInTheDocument();
    });

    it('should display subtotal, tax, and grand total', () => {
      const quote = createMockQuote({
        total_amount: 5000000,
        tax_amount: 500000,
        grand_total: 5500000,
      });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('Tax')).toBeInTheDocument();
      expect(screen.getByText('Grand Total')).toBeInTheDocument();
    });
  });

  describe('Validity Period Section', () => {
    it('should display valid until date', () => {
      const quote = createMockQuote({ valid_until: '2026-12-31T23:59:59Z' });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Validity Period')).toBeInTheDocument();
      // Date format may vary, just check for year
      const yearElements = screen.getAllByText(/2026/);
      expect(yearElements.length).toBeGreaterThan(0);
    });

    it('should display "Expired" badge for past dates', () => {
      const quote = createMockQuote({ valid_until: '2020-01-01T00:00:00Z' });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });

  describe('Terms & Conditions Section', () => {
    it('should display terms and conditions as HTML', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
      expect(screen.getByText(/Payment terms: 50% upfront/)).toBeInTheDocument();
      expect(screen.getByText(/Delivery: 14 working days/)).toBeInTheDocument();
    });

    it('should not render section if terms are empty', () => {
      const quote = createMockQuote({ terms_and_conditions: undefined });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.queryByText('Terms & Conditions')).not.toBeInTheDocument();
    });
  });

  describe('Internal Notes Section', () => {
    it('should display internal notes', () => {
      const quote = createMockQuote();
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Internal Notes')).toBeInTheDocument();
      expect(screen.getByText(/Customer prefers stainless steel/)).toBeInTheDocument();
      expect(screen.getByText(/only visible to admin users/)).toBeInTheDocument();
    });

    it('should not render section if notes are empty', () => {
      const quote = createMockQuote({ notes: undefined });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.queryByText('Internal Notes')).not.toBeInTheDocument();
    });
  });

  describe('Negotiation History Timeline', () => {
    it('should display revision history when available', () => {
      const quote = createMockQuote({
        revision_number: 3,
        revision_history: [
          createMockQuote({
            id: 'rev-1',
            revision_number: 1,
            status: 'rejected',
            grand_total: 6000000,
            created_at: '2026-01-10T10:00:00Z',
          }),
          createMockQuote({
            id: 'rev-2',
            revision_number: 2,
            status: 'countered',
            grand_total: 5500000,
            created_at: '2026-01-12T10:00:00Z',
          }),
        ],
      });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('Negotiation History')).toBeInTheDocument();
      expect(screen.getByText('Current Version')).toBeInTheDocument();
      expect(screen.getByText('Rev. 3')).toBeInTheDocument();
      expect(screen.getByText('Revision 1')).toBeInTheDocument();
      expect(screen.getByText('Revision 2')).toBeInTheDocument();
      expect(screen.getByText('Quote Created')).toBeInTheDocument();
    });

    it('should not render section if no revision history', () => {
      const quote = createMockQuote({ revision_history: undefined });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.queryByText('Negotiation History')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should display action buttons when showActions is true and quote is not read-only', () => {
      const mockAccept = vi.fn();
      const mockReject = vi.fn();
      const mockCounter = vi.fn();
      
      const quote = createMockQuote({ status: 'open' });
      renderWithRouter(
        <QuoteDetailView
          quote={quote}
          showActions={true}
          onAccept={mockAccept}
          onReject={mockReject}
          onCounter={mockCounter}
        />
      );
      
      expect(screen.getByRole('button', { name: /Accept Quote/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reject Quote/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Counter Offer/i })).toBeInTheDocument();
    });

    it('should not display accept button for expired quotes', () => {
      const mockAccept = vi.fn();
      const quote = createMockQuote({
        status: 'open',
        valid_until: '2020-01-01T00:00:00Z',
      });
      renderWithRouter(
        <QuoteDetailView quote={quote} showActions={true} onAccept={mockAccept} />
      );
      
      expect(screen.queryByRole('button', { name: /Accept Quote/i })).not.toBeInTheDocument();
    });

    it('should not display action buttons for read-only quotes', () => {
      const quote = createMockQuote({ status: 'accepted' });
      renderWithRouter(<QuoteDetailView quote={quote} showActions={true} />);
      
      expect(screen.queryByRole('button', { name: /Accept Quote/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Reject Quote/i })).not.toBeInTheDocument();
    });

    it('should display read-only notice for accepted quotes', () => {
      const quote = createMockQuote({ status: 'accepted' });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('This quote is read-only')).toBeInTheDocument();
      expect(screen.getByText(/has been accepted and cannot be modified/)).toBeInTheDocument();
    });

    it('should display read-only notice for rejected quotes', () => {
      const quote = createMockQuote({ status: 'rejected' });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      expect(screen.getByText('This quote is read-only')).toBeInTheDocument();
      expect(screen.getByText(/has been rejected and cannot be modified/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render customer and vendor sections side by side on desktop', () => {
      const quote = createMockQuote();
      const { container } = renderWithRouter(<QuoteDetailView quote={quote} />);
      
      // Check for grid layout class
      const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should stack sections vertically on mobile', () => {
      const quote = createMockQuote();
      const { container } = renderWithRouter(<QuoteDetailView quote={quote} />);
      
      // Check for responsive flex classes
      const headerContainer = container.querySelector('.flex.flex-col.md\\:flex-row');
      expect(headerContainer).toBeInTheDocument();
    });
  });

  describe('Currency Conversion', () => {
    it('should convert all IDR amounts to USD', () => {
      const quote = createMockQuote({
        grand_total: 15750000, // Should be exactly $1,000.00
      });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      // Use getAllByText since the amount appears multiple times
      const usdElements = screen.getAllByText(/1,000\.00/);
      expect(usdElements.length).toBeGreaterThan(0);
    });

    it('should handle decimal conversions correctly', () => {
      const quote = createMockQuote({
        items: [
          {
            id: 'item-1',
            quote_id: 'quote-123',
            description: 'Test Item',
            quantity: 1,
            unit_price: 100000, // 100,000 IDR = $6.35 USD
            total_price: 100000,
          },
        ],
      });
      renderWithRouter(<QuoteDetailView quote={quote} />);
      
      // Use getAllByText since the amount appears multiple times (unit price and total)
      const usdElements = screen.getAllByText(/6\.35/);
      expect(usdElements.length).toBeGreaterThan(0);
    });
  });
});
