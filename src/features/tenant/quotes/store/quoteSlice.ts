import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { quoteService, Quote, QuoteListParams, CreateQuoteRequest, UpdateQuoteRequest, QuoteResponse } from '@/services/tenant/quoteService';

// Async thunks
export const fetchQuotes = createAsyncThunk(
  'quotes/fetchQuotes',
  async (params: QuoteListParams = {}) => {
    return await quoteService.getQuotes(params);
  }
);

export const fetchQuote = createAsyncThunk(
  'quotes/fetchQuote',
  async (id: string) => {
    return await quoteService.getQuote(id);
  }
);

export const createQuote = createAsyncThunk(
  'quotes/createQuote',
  async (data: CreateQuoteRequest) => {
    return await quoteService.createQuote(data);
  }
);

export const updateQuote = createAsyncThunk(
  'quotes/updateQuote',
  async ({ id, data }: { id: string; data: UpdateQuoteRequest }) => {
    return await quoteService.updateQuote(id, data);
  }
);

export const deleteQuote = createAsyncThunk(
  'quotes/deleteQuote',
  async (id: string) => {
    await quoteService.deleteQuote(id);
    return id;
  }
);

export const sendQuote = createAsyncThunk(
  'quotes/sendQuote',
  async (id: string) => {
    return await quoteService.sendQuote(id);
  }
);

export const respondToQuote = createAsyncThunk(
  'quotes/respondToQuote',
  async ({ id, response }: { id: string; response: QuoteResponse }) => {
    return await quoteService.respondToQuote(id, response);
  }
);

export const createRevision = createAsyncThunk(
  'quotes/createRevision',
  async ({ id, data }: { id: string; data: UpdateQuoteRequest }) => {
    return await quoteService.createRevision(id, data);
  }
);

export const approveQuote = createAsyncThunk(
  'quotes/approveQuote',
  async ({ id, notes }: { id: string; notes?: string }) => {
    return await quoteService.approveQuote(id, notes);
  }
);

export const convertToOrder = createAsyncThunk(
  'quotes/convertToOrder',
  async ({ id, orderData }: { id: string; orderData?: Record<string, any> }) => {
    return await quoteService.convertToOrder(id, orderData);
  }
);

export const fetchRevisionHistory = createAsyncThunk(
  'quotes/fetchRevisionHistory',
  async (id: string) => {
    return await quoteService.getRevisionHistory(id);
  }
);

export const fetchQuoteStats = createAsyncThunk(
  'quotes/fetchQuoteStats',
  async (params?: { 
    date_from?: string; 
    date_to?: string;
    vendor_id?: string;
    customer_id?: string;
  }) => {
    return await quoteService.getQuoteStats(params);
  }
);

export const bulkUpdateQuotes = createAsyncThunk(
  'quotes/bulkUpdate',
  async ({ ids, data }: { ids: string[]; data: { status?: Quote['status']; notes?: string } }) => {
    return await quoteService.bulkUpdate(ids, data);
  }
);

// Initial state
interface QuoteState {
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
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  
  // Filters
  filters: QuoteListParams;
  
  // Selected quotes for bulk operations
  selectedQuoteIds: string[];
}

const initialState: QuoteState = {
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
};

const quoteSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    // Filter and sorting actions
    setFilters: (state, action: PayloadAction<Partial<QuoteListParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = action.payload.page || 1;
    },
    
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        per_page: 10,
        sort_by: 'created_at',
        sort_order: 'desc',
      };
      state.currentPage = 1;
    },
    
    // Selection actions
    selectQuote: (state, action: PayloadAction<string>) => {
      if (state.selectedQuoteIds.includes(action.payload)) {
        state.selectedQuoteIds = state.selectedQuoteIds.filter(id => id !== action.payload);
      } else {
        state.selectedQuoteIds.push(action.payload);
      }
    },
    
    selectAllQuotes: (state) => {
      state.selectedQuoteIds = state.quotes.map(quote => quote.id);
    },
    
    clearSelection: (state) => {
      state.selectedQuoteIds = [];
    },
    
    // UI actions
    clearError: (state) => {
      state.error = null;
    },
    
    clearSelectedQuote: (state) => {
      state.selectedQuote = null;
    },
    
    // Optimistic updates
    optimisticallyUpdateQuote: (state, action: PayloadAction<Partial<Quote> & { id: string }>) => {
      const index = state.quotes.findIndex(quote => quote.id === action.payload.id);
      if (index !== -1) {
        state.quotes[index] = { ...state.quotes[index], ...action.payload };
      }
      
      if (state.selectedQuote?.id === action.payload.id) {
        state.selectedQuote = { ...state.selectedQuote, ...action.payload };
      }
    },
    
    optimisticallyRemoveQuote: (state, action: PayloadAction<string>) => {
      state.quotes = state.quotes.filter(quote => quote.id !== action.payload);
      state.selectedQuoteIds = state.selectedQuoteIds.filter(id => id !== action.payload);
      
      if (state.selectedQuote?.id === action.payload) {
        state.selectedQuote = null;
      }
    },
  },
  
  extraReducers: (builder) => {
    // Fetch quotes
    builder
      .addCase(fetchQuotes.pending, (state) => {
        state.quotesLoading = true;
        state.error = null;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.quotesLoading = false;
        state.quotes = action.payload.data;
        state.currentPage = action.payload.meta.current_page;
        state.totalPages = action.payload.meta.last_page;
        state.totalCount = action.payload.meta.total;
        state.perPage = action.payload.meta.per_page;
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.quotesLoading = false;
        state.error = action.error.message || 'Failed to fetch quotes';
      });
    
    // Fetch single quote
    builder
      .addCase(fetchQuote.pending, (state) => {
        state.quoteLoading = true;
        state.error = null;
      })
      .addCase(fetchQuote.fulfilled, (state, action) => {
        state.quoteLoading = false;
        state.selectedQuote = action.payload;
      })
      .addCase(fetchQuote.rejected, (state, action) => {
        state.quoteLoading = false;
        state.error = action.error.message || 'Failed to fetch quote';
      });
    
    // Create quote
    builder
      .addCase(createQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create quote';
      });
    
    // Update quote
    builder
      .addCase(updateQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.quotes.findIndex(quote => quote.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.selectedQuote?.id === action.payload.id) {
          state.selectedQuote = action.payload;
        }
      })
      .addCase(updateQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update quote';
      });
    
    // Delete quote
    builder
      .addCase(deleteQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = state.quotes.filter(quote => quote.id !== action.payload);
        state.selectedQuoteIds = state.selectedQuoteIds.filter(id => id !== action.payload);
        state.totalCount -= 1;
        
        if (state.selectedQuote?.id === action.payload) {
          state.selectedQuote = null;
        }
      })
      .addCase(deleteQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete quote';
      });
    
    // Send quote
    builder
      .addCase(sendQuote.fulfilled, (state, action) => {
        const index = state.quotes.findIndex(quote => quote.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.selectedQuote?.id === action.payload.id) {
          state.selectedQuote = action.payload;
        }
      });
    
    // Respond to quote
    builder
      .addCase(respondToQuote.fulfilled, (state, action) => {
        const index = state.quotes.findIndex(quote => quote.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.selectedQuote?.id === action.payload.id) {
          state.selectedQuote = action.payload;
        }
      });
    
    // Create revision
    builder
      .addCase(createRevision.fulfilled, (state, action) => {
        state.quotes.unshift(action.payload);
        state.totalCount += 1;
      });
    
    // Approve quote
    builder
      .addCase(approveQuote.fulfilled, (state, action) => {
        const index = state.quotes.findIndex(quote => quote.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.selectedQuote?.id === action.payload.id) {
          state.selectedQuote = action.payload;
        }
      });
    
    // Fetch revision history
    builder
      .addCase(fetchRevisionHistory.pending, (state) => {
        state.revisionLoading = true;
      })
      .addCase(fetchRevisionHistory.fulfilled, (state, action) => {
        state.revisionLoading = false;
        state.revisionHistory = action.payload;
      })
      .addCase(fetchRevisionHistory.rejected, (state, action) => {
        state.revisionLoading = false;
        state.error = action.error.message || 'Failed to fetch revision history';
      });
    
    // Fetch stats
    builder
      .addCase(fetchQuoteStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchQuoteStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchQuoteStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.error.message || 'Failed to fetch quote stats';
      });
    
    // Bulk update
    builder
      .addCase(bulkUpdateQuotes.fulfilled, (state, action) => {
        action.payload.forEach(updatedQuote => {
          const index = state.quotes.findIndex(quote => quote.id === updatedQuote.id);
          if (index !== -1) {
            state.quotes[index] = updatedQuote;
          }
        });
        state.selectedQuoteIds = [];
      });
  },
});

export const {
  setFilters,
  clearFilters,
  selectQuote,
  selectAllQuotes,
  clearSelection,
  clearError,
  clearSelectedQuote,
  optimisticallyUpdateQuote,
  optimisticallyRemoveQuote,
} = quoteSlice.actions;

export default quoteSlice.reducer;

// Selectors
export const selectQuotes = (state: { quotes: QuoteState }) => state.quotes.quotes;
export const selectSelectedQuote = (state: { quotes: QuoteState }) => state.quotes.selectedQuote;
export const selectQuotesLoading = (state: { quotes: QuoteState }) => state.quotes.quotesLoading;
export const selectQuoteLoading = (state: { quotes: QuoteState }) => state.quotes.quoteLoading;
export const selectQuotesError = (state: { quotes: QuoteState }) => state.quotes.error;
export const selectQuoteFilters = (state: { quotes: QuoteState }) => state.quotes.filters;
export const selectQuotePagination = (state: { quotes: QuoteState }) => ({
  currentPage: state.quotes.currentPage,
  totalPages: state.quotes.totalPages,
  totalCount: state.quotes.totalCount,
  perPage: state.quotes.perPage,
});
export const selectSelectedQuoteIds = (state: { quotes: QuoteState }) => state.quotes.selectedQuoteIds;
export const selectQuoteStats = (state: { quotes: QuoteState }) => state.quotes.stats;
export const selectRevisionHistory = (state: { quotes: QuoteState }) => state.quotes.revisionHistory;