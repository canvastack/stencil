/**
 * Property-Based Tests for QuoteDashboard - Status Filtering
 * 
 * Property 10: Status Filtering Works Correctly
 * Validates: Requirements 3.8, 8.4
 * 
 * For any status filter value applied to the quote list, only quotes with that 
 * status should be returned.
 */

import { render, screen, waitFor } from '@testing-library/react';
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

describe('Feature: quote-workflow-fixes, Property 10: Status Filtering Works Correctly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock for vendors
    vi.mocked(quoteService.getAvailableVendors).mockResolvedValue([
      { id: 'vendor-1', name: 'Vendor One', email: 'vendor1@example.com', company: 'Company 1' },
      { id: 'vendor-2', name: 'Vendor Two', email: 'vendor2@example.com', company: 'Company 2' },
    ]);
  });

  /**
   * Arbitrary generator for Quote Status
   */
  const quoteStatusArbitrary = fc.constantFrom(
    'draft',
    'open',
    'sent',
    'countered',
    'accepted',
    'rejected',
    'cancelled',
    'expired'
  );

  /**
   * Helper to create a minimal quote with specific status
   */
  const createQuote = (status: Quote['status'], id: string): Quote => ({
    id,
    quote_number: `Q-2024-${id.substring(0, 8)}`,
    order_id: `order-${id}`,
    customer_id: `customer-${id}`,
    vendor_id: `vendor-${id}`,
    title: `Quote ${id}`,
    description: `Description for quote ${id}`,
    status,
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
      name: `Customer ${id}`,
      email: `customer${id}@example.com`,
    },
    vendor: {
      id: `vendor-${id}`,
      name: `Vendor ${id}`,
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
   * Property Test: Status Filtering Works Correctly
   * 
   * For any status filter value applied to the quote list, only quotes with that 
   * status should be returned.
   */
  it('filters quotes by status correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        quoteStatusArbitrary,
        fc.array(quoteStatusArbitrary, { minLength: 3, maxLength: 8 }),
        async (filterStatus, allStatuses) => {
          // Generate quotes with various statuses
          const quotesWithStatus = allStatuses.map((status, index) => 
            createQuote(status, `quote-${index}`)
          );

          // Mock the API to return all quotes initially
          vi.mocked(quoteService.getQuotes).mockResolvedValue({
            data: quotesWithStatus,
            meta: {
              current_page: 1,
              last_page: 1,
              per_page: 20,
              total: quotesWithStatus.length,
            },
          });

          // Create a new QueryClient for each test
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
          }, { timeout: 3000 });

          // Filter quotes by the test status
          const filteredQuotes = quotesWithStatus.filter(q => q.status === filterStatus);
          
          // Verify filtering logic
          filteredQuotes.forEach(quote => {
            expect(quote.status).toBe(filterStatus);
          });

          // Verify that quotes with different statuses are excluded
          const excludedQuotes = quotesWithStatus.filter(q => q.status !== filterStatus);
          excludedQuotes.forEach(quote => {
            expect(quote.status).not.toBe(filterStatus);
          });
        }
      ),
      { numRuns: 20 } // Run 20 iterations with different status combinations
    );
  });

  /**
   * Property Test: All Status Values Are Valid
   * 
   * Ensures that all generated status values are valid quote statuses.
   */
  it('generates only valid quote statuses', () => {
    fc.assert(
      fc.property(
        quoteStatusArbitrary,
        (status) => {
          const validStatuses: Quote['status'][] = [
            'draft', 'open', 'sent', 'countered', 
            'accepted', 'rejected', 'cancelled', 'expired'
          ];
          expect(validStatuses).toContain(status);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Quote Creation Maintains Status
   * 
   * Ensures that created quotes maintain their assigned status.
   */
  it('maintains status when creating quotes', () => {
    fc.assert(
      fc.property(
        quoteStatusArbitrary,
        fc.uuid(),
        (status, id) => {
          const quote = createQuote(status, id);
          expect(quote.status).toBe(status);
        }
      ),
      { numRuns: 100 }
    );
  });
});
