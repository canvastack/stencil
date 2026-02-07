import axios from 'axios';
import type { Quote } from '@/types/quote';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ListQuotesParams {
  vendor_id?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

interface ListQuotesResponse {
  data: Quote[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface AcceptQuoteData {
  notes?: string;
  estimated_delivery_days?: number;
}

interface RejectQuoteData {
  reason: string;
}

interface CounterQuoteData {
  counter_offer: number;
  notes?: string;
  estimated_delivery_days?: number;
}

export const quoteApi = {
  /**
   * List quotes for admin
   */
  listQuotes: async (params?: ListQuotesParams): Promise<ListQuotesResponse> => {
    const response = await axios.get(`${API_BASE_URL}/api/quotes`, { params });
    return response.data;
  },

  /**
   * List quotes for vendor
   */
  listVendorQuotes: async (params?: ListQuotesParams): Promise<ListQuotesResponse> => {
    const response = await axios.get(`${API_BASE_URL}/api/quotes/vendor/list`, { params });
    return response.data;
  },

  /**
   * Get quote by UUID
   */
  getQuote: async (uuid: string): Promise<{ data: Quote }> => {
    const response = await axios.get(`${API_BASE_URL}/api/quotes/${uuid}`);
    return response.data;
  },

  /**
   * Create a new quote
   */
  createQuote: async (data: any): Promise<{ data: Quote }> => {
    const response = await axios.post(`${API_BASE_URL}/api/quotes`, data);
    return response.data;
  },

  /**
   * Update a quote
   */
  updateQuote: async (uuid: string, data: any): Promise<{ data: Quote }> => {
    const response = await axios.put(`${API_BASE_URL}/api/quotes/${uuid}`, data);
    return response.data;
  },

  /**
   * Delete a quote
   */
  deleteQuote: async (uuid: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/quotes/${uuid}`);
  },

  /**
   * Send quote to vendor
   */
  sendToVendor: async (uuid: string): Promise<{ data: Quote; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/quotes/${uuid}/send-to-vendor`);
    return response.data;
  },

  /**
   * Admin accepts a quote
   */
  adminAcceptQuote: async (uuid: string): Promise<{ data: Quote; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/quotes/${uuid}/accept`);
    return response.data;
  },

  /**
   * Admin rejects a quote
   */
  adminRejectQuote: async (uuid: string, data: RejectQuoteData): Promise<{ data: Quote; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/quotes/${uuid}/reject`, data);
    return response.data;
  },

  /**
   * Admin counters a quote
   */
  adminCounterQuote: async (uuid: string, data: CounterQuoteData): Promise<{ data: Quote; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/quotes/${uuid}/counter`, data);
    return response.data;
  },

  /**
   * Vendor accepts a quote
   */
  acceptQuote: async (uuid: string, data: AcceptQuoteData): Promise<{ data: Quote; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/quotes/${uuid}/vendor/accept`, data);
    return response.data;
  },

  /**
   * Vendor rejects a quote
   */
  rejectQuote: async (uuid: string, data: RejectQuoteData): Promise<{ data: Quote; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/quotes/${uuid}/vendor/reject`, data);
    return response.data;
  },

  /**
   * Vendor submits counter offer
   */
  counterQuote: async (uuid: string, data: CounterQuoteData): Promise<{ data: Quote; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/quotes/${uuid}/vendor/counter`, data);
    return response.data;
  },

  /**
   * Update quote status
   */
  updateStatus: async (uuid: string, status: string, reason?: string): Promise<{ data: Quote; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/quotes/${uuid}/update-status`, {
      status,
      reason
    });
    return response.data;
  },

  /**
   * Get quote statistics
   */
  getStatistics: async (): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/api/quotes/statistics`);
    return response.data;
  }
};
