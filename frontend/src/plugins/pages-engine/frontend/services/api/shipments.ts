import apiClient from './client';
import { PaginatedResponse, ListRequestParams } from '@/types/api';

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

export interface Shipment {
  id: string;
  uuid: string;
  tenant_id: string;
  order_id: string;
  shipping_method: 'standard' | 'express' | 'overnight' | 'local_pickup';
  shipping_address: ShippingAddress;
  cost: number;
  tracking_number?: string;
  carrier?: string;
  status: 'pending' | 'ready' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  carrier: string;
  base_cost: number;
  estimated_days: number;
  is_active: boolean;
}

export interface ShipmentFilters extends ListRequestParams {
  status?: string;
  order_id?: string;
  shipping_method?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateShipmentRequest {
  order_id: string;
  shipping_method: string;
  shipping_address: ShippingAddress;
  notes?: string;
}

export interface UpdateShipmentRequest {
  status?: string;
  tracking_number?: string;
  notes?: string;
}

class ShipmentsService {
  async getShipments(filters?: ShipmentFilters): Promise<PaginatedResponse<Shipment>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      if (filters.status) params.append('status', filters.status);
      if (filters.order_id) params.append('order_id', filters.order_id);
      if (filters.shipping_method) params.append('shipping_method', filters.shipping_method);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
    }

    const response = await apiClient.get<PaginatedResponse<Shipment>>(
      `/shipments?${params.toString()}`
    );
    return response;
  }

  async getShipmentById(id: string): Promise<Shipment> {
    const response = await apiClient.get<Shipment>(`/shipments/${id}`);
    return response;
  }

  async createShipment(data: CreateShipmentRequest): Promise<Shipment> {
    const response = await apiClient.post<Shipment>('/shipments', data);
    return response;
  }

  async updateShipment(id: string, data: UpdateShipmentRequest): Promise<Shipment> {
    const response = await apiClient.put<Shipment>(`/shipments/${id}`, data);
    return response;
  }

  async deleteShipment(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/shipments/${id}`);
    return response;
  }

  async getShippingMethods(): Promise<ShippingMethod[]> {
    const response = await apiClient.get<ShippingMethod[]>('/shipping-methods');
    return response;
  }

  async getShippingAddresses(): Promise<ShippingAddress[]> {
    const response = await apiClient.get<ShippingAddress[]>('/shipping-addresses');
    return response;
  }

  async getOrderShipments(orderId: string): Promise<Shipment[]> {
    const response = await apiClient.get<Shipment[]>(`/orders/${orderId}/shipments`);
    return response;
  }

  async updateTrackingNumber(id: string, trackingNumber: string): Promise<Shipment> {
    const response = await apiClient.post<Shipment>(`/shipments/${id}/track`, { tracking_number: trackingNumber });
    return response;
  }
}

export const shipmentsService = new ShipmentsService();
export default shipmentsService;
