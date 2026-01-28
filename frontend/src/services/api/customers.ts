import { tenantApiClient } from '../tenant/tenantApiClient';
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
  total_spent?: number;
  created_at: string;
  updated_at: string;
  // Backend response structure from CustomerResource
  customerType?: 'individual' | 'business';
  address?: {
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    location?: string;
  };
  business?: {
    taxId?: string;
    businessLicense?: string;
  };
  stats?: {
    totalOrders?: number;
    totalSpent?: number;
    lastOrderDate?: string;
  };
  notes?: string;
  timestamps?: {
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface CustomerFilters extends ListRequestParams {
  status?: string;
  type?: string;
  city?: string;
  segment?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
  individual: number;
  business: number;
  totalRevenue: number;
  averageOrderValue: number;
  customersWithOrders: number;
  averageRevenuePerCustomer: number;
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
  address?: string;
  company?: string;
  customer_type?: 'individual' | 'business';
  status?: string;
  notes?: string;
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
      // Map 'type' to 'customer_type' for backend compatibility
      if (filters.type) params.append('customer_type', filters.type);
      if (filters.city) params.append('city', filters.city);
      if (filters.segment) params.append('segment', filters.segment);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
    }

    const url = `/customers?${params.toString()}`;
    console.log('[CustomersService] Making API request:', {
      url,
      filters,
      fullUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}${url}`
    });

    try {
      const response = await tenantApiClient.get<PaginatedResponse<Customer>>(url);
      
      console.log('[CustomersService] API Response received:', {
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasData: response && 'data' in response,
        dataLength: response && 'data' in response ? (response as any).data?.length : 'no data',
        response: response
      });
      
      return response;
    } catch (error) {
      console.error('[CustomersService] API Error:', error);
      throw error;
    }
  }

  async getCustomerById(id: string): Promise<Customer> {
    const response = await tenantApiClient.get<Customer>(`/customers/${id}`);
    return response;
  }

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await tenantApiClient.post<Customer>('/customers', data);
    return response;
  }

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await tenantApiClient.put<Customer>(`/customers/${id}`, data);
    return response;
  }

  async deleteCustomer(id: string): Promise<{ message: string }> {
    const response = await tenantApiClient.delete<{ message: string }>(`/customers/${id}`);
    return response;
  }

  async getCustomerOrders(id: string): Promise<any[]> {
    const response = await tenantApiClient.get<any[]>(`/customers/${id}/orders`);
    return response;
  }

  async getCustomerSegment(id: string): Promise<any> {
    const response = await tenantApiClient.get<any>(`/customers/${id}/segment`);
    return response;
  }

  async getCustomerStats(): Promise<CustomerStats> {
    console.log('[CustomersService] Fetching customer stats...');
    try {
      const response = await tenantApiClient.get<CustomerStats>('/customers/stats');
      console.log('[CustomersService] Stats response:', response);
      return response;
    } catch (error) {
      console.error('[CustomersService] Stats error:', error);
      throw error;
    }
  }
}

export const customersService = new CustomersService();
export default customersService;
