import { apiClient } from './client';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import {
  Shipment,
  ShippingMethod,
  ShippingAddress,
  ShipmentTracking,
  CreateShipmentRequest,
  UpdateShipmentRequest
} from '@/types/shipping';

export interface ShipmentFilters extends ListRequestParams {
  status?: string;
  carrier?: string;
  date_from?: string;
  date_to?: string;
  order_id?: string;
  tracking_number?: string;
}

class ShippingService {
  async getShipments(filters?: ShipmentFilters): Promise<PaginatedResponse<Shipment>> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.carrier) params.append('carrier', filters.carrier);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.order_id) params.append('order_id', filters.order_id);
      if (filters.tracking_number) params.append('tracking_number', filters.tracking_number);
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
    const response = await apiClient.get<ShippingMethod[]>('/shipping/methods');
    return response;
  }

  async createShippingMethod(data: Partial<ShippingMethod>): Promise<ShippingMethod> {
    const response = await apiClient.post<ShippingMethod>('/shipping/methods', data);
    return response;
  }

  async updateShippingMethod(id: string, data: Partial<ShippingMethod>): Promise<ShippingMethod> {
    const response = await apiClient.put<ShippingMethod>(`/shipping/methods/${id}`, data);
    return response;
  }

  async getShippingAddresses(): Promise<ShippingAddress[]> {
    const response = await apiClient.get<ShippingAddress[]>('/shipping/addresses');
    return response;
  }

  async createShippingAddress(data: Partial<ShippingAddress>): Promise<ShippingAddress> {
    const response = await apiClient.post<ShippingAddress>('/shipping/addresses', data);
    return response;
  }

  async getShipmentTracking(shipmentId: string): Promise<ShipmentTracking[]> {
    const response = await apiClient.get<ShipmentTracking[]>(`/shipments/${shipmentId}/tracking`);
    return response;
  }

  // Mock data for development
  private generateMockShipments(): Shipment[] {
    return [
      {
        id: '1',
        uuid: 'ship_001',
        tenant_id: 'tenant_1',
        order_id: 'order_001',
        order_number: 'ORD-2024-001',
        customer_name: 'John Doe',
        tracking_number: 'TRK123456789',
        carrier: 'JNE',
        shipping_method_id: 'method_1',
        shipping_method_name: 'Regular',
        status: 'in_transit',
        weight: 2.5,
        dimensions: {
          length: 30,
          width: 20,
          height: 15,
        },
        shipping_cost: 25000,
        destination_address: {
          name: 'John Doe',
          street: 'Jl. Sudirman No. 123',
          city: 'Jakarta',
          state: 'DKI Jakarta',
          postal_code: '12345',
          country: 'Indonesia',
          phone: '+62123456789',
        },
        origin_address: {
          name: 'CanvaStack Warehouse',
          street: 'Jl. Industri No. 456',
          city: 'Tangerang',
          state: 'Banten',
          postal_code: '15123',
          country: 'Indonesia',
          phone: '+62987654321',
        },
        estimated_delivery: '2024-01-20T17:00:00Z',
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-17T10:30:00Z',
      },
      {
        id: '2',
        uuid: 'ship_002',
        tenant_id: 'tenant_1',
        order_id: 'order_002',
        order_number: 'ORD-2024-002',
        customer_name: 'Jane Smith',
        tracking_number: 'TRK987654321',
        carrier: 'SiCepat',
        shipping_method_id: 'method_2',
        shipping_method_name: 'Express',
        status: 'delivered',
        weight: 1.2,
        shipping_cost: 15000,
        destination_address: {
          name: 'Jane Smith',
          street: 'Jl. Gatot Subroto No. 789',
          city: 'Surabaya',
          state: 'Jawa Timur',
          postal_code: '60123',
          country: 'Indonesia',
          phone: '+62111222333',
        },
        origin_address: {
          name: 'CanvaStack Warehouse',
          street: 'Jl. Industri No. 456',
          city: 'Tangerang',
          state: 'Banten',
          postal_code: '15123',
          country: 'Indonesia',
          phone: '+62987654321',
        },
        estimated_delivery: '2024-01-18T17:00:00Z',
        actual_delivery: '2024-01-18T14:30:00Z',
        created_at: '2024-01-16T09:00:00Z',
        updated_at: '2024-01-18T14:30:00Z',
      },
    ];
  }

  private generateMockShippingMethods(): ShippingMethod[] {
    return [
      {
        id: 'method_1',
        name: 'Regular',
        carrier: 'JNE',
        description: 'Standard shipping service',
        estimated_days: 3,
        base_cost: 15000,
        weight_rate: 5000,
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'method_2',
        name: 'Express',
        carrier: 'SiCepat',
        description: 'Fast delivery service',
        estimated_days: 1,
        base_cost: 25000,
        weight_rate: 8000,
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];
  }

  // Development method - will be replaced with real API
  async getMockShipments(filters?: ShipmentFilters): Promise<PaginatedResponse<Shipment>> {
    let shipments = this.generateMockShipments();
    
    // Apply filters
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      shipments = shipments.filter(s => 
        s.order_number?.toLowerCase().includes(search) ||
        s.customer_name?.toLowerCase().includes(search) ||
        s.tracking_number?.toLowerCase().includes(search)
      );
    }
    
    if (filters?.status) {
      shipments = shipments.filter(s => s.status === filters.status);
    }
    
    if (filters?.carrier) {
      shipments = shipments.filter(s => s.carrier === filters.carrier);
    }

    const total = shipments.length;
    const page = filters?.page || 1;
    const per_page = filters?.per_page || 10;
    const start = (page - 1) * per_page;
    const end = start + per_page;
    
    return {
      data: shipments.slice(start, end),
      current_page: page,
      per_page: per_page,
      total: total,
      last_page: Math.ceil(total / per_page),
    };
  }

  async getMockShippingMethods(): Promise<ShippingMethod[]> {
    return this.generateMockShippingMethods();
  }
}

export const shippingService = new ShippingService();