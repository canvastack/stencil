import apiClient from './client';
import { PaginatedResponse, ListRequestParams } from '@/types/api';

export interface Payment {
  id: string;
  uuid: string;
  tenant_id: string;
  order_id: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'credit_card' | 'midtrans' | 'xendit' | 'other';
  status: 'pending' | 'verified' | 'failed' | 'cancelled';
  reference_number?: string;
  notes?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentFilters extends ListRequestParams {
  status?: string;
  method?: string;
  order_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  amount: number;
  method: string;
  reference_number?: string;
  notes?: string;
}

export interface UpdatePaymentRequest {
  status?: string;
  verified_at?: string;
  notes?: string;
}

export interface RefundRequest {
  amount?: number;
  reason: string;
  notes?: string;
}

export interface Refund {
  id: string;
  uuid: string;
  payment_id: string;
  order_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'failed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

class PaymentsService {
  async getPayments(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      if (filters.status) params.append('status', filters.status);
      if (filters.method) params.append('method', filters.method);
      if (filters.order_id) params.append('order_id', filters.order_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
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

  async verifyPayment(id: string): Promise<Payment> {
    const response = await apiClient.post<Payment>(`/payments/${id}/verify`, {});
    return response;
  }

  async requestRefund(paymentId: string, data: RefundRequest): Promise<Refund> {
    const response = await apiClient.post<Refund>(`/payments/${paymentId}/refund`, data);
    return response;
  }

  async getRefunds(filters?: PaymentFilters): Promise<PaginatedResponse<Refund>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.status) params.append('status', filters.status);
    }

    const response = await apiClient.get<PaginatedResponse<Refund>>(
      `/refunds?${params.toString()}`
    );
    return response;
  }

  async getRefundById(id: string): Promise<Refund> {
    const response = await apiClient.get<Refund>(`/refunds/${id}`);
    return response;
  }

  async approveRefund(id: string): Promise<Refund> {
    const response = await apiClient.post<Refund>(`/refunds/${id}/approve`, {});
    return response;
  }

  async rejectRefund(id: string, reason?: string): Promise<Refund> {
    const response = await apiClient.post<Refund>(`/refunds/${id}/reject`, { reason });
    return response;
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;
