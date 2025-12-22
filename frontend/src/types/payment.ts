export interface Payment {
  id: string;
  uuid: string;
  tenant_id: string;
  order_id: string;
  order_number?: string;
  customer_name?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_method: 'credit_card' | 'bank_transfer' | 'cash' | 'ewallet' | 'other';
  payment_gateway?: string;
  transaction_id?: string;
  reference_number?: string;
  notes?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRefund {
  id: string;
  uuid: string;
  payment_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  refund_method: 'original' | 'bank_transfer' | 'cash' | 'store_credit';
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  amount: number;
  currency?: string;
  payment_method: string;
  payment_gateway?: string;
  transaction_id?: string;
  reference_number?: string;
  notes?: string;
  paid_at?: string;
}

export interface UpdatePaymentRequest {
  amount?: number;
  status?: string;
  payment_method?: string;
  transaction_id?: string;
  reference_number?: string;
  notes?: string;
  paid_at?: string;
}

export interface CreateRefundRequest {
  payment_id: string;
  amount: number;
  reason: string;
  refund_method: string;
  notes?: string;
}

export interface PaymentSummary {
  total_payments: number;
  total_amount: number;
  pending_amount: number;
  completed_amount: number;
  refunded_amount: number;
  today_payments: number;
  today_amount: number;
}