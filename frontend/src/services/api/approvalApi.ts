import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface PendingApproval {
  id: number;
  uuid: string;
  quote_number: string;
  order_number: string;
  customer_name: string;
  grand_total: number;
  status: string;
  created_at: string;
  time_since_accepted: string;
  approval_reason: string;
  customer_trust_indicators: {
    email_verified: boolean;
    successful_orders: number;
    payment_success_rate: number;
  };
}

export interface ApprovalSettings {
  auto_approval_enabled: boolean;
  auto_approval_threshold: number;
  require_email_verification: boolean;
  min_successful_orders: number;
  min_payment_success_rate: number;
  auto_approve_standard_products: boolean;
  require_approval_custom_products: boolean;
  max_negotiation_rounds: number;
  allow_customer_counter_offer: boolean;
  notify_admin_on_auto_approve: boolean;
  notify_admin_on_pending_approval: boolean;
}

export const approvalApi = {
  // Get pending approvals
  getPending: async (): Promise<{ data: PendingApproval[] }> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/tenant/approvals/pending`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Alias for compatibility
  getPendingApprovals: async (): Promise<{ data: PendingApproval[] }> => {
    return approvalApi.getPending();
  },

  // Approve quote
  approve: async (uuid: string, notes?: string): Promise<{ message: string }> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/tenant/approvals/${uuid}/approve`,
      { notes },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  },

  // Alias for compatibility
  approveQuote: async (uuid: string, notes?: string): Promise<{ message: string }> => {
    return approvalApi.approve(uuid, notes);
  },

  // Reject quote
  reject: async (uuid: string, reason: string): Promise<{ message: string }> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/tenant/approvals/${uuid}/reject`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  },

  // Alias for compatibility
  rejectQuote: async (uuid: string, reason: string): Promise<{ message: string }> => {
    return approvalApi.reject(uuid, reason);
  },

  // Get approval settings
  getSettings: async (): Promise<{ data: ApprovalSettings }> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/tenant/approvals/settings`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Update approval settings
  updateSettings: async (settings: Partial<ApprovalSettings>): Promise<{ message: string; data: ApprovalSettings }> => {
    const response = await axios.put(`${API_BASE_URL}/api/v1/tenant/approvals/settings`, settings, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },
};
