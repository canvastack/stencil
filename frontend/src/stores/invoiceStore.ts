import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Invoice, 
  InvoiceListParams, 
  CreateInvoiceRequest, 
  UpdateInvoiceRequest, 
  RecordPaymentRequest,
  InvoiceStats
} from '@/services/tenant/invoiceService';
import { invoiceService } from '@/services/tenant/invoiceService';

interface InvoiceState {
  // Data
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  stats: InvoiceStats | null;
  overdueInvoices: Invoice[];

  // UI State
  loading: boolean;
  invoicesLoading: boolean;
  invoiceLoading: boolean;
  overdueLoading: boolean;
  statsLoading: boolean;
  paymentLoading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;

  // Filters
  filters: InvoiceListParams;

  // Selection
  selectedInvoiceIds: string[];

  // Actions
  setInvoices: (invoices: Invoice[]) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setStats: (stats: InvoiceStats | null) => void;
  setOverdueInvoices: (invoices: Invoice[]) => void;
  setLoading: (loading: boolean) => void;
  setInvoicesLoading: (loading: boolean) => void;
  setInvoiceLoading: (loading: boolean) => void;
  setOverdueLoading: (loading: boolean) => void;
  setStatsLoading: (loading: boolean) => void;
  setPaymentLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: { 
    currentPage: number; 
    totalPages: number; 
    totalCount: number; 
    perPage: number; 
  }) => void;
  setFilters: (filters: Partial<InvoiceListParams>) => void;
  clearFilters: () => void;
  
  // Selection actions
  selectInvoice: (invoiceId: string) => void;
  selectAllInvoices: () => void;
  clearSelection: () => void;
  
  // API actions
  fetchInvoices: (params?: InvoiceListParams) => Promise<void>;
  fetchInvoice: (id: string) => Promise<Invoice | null>;
  createInvoice: (data: CreateInvoiceRequest) => Promise<Invoice | null>;
  updateInvoice: (id: string, data: UpdateInvoiceRequest) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<void>;
  sendInvoice: (id: string, customMessage?: string) => Promise<Invoice | null>;
  markAsSent: (id: string) => Promise<Invoice | null>;
  recordPayment: (id: string, data: RecordPaymentRequest) => Promise<Invoice | null>;
  markAsPaid: (id: string, paymentData?: RecordPaymentRequest) => Promise<Invoice | null>;
  cancelInvoice: (id: string, reason?: string) => Promise<Invoice | null>;
  createCreditNote: (id: string, data: { amount?: number; reason: string; items?: Array<{ item_id: string; quantity: number; }> }) => Promise<Invoice | null>;
  duplicateInvoice: (id: string, data?: { invoice_date?: string; due_date?: string; title?: string }) => Promise<Invoice | null>;
  sendReminder: (id: string, reminderType: 'gentle' | 'firm' | 'final', customMessage?: string) => Promise<void>;
  fetchInvoiceStats: (params?: { date_from?: string; date_to?: string; customer_id?: string }) => Promise<void>;
  fetchOverdueInvoices: (params?: { days_overdue?: number; customer_id?: string; page?: number; per_page?: number }) => Promise<void>;
  bulkUpdateInvoices: (ids: string[], data: { status?: Invoice['status']; due_date?: string; notes?: string }) => Promise<void>;
  bulkSendInvoices: (ids: string[], customMessage?: string) => Promise<void>;

  // Invoice-specific actions
  createFromQuote: (quoteId: string, data?: { due_date?: string; terms_and_conditions?: string; notes?: string }) => Promise<Invoice | null>;
  createFromOrder: (orderId: string, data?: { due_date?: string; terms_and_conditions?: string; notes?: string; partial_amount?: number }) => Promise<Invoice | null>;
  previewCalculations: (data: { items: Array<{ quantity: number; unit_price: number; }>; tax_rate?: number; discount_rate?: number }) => Promise<{ subtotal: number; tax_amount: number; discount_amount: number; total_amount: number } | null>;

  // Optimistic updates
  optimisticallyUpdateInvoice: (updatedInvoice: Partial<Invoice> & { id: string }) => void;
  optimisticallyRemoveInvoice: (id: string) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      // Initial state
      invoices: [],
      selectedInvoice: null,
      stats: null,
      overdueInvoices: [],
      
      loading: false,
      invoicesLoading: false,
      invoiceLoading: false,
      overdueLoading: false,
      statsLoading: false,
      paymentLoading: false,
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
      
      selectedInvoiceIds: [],

      // Setters
      setInvoices: (invoices) => set({ invoices }),
      setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),
      setStats: (stats) => set({ stats }),
      setOverdueInvoices: (invoices) => set({ overdueInvoices: invoices }),
      setLoading: (loading) => set({ loading }),
      setInvoicesLoading: (loading) => set({ invoicesLoading: loading }),
      setInvoiceLoading: (loading) => set({ invoiceLoading: loading }),
      setOverdueLoading: (loading) => set({ overdueLoading: loading }),
      setStatsLoading: (loading) => set({ statsLoading: loading }),
      setPaymentLoading: (loading) => set({ paymentLoading: loading }),
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
      selectInvoice: (invoiceId) => set((state) => ({
        selectedInvoiceIds: state.selectedInvoiceIds.includes(invoiceId)
          ? state.selectedInvoiceIds.filter(id => id !== invoiceId)
          : [...state.selectedInvoiceIds, invoiceId]
      })),
      selectAllInvoices: () => set((state) => ({
        selectedInvoiceIds: state.invoices.map(invoice => invoice.id)
      })),
      clearSelection: () => set({ selectedInvoiceIds: [] }),

      // API actions
      fetchInvoices: async (params = {}) => {
        const state = get();
        const mergedParams = { ...state.filters, ...params };
        
        set({ invoicesLoading: true, error: null });
        try {
          const response = await invoiceService.getInvoices(mergedParams);
          set({
            invoices: response.data,
            currentPage: response.meta.current_page,
            totalPages: response.meta.last_page,
            totalCount: response.meta.total,
            perPage: response.meta.per_page,
            invoicesLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch invoices',
            invoicesLoading: false 
          });
        }
      },

      fetchInvoice: async (id: string) => {
        set({ invoiceLoading: true, error: null });
        try {
          const invoice = await invoiceService.getInvoice(id);
          set({ selectedInvoice: invoice, invoiceLoading: false });
          return invoice;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch invoice',
            invoiceLoading: false 
          });
          return null;
        }
      },

      createInvoice: async (data: CreateInvoiceRequest) => {
        set({ loading: true, error: null });
        try {
          const invoice = await invoiceService.createInvoice(data);
          set((state) => ({
            invoices: [invoice, ...state.invoices],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return invoice;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create invoice',
            loading: false 
          });
          return null;
        }
      },

      updateInvoice: async (id: string, data: UpdateInvoiceRequest) => {
        set({ loading: true, error: null });
        try {
          const updatedInvoice = await invoiceService.updateInvoice(id, data);
          set((state) => ({
            invoices: state.invoices.map(invoice => invoice.id === id ? updatedInvoice : invoice),
            selectedInvoice: state.selectedInvoice?.id === id ? updatedInvoice : state.selectedInvoice,
            loading: false,
          }));
          return updatedInvoice;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update invoice',
            loading: false 
          });
          return null;
        }
      },

      deleteInvoice: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await invoiceService.deleteInvoice(id);
          set((state) => ({
            invoices: state.invoices.filter(invoice => invoice.id !== id),
            selectedInvoiceIds: state.selectedInvoiceIds.filter(invoiceId => invoiceId !== id),
            selectedInvoice: state.selectedInvoice?.id === id ? null : state.selectedInvoice,
            totalCount: state.totalCount - 1,
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete invoice',
            loading: false 
          });
        }
      },

      sendInvoice: async (id: string, customMessage?: string) => {
        try {
          const updatedInvoice = await invoiceService.sendInvoice(id, customMessage);
          set((state) => ({
            invoices: state.invoices.map(invoice => invoice.id === id ? updatedInvoice : invoice),
            selectedInvoice: state.selectedInvoice?.id === id ? updatedInvoice : state.selectedInvoice,
          }));
          return updatedInvoice;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to send invoice' });
          return null;
        }
      },

      markAsSent: async (id: string) => {
        try {
          const updatedInvoice = await invoiceService.markAsSent(id);
          set((state) => ({
            invoices: state.invoices.map(invoice => invoice.id === id ? updatedInvoice : invoice),
            selectedInvoice: state.selectedInvoice?.id === id ? updatedInvoice : state.selectedInvoice,
          }));
          return updatedInvoice;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to mark invoice as sent' });
          return null;
        }
      },

      recordPayment: async (id: string, data: RecordPaymentRequest) => {
        set({ paymentLoading: true, error: null });
        try {
          const updatedInvoice = await invoiceService.recordPayment(id, data);
          set((state) => ({
            invoices: state.invoices.map(invoice => invoice.id === id ? updatedInvoice : invoice),
            selectedInvoice: state.selectedInvoice?.id === id ? updatedInvoice : state.selectedInvoice,
            paymentLoading: false,
          }));
          return updatedInvoice;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to record payment',
            paymentLoading: false 
          });
          return null;
        }
      },

      markAsPaid: async (id: string, paymentData?: RecordPaymentRequest) => {
        set({ paymentLoading: true, error: null });
        try {
          const updatedInvoice = await invoiceService.markAsPaid(id, paymentData);
          set((state) => ({
            invoices: state.invoices.map(invoice => invoice.id === id ? updatedInvoice : invoice),
            selectedInvoice: state.selectedInvoice?.id === id ? updatedInvoice : state.selectedInvoice,
            paymentLoading: false,
          }));
          return updatedInvoice;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to mark invoice as paid',
            paymentLoading: false 
          });
          return null;
        }
      },

      cancelInvoice: async (id: string, reason?: string) => {
        try {
          const updatedInvoice = await invoiceService.cancelInvoice(id, reason);
          set((state) => ({
            invoices: state.invoices.map(invoice => invoice.id === id ? updatedInvoice : invoice),
            selectedInvoice: state.selectedInvoice?.id === id ? updatedInvoice : state.selectedInvoice,
          }));
          return updatedInvoice;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to cancel invoice' });
          return null;
        }
      },

      createCreditNote: async (id: string, data: { amount?: number; reason: string; items?: Array<{ item_id: string; quantity: number; }> }) => {
        set({ loading: true, error: null });
        try {
          const creditNote = await invoiceService.createCreditNote(id, data);
          set((state) => ({
            invoices: [creditNote, ...state.invoices],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return creditNote;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create credit note',
            loading: false 
          });
          return null;
        }
      },

      duplicateInvoice: async (id: string, data?: { invoice_date?: string; due_date?: string; title?: string }) => {
        set({ loading: true, error: null });
        try {
          const duplicatedInvoice = await invoiceService.duplicateInvoice(id, data);
          set((state) => ({
            invoices: [duplicatedInvoice, ...state.invoices],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return duplicatedInvoice;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to duplicate invoice',
            loading: false 
          });
          return null;
        }
      },

      sendReminder: async (id: string, reminderType: 'gentle' | 'firm' | 'final', customMessage?: string) => {
        try {
          await invoiceService.sendReminder(id, reminderType, customMessage);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to send reminder' });
        }
      },

      fetchInvoiceStats: async (params) => {
        set({ statsLoading: true, error: null });
        try {
          const stats = await invoiceService.getInvoiceStats(params);
          set({ stats, statsLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch invoice stats',
            statsLoading: false 
          });
        }
      },

      fetchOverdueInvoices: async (params) => {
        set({ overdueLoading: true, error: null });
        try {
          const response = await invoiceService.getOverdueInvoices(params);
          set({ overdueInvoices: response.data, overdueLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch overdue invoices',
            overdueLoading: false 
          });
        }
      },

      bulkUpdateInvoices: async (ids: string[], data: { status?: Invoice['status']; due_date?: string; notes?: string }) => {
        set({ loading: true, error: null });
        try {
          const updatedInvoices = await invoiceService.bulkUpdate(ids, data);
          set((state) => {
            const invoicesMap = new Map(updatedInvoices.map(i => [i.id, i]));
            return {
              invoices: state.invoices.map(invoice => invoicesMap.get(invoice.id) || invoice),
              selectedInvoiceIds: [],
              loading: false,
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update invoices',
            loading: false 
          });
        }
      },

      bulkSendInvoices: async (ids: string[], customMessage?: string) => {
        set({ loading: true, error: null });
        try {
          const result = await invoiceService.bulkSend(ids, customMessage);
          set((state) => {
            const sentInvoicesMap = new Map(result.sent.map(i => [i.id, i]));
            return {
              invoices: state.invoices.map(invoice => sentInvoicesMap.get(invoice.id) || invoice),
              selectedInvoiceIds: [],
              loading: false,
            };
          });
          
          // Show errors for failed sends if any
          if (result.failed.length > 0) {
            const errorMessage = `Failed to send ${result.failed.length} invoice(s): ${result.failed.map(f => f.error).join(', ')}`;
            set({ error: errorMessage });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to send invoices',
            loading: false 
          });
        }
      },

      createFromQuote: async (quoteId: string, data?: { due_date?: string; terms_and_conditions?: string; notes?: string }) => {
        set({ loading: true, error: null });
        try {
          const invoice = await invoiceService.createFromQuote(quoteId, data);
          set((state) => ({
            invoices: [invoice, ...state.invoices],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return invoice;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create invoice from quote',
            loading: false 
          });
          return null;
        }
      },

      createFromOrder: async (orderId: string, data?: { due_date?: string; terms_and_conditions?: string; notes?: string; partial_amount?: number }) => {
        set({ loading: true, error: null });
        try {
          const invoice = await invoiceService.createFromOrder(orderId, data);
          set((state) => ({
            invoices: [invoice, ...state.invoices],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return invoice;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create invoice from order',
            loading: false 
          });
          return null;
        }
      },

      previewCalculations: async (data: { items: Array<{ quantity: number; unit_price: number; }>; tax_rate?: number; discount_rate?: number }) => {
        try {
          const calculations = await invoiceService.previewCalculations(data);
          return calculations;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to preview calculations' });
          return null;
        }
      },

      // Optimistic updates
      optimisticallyUpdateInvoice: (updatedInvoice) => {
        set((state) => ({
          invoices: state.invoices.map(invoice => 
            invoice.id === updatedInvoice.id ? { ...invoice, ...updatedInvoice } : invoice
          ),
          selectedInvoice: state.selectedInvoice?.id === updatedInvoice.id 
            ? { ...state.selectedInvoice, ...updatedInvoice } 
            : state.selectedInvoice,
        }));
      },

      optimisticallyRemoveInvoice: (id: string) => {
        set((state) => ({
          invoices: state.invoices.filter(invoice => invoice.id !== id),
          selectedInvoiceIds: state.selectedInvoiceIds.filter(invoiceId => invoiceId !== id),
          selectedInvoice: state.selectedInvoice?.id === id ? null : state.selectedInvoice,
        }));
      },
    }),
    {
      name: 'invoice-storage',
      partialize: (state) => ({
        filters: state.filters,
        selectedInvoiceIds: state.selectedInvoiceIds,
      }),
    }
  )
);