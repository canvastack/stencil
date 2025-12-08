import { tenantApiClient } from '@/services/tenant/tenantApiClient';
import { 
  RefundRequest, 
  RefundApproval, 
  InsuranceFundTransaction,
  RefundDispute,
  VendorLiability,
  RefundAnalytics,
  InsuranceFundAnalytics,
  CreateRefundRequestData,
  UpdateRefundRequestData,
  ProcessRefundData,
  CreateRefundApprovalData,
  CreateRefundDisputeData,
  RefundStatus,
  RefundReason,
  RefundType,
  ApprovalDecision,
  DisputeStatus
} from '@/types/refund';
import { PaginatedResponse, ListRequestParams } from '@/types/api';

export interface RefundFilters extends ListRequestParams {
  status?: RefundStatus;
  refund_reason?: RefundReason;
  refund_type?: RefundType;
  date_from?: string;
  date_to?: string;
  approver_id?: string;
  order_id?: string;
}

export interface ProcessRefundRequest {
  gateway_id?: string;
  processing_notes?: string;
}

class RefundService {
  async getRefunds(filters?: RefundFilters): Promise<PaginatedResponse<RefundRequest>> {
    try {
      const response = await tenantApiClient.get('/refunds', { params: filters });
      
      // Handle Laravel pagination format
      if (response.data && Array.isArray(response.data.data)) {
        const transformedData = response.data.data.map(this.transformRefundFromApi.bind(this));
        
        return {
          data: transformedData,
          meta: {
            page: response.data.meta?.current_page || 1,
            per_page: response.data.meta?.per_page || 10,
            total: response.data.meta?.total || 0,
            total_pages: response.data.meta?.last_page || 1
          }
        };
      }

      // Handle direct array response
      const filteredRefunds = Array.isArray(response.data) 
        ? response.data.map(this.transformRefundFromApi.bind(this))
        : [];

      return {
        data: filteredRefunds,
        meta: {
          page: 1,
          per_page: filteredRefunds.length,
          total: filteredRefunds.length,
          total_pages: 1
        }
      };

    } catch (error) {
      console.error('Failed to fetch refunds:', error);
      throw error;
    }
  }

  async getRefundById(id: string): Promise<RefundRequest> {
    try {
      const response = await tenantApiClient.get(`/refunds/${id}`);
      return this.transformRefundFromApi(response.data.data);
    } catch (error) {
      console.error('Failed to fetch refund:', error);
      throw error;
    }
  }

  async createRefundRequest(data: CreateRefundRequestData): Promise<RefundRequest> {
    try {
      const response = await tenantApiClient.post('/refunds', data);
      return this.transformRefundFromApi(response.data.data);
    } catch (error) {
      console.error('Failed to create refund request:', error);
      throw error;
    }
  }

  async updateRefundRequest(id: string, data: UpdateRefundRequestData): Promise<RefundRequest> {
    try {
      const response = await tenantApiClient.put(`/refunds/${id}`, data);
      return this.transformRefundFromApi(response.data.data);
    } catch (error) {
      console.error('Failed to update refund request:', error);
      throw error;
    }
  }

  async processRefund(id: string, data: ProcessRefundData): Promise<RefundRequest> {
    try {
      const response = await tenantApiClient.post(`/refunds/${id}/process`, data);
      return this.transformRefundFromApi(response.data.data);
    } catch (error) {
      console.error('Failed to process refund:', error);
      throw error;
    }
  }

  async getRefundApprovals(refundId: string): Promise<RefundApproval[]> {
    try {
      const response = await tenantApiClient.get(`/refunds/${refundId}/approvals`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch refund approvals:', error);
      throw error;
    }
  }

  async createRefundApproval(refundId: string, data: CreateRefundApprovalData): Promise<RefundApproval> {
    try {
      const response = await tenantApiClient.post(`/refunds/${refundId}/approvals`, data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create refund approval:', error);
      throw error;
    }
  }

  async getInsuranceFundTransactions(params?: { 
    type?: 'contribution' | 'withdrawal'; 
    limit?: number; 
    page?: number; 
  }): Promise<PaginatedResponse<InsuranceFundTransaction>> {
    try {
      const response = await tenantApiClient.get('/insurance-fund/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch insurance fund transactions:', error);
      throw error;
    }
  }

  async getInsuranceFundBalance(): Promise<number> {
    try {
      const response = await tenantApiClient.get('/insurance-fund/balance');
      console.log('Insurance fund balance response:', response.data);
      return response.data?.balance || 0;
    } catch (error) {
      console.error('Failed to fetch insurance fund balance:', error);
      return 0;
    }
  }

  async getInsuranceFundAnalytics(): Promise<InsuranceFundAnalytics> {
    try {
      const response = await tenantApiClient.get('/insurance-fund/analytics');
      console.log('Insurance fund analytics response:', response.data);
      return response.data || {
        currentBalance: 0,
        totalContributions: 0,
        totalWithdrawals: 0,
        monthlyTrend: [],
        utilizationRate: 0,
        coverage: {
          totalCovered: 0,
          totalExposure: 0,
          coverageRatio: 0
        }
      };
    } catch (error) {
      console.error('Failed to fetch insurance fund analytics:', error);
      return {
        currentBalance: 0,
        totalContributions: 0,
        totalWithdrawals: 0,
        monthlyTrend: [],
        utilizationRate: 0,
        coverage: {
          totalCovered: 0,
          totalExposure: 0,
          coverageRatio: 0
        }
      };
    }
  }

  async getRefundDisputes(refundId?: string): Promise<RefundDispute[]> {
    try {
      const endpoint = refundId ? `/refunds/${refundId}/disputes` : '/disputes';
      const response = await tenantApiClient.get(endpoint);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch refund disputes:', error);
      throw error;
    }
  }

  async createRefundDispute(refundId: string, data: CreateRefundDisputeData): Promise<RefundDispute> {
    try {
      const response = await tenantApiClient.post(`/refunds/${refundId}/disputes`, data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create refund dispute:', error);
      throw error;
    }
  }

  async getVendorLiabilities(): Promise<VendorLiability[]> {
    try {
      const response = await tenantApiClient.get('/vendor-liabilities');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch vendor liabilities:', error);
      throw error;
    }
  }

  async getRefundAnalytics(): Promise<RefundAnalytics> {
    try {
      const response = await tenantApiClient.get('/refunds/analytics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch refund analytics:', error);
      throw error;
    }
  }

  // Transform API response to internal format
  private transformRefundFromApi(apiRefund: any): RefundRequest {
    return {
      id: apiRefund.id,
      tenantId: apiRefund.tenant_id,
      orderId: apiRefund.order_id,
      requestNumber: apiRefund.request_number,
      refundReason: apiRefund.refund_reason,
      refundType: apiRefund.refund_type,
      customerRequestAmount: apiRefund.customer_request_amount,
      evidenceDocuments: apiRefund.evidence_documents || [],
      customerNotes: apiRefund.customer_notes,
      status: apiRefund.status,
      calculation: apiRefund.calculation,
      timeline: apiRefund.timeline || [],
      requestedBy: apiRefund.requested_by,
      requestedAt: apiRefund.requested_at,
      createdAt: apiRefund.created_at,
      updatedAt: apiRefund.updated_at
    };
  }
}

export const refundService = new RefundService();
export default refundService;