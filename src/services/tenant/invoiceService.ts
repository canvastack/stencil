import { tenantApiClient } from './tenantApiClient';

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id?: string;
  quote_id?: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_company?: string;
  customer_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  
  // Invoice Details
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'partial_paid' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  
  // Financial Information
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  currency: string;
  
  // Dates
  invoice_date: string;
  due_date: string;
  sent_date?: string;
  paid_date?: string;
  
  // Terms and Notes
  terms_and_conditions?: string;
  notes?: string;
  payment_instructions?: string;
  
  // Metadata
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  customer: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  
  items: InvoiceItem[];
  payments: InvoicePayment[];
  
  // Additional Properties
  reference_number?: string;
  purchase_order_number?: string;
  tax_rate?: number;
  discount_rate?: number;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_amount: number;
  discount_amount: number;
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

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'check' | 'digital_wallet';
  amount: number;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceRequest {
  customer_id: string;
  order_id?: string;
  quote_id?: string;
  title: string;
  description?: string;
  due_date: string;
  terms_and_conditions?: string;
  notes?: string;
  payment_instructions?: string;
  reference_number?: string;
  purchase_order_number?: string;
  tax_rate?: number;
  discount_rate?: number;
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'tax_amount' | 'total_price' | 'discount_amount'>[];
}

export interface UpdateInvoiceRequest {
  title?: string;
  description?: string;
  due_date?: string;
  terms_and_conditions?: string;
  notes?: string;
  payment_instructions?: string;
  reference_number?: string;
  purchase_order_number?: string;
  tax_rate?: number;
  discount_rate?: number;
  items?: Omit<InvoiceItem, 'id' | 'invoice_id' | 'tax_amount' | 'total_price' | 'discount_amount'>[];
}

export interface RecordPaymentRequest {
  payment_method: InvoicePayment['payment_method'];
  amount: number;
  payment_date: string;
  reference_number?: string;
  notes?: string;
}

export interface InvoiceListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: Invoice['status'];
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  overdue?: boolean;
  sort_by?: 'invoice_number' | 'created_at' | 'due_date' | 'total_amount' | 'balance_due';
  sort_order?: 'asc' | 'desc';
}

export interface InvoiceListResponse {
  data: Invoice[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    summary?: {
      total_invoices: number;
      total_amount: number;
      paid_amount: number;
      outstanding_amount: number;
      overdue_amount: number;
    };
  };
}

export interface InvoiceStats {
  total_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  draft_invoices: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  overdue_amount: number;
  average_payment_time: number; // in days
  collection_rate: number; // percentage
}

class InvoiceService {
  private baseUrl = '/tenant/invoices';

  /**
   * Get paginated list of invoices with optional filtering
   */
  async getInvoices(params: InvoiceListParams = {}): Promise<InvoiceListResponse> {
    const response = await tenantApiClient.get(this.baseUrl, { params });
    return response;
  }

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    const response = await tenantApiClient.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(id: string, data: UpdateInvoiceRequest): Promise<Invoice> {
    const response = await tenantApiClient.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Delete an invoice (only if not sent or paid)
   */
  async deleteInvoice(id: string): Promise<void> {
    await tenantApiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Send invoice to customer via email
   */
  async sendInvoice(id: string, customMessage?: string): Promise<Invoice> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/send`, { 
      message: customMessage 
    });
    return response.data;
  }

  /**
   * Mark invoice as sent manually
   */
  async markAsSent(id: string): Promise<Invoice> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/mark-sent`);
    return response.data;
  }

  /**
   * Record a payment against the invoice
   */
  async recordPayment(id: string, data: RecordPaymentRequest): Promise<Invoice> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/payments`, data);
    return response.data;
  }

  /**
   * Update payment status
   */
  async updatePayment(invoiceId: string, paymentId: string, data: { 
    status?: InvoicePayment['status']; 
    notes?: string; 
  }): Promise<Invoice> {
    const response = await tenantApiClient.put(`${this.baseUrl}/${invoiceId}/payments/${paymentId}`, data);
    return response.data;
  }

  /**
   * Delete a payment record
   */
  async deletePayment(invoiceId: string, paymentId: string): Promise<Invoice> {
    const response = await tenantApiClient.delete(`${this.baseUrl}/${invoiceId}/payments/${paymentId}`);
    return response.data;
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string, paymentData?: RecordPaymentRequest): Promise<Invoice> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/mark-paid`, paymentData);
    return response.data;
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(id: string, reason?: string): Promise<Invoice> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/cancel`, { reason });
    return response.data;
  }

  /**
   * Create a credit note for full or partial refund
   */
  async createCreditNote(id: string, data: {
    amount?: number;
    reason: string;
    items?: Array<{ item_id: string; quantity: number; }>;
  }): Promise<Invoice> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/credit-note`, data);
    return response.data;
  }

  /**
   * Duplicate an existing invoice
   */
  async duplicateInvoice(id: string, data?: { 
    invoice_date?: string; 
    due_date?: string;
    title?: string;
  }): Promise<Invoice> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/duplicate`, data);
    return response.data;
  }

  /**
   * Generate PDF for invoice
   */
  async generatePDF(id: string, options?: {
    template?: string;
    include_payments?: boolean;
  }): Promise<Blob> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}/pdf`, {
      params: options,
      responseType: 'blob',
    });
    return response;
  }

  /**
   * Send payment reminder
   */
  async sendReminder(id: string, reminderType: 'gentle' | 'firm' | 'final', customMessage?: string): Promise<void> {
    await tenantApiClient.post(`${this.baseUrl}/${id}/remind`, { 
      type: reminderType,
      message: customMessage 
    });
  }

  /**
   * Get invoice statistics and analytics
   */
  async getInvoiceStats(params?: { 
    date_from?: string; 
    date_to?: string;
    customer_id?: string;
  }): Promise<InvoiceStats> {
    const response = await tenantApiClient.get(`${this.baseUrl}/stats`, { params });
    return response.data;
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(params?: {
    days_overdue?: number;
    customer_id?: string;
    page?: number;
    per_page?: number;
  }): Promise<InvoiceListResponse> {
    const response = await tenantApiClient.get(`${this.baseUrl}/overdue`, { params });
    return response;
  }

  /**
   * Bulk operations on invoices
   */
  async bulkUpdate(ids: string[], data: { 
    status?: Invoice['status']; 
    due_date?: string;
    notes?: string;
  }): Promise<Invoice[]> {
    const response = await tenantApiClient.post(`${this.baseUrl}/bulk-update`, { ids, ...data });
    return response.data;
  }

  /**
   * Bulk send invoices
   */
  async bulkSend(ids: string[], customMessage?: string): Promise<{ 
    sent: Invoice[]; 
    failed: Array<{ id: string; error: string; }>;
  }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/bulk-send`, { 
      ids, 
      message: customMessage 
    });
    return response.data;
  }

  /**
   * Export invoices to CSV/Excel
   */
  async exportInvoices(params: InvoiceListParams & { format: 'csv' | 'excel' | 'pdf' }): Promise<Blob> {
    const response = await tenantApiClient.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob',
    });
    return response;
  }

  /**
   * Get available customers for invoice creation
   */
  async getAvailableCustomers(search?: string): Promise<Invoice['customer'][]> {
    const response = await tenantApiClient.get('/tenant/customers/for-invoices', {
      params: { search, limit: 50 }
    });
    return response.data;
  }

  /**
   * Get available products for invoice items
   */
  async getAvailableProducts(search?: string): Promise<InvoiceItem['product'][]> {
    const response = await tenantApiClient.get('/tenant/products/for-invoices', {
      params: { search, limit: 100 }
    });
    return response.data;
  }

  /**
   * Get payment methods and settings
   */
  async getPaymentMethods(): Promise<Array<{
    id: string;
    name: string;
    type: InvoicePayment['payment_method'];
    instructions?: string;
    enabled: boolean;
  }>> {
    const response = await tenantApiClient.get(`${this.baseUrl}/payment-methods`);
    return response.data;
  }

  /**
   * Create invoice from quote
   */
  async createFromQuote(quoteId: string, data?: {
    due_date?: string;
    terms_and_conditions?: string;
    notes?: string;
  }): Promise<Invoice> {
    const response = await tenantApiClient.post(`${this.baseUrl}/from-quote/${quoteId}`, data);
    return response.data;
  }

  /**
   * Create invoice from order
   */
  async createFromOrder(orderId: string, data?: {
    due_date?: string;
    terms_and_conditions?: string;
    notes?: string;
    partial_amount?: number;
  }): Promise<Invoice> {
    const response = await tenantApiClient.post(`${this.baseUrl}/from-order/${orderId}`, data);
    return response.data;
  }

  /**
   * Preview invoice calculations before creation/update
   */
  async previewCalculations(data: {
    items: Array<{ quantity: number; unit_price: number; }>;
    tax_rate?: number;
    discount_rate?: number;
  }): Promise<{
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
  }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/preview-calculations`, data);
    return response.data;
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;