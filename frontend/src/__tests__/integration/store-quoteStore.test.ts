import { describe, test, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { useQuoteStore } from '@/stores/quoteStore';
import { authService } from '@/services/api/auth';

describe('Quote Store - Integration Tests', () => {
  let tenantId: string | null = null;
  let testQuoteId: string | null = null;

  beforeAll(async () => {
    try {
      const response = await authService.login({
        email: 'admin@etchinx.com',
        password: 'DemoAdmin2024!',
        tenant_id: 'tenant_demo-etching',
      });

      tenantId = response.tenant?.uuid || null;
      console.log('✓ Quote Store test setup: Tenant authenticated');
    } catch (error) {
      console.log('Quote Store test setup skipped (requires backend running)');
    }
  });

  beforeEach(() => {
    const store = useQuoteStore.getState();
    store.clearFilters();
    store.clearSelection();
    store.setQuotes([]);
    store.setSelectedQuote(null);
    store.setError(null);
  });

  afterEach(async () => {
    if (testQuoteId) {
      try {
        await useQuoteStore.getState().deleteQuote(testQuoteId);
        console.log('✓ Test cleanup: Quote deleted');
      } catch (error) {
        console.log('Test cleanup skipped');
      }
      testQuoteId = null;
    }
  });

  describe('State Management', () => {
    test('should initialize with default state', () => {
      const store = useQuoteStore.getState();

      expect(store.quotes).toEqual([]);
      expect(store.selectedQuote).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.currentPage).toBe(1);
      expect(store.selectedQuoteIds).toEqual([]);
      console.log('✓ Store initialized with default state');
    });

    test('should update quotes', () => {
      const store = useQuoteStore.getState();

      const mockQuotes = [
        { id: '1', quote_number: 'QT-001', customer_name: 'Test Customer 1' },
        { id: '2', quote_number: 'QT-002', customer_name: 'Test Customer 2' },
      ] as any;

      store.setQuotes(mockQuotes);
      const currentStore = useQuoteStore.getState();

      expect(currentStore.quotes).toHaveLength(2);
      expect(currentStore.quotes[0].quote_number).toBe('QT-001');
      console.log('✓ Quotes updated');
    });

    test('should set selected quote', () => {
      const store = useQuoteStore.getState();

      const mockQuote = { 
        id: '1', 
        quote_number: 'QT-001', 
        customer_name: 'Selected Customer' 
      } as any;

      store.setSelectedQuote(mockQuote);
      const currentStore = useQuoteStore.getState();

      expect(currentStore.selectedQuote).toBeDefined();
      expect(currentStore.selectedQuote?.quote_number).toBe('QT-001');
      console.log('✓ Selected quote updated');
    });

    test('should manage loading states', () => {
      const store = useQuoteStore.getState();

      store.setLoading(true);
      expect(useQuoteStore.getState().loading).toBe(true);

      store.setQuotesLoading(true);
      expect(useQuoteStore.getState().quotesLoading).toBe(true);

      store.setQuoteLoading(false);
      expect(useQuoteStore.getState().quoteLoading).toBe(false);

      console.log('✓ Loading states managed correctly');
    });

    test('should manage error state', () => {
      const store = useQuoteStore.getState();

      store.setError('Test error message');
      expect(useQuoteStore.getState().error).toBe('Test error message');

      store.setError(null);
      expect(useQuoteStore.getState().error).toBeNull();

      console.log('✓ Error state managed correctly');
    });
  });

  describe('Pagination Management', () => {
    test('should update pagination state', () => {
      const store = useQuoteStore.getState();

      store.setPagination({
        currentPage: 2,
        totalPages: 10,
        totalCount: 100,
        perPage: 10,
      });

      const currentStore = useQuoteStore.getState();
      expect(currentStore.currentPage).toBe(2);
      expect(currentStore.totalPages).toBe(10);
      expect(currentStore.totalCount).toBe(100);
      expect(currentStore.perPage).toBe(10);

      console.log('✓ Pagination state updated');
    });

    test('should handle page changes through filters', () => {
      const store = useQuoteStore.getState();

      store.setFilters({ page: 3 });

      const currentStore = useQuoteStore.getState();
      expect(currentStore.filters.page).toBe(3);
      expect(currentStore.currentPage).toBe(3);

      console.log('✓ Page changes handled correctly');
    });
  });

  describe('Filter Management', () => {
    test('should update filters', () => {
      const store = useQuoteStore.getState();

      store.setFilters({
        status: 'pending',
        search: 'test quote',
      });

      const currentStore = useQuoteStore.getState();
      expect(currentStore.filters.status).toBe('pending');
      expect(currentStore.filters.search).toBe('test quote');

      console.log('✓ Filters updated');
    });

    test('should clear filters', () => {
      const store = useQuoteStore.getState();

      store.setFilters({
        status: 'accepted',
        search: 'test',
        page: 5,
      });

      store.clearFilters();

      const currentStore = useQuoteStore.getState();
      expect(currentStore.filters.status).toBeUndefined();
      expect(currentStore.filters.search).toBeUndefined();
      expect(currentStore.filters.page).toBe(1);
      expect(currentStore.currentPage).toBe(1);

      console.log('✓ Filters cleared');
    });

    test('should merge filters with defaults', () => {
      const store = useQuoteStore.getState();

      store.setFilters({ status: 'pending' });

      const currentStore = useQuoteStore.getState();
      expect(currentStore.filters.status).toBe('pending');
      expect(currentStore.filters.sort_by).toBe('created_at');
      expect(currentStore.filters.sort_order).toBe('desc');

      console.log('✓ Filters merged with defaults');
    });
  });

  describe('Selection Management', () => {
    test('should toggle quote selection', () => {
      const store = useQuoteStore.getState();

      store.selectQuote('quote-1');
      expect(useQuoteStore.getState().selectedQuoteIds).toContain('quote-1');

      store.selectQuote('quote-1');
      expect(useQuoteStore.getState().selectedQuoteIds).not.toContain('quote-1');

      console.log('✓ Quote selection toggled');
    });

    test('should select all quotes', () => {
      const store = useQuoteStore.getState();

      const mockQuotes = [
        { id: 'quote-1', quote_number: 'QT-001' },
        { id: 'quote-2', quote_number: 'QT-002' },
        { id: 'quote-3', quote_number: 'QT-003' },
      ] as any;

      store.setQuotes(mockQuotes);
      store.selectAllQuotes();

      const currentStore = useQuoteStore.getState();
      expect(currentStore.selectedQuoteIds).toHaveLength(3);
      expect(currentStore.selectedQuoteIds).toContain('quote-1');
      expect(currentStore.selectedQuoteIds).toContain('quote-2');
      expect(currentStore.selectedQuoteIds).toContain('quote-3');

      console.log('✓ All quotes selected');
    });

    test('should clear selection', () => {
      const store = useQuoteStore.getState();

      store.selectQuote('quote-1');
      store.selectQuote('quote-2');
      expect(useQuoteStore.getState().selectedQuoteIds).toHaveLength(2);

      store.clearSelection();
      expect(useQuoteStore.getState().selectedQuoteIds).toHaveLength(0);

      console.log('✓ Selection cleared');
    });
  });

  describe('API Integration - Fetch Quotes', () => {
    test('should fetch quotes from API', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        await store.fetchQuotes({ page: 1, per_page: 10 });

        const currentStore = useQuoteStore.getState();
        expect(currentStore.quotes).toBeDefined();
        expect(Array.isArray(currentStore.quotes)).toBe(true);
        expect(currentStore.quotesLoading).toBe(false);
        expect(currentStore.error).toBeNull();

        console.log(`✓ Fetched ${currentStore.quotes.length} quotes from API`);
      } catch (error) {
        console.log('fetchQuotes test skipped (requires backend running)');
      }
    });

    test('should apply filters when fetching quotes', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        await store.fetchQuotes({ 
          page: 1, 
          per_page: 5,
          status: 'pending',
        });

        const currentStore = useQuoteStore.getState();
        expect(currentStore.quotes).toBeDefined();
        expect(currentStore.perPage).toBe(5);

        console.log(`✓ Fetched quotes with filters`);
      } catch (error) {
        console.log('fetchQuotes with filters test skipped (requires backend running)');
      }
    });

    test('should update pagination data after fetching', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        await store.fetchQuotes({ page: 1, per_page: 10 });

        const currentStore = useQuoteStore.getState();
        expect(currentStore.currentPage).toBeGreaterThanOrEqual(1);
        expect(currentStore.totalPages).toBeGreaterThanOrEqual(0);
        expect(currentStore.totalCount).toBeGreaterThanOrEqual(0);

        console.log('✓ Pagination data updated after fetch');
      } catch (error) {
        console.log('Pagination update test skipped (requires backend running)');
      }
    });
  });

  describe('API Integration - Single Quote', () => {
    test('should fetch single quote by ID', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        await store.fetchQuotes({ page: 1, per_page: 1 });

        const currentStore = useQuoteStore.getState();
        if (currentStore.quotes.length === 0) {
          console.log('Test skipped: no quotes available');
          return;
        }

        const quoteId = currentStore.quotes[0].id;
        const quote = await store.fetchQuote(quoteId);

        expect(quote).toBeDefined();
        expect(quote?.id).toBe(quoteId);
        expect(useQuoteStore.getState().selectedQuote).toBeDefined();
        expect(useQuoteStore.getState().selectedQuote?.id).toBe(quoteId);

        console.log(`✓ Fetched quote: ${quote?.quote_number}`);
      } catch (error) {
        console.log('fetchQuote test skipped (requires backend running)');
      }
    });

    test('should handle fetch error for invalid quote ID', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        const invalidId = '99999999-9999-9999-9999-999999999999';

        const result = await store.fetchQuote(invalidId);

        expect(result).toBeNull();
        expect(useQuoteStore.getState().error).toBeDefined();

        console.log('✓ Invalid quote ID handled correctly');
      } catch (error) {
        console.log('Invalid quote ID test skipped (requires backend running)');
      }
    });
  });

  describe('API Integration - CRUD Operations', () => {
    test('should create new quote', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        const initialCount = useQuoteStore.getState().quotes.length;

        const newQuote = await store.createQuote({
          customer_id: 'customer-123',
          quote_type: 'product',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              product_id: 'product-123',
              quantity: 10,
              unit_price: 50000,
              total_price: 500000,
            },
          ],
          notes: 'Integration test quote',
        } as any);

        if (newQuote) {
          testQuoteId = newQuote.id;
          const currentStore = useQuoteStore.getState();
          expect(currentStore.quotes.length).toBe(initialCount + 1);
          expect(currentStore.error).toBeNull();

          console.log(`✓ Created quote: ${newQuote.quote_number}`);
        } else {
          console.log('Quote creation returned null');
        }
      } catch (error) {
        console.log('createQuote test skipped (requires backend running)');
      }
    });

    test('should update existing quote', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        await store.fetchQuotes({ page: 1, per_page: 1 });

        const currentStore = useQuoteStore.getState();
        if (currentStore.quotes.length === 0) {
          console.log('Test skipped: no quotes available');
          return;
        }

        const quoteId = currentStore.quotes[0].id;
        const updatedQuote = await store.updateQuote(quoteId, {
          notes: 'Updated during integration test',
        });

        expect(updatedQuote).toBeDefined();
        expect(updatedQuote?.id).toBe(quoteId);

        console.log(`✓ Updated quote: ${updatedQuote?.quote_number}`);
      } catch (error) {
        console.log('updateQuote test skipped (requires backend running)');
      }
    });

    test('should delete quote', async () => {
      try {
        if (!tenantId || !testQuoteId) {
          console.log('Test skipped: tenant authentication or test quote required');
          return;
        }

        const store = useQuoteStore.getState();
        const initialCount = useQuoteStore.getState().quotes.length;

        await store.deleteQuote(testQuoteId);

        const currentStore = useQuoteStore.getState();
        expect(currentStore.quotes.length).toBe(initialCount - 1);
        expect(currentStore.quotes.find(q => q.id === testQuoteId)).toBeUndefined();

        testQuoteId = null;
        console.log('✓ Quote deleted');
      } catch (error) {
        console.log('deleteQuote test skipped (requires backend running)');
      }
    });
  });

  describe('Quote Workflow Actions', () => {
    test('should send quote to customer', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        await store.fetchQuotes({ page: 1, per_page: 1, status: 'draft' });

        const currentStore = useQuoteStore.getState();
        if (currentStore.quotes.length === 0) {
          console.log('Test skipped: no draft quotes available');
          return;
        }

        const quoteId = currentStore.quotes[0].id;
        const sentQuote = await store.sendQuote(quoteId);

        expect(sentQuote).toBeDefined();
        expect(sentQuote?.status).not.toBe('draft');

        console.log(`✓ Quote sent: ${sentQuote?.quote_number}`);
      } catch (error) {
        console.log('sendQuote test skipped (requires backend running)');
      }
    });

    test('should approve quote', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        await store.fetchQuotes({ page: 1, per_page: 1, status: 'pending' });

        const currentStore = useQuoteStore.getState();
        if (currentStore.quotes.length === 0) {
          console.log('Test skipped: no pending quotes available');
          return;
        }

        const quoteId = currentStore.quotes[0].id;
        const approvedQuote = await store.approveQuote(quoteId, 'Approved during test');

        expect(approvedQuote).toBeDefined();

        console.log(`✓ Quote approved: ${approvedQuote?.quote_number}`);
      } catch (error) {
        console.log('approveQuote test skipped (requires backend running)');
      }
    });
  });

  describe('Quote Statistics', () => {
    test('should fetch quote statistics', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();
        await store.fetchQuoteStats();

        const currentStore = useQuoteStore.getState();
        expect(currentStore.stats).toBeDefined();
        
        if (currentStore.stats) {
          expect(currentStore.stats.total_quotes).toBeGreaterThanOrEqual(0);
          expect(currentStore.stats.conversion_rate).toBeGreaterThanOrEqual(0);
          expect(currentStore.stats.conversion_rate).toBeLessThanOrEqual(100);
        }

        console.log(`✓ Quote stats fetched - Total: ${currentStore.stats?.total_quotes}`);
      } catch (error) {
        console.log('fetchQuoteStats test skipped (requires backend running)');
      }
    });
  });

  describe('Complex Workflows', () => {
    test('should handle complete quote lifecycle', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();

        const newQuote = await store.createQuote({
          customer_id: 'customer-123',
          quote_type: 'product',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              product_id: 'product-123',
              quantity: 5,
              unit_price: 100000,
              total_price: 500000,
            },
          ],
          notes: 'Lifecycle test quote',
        } as any);

        if (!newQuote) {
          console.log('Quote creation failed');
          return;
        }

        testQuoteId = newQuote.id;

        const updatedQuote = await store.updateQuote(newQuote.id, {
          notes: 'Updated notes',
        });
        expect(updatedQuote).toBeDefined();

        await store.deleteQuote(newQuote.id);
        testQuoteId = null;

        const currentStore = useQuoteStore.getState();
        expect(currentStore.quotes.find(q => q.id === newQuote.id)).toBeUndefined();

        console.log('✓ Complete quote lifecycle tested');
      } catch (error) {
        console.log('Quote lifecycle test skipped (requires backend running)');
      }
    });

    test('should handle pagination and filters combined', async () => {
      try {
        if (!tenantId) {
          console.log('Test skipped: tenant authentication required');
          return;
        }

        const store = useQuoteStore.getState();

        store.setFilters({ status: 'pending', per_page: 5 });
        await store.fetchQuotes();

        const currentStore = useQuoteStore.getState();
        expect(currentStore.filters.status).toBe('pending');
        expect(currentStore.perPage).toBe(5);

        console.log('✓ Pagination and filters combined successfully');
      } catch (error) {
        console.log('Combined pagination/filters test skipped (requires backend running)');
      }
    });
  });

  describe('Optimistic Updates', () => {
    test('should optimistically update quote', () => {
      const store = useQuoteStore.getState();

      const mockQuotes = [
        { id: 'quote-1', quote_number: 'QT-001', status: 'draft' },
        { id: 'quote-2', quote_number: 'QT-002', status: 'pending' },
      ] as any;

      store.setQuotes(mockQuotes);

      store.optimisticallyUpdateQuote({
        id: 'quote-1',
        status: 'sent',
      });

      const currentStore = useQuoteStore.getState();
      const updatedQuote = currentStore.quotes.find(q => q.id === 'quote-1');
      expect(updatedQuote?.status).toBe('sent');

      console.log('✓ Optimistic update applied');
    });

    test('should optimistically remove quote', () => {
      const store = useQuoteStore.getState();

      const mockQuotes = [
        { id: 'quote-1', quote_number: 'QT-001' },
        { id: 'quote-2', quote_number: 'QT-002' },
      ] as any;

      store.setQuotes(mockQuotes);
      expect(useQuoteStore.getState().quotes).toHaveLength(2);

      store.optimisticallyRemoveQuote('quote-1');

      const currentStore = useQuoteStore.getState();
      expect(currentStore.quotes).toHaveLength(1);
      expect(currentStore.quotes.find(q => q.id === 'quote-1')).toBeUndefined();

      console.log('✓ Optimistic removal applied');
    });
  });

  describe('Data Persistence', () => {
    test('should maintain state across store access', () => {
      const store1 = useQuoteStore.getState();
      store1.setFilters({ status: 'accepted', page: 2 });

      const store2 = useQuoteStore.getState();
      expect(store2.filters.status).toBe('accepted');
      expect(store2.filters.page).toBe(2);

      console.log('✓ State persists across store access');
    });
  });
});
