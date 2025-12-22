import { useState, useCallback, useEffect } from 'react';
import { vendorsService, CreateVendorRequest, UpdateVendorRequest } from '@/services/api/vendors';
import type { Vendor, VendorFilters } from '@/services/api/vendors';
import { PaginatedResponse } from '@/types/api';
import { toast } from '@/lib/toast-config';
import { handleApiError, displayError } from '@/lib/api/error-handler';
import { tenantApiClient } from '@/services/api/tenantApiClient';

interface UseVendorsState {
  vendors: Vendor[];
  currentVendor: Vendor | null;
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

export const useVendors = () => {
  const [state, setState] = useState<UseVendorsState>({
    vendors: [],
    currentVendor: null,
    pagination: {
      page: 1,
      per_page: 50,
      total: 0,
      last_page: 1,
    },
    isLoading: false,
    isSaving: false,
    error: null,
  });

  const fetchVendors = useCallback(async (filters?: VendorFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Vendor> = await vendorsService.getVendors(filters);
      setState((prev) => ({
        ...prev,
        vendors: response.data,
        pagination: {
          page: response.current_page || 1,
          per_page: response.per_page || 50,
          total: response.total || 0,
          last_page: response.last_page || 1,
        },
        isLoading: false,
      }));
    } catch (error) {
      const apiError = handleApiError(error);
      setState((prev) => ({ ...prev, error: apiError.message, isLoading: false }));
      displayError(apiError, 'Fetch Vendors');
    }
  }, []);

  const fetchVendorById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const vendor = await vendorsService.getVendorById(id);
      setState((prev) => ({ ...prev, currentVendor: vendor, isLoading: false }));
      return vendor;
    } catch (error) {
      const apiError = handleApiError(error);
      setState((prev) => ({ ...prev, error: apiError.message, isLoading: false }));
      displayError(apiError, 'Fetch Vendor');
    }
  }, []);

  const createVendor = useCallback(async (data: CreateVendorRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const newVendor = await vendorsService.createVendor(data);
      setState((prev) => ({
        ...prev,
        vendors: [...prev.vendors, newVendor],
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total + 1,
        },
        isSaving: false,
      }));
      toast.success('Vendor created successfully');
      return newVendor;
    } catch (error) {
      const apiError = handleApiError(error);
      setState((prev) => ({ ...prev, error: apiError.message, isSaving: false }));
      displayError(apiError, 'Create Vendor');
      throw apiError;
    }
  }, []);

  const updateVendor = useCallback(async (id: string, data: UpdateVendorRequest) => {
    const originalVendor = state.vendors.find(v => v.id === id);
    const originalCurrentVendor = state.currentVendor;
    
    // Optimistic update - update UI immediately
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.map((vendor) =>
        vendor.id === id ? { ...vendor, ...data } : vendor
      ),
      currentVendor: prev.currentVendor?.id === id 
        ? { ...prev.currentVendor, ...data } 
        : prev.currentVendor,
      isSaving: true,
      error: null,
    }));

    try {
      // Make actual API call
      const updatedVendor = await vendorsService.updateVendor(id, data);
      
      // Replace optimistic update with server response
      setState((prev) => ({
        ...prev,
        vendors: prev.vendors.map((vendor) =>
          vendor.id === id ? updatedVendor : vendor
        ),
        currentVendor: prev.currentVendor?.id === id ? updatedVendor : prev.currentVendor,
        isSaving: false,
      }));
      
      toast.success('Vendor updated successfully');
      return updatedVendor;
    } catch (error) {
      // Rollback optimistic update on error
      setState((prev) => ({
        ...prev,
        vendors: originalVendor 
          ? prev.vendors.map((vendor) => vendor.id === id ? originalVendor : vendor)
          : prev.vendors,
        currentVendor: originalCurrentVendor,
        error: null,
        isSaving: false,
      }));
      
      const apiError = handleApiError(error);
      displayError(apiError, 'Update Vendor');
      throw apiError;
    }
  }, [state.vendors, state.currentVendor]);

  const deleteVendor = useCallback(async (id: string) => {
    const originalVendors = [...state.vendors];
    const originalCurrentVendor = state.currentVendor;
    const originalPagination = { ...state.pagination };
    
    // Optimistic removal - remove from UI immediately
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((vendor) => vendor.id !== id),
      currentVendor: prev.currentVendor?.id === id ? null : prev.currentVendor,
      pagination: {
        ...prev.pagination,
        total: Math.max(0, prev.pagination.total - 1),
      },
      isSaving: true,
      error: null,
    }));

    try {
      // Make actual API call
      await vendorsService.deleteVendor(id);
      
      // Confirm deletion success
      setState((prev) => ({ ...prev, isSaving: false }));
      toast.success('Vendor deleted successfully');
    } catch (error) {
      // Rollback optimistic deletion on error
      setState((prev) => ({
        ...prev,
        vendors: originalVendors,
        currentVendor: originalCurrentVendor,
        pagination: originalPagination,
        error: null,
        isSaving: false,
      }));
      
      const apiError = handleApiError(error);
      displayError(apiError, 'Delete Vendor');
      throw apiError;
    }
  }, [state.vendors, state.currentVendor, state.pagination]);

  const getVendorEvaluations = useCallback(async (id: string) => {
    try {
      return await vendorsService.getVendorEvaluations(id);
    } catch (error) {
      const apiError = handleApiError(error);
      displayError(apiError, 'Fetch Vendor Evaluations');
      throw apiError;
    }
  }, []);

  const getVendorSpecializations = useCallback(async (id: string) => {
    try {
      return await vendorsService.getVendorSpecializations(id);
    } catch (error) {
      const apiError = handleApiError(error);
      displayError(apiError, 'Fetch Vendor Specializations');
      throw apiError;
    }
  }, []);

  const getVendorOrders = useCallback(async (id: string) => {
    try {
      return await vendorsService.getVendorOrders(id);
    } catch (error) {
      const apiError = handleApiError(error);
      displayError(apiError, 'Fetch Vendor Orders');
      throw apiError;
    }
  }, []);

  const refreshVendors = useCallback(() => {
    fetchVendors();
  }, [fetchVendors]);

  const clearCurrentVendor = useCallback(() => {
    setState((prev) => ({ ...prev, currentVendor: null }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    vendors: state.vendors,
    currentVendor: state.currentVendor,
    pagination: state.pagination,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,

    // Actions
    fetchVendors,
    fetchVendorById,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendorEvaluations,
    getVendorSpecializations,
    getVendorOrders,
    refreshVendors,
    clearCurrentVendor,
    clearError,
  };
};

// Specialized hook for vendor performance metrics
export const useVendorPerformance = () => {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [vendorRankings, setVendorRankings] = useState<any[]>([]);
  const [deliveryMetrics, setDeliveryMetrics] = useState<any[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceData = useCallback(async (filters?: { period?: string; vendor?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.period) params.append('period', filters.period);
      if (filters?.vendor) params.append('vendor', filters.vendor);
      
      const [performanceResponse, rankingsResponse, deliveryResponse, qualityResponse] = await Promise.all([
        tenantApiClient.get(`/vendor-performance/metrics?${params.toString()}`),
        tenantApiClient.get(`/vendor-performance/rankings?${params.toString()}`),
        tenantApiClient.get(`/vendor-performance/delivery-metrics?${params.toString()}`),
        tenantApiClient.get(`/vendor-performance/quality-metrics?${params.toString()}`)
      ]);

      setPerformanceData(performanceResponse.data || []);
      setVendorRankings(rankingsResponse.data || []);
      setDeliveryMetrics(deliveryResponse.data || []);
      setQualityMetrics(qualityResponse.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch performance data';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  return {
    performanceData,
    vendorRankings,
    deliveryMetrics,
    qualityMetrics,
    isLoading,
    error,
    fetchPerformanceData,
  };
};

// Specialized hook for vendor sourcing
export const useVendorSourcing = () => {
  const [sourcingRequests, setSourcingRequests] = useState<any[]>([]);
  const [vendorQuotes, setVendorQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSourcingRequests = useCallback(async (filters?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Real API call to vendor sourcing endpoints
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.order_id) params.append('order_id', filters.order_id);
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id);
      
      const [requestsResponse, quotesResponse] = await Promise.all([
        tenantApiClient.get(`/vendor-sourcing?${params.toString()}`),
        tenantApiClient.get(`/vendor-sourcing/quotes?${params.toString()}`)
      ]);

      setSourcingRequests(requestsResponse.data || []);
      setVendorQuotes(quotesResponse.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sourcing requests';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSourcingRequest = useCallback(async (data: any) => {
    setIsLoading(true);
    try {
      // Real API call to create sourcing request
      const response = await tenantApiClient.post('/vendor-sourcing', data);
      
      setSourcingRequests((prev) => [response.data, ...prev]);
      toast.success('Sourcing request created successfully');
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create sourcing request';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sourcingRequests,
    vendorQuotes,
    isLoading,
    error,
    fetchSourcingRequests,
    createSourcingRequest,
  };
};

// Specialized hook for vendor payments
export const useVendorPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalOverdue: 0,
    totalAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (filters?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Real API call to vendor payments endpoints
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      
      const [paymentsResponse, statsResponse] = await Promise.all([
        tenantApiClient.get(`/vendor-payments?${params.toString()}`),
        tenantApiClient.get(`/vendor-payments/stats?${params.toString()}`)
      ]);

      // Transform snake_case to camelCase
      const transformedPayments = (paymentsResponse.data || []).map((payment: any) => ({
        id: payment.id,
        uuid: payment.uuid,
        invoiceNumber: payment.invoice_number,
        vendorId: payment.vendor_id,
        vendorName: payment.vendor_name,
        orderId: payment.order_id,
        orderNumber: payment.order_number,
        amount: parseFloat(payment.amount) || 0,
        taxAmount: parseFloat(payment.tax_amount) || 0,
        totalAmount: parseFloat(payment.total_amount) || 0,
        status: payment.status,
        paymentMethod: payment.payment_method,
        dueDate: payment.due_date,
        paidDate: payment.paid_date,
        description: payment.description,
        notes: payment.notes,
        bankAccount: payment.bank_account,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      }));

      setPayments(transformedPayments);
      setPaymentStats(statsResponse.data || {
        totalPending: 0,
        totalPaid: 0,
        totalOverdue: 0,
        totalAmount: 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processPayment = useCallback(async (paymentId: string, data: any) => {
    setIsLoading(true);
    try {
      // Real API call to process payment
      const response = await tenantApiClient.post(`/vendor-payments/${paymentId}/process`, data);
      
      setPayments((prev) => 
        prev.map((payment) => 
          payment.id === paymentId ? response.data : payment
        )
      );
      toast.success('Payment processed successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process payment';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    payments,
    paymentStats,
    isLoading,
    error,
    fetchPayments,
    processPayment,
  };
};

// Specialized hook for vendor matching and order assignment
export const useVendorMatching = () => {
  const [vendorMatches, setVendorMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getVendorMatches = useCallback(async (orderId: string, criteria?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Real API call to vendor matching endpoint
      const params = new URLSearchParams();
      if (criteria?.quality_tier) params.append('quality_tier', criteria.quality_tier);
      if (criteria?.max_lead_time) params.append('max_lead_time', criteria.max_lead_time.toString());
      if (criteria?.budget_range) {
        if (criteria.budget_range.min) params.append('budget_range[min]', criteria.budget_range.min.toString());
        if (criteria.budget_range.max) params.append('budget_range[max]', criteria.budget_range.max.toString());
      }
      if (criteria?.specializations) {
        criteria.specializations.forEach((spec: string, index: number) => {
          params.append(`specializations[${index}]`, spec);
        });
      }
      if (criteria?.limit) params.append('limit', criteria.limit.toString());
      
      const response = await tenantApiClient.get(`/orders/${orderId}/vendor-matches?${params.toString()}`);
      
      setVendorMatches(response.data || []);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch vendor matches';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const assignVendorToOrder = useCallback(async (orderId: string, data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Real API call to assign vendor to order
      const response = await tenantApiClient.post(`/orders/${orderId}/assign-vendor`, data);
      
      toast.success('Vendor assigned successfully');
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign vendor';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startVendorNegotiation = useCallback(async (orderId: string, vendorId: string, data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Real API call to start negotiation
      const response = await tenantApiClient.post(`/orders/${orderId}/negotiations`, {
        vendor_id: vendorId,
        ...data
      });
      
      toast.success('Negotiation started successfully');
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start negotiation';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    vendorMatches,
    isLoading,
    error,
    getVendorMatches,
    assignVendorToOrder,
    startVendorNegotiation,
  };
};

// Hook for vendor negotiation management
export const useVendorNegotiation = () => {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNegotiations = useCallback(async (filters?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Real API call to fetch negotiations
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.order_id) params.append('order_id', filters.order_id);
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id);
      
      const response = await tenantApiClient.get(`/vendor-negotiations?${params.toString()}`);
      
      setNegotiations(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch negotiations';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCounterOffer = useCallback(async (negotiationId: string, data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Real API call to add counter offer
      const response = await tenantApiClient.post(`/vendor-negotiations/${negotiationId}/counter`, data);
      
      // Update local state
      setNegotiations(prev => prev.map(neg => 
        neg.id === negotiationId 
          ? { ...neg, ...response.data }
          : neg
      ));
      
      toast.success('Counter offer submitted successfully');
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit counter offer';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveNegotiation = useCallback(async (negotiationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Real API call to approve negotiation
      const response = await tenantApiClient.post(`/vendor-negotiations/${negotiationId}/approve`);
      
      // Update local state
      setNegotiations(prev => prev.map(neg => 
        neg.id === negotiationId 
          ? { ...neg, status: 'approved', ...response.data }
          : neg
      ));
      
      toast.success('Negotiation approved successfully');
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve negotiation';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectNegotiation = useCallback(async (negotiationId: string, reason?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Real API call to reject negotiation
      const response = await tenantApiClient.post(`/vendor-negotiations/${negotiationId}/reject`, {
        reason
      });
      
      // Update local state
      setNegotiations(prev => prev.map(neg => 
        neg.id === negotiationId 
          ? { ...neg, status: 'rejected', ...response.data }
          : neg
      ));
      
      toast.success('Negotiation rejected');
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject negotiation';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    negotiations,
    isLoading,
    error,
    fetchNegotiations,
    addCounterOffer,
    approveNegotiation,
    rejectNegotiation,
  };
};