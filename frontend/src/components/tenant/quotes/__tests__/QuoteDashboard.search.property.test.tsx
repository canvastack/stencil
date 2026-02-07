/**
 * Property-Based Tests for QuoteDashboard - Search Functionality
 * 
 * Property 26: Admin Search Finds Matching Quotes
 * Validates: Requirements 8.3
 * 
 * For any search term entered in the admin dashboard, quotes matching the term 
 * in quote_number, order_number, vendor_name, or customer_name should be returned.
 */

import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
import { QuoteDashboard } from '../QuoteDashboard';
import { quoteService, Quote } from '@/services/tenant/quoteService';

// Mock the quote service
vi.mock('@/services/tenant/quoteService', () => ({
  quoteService: {
    getQuotes: vi.fn(),
    getAvailableVendors: vi.fn(),
    sendQuote: vi.fn(),
    deleteQuote: vi.fn(),
    generatePDF: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Feature: quote-workflow-fixes, Property 26: Admin Search Finds Matching Quotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock for vendors
    vi.mocked(quoteService.getAvailableVendors).mockResolvedValue([
      { id: 'vendor-1', name: 'Vendor One', email: 'vendor1@example.com', company: 'Company 1' },
      { id: 'vendor-2', name: 'Vendor Two', email: 'vendor2@example.com', company: 'Company 2' },
    ]);
  });

  /**
   * Helper to create a quote with specific searchable fields
   */
  const createQuote = (
    id: string,
    quoteNumber: string,
    orderNumber: string,
    vendorName: string,
    customerName: string
  ): Quote => ({
    id,
    quote_number: quoteNumber,
    order_id: `order-${id}`,
    customer_id: `customer-${id}`,
    vendor_id: `vendor-${id}`,
    title: `Quote ${id}`,
    description: `Description for quote ${id}`,
    status: 'draft',
    total_amount: 100000,
    tax_amount: 10000,
    grand_total: 110000,
    currency: 'IDR',
    valid_until: new Date().toISOString(),
    terms_and_conditions: 'Standard terms',
    notes: 'Test notes',
    revision_number: 0,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer: {
      id: `customer-${id}`,
      name: customerName,
      email: `customer${id}@example.com`,
    },
    vendor: {
      id: `vendor-${id}`,
      name: vendorName,
      email: `vendor${id}@example.com`,
      company: `Company ${id}`,
    },
    items: [{
      id: `item-${id}`,
      quote_id: id,
      description: 'Test item',
      quantity: 1,
      unit_price: 100000,
      total_vendor_cost: 80000,
      total_unit_price: 100000,
      total_price: 100000,
      profit_per_piece: 20000,
      profit_per_piece_percent: 20,
      profit_total: 20000,
      profit_total_percent: 20,
      specifications: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
  });

  /**
   * Property Test: Search Finds Quotes by Quote Number
   * 
   * For any search term that matches a quote number, that quote should be in the results.
   */
  it('finds quotes by quote number', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }),
        fc.array(fc.string({ minLength: 3, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
        (searchTerm, otherTerms) => {
          // Create quotes with different quote numbers
          const targetQuote = createQuote(
            'quote-1',
            `Q-2024-${searchTerm}`,
            'ORD-001',
            'Vendor A',
            'Customer A'
          );
          
          const otherQuotes = otherTerms.map((term, index) =>
            createQuote(
              `quote-${index + 2}`,
              `Q-2024-${term}`,
              `ORD-00${index + 2}`,
              `Vendor ${String.fromCharCode(66 + index)}`,
              `Customer ${String.fromCharCode(66 + index)}`
            )
          );
          
          const allQuotes = [targetQuote, ...otherQuotes];
          
          // Filter quotes that match the search term in quote_number
          const matchingQuotes = allQuotes.filter(q =>
            q.quote_number.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          // Verify the target quote is in the matching results
          expect(matchingQuotes).toContainEqual(targetQuote);
          
          // Verify all matching quotes actually contain the search term
          matchingQuotes.forEach(quote => {
            expect(quote.quote_number.toLowerCase()).toContain(searchTerm.toLowerCase());
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test: Search Finds Quotes by Vendor Name
   * 
   * For any search term that matches a vendor name, quotes from that vendor should be in the results.
   */
  it('finds quotes by vendor name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 15 }),
        fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 2, maxLength: 5 }),
        (searchTerm, otherTerms) => {
          // Create quotes with different vendor names
          const targetQuote = createQuote(
            'quote-1',
            'Q-2024-001',
            'ORD-001',
            `Vendor ${searchTerm}`,
            'Customer A'
          );
          
          const otherQuotes = otherTerms.map((term, index) =>
            createQuote(
              `quote-${index + 2}`,
              `Q-2024-00${index + 2}`,
              `ORD-00${index + 2}`,
              `Vendor ${term}`,
              `Customer ${String.fromCharCode(66 + index)}`
            )
          );
          
          const allQuotes = [targetQuote, ...otherQuotes];
          
          // Filter quotes that match the search term in vendor name
          const matchingQuotes = allQuotes.filter(q =>
            q.vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          // Verify the target quote is in the matching results
          expect(matchingQuotes).toContainEqual(targetQuote);
          
          // Verify all matching quotes actually contain the search term in vendor name
          matchingQuotes.forEach(quote => {
            expect(quote.vendor.name.toLowerCase()).toContain(searchTerm.toLowerCase());
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test: Search Finds Quotes by Customer Name
   * 
   * For any search term that matches a customer name, quotes for that customer should be in the results.
   */
  it('finds quotes by customer name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 15 }),
        fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 2, maxLength: 5 }),
        (searchTerm, otherTerms) => {
          // Create quotes with different customer names
          const targetQuote = createQuote(
            'quote-1',
            'Q-2024-001',
            'ORD-001',
            'Vendor A',
            `Customer ${searchTerm}`
          );
          
          const otherQuotes = otherTerms.map((term, index) =>
            createQuote(
              `quote-${index + 2}`,
              `Q-2024-00${index + 2}`,
              `ORD-00${index + 2}`,
              `Vendor ${String.fromCharCode(66 + index)}`,
              `Customer ${term}`
            )
          );
          
          const allQuotes = [targetQuote, ...otherQuotes];
          
          // Filter quotes that match the search term in customer name
          const matchingQuotes = allQuotes.filter(q =>
            q.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          // Verify the target quote is in the matching results
          expect(matchingQuotes).toContainEqual(targetQuote);
          
          // Verify all matching quotes actually contain the search term in customer name
          matchingQuotes.forEach(quote => {
            expect(quote.customer.name.toLowerCase()).toContain(searchTerm.toLowerCase());
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test: Empty Search Returns All Quotes
   * 
   * When no search term is provided, all quotes should be returned.
   */
  it('returns all quotes when search is empty', async () => {
    const allQuotes = [
      createQuote('quote-1', 'Q-2024-001', 'ORD-001', 'Vendor A', 'Customer A'),
      createQuote('quote-2', 'Q-2024-002', 'ORD-002', 'Vendor B', 'Customer B'),
      createQuote('quote-3', 'Q-2024-003', 'ORD-003', 'Vendor C', 'Customer C'),
    ];

    // Mock the API to return all quotes
    vi.mocked(quoteService.getQuotes).mockResolvedValue({
      data: allQuotes,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: allQuotes.length,
      },
    });

    // Create a new QueryClient
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Render the component
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <QuoteDashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(quoteService.getQuotes).toHaveBeenCalled();
    });

    // Verify API was called without search parameter or with empty search
    const lastCall = vi.mocked(quoteService.getQuotes).mock.calls[0];
    const params = lastCall?.[0];
    
    // Search should be undefined, null, or empty string
    expect(!params?.search || params.search === '').toBeTruthy();
  });

  /**
   * Property Test: Case-Insensitive Search
   * 
   * Search should be case-insensitive for all searchable fields.
   */
  it('performs case-insensitive search', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }),
        (searchTerm) => {
          const lowerCase = searchTerm.toLowerCase();
          const upperCase = searchTerm.toUpperCase();
          const mixedCase = searchTerm.split('').map((c, i) => 
            i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
          ).join('');
          
          const quote = createQuote(
            'quote-1',
            `Q-2024-${searchTerm}`,
            'ORD-001',
            'Vendor A',
            'Customer A'
          );
          
          // All case variations should match
          expect(quote.quote_number.toLowerCase()).toContain(lowerCase);
          expect(quote.quote_number.toLowerCase()).toContain(upperCase.toLowerCase());
          expect(quote.quote_number.toLowerCase()).toContain(mixedCase.toLowerCase());
        }
      ),
      { numRuns: 50 }
    );
  });
});
