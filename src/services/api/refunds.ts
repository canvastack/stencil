import { tenantApiClient } from '../tenant/tenantApiClient';
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
  ApproveRefundData,
  RefundRequestFilters,
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
  private isDemoMode(): boolean {
    // Always use real backend data now that seeder is working
    return false;
    // const token = localStorage.getItem('auth_token');
    // return token?.startsWith('demo_token_') || false;
  }

  private getMockRefunds(filters?: RefundFilters): PaginatedResponse<RefundRequest> {
    const mockRefunds: RefundRequest[] = [
      {
        id: 'refund-demo-001',
        tenantId: 'tenant-001',
        orderId: 'order-demo-001',
        requestNumber: 'RFD-20241207-001',
        refundReason: RefundReason.QualityIssue,
        refundType: RefundType.PartialRefund,
        customerRequestAmount: 5000000,
        customerNotes: 'Produk tidak sesuai spesifikasi yang diminta',
        status: RefundStatus.PendingFinance,
        calculation: {
          orderTotal: 15750000,
          customerPaidAmount: 7500000,
          vendorCostPaid: 6000000,
          productionProgress: 80,
          refundReason: RefundReason.QualityIssue,
          qualityIssuePercentage: 60,
          faultParty: 'vendor',
          refundableToCustomer: 4500000,
          companyLoss: 500000,
          vendorRecoverable: 3600000,
          insuranceCover: 500000,
          appliedRules: ['quality_issue_proportional', 'insurance_fund_applied'],
          calculatedAt: '2024-12-07T10:00:00Z',
          calculatedBy: 'system'
        },
        requestedBy: 'user-cs-001',
        requestedAt: '2024-12-07T09:00:00Z',
        createdAt: '2024-12-07T09:00:00Z',
        updatedAt: '2024-12-07T10:30:00Z',
        order: {
          id: 'order-demo-001',
          orderNumber: 'ORD-2024-001',
          customerName: 'PT Demo Manufaktur',
          totalAmount: 15750000
        },
        requester: {
          id: 'user-cs-001',
          name: 'Sarah Customer Service',
          email: 'sarah.cs@ptcex.com'
        }
      },
      {
        id: 'refund-demo-002',
        tenantId: 'tenant-001',
        orderId: 'order-demo-002',
        requestNumber: 'RFD-20241206-002',
        refundReason: RefundReason.CustomerRequest,
        refundType: RefundType.FullRefund,
        customerRequestAmount: 23500000,
        customerNotes: 'Customer membatalkan pesanan karena perubahan rencana bisnis',
        status: RefundStatus.Completed,
        calculation: {
          orderTotal: 23500000,
          customerPaidAmount: 23500000,
          vendorCostPaid: 0,
          productionProgress: 0,
          refundReason: RefundReason.CustomerRequest,
          faultParty: 'customer',
          refundableToCustomer: 23500000,
          companyLoss: 0,
          vendorRecoverable: 0,
          insuranceCover: 0,
          appliedRules: ['pre_production_full_refund'],
          calculatedAt: '2024-12-06T14:00:00Z',
          calculatedBy: 'finance-manager'
        },
        requestedBy: 'user-cs-002',
        requestedAt: '2024-12-06T13:00:00Z',
        approvedAt: '2024-12-06T16:00:00Z',
        processedAt: '2024-12-06T18:00:00Z',
        createdAt: '2024-12-06T13:00:00Z',
        updatedAt: '2024-12-06T18:00:00Z',
        order: {
          id: 'order-demo-002',
          orderNumber: 'ORD-2024-002',
          customerName: 'CV Metalworks Indo',
          totalAmount: 23500000
        }
      }
    ];

    // Apply filters
    let filteredRefunds = mockRefunds;
    if (filters?.status) {
      filteredRefunds = filteredRefunds.filter(r => r.status === filters.status);
    }
    if (filters?.refund_reason) {
      filteredRefunds = filteredRefunds.filter(r => r.refundReason === filters.refund_reason);
    }

    return {
      data: filteredRefunds,
      meta: {
        page: 1,
        per_page: 15,
        total: filteredRefunds.length,
        last_page: 1
      }
    };
  }

  private transformRefundFromApi(apiRefund: any): RefundRequest {
    return {
      id: apiRefund.id,
      tenantId: apiRefund.tenant_id?.toString(),
      orderId: apiRefund.order_id?.toString(),
      requestNumber: apiRefund.request_number,
      refundReason: apiRefund.refund_reason,
      refundType: apiRefund.refund_type,
      customerRequestAmount: apiRefund.customer_request_amount ? parseFloat(apiRefund.customer_request_amount) : undefined,
      evidenceDocuments: apiRefund.evidence_documents,
      customerNotes: apiRefund.customer_notes,
      status: apiRefund.status,
      currentApproverId: apiRefund.current_approver_id,
      calculation: apiRefund.calculation,
      requestedBy: apiRefund.requested_by?.toString(),
      requestedAt: apiRefund.requested_at,
      approvedAt: apiRefund.approved_at,
      processedAt: apiRefund.processed_at,
      createdAt: apiRefund.created_at,
      updatedAt: apiRefund.updated_at,
      order: apiRefund.order ? {
        id: apiRefund.order.id.toString(),
        orderNumber: apiRefund.order.order_number,
        customerName: apiRefund.order.shipping_address?.name || 'Unknown Customer',
        totalAmount: apiRefund.order.total_amount
      } : undefined,
      approvals: apiRefund.approvals || []
    };
  }

  async getRefunds(filters?: RefundFilters): Promise<PaginatedResponse<RefundRequest>> {
    if (this.isDemoMode()) {
      return Promise.resolve(this.getMockRefunds(filters));
    }

    try {
      const response = await tenantApiClient.get('/refunds', { params: filters });
      
      // Handle Laravel pagination format
      if (response.data && Array.isArray(response.data.data)) {
        const transformedData = response.data.data.map(this.transformRefundFromApi.bind(this));
        
        return {
          data: transformedData,
          meta: {
            page: response.data.meta?.current_page || 1,
            per_page: response.data.meta?.per_page || 15,
            total: response.data.meta?.total || transformedData.length,
            last_page: response.data.meta?.last_page || 1
          }
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array response
        const transformedData = response.data.map(this.transformRefundFromApi.bind(this));
        
        return {
          data: transformedData,
          meta: { page: 1, per_page: 15, total: transformedData.length, last_page: 1 }
        };
      } else {
        console.warn('Unexpected response structure:', response.data);
        return {
          data: [],
          meta: { page: 1, per_page: 15, total: 0, last_page: 1 }
        };
      }
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
      throw error;
    }
  }

  async getRefundById(id: string): Promise<RefundRequest> {
    if (this.isDemoMode()) {
      const mockData = this.getMockRefunds();
      const refund = mockData.data.find(r => r.id === id);
      if (!refund) throw new Error('Refund not found');
      return Promise.resolve(refund);
    }

    try {
      const response = await tenantApiClient.get(`/refunds/${id}`);
      return this.transformRefundFromApi(response.data.data);
    } catch (error) {
      console.error('Failed to fetch refund:', error);
      throw error;
    }
  }

  async createRefundRequest(data: CreateRefundRequestData): Promise<RefundRequest> {
    if (this.isDemoMode()) {
      const newRefund: RefundRequest = {
        id: `refund-demo-${Date.now()}`,
        tenantId: 'tenant-001',
        orderId: data.orderId,
        requestNumber: `RFD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-3)}`,
        refundReason: data.refundReason,
        refundType: data.refundType,
        customerRequestAmount: data.customerRequestAmount,
        evidenceDocuments: data.evidenceDocuments,
        customerNotes: data.customerNotes,
        status: RefundStatus.PendingReview,
        calculation: {
          orderTotal: 15000000,
          customerPaidAmount: 15000000,
          vendorCostPaid: 0,
          productionProgress: 0,
          refundReason: data.refundReason,
          faultParty: 'customer',
          refundableToCustomer: data.customerRequestAmount || 15000000,
          companyLoss: 0,
          vendorRecoverable: 0,
          insuranceCover: 0,
          appliedRules: ['new_request_calculation'],
          calculatedAt: new Date().toISOString(),
          calculatedBy: 'system'
        },
        requestedBy: 'current-user',
        requestedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return Promise.resolve(newRefund);
    }

    try {
      const response = await tenantApiClient.post('/refunds', data);
      return this.transformRefundFromApi(response.data.data);
    } catch (error) {
      console.error('Failed to create refund request:', error);
      throw error;
    }
  }

  async updateRefundRequest(id: string, data: UpdateRefundRequestData): Promise<RefundRequest> {
    if (this.isDemoMode()) {
      const mockData = this.getMockRefunds();
      const refund = mockData.data.find(r => r.id === id);
      if (!refund) throw new Error('Refund not found');
      
      const updated = { ...refund, ...data, updatedAt: new Date().toISOString() };
      return Promise.resolve(updated);
    }

    try {
      const response = await tenantApiClient.put(`/refunds/${id}`, data);
      return this.transformRefundFromApi(response.data.data);
    } catch (error) {
      console.error('Failed to update refund request:', error);
      throw error;
    }
  }

  async approveRefund(id: string, data: ApproveRefundData): Promise<RefundApproval> {
    if (this.isDemoMode()) {
      const newApproval: RefundApproval = {
        id: `approval-demo-${Date.now()}`,
        refundRequestId: id,
        approverId: 'current-user',
        approvalLevel: 2,
        decision: data.decision,
        decisionNotes: data.decisionNotes,
        adjustedAmount: data.adjustedAmount,
        decidedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        approver: {
          id: 'current-user',
          name: 'Finance Manager',
          role: 'finance_manager'
        }
      };
      
      return Promise.resolve(newApproval);
    }

    try {
      const response = await tenantApiClient.post(`/refunds/${id}/approve`, data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to approve refund:', error);
      throw error;
    }
  }

  async processRefund(id: string, data?: ProcessRefundRequest): Promise<RefundRequest> {
    if (this.isDemoMode()) {
      const mockData = this.getMockRefunds();
      const refund = mockData.data.find(r => r.id === id);
      if (!refund) throw new Error('Refund not found');
      
      const processed = { 
        ...refund, 
        status: RefundStatus.Processing,
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      };
      return Promise.resolve(processed);
    }

    try {
      const response = await tenantApiClient.post(`/refunds/${id}/process`, data);
      return this.transformRefundFromApi(response.data.data);
    } catch (error) {
      console.error('Failed to process refund:', error);
      throw error;
    }
  }

  async deleteRefund(id: string): Promise<void> {
    if (this.isDemoMode()) {
      return Promise.resolve();
    }

    try {
      await tenantApiClient.delete(`/refunds/${id}`);
    } catch (error) {
      console.error('Failed to delete refund:', error);
      throw error;
    }
  }

  // Insurance Fund Operations
  async getInsuranceFundBalance(): Promise<number> {
    try {
      const response = await tenantApiClient.get('/refunds/insurance-fund/balance');
      console.log('Insurance fund balance response:', response);
      
      // TenantApiClient already returns response.data, so response IS the data
      if (response === undefined || response === null) {
        console.warn('Balance response is undefined/null, returning 0');
        return 0;
      }
      
      return Number(response);
    } catch (error) {
      console.error('Failed to fetch insurance fund balance:', error);
      throw error;
    }
  }

  async getInsuranceFundTransactions(filters?: ListRequestParams): Promise<PaginatedResponse<InsuranceFundTransaction>> {
    try {
      const response = await tenantApiClient.get('/refunds/insurance-fund/transactions', { params: filters });
      // TenantApiClient already returns response.data
      return response;
    } catch (error) {
      console.error('Failed to fetch insurance fund transactions:', error);
      throw error;
    }
  }

  async getInsuranceFundAnalytics(): Promise<InsuranceFundAnalytics> {
    try {
      const response = await tenantApiClient.get('/refunds/insurance-fund/analytics');
      console.log('Insurance fund analytics response:', response);
      
      // TenantApiClient already returns response.data
      if (!response) {
        console.warn('Analytics response is undefined/null, returning fallback');
        return {
          currentBalance: 0,
          totalContributions: 0,
          totalWithdrawals: 0,
          monthlyTrend: [],
          utilizationRate: 0,
          averageWithdrawalAmount: 0,
        };
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch insurance fund analytics:', error);
      throw error;
    }
  }

  // Analytics
  async getRefundAnalytics(): Promise<RefundAnalytics> {
    if (this.isDemoMode()) {
      return Promise.resolve({
        totalRefunds: 156,
        totalRefundAmount: 450000000,
        refundsByStatus: {
          [RefundStatus.PendingReview]: 12,
          [RefundStatus.UnderInvestigation]: 8,
          [RefundStatus.PendingFinance]: 5,
          [RefundStatus.PendingManager]: 3,
          [RefundStatus.Approved]: 2,
          [RefundStatus.Processing]: 4,
          [RefundStatus.Completed]: 118,
          [RefundStatus.Rejected]: 3,
          [RefundStatus.Disputed]: 1,
          [RefundStatus.Cancelled]: 0
        },
        refundsByReason: {
          [RefundReason.CustomerRequest]: 45,
          [RefundReason.QualityIssue]: 68,
          [RefundReason.TimelineDelay]: 23,
          [RefundReason.VendorFailure]: 12,
          [RefundReason.ProductionError]: 5,
          [RefundReason.ShippingDamage]: 2,
          [RefundReason.Other]: 1
        },
        monthlyTrend: [
          { month: '2024-08', count: 28, amount: 85000000 },
          { month: '2024-09', count: 32, amount: 92000000 },
          { month: '2024-10', count: 35, amount: 105000000 },
          { month: '2024-11', count: 38, amount: 98000000 },
          { month: '2024-12', count: 23, amount: 70000000 }
        ],
        averageProcessingTime: 3.2,
        approvalRate: 94.2,
        topRefundReasons: [
          { reason: RefundReason.QualityIssue, count: 68, percentage: 43.6 },
          { reason: RefundReason.CustomerRequest, count: 45, percentage: 28.8 },
          { reason: RefundReason.TimelineDelay, count: 23, percentage: 14.7 }
        ]
      });
    }

    try {
      const response = await tenantApiClient.get('/refunds/analytics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch refund analytics:', error);
      throw error;
    }
  }
}

export const refundService = new RefundService();