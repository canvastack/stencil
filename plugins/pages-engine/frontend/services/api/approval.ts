import { tenantApiClient } from './tenantApiClient';
import type {
  ApprovalRequest,
  ApprovalRule,
  CreateApprovalRequestData,
  ApprovalAction,
  ApprovalListResponse,
  ApprovalStatsResponse,
  ApprovalRuleListResponse,
  ApprovalFilterOptions,
} from '@/types/approval';

class ApprovalService {
  async getApprovalRequests(
    page = 1,
    perPage = 20,
    filters?: ApprovalFilterOptions
  ): Promise<ApprovalListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (filters?.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      if (filters?.requestType && filters.requestType.length > 0) {
        params.append('request_type', filters.requestType.join(','));
      }
      if (filters?.requestedBy && filters.requestedBy.length > 0) {
        params.append('requested_by', filters.requestedBy.join(','));
      }
      if (filters?.priority && filters.priority.length > 0) {
        params.append('priority', filters.priority.join(','));
      }
      if (filters?.dateFrom) {
        params.append('date_from', filters.dateFrom);
      }
      if (filters?.dateTo) {
        params.append('date_to', filters.dateTo);
      }

      const response = await tenantApiClient.get<ApprovalListResponse>(
        `/products/approvals?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get approval requests:', error);
      throw error;
    }
  }

  async getMyApprovals(page = 1, perPage = 20): Promise<ApprovalListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await tenantApiClient.get<ApprovalListResponse>(
        `/products/approvals/my-approvals?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get my approvals:', error);
      throw error;
    }
  }

  async getApprovalRequest(requestId: string): Promise<ApprovalRequest> {
    try {
      const response = await tenantApiClient.get<{ request: ApprovalRequest }>(
        `/products/approvals/${requestId}`
      );
      
      return response.data.request;
    } catch (error) {
      console.error('Failed to get approval request:', error);
      throw error;
    }
  }

  async createApprovalRequest(data: CreateApprovalRequestData): Promise<ApprovalRequest> {
    try {
      const response = await tenantApiClient.post<{ request: ApprovalRequest }>(
        '/products/approvals',
        data
      );
      
      return response.data.request;
    } catch (error) {
      console.error('Failed to create approval request:', error);
      throw error;
    }
  }

  async approveRequest(requestId: string, comments?: string): Promise<ApprovalRequest> {
    try {
      const response = await tenantApiClient.post<{ request: ApprovalRequest }>(
        `/products/approvals/${requestId}/approve`,
        { comments }
      );
      
      return response.data.request;
    } catch (error) {
      console.error('Failed to approve request:', error);
      throw error;
    }
  }

  async rejectRequest(requestId: string, comments?: string): Promise<ApprovalRequest> {
    try {
      const response = await tenantApiClient.post<{ request: ApprovalRequest }>(
        `/products/approvals/${requestId}/reject`,
        { comments }
      );
      
      return response.data.request;
    } catch (error) {
      console.error('Failed to reject request:', error);
      throw error;
    }
  }

  async cancelRequest(requestId: string): Promise<ApprovalRequest> {
    try {
      const response = await tenantApiClient.post<{ request: ApprovalRequest }>(
        `/products/approvals/${requestId}/cancel`
      );
      
      return response.data.request;
    } catch (error) {
      console.error('Failed to cancel request:', error);
      throw error;
    }
  }

  async getStats(): Promise<ApprovalStatsResponse> {
    try {
      const response = await tenantApiClient.get<ApprovalStatsResponse>(
        '/products/approvals/stats'
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get approval stats:', error);
      throw error;
    }
  }

  async getRules(page = 1, perPage = 20): Promise<ApprovalRuleListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await tenantApiClient.get<ApprovalRuleListResponse>(
        `/products/approval-rules?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get approval rules:', error);
      throw error;
    }
  }

  async getRule(ruleId: string): Promise<ApprovalRule> {
    try {
      const response = await tenantApiClient.get<{ rule: ApprovalRule }>(
        `/products/approval-rules/${ruleId}`
      );
      
      return response.data.rule;
    } catch (error) {
      console.error('Failed to get approval rule:', error);
      throw error;
    }
  }

  async createRule(rule: Partial<ApprovalRule>): Promise<ApprovalRule> {
    try {
      const response = await tenantApiClient.post<{ rule: ApprovalRule }>(
        '/products/approval-rules',
        rule
      );
      
      return response.data.rule;
    } catch (error) {
      console.error('Failed to create approval rule:', error);
      throw error;
    }
  }

  async updateRule(ruleId: string, updates: Partial<ApprovalRule>): Promise<ApprovalRule> {
    try {
      const response = await tenantApiClient.put<{ rule: ApprovalRule }>(
        `/products/approval-rules/${ruleId}`,
        updates
      );
      
      return response.data.rule;
    } catch (error) {
      console.error('Failed to update approval rule:', error);
      throw error;
    }
  }

  async deleteRule(ruleId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/approval-rules/${ruleId}`);
    } catch (error) {
      console.error('Failed to delete approval rule:', error);
      throw error;
    }
  }

  async toggleRuleStatus(ruleId: string, isActive: boolean): Promise<ApprovalRule> {
    try {
      const response = await tenantApiClient.patch<{ rule: ApprovalRule }>(
        `/products/approval-rules/${ruleId}/toggle`,
        { isActive }
      );
      
      return response.data.rule;
    } catch (error) {
      console.error('Failed to toggle rule status:', error);
      throw error;
    }
  }
}

export const approvalService = new ApprovalService();
