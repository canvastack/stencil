import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Quote, QuoteListParams, CreateQuoteRequest, UpdateQuoteRequest, QuoteResponse } from '@/services/tenant/quoteService';
import { quoteService } from '@/services/tenant/quoteService';

interface QuoteState {
  // Data
  quotes: Quote[];
  selectedQuote: Quote | null;
  revisionHistory: Quote[];
  stats: {
    total_quotes: number;
    accepted_quotes: number;
    rejected_quotes: number;
    pending_quotes: number;
    total_value: number;
    accepted_value: number;
    conversion_rate: number;
    average_response_time: number;
  } | null;

  // UI State
  loading: boolean;
  quotesLoading: boolean;
  quoteLoading: boolean;
  revisionLoading: boolean;
  statsLoading: boolean;
  error: string | null;

  // New state for duplicate check
  activeQuoteForOrder: Quote | null;
  checkingDuplicate: boolean;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;

  // Filters
  filters: QuoteListParams;

  // Selection
  selectedQuoteIds: string[];

  // Actions
  setQuotes: (quotes: Quote[]) => void;
  setSelectedQuote: (quote: Quote | null) => void;
  setRevisionHistory: (history: Quote[]) => void;
  setStats: (stats: QuoteState['stats']) => void;
  setLoading: (loading: boolean) => void;
  setQuotesLoading: (loading: boolean) => void;
  setQuoteLoading: (loading: boolean) => void;
  setRevisionLoading: (loading: boolean) => void;
  setStatsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: { currentPage: number; totalPages: number; totalCount: number; perPage: number }) => void;
  setFilters: (filters: Partial<QuoteListParams>) => void;
  clearFilters: () => void;
  
  // Selection actions
  selectQuote: (quoteId: string) => void;
  selectAllQuotes: () => void;
  clearSelection: () => void;
  
  // API actions
  fetchQuotes: (params?: QuoteListParams) => Promise<void>;
  fetchQuote: (id: string) => Promise<Quote | null>;
  createQuote: (data: CreateQuoteRequest) => Promise<Quote | null>;
  updateQuote: (id: string, data: UpdateQuoteRequest) => Promise<Quote | null>;
  deleteQuote: (id: string) => Promise<void>;
  sendQuote: (id: string) => Promise<Quote | null>;
  respondToQuote: (id: string, response: QuoteResponse) => Promise<Quote | null>;
  createRevision: (id: string, data: UpdateQuoteRequest) => Promise<Quote | null>;
  approveQuote: (id: string, notes?: string) => Promise<Quote | null>;
  convertToOrder: (id: string, orderData?: Record<string, any>) => Promise<{ quote: Quote; order: any } | null>;
  fetchRevisionHistory: (id: string) => Promise<void>;
  fetchQuoteStats: (params?: { date_from?: string; date_to?: string; vendor_id?: string; customer_id?: string }) => Promise<void>;
  bulkUpdateQuotes: (ids: string[], data: { status?: Quote['status']; notes?: string }) => Promise<void>;
  
  // New actions for quote management workflow
  checkExistingQuote: (orderId: string, vendorId?: string) => Promise<{
    hasActiveQuote: boolean;
    quote: Quote | null;
  }>;
  acceptQuote: (id: string, notes?: string) => Promise<Quote | null>;
  rejectQuote: (id: string, reason: string) => Promise<Quote | null>;
  counterQuote: (id: string, price: number, notes?: string) => Promise<Quote | null>;

  // Optimistic updates
  optimisticallyUpdateQuote: (updatedQuote: Partial<Quote> & { id: string }) => void;
  optimisticallyRemoveQuote: (id: string) => void;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      // Initial state
      quotes: [],
      selectedQuote: null,
      revisionHistory: [],
      stats: null,
      
      loading: false,
      quotesLoading: false,
      quoteLoading: false,
      revisionLoading: false,
      statsLoading: false,
      error: null,
      
      // New state for duplicate check
      activeQuoteForOrder: null,
      checkingDuplicate: false,
      
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      perPage: 10,
      
      filters: {
        page: 1,
        per_page: 10,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
      
      selectedQuoteIds: [],

      // Setters
      setQuotes: (quotes) => set({ quotes }),
      setSelectedQuote: (quote) => set({ selectedQuote: quote }),
      setRevisionHistory: (history) => set({ revisionHistory: history }),
      setStats: (stats) => set({ stats }),
      setLoading: (loading) => set({ loading }),
      setQuotesLoading: (loading) => set({ quotesLoading: loading }),
      setQuoteLoading: (loading) => set({ quoteLoading: loading }),
      setRevisionLoading: (loading) => set({ revisionLoading: loading }),
      setStatsLoading: (loading) => set({ statsLoading: loading }),
      setError: (error) => set({ error }),
      setPagination: (pagination) => set(pagination),
      setFilters: (newFilters) => set((state) => ({ 
        filters: { ...state.filters, ...newFilters },
        currentPage: newFilters.page || state.currentPage,
      })),
      clearFilters: () => set({
        filters: {
          page: 1,
          per_page: 10,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
        currentPage: 1,
      }),

      // Selection actions
      selectQuote: (quoteId) => set((state) => ({
        selectedQuoteIds: state.selectedQuoteIds.includes(quoteId)
          ? state.selectedQuoteIds.filter(id => id !== quoteId)
          : [...state.selectedQuoteIds, quoteId]
      })),
      selectAllQuotes: () => set((state) => ({
        selectedQuoteIds: state.quotes.map(quote => quote.id)
      })),
      clearSelection: () => set({ selectedQuoteIds: [] }),

      // API actions
      fetchQuotes: async (params = {}) => {
        const state = get();
        const mergedParams = { ...state.filters, ...params };
        
        set({ quotesLoading: true, error: null });
        try {
          const response = await quoteService.getQuotes(mergedParams);
          set({
            quotes: response.data,
            currentPage: response.meta.current_page,
            totalPages: response.meta.last_page,
            totalCount: response.meta.total,
            perPage: response.meta.per_page,
            quotesLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch quotes',
            quotesLoading: false 
          });
        }
      },

      fetchQuote: async (id: string) => {
        set({ quoteLoading: true, error: null });
        try {
          const quote = await quoteService.getQuote(id);
          set({ selectedQuote: quote, quoteLoading: false });
          return quote;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch quote',
            quoteLoading: false 
          });
          return null;
        }
      },

      createQuote: async (data: CreateQuoteRequest) => {
        set({ loading: true, error: null });
        try {
          const quote = await quoteService.createQuote(data);
          set((state) => ({
            quotes: [quote, ...state.quotes],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return quote;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create quote',
            loading: false 
          });
          return null;
        }
      },

      updateQuote: async (id: string, data: UpdateQuoteRequest) => {
        set({ loading: true, error: null });
        try {
          const updatedQuote = await quoteService.updateQuote(id, data);
          
          // Only update if we got a valid quote back
          if (updatedQuote) {
            set((state) => ({
              quotes: state.quotes.map(quote => quote.id === id ? updatedQuote : quote),
              selectedQuote: state.selectedQuote?.id === id ? updatedQuote : state.selectedQuote,
              loading: false,
            }));
            return updatedQuote;
          } else {
            set({ 
              error: 'Failed to update quote - no data returned',
              loading: false 
            });
            return null;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update quote',
            loading: false 
          });
          return null;
        }
      },

      deleteQuote: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await quoteService.deleteQuote(id);
          set((state) => ({
            quotes: state.quotes.filter(quote => quote.id !== id),
            selectedQuoteIds: state.selectedQuoteIds.filter(quoteId => quoteId !== id),
            selectedQuote: state.selectedQuote?.id === id ? null : state.selectedQuote,
            totalCount: state.totalCount - 1,
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete quote',
            loading: false 
          });
        }
      },

      sendQuote: async (id: string) => {
        try {
          const updatedQuote = await quoteService.sendQuote(id);
          set((state) => ({
            quotes: state.quotes.map(quote => quote.id === id ? updatedQuote : quote),
            selectedQuote: state.selectedQuote?.id === id ? updatedQuote : state.selectedQuote,
          }));
          return updatedQuote;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to send quote' });
          return null;
        }
      },

      respondToQuote: async (id: string, response: QuoteResponse) => {
        try {
          const updatedQuote = await quoteService.respondToQuote(id, response);
          set((state) => ({
            quotes: state.quotes.map(quote => quote.id === id ? updatedQuote : quote),
            selectedQuote: state.selectedQuote?.id === id ? updatedQuote : state.selectedQuote,
          }));
          return updatedQuote;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to respond to quote' });
          return null;
        }
      },

      createRevision: async (id: string, data: UpdateQuoteRequest) => {
        set({ loading: true, error: null });
        try {
          const newRevision = await quoteService.createRevision(id, data);
          set((state) => ({
            quotes: [newRevision, ...state.quotes],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return newRevision;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create revision',
            loading: false 
          });
          return null;
        }
      },

      approveQuote: async (id: string, notes?: string) => {
        try {
          const updatedQuote = await quoteService.approveQuote(id, notes);
          set((state) => ({
            quotes: state.quotes.map(quote => quote.id === id ? updatedQuote : quote),
            selectedQuote: state.selectedQuote?.id === id ? updatedQuote : state.selectedQuote,
          }));
          return updatedQuote;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to approve quote' });
          return null;
        }
      },

      convertToOrder: async (id: string, orderData?: Record<string, any>) => {
        try {
          const result = await quoteService.convertToOrder(id, orderData);
          set((state) => ({
            quotes: state.quotes.map(quote => quote.id === id ? result.quote : quote),
            selectedQuote: state.selectedQuote?.id === id ? result.quote : state.selectedQuote,
          }));
          return result;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to convert quote to order' });
          return null;
        }
      },

      fetchRevisionHistory: async (id: string) => {
        set({ revisionLoading: true, error: null });
        try {
          const history = await quoteService.getRevisionHistory(id);
          set({ revisionHistory: history, revisionLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch revision history',
            revisionLoading: false 
          });
        }
      },

      fetchQuoteStats: async (params) => {
        set({ statsLoading: true, error: null });
        try {
          const stats = await quoteService.getQuoteStats(params);
          set({ stats, statsLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch quote stats',
            statsLoading: false 
          });
        }
      },

      bulkUpdateQuotes: async (ids: string[], data: { status?: Quote['status']; notes?: string }) => {
        set({ loading: true, error: null });
        try {
          const updatedQuotes = await quoteService.bulkUpdate(ids, data);
          set((state) => {
            const quotesMap = new Map(updatedQuotes.map(q => [q.id, q]));
            return {
              quotes: state.quotes.map(quote => quotesMap.get(quote.id) || quote),
              selectedQuoteIds: [],
              loading: false,
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update quotes',
            loading: false 
          });
        }
      },

      // New actions for quote management workflow
      checkExistingQuote: async (orderId: string, vendorId?: string) => {
        set({ checkingDuplicate: true, error: null });
        try {
          const result = await quoteService.checkExisting({
            order_id: orderId,
            vendor_id: vendorId,
            status: ['draft', 'open', 'sent', 'countered'],
          });
          
          set({
            activeQuoteForOrder: result.quote,
            checkingDuplicate: false,
          });
          
          return {
            hasActiveQuote: result.has_active_quote,
            quote: result.quote,
          };
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to check existing quote',
            checkingDuplicate: false,
            activeQuoteForOrder: null,
          });
          return {
            hasActiveQuote: false,
            quote: null,
          };
        }
      },

      acceptQuote: async (id: string, notes?: string) => {
        set({ loading: true, error: null });
        
        // Optimistic update
        const state = get();
        const originalQuote = state.quotes.find(q => q.id === id);
        if (originalQuote) {
          get().optimisticallyUpdateQuote({
            id,
            status: 'accepted',
          });
        }
        
        try {
          const acceptedQuote = await quoteService.acceptQuote(id, notes);
          
          set((state) => ({
            quotes: state.quotes.map(quote => quote.id === id ? acceptedQuote : quote),
            selectedQuote: state.selectedQuote?.id === id ? acceptedQuote : state.selectedQuote,
            loading: false,
          }));
          
          return acceptedQuote;
        } catch (error) {
          // Revert optimistic update on error
          if (originalQuote) {
            get().optimisticallyUpdateQuote(originalQuote);
          }
          
          set({ 
            error: error instanceof Error ? error.message : 'Failed to accept quote',
            loading: false 
          });
          return null;
        }
      },

      rejectQuote: async (id: string, reason: string) => {
        set({ loading: true, error: null });
        
        // Optimistic update
        const state = get();
        const originalQuote = state.quotes.find(q => q.id === id);
        if (originalQuote) {
          get().optimisticallyUpdateQuote({
            id,
            status: 'rejected',
          });
        }
        
        try {
          const rejectedQuote = await quoteService.rejectQuote(id, reason);
          
          set((state) => ({
            quotes: state.quotes.map(quote => quote.id === id ? rejectedQuote : quote),
            selectedQuote: state.selectedQuote?.id === id ? rejectedQuote : state.selectedQuote,
            loading: false,
          }));
          
          return rejectedQuote;
        } catch (error) {
          // Revert optimistic update on error
          if (originalQuote) {
            get().optimisticallyUpdateQuote(originalQuote);
          }
          
          set({ 
            error: error instanceof Error ? error.message : 'Failed to reject quote',
            loading: false 
          });
          return null;
        }
      },

      counterQuote: async (id: string, price: number, notes?: string) => {
        set({ loading: true, error: null });
        
        // Optimistic update
        const state = get();
        const originalQuote = state.quotes.find(q => q.id === id);
        if (originalQuote) {
          get().optimisticallyUpdateQuote({
            id,
            status: 'countered',
            grand_total: price,
          });
        }
        
        try {
          const counteredQuote = await quoteService.counterQuote(id, price, notes);
          
          set((state) => ({
            quotes: state.quotes.map(quote => quote.id === id ? counteredQuote : quote),
            selectedQuote: state.selectedQuote?.id === id ? counteredQuote : state.selectedQuote,
            loading: false,
          }));
          
          return counteredQuote;
        } catch (error) {
          // Revert optimistic update on error
          if (originalQuote) {
            get().optimisticallyUpdateQuote(originalQuote);
          }
          
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create counter offer',
            loading: false 
          });
          return null;
        }
      },

      // Optimistic updates
      optimisticallyUpdateQuote: (updatedQuote) => {
        set((state) => ({
          quotes: state.quotes.map(quote => 
            quote.id === updatedQuote.id ? { ...quote, ...updatedQuote } : quote
          ),
          selectedQuote: state.selectedQuote?.id === updatedQuote.id 
            ? { ...state.selectedQuote, ...updatedQuote } 
            : state.selectedQuote,
        }));
      },

      optimisticallyRemoveQuote: (id: string) => {
        set((state) => ({
          quotes: state.quotes.filter(quote => quote.id !== id),
          selectedQuoteIds: state.selectedQuoteIds.filter(quoteId => quoteId !== id),
          selectedQuote: state.selectedQuote?.id === id ? null : state.selectedQuote,
        }));
      },
    }),
    {
      name: 'quote-storage',
      partialize: (state) => ({
        filters: state.filters,
        selectedQuoteIds: state.selectedQuoteIds,
      }),
    }
  )
);