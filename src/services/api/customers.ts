import apiClient from './client';
import { PaginatedResponse, ListRequestParams } from '@/types/api';

export interface Customer {
  id: string;
  uuid: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  company?: string;
  type: 'individual' | 'business';
  status: 'active' | 'inactive' | 'suspended';
  segment?: string;
  lifetime_value?: number;
  total_orders?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerFilters extends ListRequestParams {
  status?: string;
  type?: string;
  segment?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  company?: string;
  type: 'individual' | 'business';
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  company?: string;
  status?: string;
}

class CustomersService {
  async getCustomers(filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.segment) params.append('segment', filters.segment);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
    }

    const response = await apiClient.get<PaginatedResponse<Customer>>(
      `/customers?${params.toString()}`
    );
    return response;
  }

  async getCustomerById(id: string): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response;
  }

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', data);
    return response;
  }

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data);
    return response;
  }

  async deleteCustomer(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/customers/${id}`);
    return response;
  }

  async getCustomerOrders(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/customers/${id}/orders`);
    return response;
  }

  async getCustomerSegment(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/customers/${id}/segment`);
    return response;
  }
}

export const customersService = new CustomersService();
export default customersService;
