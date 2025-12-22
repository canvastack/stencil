import { tenantApiClient } from '../tenant/tenantApiClient';
import { PaginatedResponse } from '@/types/api';
import type { 
  Vendor, 
  VendorFilters, 
  CreateVendorRequest, 
  UpdateVendorRequest 
} from '@/types/vendor';
import { VendorSchema } from '@/schemas/vendor.schema';

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
    const validated = VendorSchema.parse(response);
    return validated;
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

  async bulkUpdateStatus(vendorIds: string[], status: string): Promise<{ message: string }> {
    const response = await tenantApiClient.post<{ message: string }>('/vendors/bulk/status', {
      vendor_ids: vendorIds,
      status,
    });
    return response;
  }

  async bulkDelete(vendorIds: string[]): Promise<{ message: string }> {
    const response = await tenantApiClient.post<{ message: string }>('/vendors/bulk/delete', {
      vendor_ids: vendorIds,
    });
    return response;
  }

  async getVendorEvaluations(id: string): Promise<unknown> {
    const response = await tenantApiClient.get(`/vendors/${id}/evaluations`);
    return response;
  }

  async getVendorSpecializations(id: string): Promise<unknown[]> {
    const response = await tenantApiClient.get(`/vendors/${id}/specializations`);
    return response;
  }

  async getVendorOrders(id: string): Promise<unknown[]> {
    const response = await tenantApiClient.get(`/vendors/${id}/orders`);
    return response;
  }
}

export const vendorsService = new VendorsService();
export default vendorsService;
