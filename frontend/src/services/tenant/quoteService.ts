import { tenantApiClient } from './tenantApiClient';

export interface Quote {
  id: string;
  quote_number: string;
  order_id?: string;
  customer_id: string;
  vendor_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'revised' | 'expired';
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  currency: string;
  valid_until: string;
  terms_and_conditions?: string;
  notes?: string;
  revision_number: number;
  parent_quote_id?: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  customer: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  
  vendor: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  
  items: QuoteItem[];
  revision_history?: Quote[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  vendor_cost?: number;
  total_price: number;
  specifications?: Record<string, any>;
  notes?: string;
  
  // Relationship
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

export interface CreateQuoteRequest {
  order_id?: string;
  customer_id: string;
  vendor_id: string;
  title: string;
  description?: string;
  valid_until: string;
  terms_and_conditions?: string;
  notes?: string;
  items: Omit<QuoteItem, 'id' | 'quote_id'>[];
}

export interface UpdateQuoteRequest {
  title?: string;
  description?: string;
  valid_until?: string;
  terms_and_conditions?: string;
  notes?: string;
  items?: Omit<QuoteItem, 'id' | 'quote_id'>[];
}

export interface QuoteResponse {
  action: 'accept' | 'reject' | 'revise';
  response_notes?: string;
  revision_request?: string;
}

export interface QuoteListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: Quote['status'];
  customer_id?: string;
  vendor_id?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'quote_number' | 'created_at' | 'total_amount' | 'valid_until';
  sort_order?: 'asc' | 'desc';
}

export interface QuoteListResponse {
  data: Quote[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

class QuoteService {
  private baseUrl = '/tenant/quotes';

  /**
   * Get paginated list of quotes with optional filtering
   */
  async getQuotes(params: QuoteListParams = {}): Promise<QuoteListResponse> {
    const response = await tenantApiClient.get(this.baseUrl, { params });
    return response;
  }

  /**
   * Get a specific quote by ID
   */
  async getQuote(id: string): Promise<Quote> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Create a new quote
   */
  async createQuote(data: CreateQuoteRequest): Promise<Quote> {
    const response = await tenantApiClient.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Update an existing quote
   */
  async updateQuote(id: string, data: UpdateQuoteRequest): Promise<Quote> {
    const response = await tenantApiClient.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a quote
   */
  async deleteQuote(id: string): Promise<void> {
    await tenantApiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Send quote to vendor
   */
  async sendQuote(id: string): Promise<Quote> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/send`);
    return response.data;
  }

  /**
   * Respond to a quote (accept, reject, or request revision)
   */
  async respondToQuote(id: string, response: QuoteResponse): Promise<Quote> {
    const apiResponse = await tenantApiClient.post(`${this.baseUrl}/${id}/respond`, response);
    return apiResponse.data;
  }

  /**
   * Create a revision of an existing quote
   */
  async createRevision(id: string, data: UpdateQuoteRequest): Promise<Quote> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/revise`, data);
    return response.data;
  }

  /**
   * Approve a quote (internal approval workflow)
   */
  async approveQuote(id: string, notes?: string): Promise<Quote> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/approve`, { notes });
    return response.data;
  }

  /**
   * Convert quote to order
   */
  async convertToOrder(id: string, orderData?: Record<string, any>): Promise<{ quote: Quote; order: any }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/convert-to-order`, orderData || {});
    return response.data;
  }

  /**
   * Get quote revision history
   */
  async getRevisionHistory(id: string): Promise<Quote[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}/revisions`);
    return response.data;
  }

  /**
   * Generate PDF for quote
   */
  async generatePDF(id: string): Promise<Blob> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}/pdf`, {
      responseType: 'blob',
    });
    return response;
  }

  /**
   * Send quote reminder
   */
  async sendReminder(id: string, message?: string): Promise<void> {
    await tenantApiClient.post(`${this.baseUrl}/${id}/remind`, { message });
  }

  /**
   * Get quote statistics
   */
  async getQuoteStats(params?: { 
    date_from?: string; 
    date_to?: string;
    vendor_id?: string;
    customer_id?: string;
  }): Promise<{
    total_quotes: number;
    accepted_quotes: number;
    rejected_quotes: number;
    pending_quotes: number;
    total_value: number;
    accepted_value: number;
    conversion_rate: number;
    average_response_time: number;
  }> {
    const response = await tenantApiClient.get(`${this.baseUrl}/stats`, { params });
    return response.data;
  }

  /**
   * Bulk operations on quotes
   */
  async bulkUpdate(ids: string[], data: { status?: Quote['status']; notes?: string }): Promise<Quote[]> {
    const response = await tenantApiClient.post(`${this.baseUrl}/bulk-update`, { ids, ...data });
    return response.data;
  }

  /**
   * Export quotes to CSV/Excel
   */
  async exportQuotes(params: QuoteListParams & { format: 'csv' | 'excel' }): Promise<Blob> {
    const response = await tenantApiClient.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob',
    });
    return response;
  }

  /**
   * Get available customers for quote creation
   */
  async getAvailableCustomers(search?: string): Promise<Quote['customer'][]> {
    const response = await tenantApiClient.get('/customers/for-quotes', {
      params: { search, limit: 50 }
    });
    return response.data;
  }

  /**
   * Get available vendors for quote creation
   */
  async getAvailableVendors(search?: string): Promise<Quote['vendor'][]> {
    const response = await tenantApiClient.get('/vendors/for-quotes', {
      params: { search, limit: 50 }
    });
    return response.data;
  }

  /**
   * Get available products for quote items
   */
  async getAvailableProducts(search?: string): Promise<QuoteItem['product'][]> {
    const response = await tenantApiClient.get('/products/for-quotes', {
      params: { search, limit: 100 }
    });
    return response.data;
  }
}

export const quoteService = new QuoteService();
export default quoteService;