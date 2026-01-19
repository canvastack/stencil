import { apiClient } from './client';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import {
  Payment,
  PaymentRefund,
  PaymentSummary,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  CreateRefundRequest
} from '@/types/payment';

export interface PaymentFilters extends ListRequestParams {
  status?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  order_id?: string;
  customer_name?: string;
}

class PaymentsService {
  async getPayments(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.payment_method) params.append('payment_method', filters.payment_method);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.order_id) params.append('order_id', filters.order_id);
      if (filters.customer_name) params.append('customer_name', filters.customer_name);
    }

    const response = await apiClient.get<PaginatedResponse<Payment>>(
      `/payments?${params.toString()}`
    );
    return response;
  }

  async getPaymentById(id: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response;
  }

  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const response = await apiClient.post<Payment>('/payments', data);
    return response;
  }

  async updatePayment(id: string, data: UpdatePaymentRequest): Promise<Payment> {
    const response = await apiClient.put<Payment>(`/payments/${id}`, data);
    return response;
  }

  async deletePayment(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/payments/${id}`);
    return response;
  }

  async getOrderPayments(orderId: string): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>(`/orders/${orderId}/payments`);
    return response;
  }

  async createRefund(data: CreateRefundRequest): Promise<PaymentRefund> {
    const response = await apiClient.post<PaymentRefund>('/payments/refunds', data);
    return response;
  }

  async getRefunds(filters?: ListRequestParams): Promise<PaginatedResponse<PaymentRefund>> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
    }

    const response = await apiClient.get<PaginatedResponse<PaymentRefund>>(
      `/payments/refunds?${params.toString()}`
    );
    return response;
  }

  async updateRefund(id: string, data: { status: string; notes?: string }): Promise<PaymentRefund> {
    const response = await apiClient.put<PaymentRefund>(`/payments/refunds/${id}`, data);
    return response;
  }

  async getPaymentSummary(): Promise<PaymentSummary> {
    const response = await apiClient.get<PaymentSummary>('/payments/summary');
    return response;
  }

  // Mock data for development
  private generateMockPayments(): Payment[] {
    return [
      {
        id: '1',
        uuid: 'pay_001',
        tenant_id: 'tenant_1',
        order_id: 'order_001',
        order_number: 'ORD-2024-001',
        customer_name: 'John Doe',
        amount: 250000,
        currency: 'IDR',
        status: 'completed',
        payment_method: 'credit_card',
        payment_gateway: 'Stripe',
        transaction_id: 'txn_123456',
        reference_number: 'REF001',
        paid_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        uuid: 'pay_002',
        tenant_id: 'tenant_1',
        order_id: 'order_002',
        order_number: 'ORD-2024-002',
        customer_name: 'Jane Smith',
        amount: 150000,
        currency: 'IDR',
        status: 'pending',
        payment_method: 'bank_transfer',
        reference_number: 'REF002',
        created_at: '2024-01-16T09:00:00Z',
        updated_at: '2024-01-16T09:00:00Z',
      },
    ];
  }

  // Development method - will be replaced with real API
  async getMockPayments(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
    let payments = this.generateMockPayments();
    
    // Apply filters
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      payments = payments.filter(p => 
        p.order_number?.toLowerCase().includes(search) ||
        p.customer_name?.toLowerCase().includes(search) ||
        p.reference_number?.toLowerCase().includes(search)
      );
    }
    
    if (filters?.status) {
      payments = payments.filter(p => p.status === filters.status);
    }
    
    if (filters?.payment_method) {
      payments = payments.filter(p => p.payment_method === filters.payment_method);
    }

    const total = payments.length;
    const page = filters?.page || 1;
    const per_page = filters?.per_page || 10;
    const start = (page - 1) * per_page;
    const end = start + per_page;
    
    return {
      data: payments.slice(start, end),
      current_page: page,
      per_page: per_page,
      total: total,
      last_page: Math.ceil(total / per_page),
    };
  }
}

export const paymentsService = new PaymentsService();