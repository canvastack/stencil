import { tenantApiClient } from './tenantApiClient';

export interface QuoteItemFormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number';
  options?: Array<{ value: string; label: string }> | string[]; // Support both formats
  required?: boolean;
}

export interface QuoteItemFormSchema {
  fields: QuoteItemFormField[];
}

export interface QuoteItemSpecifications {
  [key: string]: string | number | boolean;
}

export interface Quote {
  id: string;
  quote_number: string;
  order_id?: string;
  customer_id: string;
  vendor_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'open' | 'sent' | 'countered' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
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
  history?: QuoteHistoryEntry[];
}

export interface QuoteHistoryEntry {
  action: string;
  user_id?: string;
  user_name?: string;
  vendor_id?: string;
  timestamp: string;
  old_value?: any;
  new_value?: any;
  notes?: string;
  ip_address?: string;
  previous_offer?: number;
  new_offer?: number;
  offer?: number;
  rejection_reason?: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  
  // Per-piece values (editable)
  unit_price: number;
  vendor_cost?: number;
  
  // Total values (calculated, read-only)
  total_vendor_cost: number;
  total_unit_price: number;
  total_price: number;
  
  // Profit margins
  profit_per_piece: number;
  profit_per_piece_percent: number;
  profit_total: number;
  profit_total_percent: number;
  
  // Dynamic form data
  specifications?: QuoteItemSpecifications;
  form_schema?: QuoteItemFormSchema;
  
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
   * Check if an active quote exists for the given order
   */
  async checkExisting(params: {
    order_id: string;
    vendor_id?: string;
    status?: string[];
  }): Promise<{
    has_active_quote: boolean;
    quote: Quote | null;
  }> {
    const response = await tenantApiClient.get(`${this.baseUrl}/check-existing`, { params });
    console.log('[quoteService.checkExisting] Response received:', {
      response,
      responseType: typeof response,
      responseKeys: response ? Object.keys(response) : [],
      hasData: response && 'data' in response,
      data: response?.data,
    });
    
    // Backend returns { data: { has_active_quote, quote } }
    // tenantApiClient preserves this structure for check-existing endpoint
    return response.data || { has_active_quote: false, quote: null };
  }

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
    // Interceptor already unwraps single resource { data: quote } → quote
    return response;
  }

  /**
   * Create a new quote
   */
  async createQuote(data: CreateQuoteRequest): Promise<Quote> {
    const response = await tenantApiClient.post(this.baseUrl, data);
    // Interceptor already unwraps single resource { data: quote } → quote
    return response;
  }

  /**
   * Update an existing quote
   */
  async updateQuote(id: string, data: UpdateQuoteRequest): Promise<Quote> {
    const response = await tenantApiClient.put(`${this.baseUrl}/${id}`, data);
    // Interceptor already unwraps single resource { data: quote } → quote
    return response;
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
    // Interceptor already unwraps single resource { data: quote } → quote
    return response;
  }

  /**
   * Respond to a quote (accept, reject, or request revision)
   */
  async respondToQuote(id: string, response: QuoteResponse): Promise<Quote> {
    const apiResponse = await tenantApiClient.post(`${this.baseUrl}/${id}/respond`, response);
    // Interceptor already unwraps single resource { data: quote } → quote
    return apiResponse;
  }

  /**
   * Accept a quote
   */
  async acceptQuote(id: string, notes?: string): Promise<Quote> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/accept`, { notes });
    // Interceptor already unwraps single resource { data: quote } → quote
    return response;
  }

  /**
   * Reject a quote with reason
   */
  async rejectQuote(id: string, reason: string): Promise<Quote> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/reject`, { reason });
    // Interceptor already unwraps single resource { data: quote } → quote
    return response;
  }

  /**
   * Create counter offer for a quote
   */
  async counterQuote(id: string, price: number, notes?: string): Promise<Quote> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/counter`, {
      quoted_price: price,
      notes
    });
    // Interceptor already unwraps single resource { data: quote } → quote
    return response;
  }

  /**
   * Create a revision of an existing quote
   */
  async createRevision(id: string, data: UpdateQuoteRequest): Promise<Quote> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/revise`, data);
    // Interceptor already unwraps single resource { data: quote } → quote
    return response;
  }

  /**
   * Approve a quote (internal approval workflow)
   */
  async approveQuote(id: string, notes?: string): Promise<Quote> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/approve`, { notes });
    // Backend returns { data: quote }, so we need to access response.data.data
    return response.data?.data || response.data;
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
    // Backend returns { data: quotes }, so we need to access response.data.data
    return response.data?.data || response.data;
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
    // Backend returns { data: stats }, so we need to access response.data.data
    return response.data?.data || response.data;
  }

  /**
   * Bulk operations on quotes
   */
  async bulkUpdate(ids: string[], data: { status?: Quote['status']; notes?: string }): Promise<Quote[]> {
    const response = await tenantApiClient.post(`${this.baseUrl}/bulk-update`, { ids, ...data });
    // Backend returns { data: quotes }, so we need to access response.data.data
    return response.data?.data || response.data;
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
    // Backend returns { data: customers }, so we need to access response.data.data
    return response.data?.data || response.data;
  }

  /**
   * Get available vendors for quote creation
   */
  async getAvailableVendors(search?: string): Promise<Quote['vendor'][]> {
    const response = await tenantApiClient.get('/vendors/for-quotes', {
      params: { search, limit: 50 }
    });
    // Backend returns { data: vendors }, so we need to access response.data.data
    return response.data?.data || response.data;
  }

  /**
   * Get available products for quote items
   */
  async getAvailableProducts(search?: string): Promise<QuoteItem['product'][]> {
    const response = await tenantApiClient.get('/products/for-quotes', {
      params: { search, limit: 100 }
    });
    // Backend returns { data: products }, so we need to access response.data.data
    return response.data?.data || response.data;
  }
}

export const quoteService = new QuoteService();
export default quoteService;