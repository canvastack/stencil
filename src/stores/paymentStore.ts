import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Payment, 
  PaymentRefund,
  PaymentListParams, 
  CreatePaymentRequest, 
  UpdatePaymentRequest,
  ProcessPaymentRequest,
  VerifyPaymentRequest,
  RefundPaymentRequest,
  PaymentStats,
  PaymentGateway
} from '@/services/tenant/paymentService';
import { paymentService } from '@/services/tenant/paymentService';

interface PaymentState {
  // Data
  payments: Payment[];
  selectedPayment: Payment | null;
  stats: PaymentStats | null;
  verificationQueue: Payment[];
  paymentGateways: PaymentGateway[];
  paymentRefunds: PaymentRefund[];

  // UI State
  loading: boolean;
  paymentsLoading: boolean;
  paymentLoading: boolean;
  verificationLoading: boolean;
  statsLoading: boolean;
  gatewaysLoading: boolean;
  processLoading: boolean;
  refundLoading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;

  // Filters
  filters: PaymentListParams;

  // Selection
  selectedPaymentIds: string[];

  // Actions
  setPayments: (payments: Payment[]) => void;
  setSelectedPayment: (payment: Payment | null) => void;
  setStats: (stats: PaymentStats | null) => void;
  setVerificationQueue: (payments: Payment[]) => void;
  setPaymentGateways: (gateways: PaymentGateway[]) => void;
  setPaymentRefunds: (refunds: PaymentRefund[]) => void;
  setLoading: (loading: boolean) => void;
  setPaymentsLoading: (loading: boolean) => void;
  setPaymentLoading: (loading: boolean) => void;
  setVerificationLoading: (loading: boolean) => void;
  setStatsLoading: (loading: boolean) => void;
  setGatewaysLoading: (loading: boolean) => void;
  setProcessLoading: (loading: boolean) => void;
  setRefundLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: { 
    currentPage: number; 
    totalPages: number; 
    totalCount: number; 
    perPage: number; 
  }) => void;
  setFilters: (filters: Partial<PaymentListParams>) => void;
  clearFilters: () => void;
  
  // Selection actions
  selectPayment: (paymentId: string) => void;
  selectAllPayments: () => void;
  clearSelection: () => void;
  
  // API actions
  fetchPayments: (params?: PaymentListParams) => Promise<void>;
  fetchPayment: (id: string) => Promise<Payment | null>;
  createPayment: (data: CreatePaymentRequest) => Promise<Payment | null>;
  updatePayment: (id: string, data: UpdatePaymentRequest) => Promise<Payment | null>;
  deletePayment: (id: string) => Promise<void>;
  processPayment: (id: string, data: ProcessPaymentRequest) => Promise<Payment | null>;
  verifyPayment: (id: string, data: VerifyPaymentRequest) => Promise<Payment | null>;
  failPayment: (id: string, data: { reason: string; notes?: string }) => Promise<Payment | null>;
  cancelPayment: (id: string, reason?: string) => Promise<Payment | null>;
  refundPayment: (id: string, data: RefundPaymentRequest) => Promise<Payment | null>;
  fetchPaymentRefunds: (id: string) => Promise<void>;
  updateRefund: (paymentId: string, refundId: string, data: { status?: PaymentRefund['status']; notes?: string; gateway_refund_id?: string }) => Promise<PaymentRefund | null>;
  fetchVerificationQueue: (params?: { status?: Payment['verification_status']; risk_level?: 'low' | 'medium' | 'high'; page?: number; per_page?: number }) => Promise<void>;
  bulkVerifyPayments: (ids: string[], data: { verification_status: Payment['verification_status']; verification_notes?: string; auto_process?: boolean }) => Promise<void>;
  bulkProcessPayments: (ids: string[], data: { payment_gateway?: string; auto_verify?: boolean }) => Promise<void>;
  fetchPaymentStats: (params?: { date_from?: string; date_to?: string; customer_id?: string; payment_method?: Payment['payment_method']; payment_gateway?: string }) => Promise<void>;
  fetchPaymentGateways: () => Promise<void>;
  testGatewayConnection: (gatewayId: string) => Promise<{ success: boolean; response_time: number; message: string; details?: Record<string, any> } | null>;
  sendPaymentReceipt: (id: string, data: { email?: string; custom_message?: string; include_proof?: boolean }) => Promise<void>;

  // Payment creation helpers
  createFromInvoice: (invoiceId: string, data: { payment_method: Payment['payment_method']; payment_gateway?: string; amount?: number; notes?: string; auto_verify?: boolean }) => Promise<Payment | null>;
  createFromOrder: (orderId: string, data: { payment_method: Payment['payment_method']; payment_gateway?: string; amount?: number; notes?: string; auto_verify?: boolean }) => Promise<Payment | null>;

  // Analysis and reporting
  getFraudAnalysis: (id: string) => Promise<{ risk_score: number; risk_level: 'low' | 'medium' | 'high'; indicators: any[]; recommendation: 'approve' | 'review' | 'reject'; details: Record<string, any> } | null>;
  getPaymentTimeline: (id: string) => Promise<any[]>;
  scheduleReconciliation: (data: { payment_gateway?: string; date_from: string; date_to: string; auto_process?: boolean; notify_email?: string }) => Promise<{ job_id: string; scheduled_at: string; estimated_completion: string } | null>;

  // Optimistic updates
  optimisticallyUpdatePayment: (updatedPayment: Partial<Payment> & { id: string }) => void;
  optimisticallyRemovePayment: (id: string) => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      // Initial state
      payments: [],
      selectedPayment: null,
      stats: null,
      verificationQueue: [],
      paymentGateways: [],
      paymentRefunds: [],
      
      loading: false,
      paymentsLoading: false,
      paymentLoading: false,
      verificationLoading: false,
      statsLoading: false,
      gatewaysLoading: false,
      processLoading: false,
      refundLoading: false,
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
      
      selectedPaymentIds: [],

      // Setters
      setPayments: (payments) => set({ payments }),
      setSelectedPayment: (payment) => set({ selectedPayment: payment }),
      setStats: (stats) => set({ stats }),
      setVerificationQueue: (payments) => set({ verificationQueue: payments }),
      setPaymentGateways: (gateways) => set({ paymentGateways: gateways }),
      setPaymentRefunds: (refunds) => set({ paymentRefunds: refunds }),
      setLoading: (loading) => set({ loading }),
      setPaymentsLoading: (loading) => set({ paymentsLoading: loading }),
      setPaymentLoading: (loading) => set({ paymentLoading: loading }),
      setVerificationLoading: (loading) => set({ verificationLoading: loading }),
      setStatsLoading: (loading) => set({ statsLoading: loading }),
      setGatewaysLoading: (loading) => set({ gatewaysLoading: loading }),
      setProcessLoading: (loading) => set({ processLoading: loading }),
      setRefundLoading: (loading) => set({ refundLoading: loading }),
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
      selectPayment: (paymentId) => set((state) => ({
        selectedPaymentIds: state.selectedPaymentIds.includes(paymentId)
          ? state.selectedPaymentIds.filter(id => id !== paymentId)
          : [...state.selectedPaymentIds, paymentId]
      })),
      selectAllPayments: () => set((state) => ({
        selectedPaymentIds: state.payments.map(payment => payment.id)
      })),
      clearSelection: () => set({ selectedPaymentIds: [] }),

      // API actions
      fetchPayments: async (params = {}) => {
        const state = get();
        const mergedParams = { ...state.filters, ...params };
        
        set({ paymentsLoading: true, error: null });
        try {
          const response = await paymentService.getPayments(mergedParams);
          set({
            payments: response.data,
            currentPage: response.meta.current_page,
            totalPages: response.meta.last_page,
            totalCount: response.meta.total,
            perPage: response.meta.per_page,
            paymentsLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch payments',
            paymentsLoading: false 
          });
        }
      },

      fetchPayment: async (id: string) => {
        set({ paymentLoading: true, error: null });
        try {
          const payment = await paymentService.getPayment(id);
          set({ selectedPayment: payment, paymentLoading: false });
          return payment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch payment',
            paymentLoading: false 
          });
          return null;
        }
      },

      createPayment: async (data: CreatePaymentRequest) => {
        set({ loading: true, error: null });
        try {
          const payment = await paymentService.createPayment(data);
          set((state) => ({
            payments: [payment, ...state.payments],
            loading: false,
          }));
          return payment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create payment',
            loading: false 
          });
          return null;
        }
      },

      updatePayment: async (id: string, data: UpdatePaymentRequest) => {
        set({ loading: true, error: null });
        try {
          const updatedPayment = await paymentService.updatePayment(id, data);
          set((state) => ({
            payments: state.payments.map(payment => 
              payment.id === id ? updatedPayment : payment
            ),
            selectedPayment: state.selectedPayment?.id === id ? updatedPayment : state.selectedPayment,
            loading: false,
          }));
          return updatedPayment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update payment',
            loading: false 
          });
          return null;
        }
      },

      deletePayment: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await paymentService.deletePayment(id);
          set((state) => ({
            payments: state.payments.filter(payment => payment.id !== id),
            selectedPayment: state.selectedPayment?.id === id ? null : state.selectedPayment,
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete payment',
            loading: false 
          });
        }
      },

      processPayment: async (id: string, data: ProcessPaymentRequest) => {
        set({ processLoading: true, error: null });
        try {
          const processedPayment = await paymentService.processPayment(id, data);
          set((state) => ({
            payments: state.payments.map(payment => 
              payment.id === id ? processedPayment : payment
            ),
            selectedPayment: state.selectedPayment?.id === id ? processedPayment : state.selectedPayment,
            processLoading: false,
          }));
          return processedPayment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to process payment',
            processLoading: false 
          });
          return null;
        }
      },

      verifyPayment: async (id: string, data: VerifyPaymentRequest) => {
        set({ verificationLoading: true, error: null });
        try {
          const verifiedPayment = await paymentService.verifyPayment(id, data);
          set((state) => ({
            payments: state.payments.map(payment => 
              payment.id === id ? verifiedPayment : payment
            ),
            selectedPayment: state.selectedPayment?.id === id ? verifiedPayment : state.selectedPayment,
            verificationQueue: state.verificationQueue.filter(payment => payment.id !== id),
            verificationLoading: false,
          }));
          return verifiedPayment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to verify payment',
            verificationLoading: false 
          });
          return null;
        }
      },

      failPayment: async (id: string, data: { reason: string; notes?: string }) => {
        set({ loading: true, error: null });
        try {
          const failedPayment = await paymentService.failPayment(id, data);
          set((state) => ({
            payments: state.payments.map(payment => 
              payment.id === id ? failedPayment : payment
            ),
            selectedPayment: state.selectedPayment?.id === id ? failedPayment : state.selectedPayment,
            loading: false,
          }));
          return failedPayment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to mark payment as failed',
            loading: false 
          });
          return null;
        }
      },

      cancelPayment: async (id: string, reason?: string) => {
        set({ loading: true, error: null });
        try {
          const cancelledPayment = await paymentService.cancelPayment(id, reason);
          set((state) => ({
            payments: state.payments.map(payment => 
              payment.id === id ? cancelledPayment : payment
            ),
            selectedPayment: state.selectedPayment?.id === id ? cancelledPayment : state.selectedPayment,
            loading: false,
          }));
          return cancelledPayment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to cancel payment',
            loading: false 
          });
          return null;
        }
      },

      refundPayment: async (id: string, data: RefundPaymentRequest) => {
        set({ refundLoading: true, error: null });
        try {
          const refundedPayment = await paymentService.refundPayment(id, data);
          set((state) => ({
            payments: state.payments.map(payment => 
              payment.id === id ? refundedPayment : payment
            ),
            selectedPayment: state.selectedPayment?.id === id ? refundedPayment : state.selectedPayment,
            refundLoading: false,
          }));
          return refundedPayment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refund payment',
            refundLoading: false 
          });
          return null;
        }
      },

      fetchPaymentRefunds: async (id: string) => {
        set({ refundLoading: true, error: null });
        try {
          const refunds = await paymentService.getPaymentRefunds(id);
          set({ paymentRefunds: refunds, refundLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch payment refunds',
            refundLoading: false 
          });
        }
      },

      updateRefund: async (paymentId: string, refundId: string, data: { status?: PaymentRefund['status']; notes?: string; gateway_refund_id?: string }) => {
        set({ refundLoading: true, error: null });
        try {
          const updatedRefund = await paymentService.updateRefund(paymentId, refundId, data);
          set((state) => ({
            paymentRefunds: state.paymentRefunds.map(refund => 
              refund.id === refundId ? updatedRefund : refund
            ),
            refundLoading: false,
          }));
          return updatedRefund;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update refund',
            refundLoading: false 
          });
          return null;
        }
      },

      fetchVerificationQueue: async (params = {}) => {
        set({ verificationLoading: true, error: null });
        try {
          const response = await paymentService.getVerificationQueue(params);
          set({ verificationQueue: response.data, verificationLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch verification queue',
            verificationLoading: false 
          });
        }
      },

      bulkVerifyPayments: async (ids: string[], data: { verification_status: Payment['verification_status']; verification_notes?: string; auto_process?: boolean }) => {
        set({ verificationLoading: true, error: null });
        try {
          const result = await paymentService.bulkVerifyPayments(ids, data);
          // Update payments in the store
          set((state) => ({
            payments: state.payments.map(payment => {
              const updatedPayment = result.success.find(p => p.id === payment.id);
              return updatedPayment || payment;
            }),
            verificationQueue: state.verificationQueue.filter(payment => 
              !result.success.some(p => p.id === payment.id)
            ),
            verificationLoading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to bulk verify payments',
            verificationLoading: false 
          });
        }
      },

      bulkProcessPayments: async (ids: string[], data: { payment_gateway?: string; auto_verify?: boolean }) => {
        set({ processLoading: true, error: null });
        try {
          const result = await paymentService.bulkProcessPayments(ids, data);
          // Update payments in the store
          set((state) => ({
            payments: state.payments.map(payment => {
              const updatedPayment = result.success.find(p => p.id === payment.id);
              return updatedPayment || payment;
            }),
            processLoading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to bulk process payments',
            processLoading: false 
          });
        }
      },

      fetchPaymentStats: async (params = {}) => {
        set({ statsLoading: true, error: null });
        try {
          const stats = await paymentService.getPaymentStats(params);
          set({ stats, statsLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch payment statistics',
            statsLoading: false 
          });
        }
      },

      fetchPaymentGateways: async () => {
        set({ gatewaysLoading: true, error: null });
        try {
          const gateways = await paymentService.getPaymentGateways();
          set({ paymentGateways: gateways, gatewaysLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch payment gateways',
            gatewaysLoading: false 
          });
        }
      },

      testGatewayConnection: async (gatewayId: string) => {
        set({ gatewaysLoading: true, error: null });
        try {
          const result = await paymentService.testGatewayConnection(gatewayId);
          set({ gatewaysLoading: false });
          return result;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to test gateway connection',
            gatewaysLoading: false 
          });
          return null;
        }
      },

      sendPaymentReceipt: async (id: string, data: { email?: string; custom_message?: string; include_proof?: boolean }) => {
        set({ loading: true, error: null });
        try {
          await paymentService.sendPaymentReceipt(id, data);
          set({ loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to send payment receipt',
            loading: false 
          });
        }
      },

      createFromInvoice: async (invoiceId: string, data: { payment_method: Payment['payment_method']; payment_gateway?: string; amount?: number; notes?: string; auto_verify?: boolean }) => {
        set({ loading: true, error: null });
        try {
          const payment = await paymentService.createFromInvoice(invoiceId, data);
          set((state) => ({
            payments: [payment, ...state.payments],
            loading: false,
          }));
          return payment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create payment from invoice',
            loading: false 
          });
          return null;
        }
      },

      createFromOrder: async (orderId: string, data: { payment_method: Payment['payment_method']; payment_gateway?: string; amount?: number; notes?: string; auto_verify?: boolean }) => {
        set({ loading: true, error: null });
        try {
          const payment = await paymentService.createFromOrder(orderId, data);
          set((state) => ({
            payments: [payment, ...state.payments],
            loading: false,
          }));
          return payment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create payment from order',
            loading: false 
          });
          return null;
        }
      },

      getFraudAnalysis: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const analysis = await paymentService.getFraudAnalysis(id);
          set({ loading: false });
          return analysis;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get fraud analysis',
            loading: false 
          });
          return null;
        }
      },

      getPaymentTimeline: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const timeline = await paymentService.getPaymentTimeline(id);
          set({ loading: false });
          return timeline;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get payment timeline',
            loading: false 
          });
          return [];
        }
      },

      scheduleReconciliation: async (data: { payment_gateway?: string; date_from: string; date_to: string; auto_process?: boolean; notify_email?: string }) => {
        set({ loading: true, error: null });
        try {
          const result = await paymentService.scheduleReconciliation(data);
          set({ loading: false });
          return result;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to schedule reconciliation',
            loading: false 
          });
          return null;
        }
      },

      // Optimistic updates
      optimisticallyUpdatePayment: (updatedPayment) => {
        set((state) => ({
          payments: state.payments.map(payment => 
            payment.id === updatedPayment.id 
              ? { ...payment, ...updatedPayment } 
              : payment
          ),
          selectedPayment: state.selectedPayment?.id === updatedPayment.id 
            ? { ...state.selectedPayment, ...updatedPayment } 
            : state.selectedPayment,
        }));
      },

      optimisticallyRemovePayment: (id) => {
        set((state) => ({
          payments: state.payments.filter(payment => payment.id !== id),
          selectedPayment: state.selectedPayment?.id === id ? null : state.selectedPayment,
        }));
      },
    }),
    {
      name: 'payment-store',
      partialize: (state) => ({
        filters: state.filters,
        selectedPaymentIds: state.selectedPaymentIds,
      }),
    }
  )
);