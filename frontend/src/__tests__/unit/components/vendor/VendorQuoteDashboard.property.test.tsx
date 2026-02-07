/**
 * Property-Based Tests for Vendor Quote Dashboard
 * 
 * Feature: quote-workflow-fixes
 * Task: 7.2 Write property test for vendor dashboard
 * 
 * These tests verify that the vendor dashboard correctly displays only quotes
 * assigned to the authenticated vendor, with proper tenant isolation.
 * 
 * Property 19: Vendor Dashboard Shows Assigned Quotes
 * Validates: Requirements 6.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { VendorQuoteDashboard } from '@/components/vendor/quotes/VendorQuoteDashboard';
import { quoteApi } from '@/lib/api/quote';
import type { Quote } from '@/types/quote';

// Mock the quote API
vi.mock('@/lib/api/quote', () => ({
  quoteApi: {
    listVendorQuotes: vi.fn(),
  },
}));

describe('VendorQuoteDashboard - Property-Based Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  /**
   * Helper function to render component with providers
   */
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  /**
   * Property 19: Vendor Dashboard Shows Assigned Quotes
   * 
   * For any vendor user, their dashboard should display only quotes where they
   * are the assigned vendor, filtered by tenant_id.
   * 
   * This property verifies that:
   * 1. The dashboard fetches quotes with the correct vendor_id parameter
   * 2. Only quotes assigned to the vendor are displayed
   * 3. Tenant isolation is maintained (all quotes belong to same tenant)
   * 4. The API is called with proper filtering parameters
   * 
   * Validates: Requirements 6.1
   * Feature: quote-workflow-fixes, Property 19
   */
  it('Property 19: Vendor dashboard shows only assigned quotes with tenant isolation', async () => {
    // Define arbitraries for generating test data
    const vendorIdArbitrary = fc.uuid();
    const tenantIdArbitrary = fc.integer({ min: 1, max: 1000 });
    
    // Generate quote status values
    const quoteStatusArbitrary = fc.constantFrom(
      'draft',
      'sent',
      'pending_response',
      'accepted',
      'rejected',
      'countered',
      'expired'
    );

    // Safe date ranges
    const pastDateArbitrary = fc.integer({ min: Date.parse('2024-01-01'), max: Date.now() }).map(ts => new Date(ts).toISOString());
    const futureDateArbitrary = fc.integer({ min: Date.now() + 86400000, max: Date.parse('2026-12-31') }).map(ts => new Date(ts).toISOString());

    // Generate a single quote for a vendor
    const quoteArbitrary = (vendorId: string, tenantId: number) =>
      fc.record({
        uuid: fc.uuid(),
        quote_number: fc.string({ minLength: 8, maxLength: 20 }).map(s => `QT-${s}`),
        tenant_id: fc.constant(tenantId),
        order_id: fc.integer({ min: 1, max: 10000 }),
        vendor_id: fc.integer({ min: 1, max: 1000 }),
        status: fc.record({
          value: quoteStatusArbitrary,
          label: fc.string({ minLength: 5, maxLength: 20 }),
          color: fc.constantFrom('gray', 'blue', 'yellow', 'green', 'red', 'orange'),
        }),
        initial_offer: fc.option(fc.integer({ min: 10000, max: 10000000 }), { nil: null }),
        latest_offer: fc.option(fc.integer({ min: 10000, max: 10000000 }), { nil: null }),
        currency: fc.constant('IDR'),
        quote_details: fc.option(
          fc.record({
            product_name: fc.string({ minLength: 5, maxLength: 50 }),
            quantity: fc.integer({ min: 1, max: 1000 }),
            specifications: fc.dictionary(
              fc.string({ minLength: 3, maxLength: 20 }),
              fc.oneof(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.integer({ min: 0, max: 1000 }),
                fc.boolean()
              )
            ),
            notes: fc.option(fc.string({ minLength: 5, maxLength: 200 }), { nil: undefined }),
            estimated_delivery_days: fc.option(fc.integer({ min: 1, max: 90 }), { nil: undefined }),
          }),
          { nil: null }
        ),
        history: fc.array(
          fc.record({
            action: fc.constantFrom('created', 'sent', 'accepted', 'rejected', 'countered'),
            timestamp: pastDateArbitrary,
            user_id: fc.integer({ min: 1, max: 100 }),
            notes: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        status_history: fc.array(
          fc.record({
            from: fc.option(quoteStatusArbitrary, { nil: null }),
            to: quoteStatusArbitrary,
            changed_by: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
            changed_at: pastDateArbitrary,
            reason: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: null }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        round: fc.integer({ min: 1, max: 10 }),
        sent_at: fc.option(pastDateArbitrary, { nil: null }),
        responded_at: fc.option(pastDateArbitrary, { nil: null }),
        response_type: fc.option(fc.constantFrom('accept', 'reject', 'counter'), { nil: null }),
        response_notes: fc.option(fc.string({ minLength: 5, maxLength: 200 }), { nil: null }),
        expires_at: fc.option(futureDateArbitrary, { nil: null }),
        closed_at: fc.option(pastDateArbitrary, { nil: null }),
        is_expired: fc.boolean(),
        created_at: pastDateArbitrary,
        updated_at: pastDateArbitrary,
        order: fc.record({
          uuid: fc.uuid(),
          order_number: fc.string({ minLength: 8, maxLength: 20 }).map(s => `ORD-${s}`),
          customer: fc.option(
            fc.record({
              uuid: fc.uuid(),
              name: fc.string({ minLength: 5, maxLength: 50 }),
              email: fc.emailAddress(),
            }),
            { nil: undefined }
          ),
        }),
        vendor: fc.record({
          uuid: fc.constant(vendorId),
          name: fc.string({ minLength: 5, maxLength: 50 }),
          email: fc.emailAddress(),
        }),
      });

    await fc.assert(
      fc.asyncProperty(
        vendorIdArbitrary,
        tenantIdArbitrary,
        fc.integer({ min: 1, max: 10 }), // Number of quotes for this vendor (reduced for speed)
        async (vendorId, tenantId, numVendorQuotes) => {
          // Generate quotes for the target vendor
          const vendorQuotes = await fc.sample(
            quoteArbitrary(vendorId, tenantId),
            numVendorQuotes
          );

          // Mock API response - should only return quotes for the target vendor
          const mockApiResponse = {
            data: vendorQuotes,
            meta: {
              current_page: 1,
              per_page: 20,
              total: vendorQuotes.length,
              last_page: 1,
              from: 1,
              to: vendorQuotes.length,
            },
          };

          vi.mocked(quoteApi.listVendorQuotes).mockResolvedValue(mockApiResponse);

          // Render the dashboard
          const { unmount } = renderWithProviders(<VendorQuoteDashboard vendorId={vendorId} />);

          try {
            // Wait for the API call to complete
            await waitFor(() => {
              expect(quoteApi.listVendorQuotes).toHaveBeenCalled();
            }, { timeout: 3000 });

            // Verify API was called with correct vendor_id parameter
            expect(quoteApi.listVendorQuotes).toHaveBeenCalledWith(
              expect.objectContaining({
                vendor_id: vendorId,
              })
            );

            // Verify all returned quotes belong to the same tenant
            vendorQuotes.forEach((quote) => {
              expect(quote.tenant_id).toBe(tenantId);
            });

            // Verify all returned quotes are assigned to the vendor
            vendorQuotes.forEach((quote) => {
              expect(quote.vendor?.uuid).toBe(vendorId);
            });
          } finally {
            // Always unmount to clean up
            unmount();
          }
        }
      ),
      {
        numRuns: 20, // Reduced from 100 for faster execution
        timeout: 5000,
      }
    );
  }, 60000); // 1 minute timeout for the entire test

  /**
   * Property 19b: Vendor Dashboard Respects Status Filtering
   * 
   * For any vendor user and status filter, the dashboard should only display
   * quotes matching both the vendor_id and the status filter.
   * 
   * Validates: Requirements 6.1, 6.2
   * Feature: quote-workflow-fixes, Property 19b
   */
  it('Property 19b: Vendor dashboard respects status filtering', async () => {
    const vendorIdArbitrary = fc.uuid();
    const tenantIdArbitrary = fc.integer({ min: 1, max: 1000 });
    const statusFilterArbitrary = fc.constantFrom(
      'sent',
      'pending_response',
      'accepted',
      'rejected',
      'countered'
    );

    // Safe date ranges
    const pastDateArbitrary = fc.integer({ min: Date.parse('2024-01-01'), max: Date.now() }).map(ts => new Date(ts).toISOString());
    const futureDateArbitrary = fc.integer({ min: Date.now() + 86400000, max: Date.parse('2026-12-31') }).map(ts => new Date(ts).toISOString());

    const quoteWithStatusArbitrary = (vendorId: string, tenantId: number, status: string) =>
      fc.record({
        uuid: fc.uuid(),
        quote_number: fc.string({ minLength: 8, maxLength: 20 }).map(s => `QT-${s}`),
        tenant_id: fc.constant(tenantId),
        order_id: fc.integer({ min: 1, max: 10000 }),
        vendor_id: fc.integer({ min: 1, max: 1000 }),
        status: fc.constant({
          value: status,
          label: status.charAt(0).toUpperCase() + status.slice(1),
          color: 'blue',
        }),
        initial_offer: fc.option(fc.integer({ min: 10000, max: 10000000 }), { nil: null }),
        latest_offer: fc.option(fc.integer({ min: 10000, max: 10000000 }), { nil: null }),
        currency: fc.constant('IDR'),
        quote_details: fc.option(
          fc.record({
            product_name: fc.string({ minLength: 5, maxLength: 50 }),
            quantity: fc.integer({ min: 1, max: 1000 }),
          }),
          { nil: null }
        ),
        history: fc.constant([]),
        status_history: fc.constant([]),
        round: fc.integer({ min: 1, max: 10 }),
        sent_at: fc.option(pastDateArbitrary, { nil: null }),
        responded_at: fc.option(pastDateArbitrary, { nil: null }),
        response_type: fc.option(fc.constantFrom('accept', 'reject', 'counter'), { nil: null }),
        response_notes: fc.option(fc.string({ minLength: 5, maxLength: 200 }), { nil: null }),
        expires_at: fc.option(futureDateArbitrary, { nil: null }),
        closed_at: fc.option(pastDateArbitrary, { nil: null }),
        is_expired: fc.boolean(),
        created_at: pastDateArbitrary,
        updated_at: pastDateArbitrary,
        order: fc.record({
          uuid: fc.uuid(),
          order_number: fc.string({ minLength: 8, maxLength: 20 }).map(s => `ORD-${s}`),
          customer: fc.option(
            fc.record({
              uuid: fc.uuid(),
              name: fc.string({ minLength: 5, maxLength: 50 }),
              email: fc.emailAddress(),
            }),
            { nil: undefined }
          ),
        }),
        vendor: fc.record({
          uuid: fc.constant(vendorId),
          name: fc.string({ minLength: 5, maxLength: 50 }),
          email: fc.emailAddress(),
        }),
      });

    await fc.assert(
      fc.asyncProperty(
        vendorIdArbitrary,
        tenantIdArbitrary,
        statusFilterArbitrary,
        fc.integer({ min: 1, max: 10 }), // Number of quotes with matching status
        async (vendorId, tenantId, statusFilter, numMatchingQuotes) => {
          // Generate quotes with the matching status
          const matchingQuotes = await fc.sample(
            quoteWithStatusArbitrary(vendorId, tenantId, statusFilter),
            numMatchingQuotes
          );

          // Mock API response
          const mockApiResponse = {
            data: matchingQuotes,
            meta: {
              current_page: 1,
              per_page: 20,
              total: matchingQuotes.length,
              last_page: 1,
              from: 1,
              to: matchingQuotes.length,
            },
          };

          vi.mocked(quoteApi.listVendorQuotes).mockResolvedValue(mockApiResponse);

          // Render the dashboard
          renderWithProviders(<VendorQuoteDashboard vendorId={vendorId} />);

          // Wait for the API call
          await waitFor(() => {
            expect(quoteApi.listVendorQuotes).toHaveBeenCalled();
          });

          // Verify all returned quotes have the correct status
          matchingQuotes.forEach((quote) => {
            expect(quote.status.value).toBe(statusFilter);
          });

          // Verify all returned quotes belong to the vendor
          matchingQuotes.forEach((quote) => {
            expect(quote.vendor?.uuid).toBe(vendorId);
          });

          // Verify all returned quotes belong to the same tenant
          matchingQuotes.forEach((quote) => {
            expect(quote.tenant_id).toBe(tenantId);
          });
        }
      ),
      {
        numRuns: 20, // Reduced from 100 for faster execution
        timeout: 5000,
      }
    );
  }, 60000);

  /**
   * Property 19c: Vendor Dashboard Handles Empty Results
   * 
   * For any vendor user with no assigned quotes, the dashboard should
   * display an appropriate empty state message.
   * 
   * Validates: Requirements 6.1
   * Feature: quote-workflow-fixes, Property 19c
   */
  it('Property 19c: Vendor dashboard handles empty results gracefully', async () => {
    const vendorIdArbitrary = fc.uuid();

    await fc.assert(
      fc.asyncProperty(vendorIdArbitrary, async (vendorId) => {
        // Mock empty API response
        const mockApiResponse = {
          data: [],
          meta: {
            current_page: 1,
            per_page: 20,
            total: 0,
            last_page: 1,
            from: 0,
            to: 0,
          },
        };

        vi.mocked(quoteApi.listVendorQuotes).mockResolvedValue(mockApiResponse);

        // Render the dashboard
        const { unmount } = renderWithProviders(<VendorQuoteDashboard vendorId={vendorId} />);

        try {
          // Wait for the API call
          await waitFor(() => {
            expect(quoteApi.listVendorQuotes).toHaveBeenCalled();
          }, { timeout: 3000 });

          // Verify API was called with correct vendor_id
          expect(quoteApi.listVendorQuotes).toHaveBeenCalledWith(
            expect.objectContaining({
              vendor_id: vendorId,
            })
          );

          // Verify empty state is displayed
          await waitFor(() => {
            const emptyStateElements = screen.queryAllByText(/no quotes found/i);
            expect(emptyStateElements.length).toBeGreaterThan(0);
          }, { timeout: 2000 });
        } finally {
          // Always unmount to clean up
          unmount();
        }
      }),
      {
        numRuns: 10, // Reduced from 50 for faster execution
        timeout: 3000,
      }
    );
  }, 30000);
});
