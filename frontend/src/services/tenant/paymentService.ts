import { tenantApiClient } from './tenantApiClient';

export interface Payment {
  id: string;
  payment_reference: string;
  invoice_id?: string;
  order_id?: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_company?: string;
  
  // Payment Details
  amount: number;
  currency: string;
  payment_method: 'bank_transfer' | 'credit_card' | 'debit_card' | 'cash' | 'check' | 'digital_wallet' | 'crypto' | 'paypal' | 'gopay' | 'ovo' | 'dana' | 'shopeepay';
  payment_gateway?: string;
  transaction_id?: string;
  gateway_reference?: string;
  
  // Status and Lifecycle
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partial_refunded';
  payment_date?: string;
  processed_date?: string;
  failed_date?: string;
  
  // Financial Information
  fee_amount?: number;
  tax_amount?: number;
  net_amount: number;
  refunded_amount?: number;
  
  // Verification and Security
  verification_status: 'pending' | 'verified' | 'rejected' | 'fraud_detected';
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  
  // Additional Information
  description?: string;
  notes?: string;
  internal_notes?: string;
  receipt_url?: string;
  proof_of_payment?: string;
  
  // Bank Transfer Specific
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  transfer_slip_url?: string;
  
  // Credit Card Specific
  card_last_four?: string;
  card_type?: string;
  card_expiry_month?: number;
  card_expiry_year?: string;
  
  // Risk Management
  risk_score?: number;
  fraud_indicators?: string[];
  ip_address?: string;
  user_agent?: string;
  
  // Metadata
  created_by: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  customer: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  
  invoice?: {
    id: string;
    invoice_number: string;
    total_amount: number;
  };
  
  order?: {
    id: string;
    order_number: string;
    total_amount: number;
  };
  
  refunds: PaymentRefund[];
}

export interface PaymentRefund {
  id: string;
  payment_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed' | 'cancelled';
  refund_method: 'original' | 'bank_transfer' | 'cash' | 'store_credit';
  refund_reference?: string;
  gateway_refund_id?: string;
  processed_date?: string;
  notes?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  invoice_id?: string;
  order_id?: string;
  customer_id: string;
  amount: number;
  currency?: string;
  payment_method: Payment['payment_method'];
  payment_gateway?: string;
  description?: string;
  notes?: string;
  
  // Bank Transfer Specific
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  
  // Scheduled Payment
  scheduled_date?: string;
  auto_verify?: boolean;
}

export interface UpdatePaymentRequest {
  status?: Payment['status'];
  payment_date?: string;
  transaction_id?: string;
  gateway_reference?: string;
  notes?: string;
  internal_notes?: string;
  receipt_url?: string;
  proof_of_payment?: string;
  
  // Bank Transfer Updates
  transfer_slip_url?: string;
  
  // Verification Updates
  verification_status?: Payment['verification_status'];
  verification_notes?: string;
}

export interface ProcessPaymentRequest {
  payment_gateway?: string;
  gateway_config?: Record<string, any>;
  auto_verify?: boolean;
  send_receipt?: boolean;
  receipt_email?: string;
}

export interface VerifyPaymentRequest {
  verification_status: Payment['verification_status'];
  verification_notes?: string;
  auto_process?: boolean;
}

export interface RefundPaymentRequest {
  amount?: number; // Full refund if not specified
  reason: string;
  refund_method?: PaymentRefund['refund_method'];
  notes?: string;
}

export interface PaymentListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: Payment['status'];
  payment_method?: Payment['payment_method'];
  verification_status?: Payment['verification_status'];
  customer_id?: string;
  invoice_id?: string;
  order_id?: string;
  date_from?: string;
  date_to?: string;
  amount_from?: number;
  amount_to?: number;
  payment_gateway?: string;
  risk_level?: 'low' | 'medium' | 'high';
  sort_by?: 'created_at' | 'payment_date' | 'amount' | 'status' | 'verification_status';
  sort_order?: 'asc' | 'desc';
}

export interface PaymentListResponse {
  data: Payment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    summary?: {
      total_payments: number;
      total_amount: number;
      completed_amount: number;
      pending_amount: number;
      failed_amount: number;
      refunded_amount: number;
    };
  };
}

export interface PaymentStats {
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  refunded_payments: number;
  
  total_amount: number;
  completed_amount: number;
  pending_amount: number;
  failed_amount: number;
  refunded_amount: number;
  
  average_payment_amount: number;
  success_rate: number;
  failure_rate: number;
  refund_rate: number;
  
  // Payment Method Distribution
  payment_methods: Array<{
    method: Payment['payment_method'];
    count: number;
    amount: number;
    percentage: number;
  }>;
  
  // Gateway Performance
  gateway_stats: Array<{
    gateway: string;
    count: number;
    success_rate: number;
    average_processing_time: number;
  }>;
  
  // Risk Analysis
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'maintenance';
  supported_methods: Payment['payment_method'][];
  supported_currencies: string[];
  fee_percentage: number;
  fee_fixed: number;
  processing_time: string;
  configuration: Record<string, any>;
}

class PaymentService {
  private baseUrl = '/payments';

  /**
   * Get paginated list of payments with optional filtering
   */
  async getPayments(params: PaymentListParams = {}): Promise<PaymentListResponse> {
    const response = await tenantApiClient.get(this.baseUrl, { params });
    return response;
  }

  /**
   * Get a specific payment by ID
   */
  async getPayment(id: string): Promise<Payment> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Create a new payment record
   */
  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const response = await tenantApiClient.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Update an existing payment
   */
  async updatePayment(id: string, data: UpdatePaymentRequest): Promise<Payment> {
    const response = await tenantApiClient.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a payment (only if pending status)
   */
  async deletePayment(id: string): Promise<void> {
    await tenantApiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Process a payment through the gateway
   */
  async processPayment(id: string, data: ProcessPaymentRequest): Promise<Payment> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/process`, data);
    return response.data;
  }

  /**
   * Verify payment manually or automatically
   */
  async verifyPayment(id: string, data: VerifyPaymentRequest): Promise<Payment> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/verify`, data);
    return response.data;
  }

  /**
   * Mark payment as failed with reason
   */
  async failPayment(id: string, data: { reason: string; notes?: string }): Promise<Payment> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/fail`, data);
    return response.data;
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(id: string, reason?: string): Promise<Payment> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/cancel`, { reason });
    return response.data;
  }

  /**
   * Refund a completed payment (full or partial)
   */
  async refundPayment(id: string, data: RefundPaymentRequest): Promise<Payment> {
    const response = await tenantApiClient.post(`${this.baseUrl}/${id}/refund`, data);
    return response.data;
  }

  /**
   * Get payment refunds
   */
  async getPaymentRefunds(id: string): Promise<PaymentRefund[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}/refunds`);
    return response.data;
  }

  /**
   * Update refund status
   */
  async updateRefund(paymentId: string, refundId: string, data: {
    status?: PaymentRefund['status'];
    notes?: string;
    gateway_refund_id?: string;
  }): Promise<PaymentRefund> {
    const response = await tenantApiClient.put(`${this.baseUrl}/${paymentId}/refunds/${refundId}`, data);
    return response.data;
  }

  /**
   * Get payment verification queue
   */
  async getVerificationQueue(params?: {
    status?: Payment['verification_status'];
    risk_level?: 'low' | 'medium' | 'high';
    page?: number;
    per_page?: number;
  }): Promise<PaymentListResponse> {
    const response = await tenantApiClient.get(`${this.baseUrl}/verification-queue`, { params });
    return response;
  }

  /**
   * Bulk verify payments
   */
  async bulkVerifyPayments(ids: string[], data: {
    verification_status: Payment['verification_status'];
    verification_notes?: string;
    auto_process?: boolean;
  }): Promise<{ success: Payment[]; failed: Array<{ id: string; error: string }> }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/bulk-verify`, { ids, ...data });
    return response.data;
  }

  /**
   * Bulk process payments
   */
  async bulkProcessPayments(ids: string[], data: {
    payment_gateway?: string;
    auto_verify?: boolean;
  }): Promise<{ success: Payment[]; failed: Array<{ id: string; error: string }> }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/bulk-process`, { ids, ...data });
    return response.data;
  }

  /**
   * Get payment statistics and analytics
   */
  async getPaymentStats(params?: { 
    date_from?: string; 
    date_to?: string;
    customer_id?: string;
    payment_method?: Payment['payment_method'];
    payment_gateway?: string;
  }): Promise<PaymentStats> {
    const response = await tenantApiClient.get(`${this.baseUrl}/stats`, { params });
    return response.data;
  }

  /**
   * Get available payment gateways
   */
  async getPaymentGateways(): Promise<PaymentGateway[]> {
    const response = await tenantApiClient.get('/payment-gateways');
    return response.data;
  }

  /**
   * Get payment gateway by ID
   */
  async getPaymentGateway(id: string): Promise<PaymentGateway> {
    const response = await tenantApiClient.get(`/payment-gateways/${id}`);
    return response.data;
  }

  /**
   * Test payment gateway connection
   */
  async testGatewayConnection(gatewayId: string): Promise<{
    success: boolean;
    response_time: number;
    message: string;
    details?: Record<string, any>;
  }> {
    const response = await tenantApiClient.post(`/payment-gateways/${gatewayId}/test`);
    return response.data;
  }

  /**
   * Get payment receipt
   */
  async getPaymentReceipt(id: string, format: 'pdf' | 'html' = 'pdf'): Promise<Blob> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}/receipt`, {
      params: { format },
      responseType: 'blob',
    });
    return response;
  }

  /**
   * Send payment receipt via email
   */
  async sendPaymentReceipt(id: string, data: {
    email?: string;
    custom_message?: string;
    include_proof?: boolean;
  }): Promise<void> {
    await tenantApiClient.post(`${this.baseUrl}/${id}/send-receipt`, data);
  }

  /**
   * Export payments to CSV/Excel
   */
  async exportPayments(params: PaymentListParams & { format: 'csv' | 'excel' | 'pdf' }): Promise<Blob> {
    const response = await tenantApiClient.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob',
    });
    return response;
  }

  /**
   * Get payment timeline/audit trail
   */
  async getPaymentTimeline(id: string): Promise<Array<{
    id: string;
    event: string;
    description: string;
    timestamp: string;
    user?: string;
    data?: Record<string, any>;
  }>> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}/timeline`);
    return response.data;
  }

  /**
   * Create payment from invoice
   */
  async createFromInvoice(invoiceId: string, data: {
    payment_method: Payment['payment_method'];
    payment_gateway?: string;
    amount?: number; // Partial payment if specified
    notes?: string;
    auto_verify?: boolean;
  }): Promise<Payment> {
    const response = await tenantApiClient.post(`/invoices/${invoiceId}/create-payment`, data);
    return response.data;
  }

  /**
   * Create payment from order
   */
  async createFromOrder(orderId: string, data: {
    payment_method: Payment['payment_method'];
    payment_gateway?: string;
    amount?: number; // Partial payment if specified
    notes?: string;
    auto_verify?: boolean;
  }): Promise<Payment> {
    const response = await tenantApiClient.post(`/orders/${orderId}/create-payment`, data);
    return response.data;
  }

  /**
   * Get fraud analysis for payment
   */
  async getFraudAnalysis(id: string): Promise<{
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high';
    indicators: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      confidence: number;
    }>;
    recommendation: 'approve' | 'review' | 'reject';
    details: Record<string, any>;
  }> {
    const response = await tenantApiClient.get(`${this.baseUrl}/${id}/fraud-analysis`);
    return response.data;
  }

  /**
   * Schedule automatic payment reconciliation
   */
  async scheduleReconciliation(data: {
    payment_gateway?: string;
    date_from: string;
    date_to: string;
    auto_process?: boolean;
    notify_email?: string;
  }): Promise<{
    job_id: string;
    scheduled_at: string;
    estimated_completion: string;
  }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/schedule-reconciliation`, data);
    return response.data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;