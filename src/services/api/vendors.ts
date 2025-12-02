import { tenantApiClient } from '../tenant/tenantApiClient';
import { PaginatedResponse, ListRequestParams } from '@/types/api';

export interface Vendor {
  id: string;
  uuid: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  company?: string;
  bank_account?: string;
  status: 'active' | 'inactive' | 'suspended';
  rating?: number;
  total_orders?: number;
  completion_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface VendorFilters extends ListRequestParams {
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateVendorRequest {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  company?: string;
  bank_account?: string;
}

export interface UpdateVendorRequest {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  company?: string;
  bank_account?: string;
  status?: string;
}

class VendorsService {
  async getVendors(filters?: VendorFilters): Promise<PaginatedResponse<Vendor>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
    }

    const response = await tenantApiClient.get<PaginatedResponse<Vendor>>(
      `/vendors?${params.toString()}`
    );
    return response;
  }

  async getVendorById(id: string): Promise<Vendor> {
    const response = await tenantApiClient.get<Vendor>(`/vendors/${id}`);
    return response;
  }

  async createVendor(data: CreateVendorRequest): Promise<Vendor> {
    const response = await tenantApiClient.post<Vendor>('/vendors', data);
    return response;
  }

  async updateVendor(id: string, data: UpdateVendorRequest): Promise<Vendor> {
    const response = await tenantApiClient.put<Vendor>(`/vendors/${id}`, data);
    return response;
  }

  async deleteVendor(id: string): Promise<{ message: string }> {
    const response = await tenantApiClient.delete<{ message: string }>(`/vendors/${id}`);
    return response;
  }

  async getVendorEvaluations(id: string): Promise<any> {
    const response = await tenantApiClient.get<any>(`/vendors/${id}/evaluations`);
    return response;
  }

  async getVendorSpecializations(id: string): Promise<any[]> {
    const response = await tenantApiClient.get<any[]>(`/vendors/${id}/specializations`);
    return response;
  }

  async getVendorOrders(id: string): Promise<any[]> {
    const response = await tenantApiClient.get<any[]>(`/vendors/${id}/orders`);
    return response;
  }
}

export const vendorsService = new VendorsService();
export default vendorsService;
