import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface CustomerQuote {
  id: number;
  uuid: string;
  quote_number: string;
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'viewed' | 'countered' | 'pending_approval' | 'accepted' | 'rejected' | 'expired';
  grand_total: number;
  valid_until: string;
  created_at: string;
  order?: any;
  pricing?: {
    vendor_total_cost: number;
    base_profit_amount: number;
    subtotal: number;
    tax_amount: number;
    grand_total: number;
  };
  terms?: {
    payment_terms: string;
    delivery_timeline?: string;
    terms_and_conditions?: string;
  };
  negotiation?: {
    counter_offer_amount?: number;
    counter_offer_round: number;
    max_negotiation_rounds: number;
  };
  approval?: {
    approval_method?: 'auto' | 'manual';
    approval_reason?: string;
  };
}

export interface CustomerQuoteListResponse {
  data: CustomerQuote[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateCustomerQuoteData {
  order_id: string;
  vendor_quote_id: string;
  additional_costs: {
    handling_fee?: number;
    shipping_cost?: number;
    insurance?: number;
    other_costs?: number;
    other_costs_description?: string;
  };
  terms: {
    valid_until: string;
    payment_terms: string;
    delivery_timeline?: string;
    terms_and_conditions?: string;
  };
}

export const customerQuoteApi = {
  // List customer quotes
  list: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }): Promise<CustomerQuoteListResponse> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/tenant/customer-quotes`, {
      params,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Get single customer quote
  get: async (uuid: string): Promise<{ data: CustomerQuote }> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/tenant/customer-quotes/${uuid}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Alias for compatibility
  getQuoteById: async (uuid: string): Promise<{ data: CustomerQuote }> => {
    return customerQuoteApi.get(uuid);
  },

  // Create customer quote
  create: async (data: CreateCustomerQuoteData): Promise<{ data: CustomerQuote }> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/tenant/customer-quotes`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Send customer quote
  send: async (uuid: string): Promise<{ message: string; data: CustomerQuote }> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/tenant/customer-quotes/${uuid}/send`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  },

  // Alias for compatibility
  sendQuote: async (uuid: string): Promise<{ message: string; data: CustomerQuote }> => {
    return customerQuoteApi.send(uuid);
  },

  // Delete customer quote
  delete: async (uuid: string): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_BASE_URL}/api/v1/tenant/customer-quotes/${uuid}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Alias for compatibility
  deleteQuote: async (uuid: string): Promise<{ message: string }> => {
    return customerQuoteApi.delete(uuid);
  },

  // Generate document
  generateDocument: async (uuid: string, type: 'quotation' | 'proforma_invoice'): Promise<{ data: any }> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/tenant/customer-quotes/${uuid}/documents/${type}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  },
};
