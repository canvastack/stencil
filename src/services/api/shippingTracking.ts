import { tenantApiClient } from './base';

export interface TrackingEvent {
  id: string;
  timestamp: string;
  status: string;
  description: string;
  location: string;
  facilityName: string;
  carrierCode: string;
  isDelivered: boolean;
  isException: boolean;
}

export interface ShippingAddress {
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface PackageInfo {
  weight: number;
  dimensions: { length: number; width: number; height: number };
  value: number;
  description: string;
}

export interface ShipmentTracking {
  id: string;
  trackingNumber: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  carrierId: string;
  carrierName: string;
  carrierCode: string;
  shippingMethodId: string;
  shippingMethodName: string;
  status: 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'cancelled' | 'returned';
  currentLocation: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  shipmentDate: string;
  origin: ShippingAddress;
  destination: ShippingAddress;
  package: PackageInfo;
  trackingEvents: TrackingEvent[];
  isInsured: boolean;
  insuranceValue: number;
  lastUpdated: string;
  deliveryAttempts: number;
  signatureRequired: boolean;
  deliveredTo?: string;
  proofOfDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingTrackingFilters {
  search?: string;
  status?: string;
  carrier?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export interface ShippingTrackingResponse {
  data: ShipmentTracking[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface BulkTrackingRequest {
  trackingNumbers: string[];
}

export interface TrackingUpdateRequest {
  trackingNumber: string;
  status: string;
  location: string;
  description: string;
  facilityName?: string;
}

export const shippingTrackingService = {
  /**
   * Get all shipment tracking records
   */
  getShipmentTrackings: async (filters: ShippingTrackingFilters = {}): Promise<ShippingTrackingResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.carrier) {
        params.append('carrier', filters.carrier);
      }
      if (filters.dateRange) {
        params.append('date_range', filters.dateRange);
      }
      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.perPage) {
        params.append('per_page', filters.perPage.toString());
      }

      const response = await tenantApiClient.get(`/shipping/tracking?${params.toString()}`);
      
      // Handle wrapped responses: { data: {...} } or direct object
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Shipping tracking data not found');
      }
      
      return {
        data: data.data || data.shipments || [],
        current_page: data.current_page || 1,
        per_page: data.per_page || 10,
        total: data.total || 0,
        last_page: data.last_page || 1
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using mock shipping tracking data for development:', error);
        
        // Fallback shipping tracking data for development
        const mockTrackings: ShipmentTracking[] = [
          {
            id: '1',
            trackingNumber: 'JNE0012345678901',
            orderNumber: 'ORD-001',
            customerId: 'cust-001',
            customerName: 'John Doe',
            customerEmail: 'john.doe@email.com',
            customerPhone: '+62-812-3456-7890',
            carrierId: 'carrier-001',
            carrierName: 'JNE Express',
            carrierCode: 'JNE',
            shippingMethodId: 'method-001',
            shippingMethodName: 'JNE REG',
            status: 'in_transit',
            currentLocation: 'Jakarta Distribution Center',
            estimatedDelivery: '2024-12-12T17:00:00Z',
            shipmentDate: '2024-12-09T10:30:00Z',
            origin: {
              address: 'Jl. Sudirman No. 123',
              city: 'Jakarta',
              province: 'DKI Jakarta',
              postalCode: '12190',
            },
            destination: {
              address: 'Jl. Thamrin No. 456',
              city: 'Bandung',
              province: 'Jawa Barat',
              postalCode: '40111',
            },
            package: {
              weight: 2.5,
              dimensions: { length: 30, width: 20, height: 15 },
              value: 500000,
              description: 'Custom Engraving Products',
            },
            trackingEvents: [
              {
                id: '1',
                timestamp: '2024-12-09T10:30:00Z',
                status: 'PICKED_UP',
                description: 'Package picked up from sender',
                location: 'Jakarta Origin Facility',
                facilityName: 'JNE Jakarta Pusat',
                carrierCode: 'JNE',
                isDelivered: false,
                isException: false,
              },
              {
                id: '2',
                timestamp: '2024-12-09T15:45:00Z',
                status: 'IN_TRANSIT',
                description: 'Package in transit to destination city',
                location: 'Jakarta Distribution Center',
                facilityName: 'JNE DC Jakarta',
                carrierCode: 'JNE',
                isDelivered: false,
                isException: false,
              },
              {
                id: '3',
                timestamp: '2024-12-10T08:20:00Z',
                status: 'ARRIVED_AT_DESTINATION',
                description: 'Package arrived at destination facility',
                location: 'Bandung Distribution Center',
                facilityName: 'JNE DC Bandung',
                carrierCode: 'JNE',
                isDelivered: false,
                isException: false,
              },
            ],
            isInsured: true,
            insuranceValue: 500000,
            lastUpdated: '2024-12-10T08:20:00Z',
            deliveryAttempts: 0,
            signatureRequired: true,
            createdAt: '2024-12-09T10:30:00Z',
            updatedAt: '2024-12-10T08:20:00Z',
          },
          {
            id: '2',
            trackingNumber: 'SCP2024120900234',
            orderNumber: 'ORD-002',
            customerId: 'cust-002',
            customerName: 'Jane Smith',
            customerEmail: 'jane.smith@email.com',
            customerPhone: '+62-813-7654-3210',
            carrierId: 'carrier-002',
            carrierName: 'SiCepat Express',
            carrierCode: 'SICEPAT',
            shippingMethodId: 'method-002',
            shippingMethodName: 'SICEPAT REG',
            status: 'delivered',
            currentLocation: 'Delivered',
            estimatedDelivery: '2024-12-10T16:00:00Z',
            actualDelivery: '2024-12-10T14:30:00Z',
            shipmentDate: '2024-12-08T09:15:00Z',
            origin: {
              address: 'Jl. Sudirman No. 123',
              city: 'Jakarta',
              province: 'DKI Jakarta',
              postalCode: '12190',
            },
            destination: {
              address: 'Jl. Gatot Subroto No. 789',
              city: 'Tangerang',
              province: 'Banten',
              postalCode: '15143',
            },
            package: {
              weight: 1.2,
              dimensions: { length: 25, width: 15, height: 10 },
              value: 250000,
              description: 'Personalized Gift Items',
            },
            trackingEvents: [
              {
                id: '1',
                timestamp: '2024-12-08T09:15:00Z',
                status: 'PICKED_UP',
                description: 'Package picked up from sender',
                location: 'Jakarta Origin Facility',
                facilityName: 'SiCepat Jakarta Pusat',
                carrierCode: 'SICEPAT',
                isDelivered: false,
                isException: false,
              },
              {
                id: '2',
                timestamp: '2024-12-09T13:20:00Z',
                status: 'OUT_FOR_DELIVERY',
                description: 'Package out for delivery',
                location: 'Tangerang Delivery Hub',
                facilityName: 'SiCepat Tangerang',
                carrierCode: 'SICEPAT',
                isDelivered: false,
                isException: false,
              },
              {
                id: '3',
                timestamp: '2024-12-10T14:30:00Z',
                status: 'DELIVERED',
                description: 'Package delivered successfully',
                location: 'Customer Address',
                facilityName: 'Customer Location',
                carrierCode: 'SICEPAT',
                isDelivered: true,
                isException: false,
              },
            ],
            isInsured: false,
            insuranceValue: 0,
            lastUpdated: '2024-12-10T14:30:00Z',
            deliveryAttempts: 1,
            signatureRequired: false,
            deliveredTo: 'Jane Smith',
            proofOfDelivery: 'Signature captured',
            createdAt: '2024-12-08T09:15:00Z',
            updatedAt: '2024-12-10T14:30:00Z',
          },
          {
            id: '3',
            trackingNumber: 'JNE0012345678902',
            orderNumber: 'ORD-003',
            customerId: 'cust-003',
            customerName: 'Ahmad Rahman',
            customerEmail: 'ahmad.rahman@email.com',
            customerPhone: '+62-821-5555-1234',
            carrierId: 'carrier-001',
            carrierName: 'JNE Express',
            carrierCode: 'JNE',
            shippingMethodId: 'method-003',
            shippingMethodName: 'JNE YES',
            status: 'exception',
            currentLocation: 'Surabaya Distribution Center',
            estimatedDelivery: '2024-12-11T17:00:00Z',
            shipmentDate: '2024-12-08T14:00:00Z',
            origin: {
              address: 'Jl. Sudirman No. 123',
              city: 'Jakarta',
              province: 'DKI Jakarta',
              postalCode: '12190',
            },
            destination: {
              address: 'Jl. Ahmad Yani No. 999',
              city: 'Surabaya',
              province: 'Jawa Timur',
              postalCode: '60174',
            },
            package: {
              weight: 3.8,
              dimensions: { length: 40, width: 25, height: 20 },
              value: 750000,
              description: 'Industrial Metal Parts',
            },
            trackingEvents: [
              {
                id: '1',
                timestamp: '2024-12-08T14:00:00Z',
                status: 'PICKED_UP',
                description: 'Package picked up from sender',
                location: 'Jakarta Origin Facility',
                facilityName: 'JNE Jakarta Pusat',
                carrierCode: 'JNE',
                isDelivered: false,
                isException: false,
              },
              {
                id: '2',
                timestamp: '2024-12-09T16:30:00Z',
                status: 'ARRIVED_AT_FACILITY',
                description: 'Package arrived at sorting facility',
                location: 'Surabaya Distribution Center',
                facilityName: 'JNE DC Surabaya',
                carrierCode: 'JNE',
                isDelivered: false,
                isException: false,
              },
              {
                id: '3',
                timestamp: '2024-12-10T10:15:00Z',
                status: 'EXCEPTION',
                description: 'Delivery attempt failed - recipient unavailable',
                location: 'Customer Address',
                facilityName: 'JNE Courier',
                carrierCode: 'JNE',
                isDelivered: false,
                isException: true,
              },
            ],
            isInsured: true,
            insuranceValue: 750000,
            lastUpdated: '2024-12-10T10:15:00Z',
            deliveryAttempts: 1,
            signatureRequired: true,
            createdAt: '2024-12-08T14:00:00Z',
            updatedAt: '2024-12-10T10:15:00Z',
          }
        ];

        return {
          data: mockTrackings,
          current_page: 1,
          per_page: 10,
          total: mockTrackings.length,
          last_page: 1
        };
      } else {
        console.error('Failed to load shipping tracking data:', error);
        throw new Error(`Failed to load shipping tracking data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  /**
   * Get tracking details by tracking number
   */
  getTrackingByNumber: async (trackingNumber: string): Promise<ShipmentTracking | null> => {
    try {
      const response = await tenantApiClient.get(`/shipping/tracking/${trackingNumber}`);
      const data = response?.data || response;
      
      return data || null;
    } catch (error) {
      console.error('Failed to load tracking details:', error);
      return null;
    }
  },

  /**
   * Bulk track multiple shipments
   */
  bulkTrackShipments: async (request: BulkTrackingRequest): Promise<ShipmentTracking[]> => {
    try {
      const response = await tenantApiClient.post('/shipping/tracking/bulk', request);
      const data = response?.data || response;
      
      return data.trackings || data || [];
    } catch (error) {
      console.error('Failed to bulk track shipments:', error);
      return [];
    }
  },

  /**
   * Update tracking information
   */
  updateTracking: async (id: string, request: TrackingUpdateRequest): Promise<ShipmentTracking | null> => {
    try {
      const response = await tenantApiClient.put(`/shipping/tracking/${id}`, request);
      const data = response?.data || response;
      
      return data || null;
    } catch (error) {
      console.error('Failed to update tracking:', error);
      throw new Error(`Failed to update tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Refresh tracking from carrier
   */
  refreshTracking: async (trackingNumber: string): Promise<ShipmentTracking | null> => {
    try {
      const response = await tenantApiClient.post(`/shipping/tracking/${trackingNumber}/refresh`);
      const data = response?.data || response;
      
      return data || null;
    } catch (error) {
      console.error('Failed to refresh tracking:', error);
      throw new Error(`Failed to refresh tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Export tracking data
   */
  exportTracking: async (filters: ShippingTrackingFilters = {}): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.carrier) {
        params.append('carrier', filters.carrier);
      }
      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }

      const response = await tenantApiClient.get(`/shipping/tracking/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to export tracking data:', error);
      throw new Error(`Failed to export tracking data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};