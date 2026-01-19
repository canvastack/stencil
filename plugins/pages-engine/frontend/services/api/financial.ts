import apiClient from './client';
import { PaginatedResponse, ListRequestParams } from '@/types/api';

export interface Transaction {
  id: string;
  uuid: string;
  tenant_id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  order_id?: string;
  vendor_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialFilters extends ListRequestParams {
  type?: 'income' | 'expense' | 'all';
  category?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface FinancialSummary {
  total_income: number;
  total_expense: number;
  net_profit: number;
  transaction_count: number;
  period_comparison: {
    income_change: number;
    expense_change: number;
    profit_change: number;
  };
}

export interface FinancialReport {
  summary: FinancialSummary;
  transactions: PaginatedResponse<Transaction>;
  categories: Array<{
    category: string;
    type: 'income' | 'expense';
    amount: number;
    count: number;
  }>;
  payment_methods: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

class FinancialService {
  async getTransactions(filters?: FinancialFilters): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.payment_method) params.append('payment_method', filters.payment_method);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.period) params.append('period', filters.period);
    }

    const response = await apiClient.get<PaginatedResponse<Transaction>>(
      `/financial/transactions?${params.toString()}`
    );
    return response;
  }

  async getFinancialSummary(filters?: Pick<FinancialFilters, 'date_from' | 'date_to' | 'period'>): Promise<FinancialSummary> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.period) params.append('period', filters.period);
    }

    const response = await apiClient.get<FinancialSummary>(
      `/financial/summary?${params.toString()}`
    );
    return response;
  }

  async getFinancialReport(filters?: FinancialFilters): Promise<FinancialReport> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.period) params.append('period', filters.period);
    }

    const response = await apiClient.get<FinancialReport>(
      `/financial/report?${params.toString()}`
    );
    return response;
  }

  async exportTransactions(filters?: FinancialFilters, format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.payment_method) params.append('payment_method', filters.payment_method);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.period) params.append('period', filters.period);
    }

    params.append('format', format);

    const response = await apiClient.get(`/financial/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  }
}

export const financialService = new FinancialService();
export default financialService;