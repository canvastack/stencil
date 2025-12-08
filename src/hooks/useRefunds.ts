import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  refundService,
  RefundFilters,
  ProcessRefundRequest
} from '../services/api/refunds';
import { 
  RefundRequest,
  RefundApproval,
  InsuranceFundTransaction,
  RefundAnalytics,
  InsuranceFundAnalytics,
  CreateRefundRequestData,
  UpdateRefundRequestData,
  ApproveRefundData
} from '../types/refund';
import { PaginatedResponse } from '../types/api';

// Query keys for refund system
const refundQueryKeys = {
  refunds: {
    all: ['refunds'] as const,
    lists: () => [...refundQueryKeys.refunds.all, 'list'] as const,
    list: (filters?: RefundFilters) => [...refundQueryKeys.refunds.lists(), { filters }] as const,
    details: () => [...refundQueryKeys.refunds.all, 'detail'] as const,
    detail: (id: string) => [...refundQueryKeys.refunds.details(), id] as const,
    approvals: (id: string) => [...refundQueryKeys.refunds.detail(id), 'approvals'] as const,
  },
  insuranceFund: {
    all: ['insurance-fund'] as const,
    balance: () => [...refundQueryKeys.insuranceFund.all, 'balance'] as const,
    transactions: () => [...refundQueryKeys.insuranceFund.all, 'transactions'] as const,
    analytics: () => [...refundQueryKeys.insuranceFund.all, 'analytics'] as const,
  },
  analytics: {
    all: ['refund-analytics'] as const,
    summary: () => [...refundQueryKeys.analytics.all, 'summary'] as const,
  }
};

// Configuration for real-time updates
const realtimeConfig = {
  staleTime: {
    refunds: 30000, // 30 seconds
    balance: 60000, // 1 minute
    analytics: 300000, // 5 minutes
  },
  polling: {
    refunds: 60000, // 1 minute
    balance: 120000, // 2 minutes
    analytics: false, // No polling for analytics
  }
};

// Get refunds list with real-time updates
export const useRefunds = (filters?: RefundFilters) => {
  return useQuery({
    queryKey: refundQueryKeys.refunds.list(filters),
    queryFn: () => refundService.getRefunds(filters),
    staleTime: realtimeConfig.staleTime.refunds,
    refetchInterval: realtimeConfig.polling.refunds,
    refetchIntervalInBackground: true,
    enabled: true,
  });
};

// Get single refund with real-time updates
export const useRefund = (id: string) => {
  return useQuery({
    queryKey: refundQueryKeys.refunds.detail(id),
    queryFn: () => refundService.getRefundById(id),
    staleTime: realtimeConfig.staleTime.refunds,
    refetchInterval: realtimeConfig.polling.refunds,
    refetchIntervalInBackground: true,
    enabled: !!id,
  });
};

// Get insurance fund balance
export const useInsuranceFundBalance = () => {
  return useQuery({
    queryKey: refundQueryKeys.insuranceFund.balance(),
    queryFn: () => refundService.getInsuranceFundBalance(),
    staleTime: realtimeConfig.staleTime.balance,
    refetchInterval: realtimeConfig.polling.balance,
    refetchIntervalInBackground: true,
  });
};

// Get insurance fund transactions
export const useInsuranceFundTransactions = () => {
  return useQuery({
    queryKey: refundQueryKeys.insuranceFund.transactions(),
    queryFn: () => refundService.getInsuranceFundTransactions(),
    staleTime: realtimeConfig.staleTime.refunds,
    refetchInterval: realtimeConfig.polling.refunds,
  });
};

// Get insurance fund analytics
export const useInsuranceFundAnalytics = () => {
  return useQuery({
    queryKey: refundQueryKeys.insuranceFund.analytics(),
    queryFn: () => refundService.getInsuranceFundAnalytics(),
    staleTime: realtimeConfig.staleTime.analytics,
    enabled: true,
  });
};

// Get refund analytics
export const useRefundAnalytics = () => {
  return useQuery({
    queryKey: refundQueryKeys.analytics.summary(),
    queryFn: () => refundService.getRefundAnalytics(),
    staleTime: realtimeConfig.staleTime.analytics,
    enabled: true,
  });
};

// Cache utilities for optimistic updates
const cacheUtils = {
  optimisticUpdate: async <T>(queryKeys: readonly unknown[], updater: (old: T | undefined) => T | undefined) => {
    const queryClient = useQueryClient();
    await queryClient.cancelQueries({ queryKey: queryKeys });
    const previousData = queryClient.getQueryData<T>(queryKeys);
    queryClient.setQueryData<T>(queryKeys, updater);
    return { previousData };
  }
};

// Create refund request mutation
export const useCreateRefundRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRefundRequestData) => refundService.createRefundRequest(data),
    onMutate: async (newRefund) => {
      // Optimistic update for refunds list
      await queryClient.cancelQueries({ queryKey: refundQueryKeys.refunds.lists() });
      
      const previousData = queryClient.getQueryData<PaginatedResponse<RefundRequest>>(
        refundQueryKeys.refunds.lists()
      );

      if (previousData) {
        const optimisticRefund: RefundRequest = {
          id: `temp-${Date.now()}`,
          tenantId: 'current-tenant',
          orderId: newRefund.orderId,
          requestNumber: `RFD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-TMP`,
          refundReason: newRefund.refundReason,
          refundType: newRefund.refundType,
          customerRequestAmount: newRefund.customerRequestAmount,
          evidenceDocuments: newRefund.evidenceDocuments,
          customerNotes: newRefund.customerNotes,
          status: 'pending_review' as any,
          calculation: {
            orderTotal: 0,
            customerPaidAmount: 0,
            vendorCostPaid: 0,
            productionProgress: 0,
            refundReason: newRefund.refundReason,
            faultParty: 'customer',
            refundableToCustomer: newRefund.customerRequestAmount || 0,
            companyLoss: 0,
            vendorRecoverable: 0,
            insuranceCover: 0,
            appliedRules: [],
            calculatedAt: new Date().toISOString(),
            calculatedBy: 'system'
          },
          requestedBy: 'current-user',
          requestedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        queryClient.setQueryData<PaginatedResponse<RefundRequest>>(
          refundQueryKeys.refunds.lists(),
          {
            ...previousData,
            data: [optimisticRefund, ...previousData.data],
            meta: {
              ...previousData.meta,
              total: previousData.meta.total + 1
            }
          }
        );
      }

      return { previousData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.refunds.lists() });
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.analytics.all });
      toast.success('Refund request created successfully');
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          refundQueryKeys.refunds.lists(),
          context.previousData
        );
      }
      toast.error('Failed to create refund request');
      console.error('Create refund error:', error);
    },
  });
};

// Update refund request mutation
export const useUpdateRefundRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRefundRequestData }) => 
      refundService.updateRefundRequest(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.refunds.lists() });
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.refunds.detail(id) });
      toast.success('Refund request updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update refund request');
      console.error('Update refund error:', error);
    },
  });
};

// Approve refund mutation
export const useApproveRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveRefundData }) => 
      refundService.approveRefund(id, data),
    onSuccess: (approval, { id }) => {
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.refunds.lists() });
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.refunds.detail(id) });
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.analytics.all });
      
      const decision = approval.decision;
      const message = decision === 'approved' ? 'Refund approved successfully' :
                     decision === 'rejected' ? 'Refund rejected' : 'Additional information requested';
      toast.success(message);
    },
    onError: (error) => {
      toast.error('Failed to process approval');
      console.error('Approve refund error:', error);
    },
  });
};

// Process refund mutation
export const useProcessRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ProcessRefundRequest }) => 
      refundService.processRefund(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.refunds.lists() });
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.refunds.detail(id) });
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.insuranceFund.all });
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.analytics.all });
      toast.success('Refund processing initiated successfully');
    },
    onError: (error) => {
      toast.error('Failed to process refund');
      console.error('Process refund error:', error);
    },
  });
};

// Delete refund mutation
export const useDeleteRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => refundService.deleteRefund(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: refundQueryKeys.refunds.lists() });
      
      const previousData = queryClient.getQueryData<PaginatedResponse<RefundRequest>>(
        refundQueryKeys.refunds.lists()
      );

      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<RefundRequest>>(
          refundQueryKeys.refunds.lists(),
          {
            ...previousData,
            data: previousData.data.filter(refund => refund.id !== id),
            meta: {
              ...previousData.meta,
              total: Math.max(0, previousData.meta.total - 1)
            }
          }
        );
      }

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.refunds.lists() });
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.analytics.all });
      toast.success('Refund request deleted successfully');
    },
    onError: (error, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          refundQueryKeys.refunds.lists(),
          context.previousData
        );
      }
      toast.error('Failed to delete refund request');
      console.error('Delete refund error:', error);
    },
  });
};

export { refundQueryKeys, realtimeConfig };