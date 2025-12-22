import { useState, useCallback } from 'react';
import { paymentsService, PaymentFilters, CreatePaymentRequest, UpdatePaymentRequest, Payment, Refund, RefundRequest } from '@/services/api/payments';
import { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

interface UsePaymentsState {
  payments: Payment[];
  refunds: Refund[];
  currentPayment: Payment | null;
  currentRefund: Refund | null;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

export const usePayments = () => {
  const [state, setState] = useState<UsePaymentsState>({
    payments: [],
    refunds: [],
    currentPayment: null,
    currentRefund: null,
    pagination: {
      page: 1,
      per_page: 10,
      total: 0,
      last_page: 1,
    },
    isLoading: false,
    isSaving: false,
    error: null,
  });

  const fetchPayments = useCallback(async (filters?: PaymentFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Payment> = await paymentsService.getPayments(filters);
      setState((prev) => ({
        ...prev,
        payments: response.data,
        pagination: {
          page: response.current_page || 1,
          per_page: response.per_page || 10,
          total: response.total || 0,
          last_page: response.last_page || 1,
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch payments';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchPaymentById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const payment = await paymentsService.getPaymentById(id);
      setState((prev) => ({ ...prev, currentPayment: payment, isLoading: false }));
      return payment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch payment';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const createPayment = useCallback(async (data: CreatePaymentRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const payment = await paymentsService.createPayment(data);
      setState((prev) => ({
        ...prev,
        payments: [payment, ...prev.payments],
        isSaving: false,
      }));
      toast.success('Payment created successfully');
      return payment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create payment';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const updatePayment = useCallback(async (id: string, data: UpdatePaymentRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const payment = await paymentsService.updatePayment(id, data);
      setState((prev) => ({
        ...prev,
        payments: prev.payments.map((p) => (p.id === id ? payment : p)),
        currentPayment: prev.currentPayment?.id === id ? payment : prev.currentPayment,
        isSaving: false,
      }));
      toast.success('Payment updated successfully');
      return payment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update payment';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await paymentsService.deletePayment(id);
      setState((prev) => ({
        ...prev,
        payments: prev.payments.filter((p) => p.id !== id),
        currentPayment: prev.currentPayment?.id === id ? null : prev.currentPayment,
        isSaving: false,
      }));
      toast.success('Payment deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete payment';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const verifyPayment = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const payment = await paymentsService.verifyPayment(id);
      setState((prev) => ({
        ...prev,
        payments: prev.payments.map((p) => (p.id === id ? payment : p)),
        currentPayment: prev.currentPayment?.id === id ? payment : prev.currentPayment,
        isSaving: false,
      }));
      toast.success('Payment verified successfully');
      return payment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify payment';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const requestRefund = useCallback(async (paymentId: string, data: RefundRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const refund = await paymentsService.requestRefund(paymentId, data);
      setState((prev) => ({
        ...prev,
        refunds: [refund, ...prev.refunds],
        isSaving: false,
      }));
      toast.success('Refund requested successfully');
      return refund;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request refund';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const fetchRefunds = useCallback(async (filters?: PaymentFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Refund> = await paymentsService.getRefunds(filters);
      setState((prev) => ({
        ...prev,
        refunds: response.data,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch refunds';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const approveRefund = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const refund = await paymentsService.approveRefund(id);
      setState((prev) => ({
        ...prev,
        refunds: prev.refunds.map((r) => (r.id === id ? refund : r)),
        currentRefund: prev.currentRefund?.id === id ? refund : prev.currentRefund,
        isSaving: false,
      }));
      toast.success('Refund approved successfully');
      return refund;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve refund';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const rejectRefund = useCallback(async (id: string, reason?: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const refund = await paymentsService.rejectRefund(id, reason);
      setState((prev) => ({
        ...prev,
        refunds: prev.refunds.map((r) => (r.id === id ? refund : r)),
        currentRefund: prev.currentRefund?.id === id ? refund : prev.currentRefund,
        isSaving: false,
      }));
      toast.success('Refund rejected successfully');
      return refund;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject refund';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  return {
    payments: state.payments,
    refunds: state.refunds,
    currentPayment: state.currentPayment,
    currentRefund: state.currentRefund,
    pagination: state.pagination,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchPayments,
    fetchPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
    verifyPayment,
    requestRefund,
    fetchRefunds,
    approveRefund,
    rejectRefund,
  };
};
