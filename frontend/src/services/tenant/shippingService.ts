import { tenantApiClient } from './tenantApiClient';

export interface Shipment {
  id: string;
  shipment_uuid: string;
  order_id: string;
  customer_id: string;
  
  // Order & Customer Details
  order_code: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  
  // Shipping Details
  tracking_number?: string;
  carrier: string;
  shipping_method_id: string;
  shipping_method_name: string;
  service_type: 'standard' | 'express' | 'overnight' | 'same_day' | 'economy';
  
  // Status & Tracking
  status: 'pending' | 'processing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned' | 'cancelled';
  substatus?: string;
  
  // Package Details
  package_count: number;
  total_weight: number; // in kg
  total_volume?: number; // in cubic cm
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  
  // Cost & Insurance
  shipping_cost: number;
  insurance_value?: number;
  insurance_cost?: number;
  additional_fees?: number;
  total_cost: number;
  
  // Addresses
  pickup_address: ShippingAddress;
  destination_address: ShippingAddress;
  return_address?: ShippingAddress;
  
  // Timing
  ship_date?: string;
  estimated_pickup?: string;
  estimated_delivery?: string;
  actual_pickup?: string;
  actual_delivery?: string;
  
  // Special Instructions
  delivery_instructions?: string;
  special_handling?: string[];
  requires_signature: boolean;
  is_fragile: boolean;
  is_dangerous_goods: boolean;
  
  // Tracking & Events
  tracking_events: TrackingEvent[];
  last_tracking_update?: string;
  
  // Documentation
  shipping_label_url?: string;
  invoice_url?: string;
  proof_of_delivery_url?: string;
  customs_declaration_url?: string;
  
  // Internal Notes
  internal_notes?: string;
  customer_notes?: string;
  
  // Metadata
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  order: {
    id: string;
    order_code: string;
    order_date: string;
    order_total: number;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  packages?: PackageDetail[];
}

export interface ShippingAddress {
  name: string;
  company?: string;
  street_line_1: string;
  street_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  
  // Location coordinates (optional)
  latitude?: number;
  longitude?: number;
  
  // Address validation
  is_validated: boolean;
  validation_status?: 'valid' | 'invalid' | 'partial' | 'unverified';
}

export interface TrackingEvent {
  id: string;
  event_date: string;
  event_time: string;
  status: string;
  substatus?: string;
  description: string;
  location?: {
    city: string;
    state: string;
    country: string;
    facility_name?: string;
  };
  carrier_event_code?: string;
  created_at: string;
}

export interface PackageDetail {
  id: string;
  package_number: string;
  tracking_number?: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  items: PackageItem[];
  insurance_value?: number;
  special_handling?: string[];
}

export interface PackageItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_weight?: number;
  unit_value?: number;
  customs_description?: string;
  harmonized_code?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  carrier_code: string;
  service_code: string;
  service_type: Shipment['service_type'];
  description: string;
  
  // Timing
  estimated_days_min: number;
  estimated_days_max: number;
  pickup_time_cut_off?: string; // HH:mm format
  
  // Coverage
  coverage_areas: string[]; // Array of country/region codes
  restricted_areas?: string[];
  
  // Pricing
  base_cost: number;
  weight_rate: number; // per kg
  dimensional_weight_factor?: number;
  zone_rates?: { zone: string; rate: number; }[];
  
  // Features
  supports_tracking: boolean;
  supports_insurance: boolean;
  supports_signature_confirmation: boolean;
  supports_saturday_delivery: boolean;
  requires_signature: boolean;
  
  // Restrictions
  max_weight?: number; // kg
  max_dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  prohibited_items?: string[];
  
  // Status
  active: boolean;
  priority: number; // For sorting/display order
  
  created_at: string;
  updated_at: string;
}

export interface ShippingRate {
  shipping_method_id: string;
  method_name: string;
  carrier: string;
  service_type: string;
  estimated_days: number;
  total_cost: number;
  base_cost: number;
  weight_cost: number;
  zone_cost: number;
  additional_fees: number;
  currency: string;
  
  // Features included
  includes_insurance: boolean;
  includes_tracking: boolean;
  includes_signature: boolean;
  
  // Validity
  valid_until: string;
  rate_id: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  code: string;
  countries: string[];
  regions?: string[];
  postal_code_patterns?: string[];
  
  // Distance/pricing zone
  zone_number: number;
  base_rate: number;
  weight_rate: number;
  
  created_at: string;
  updated_at: string;
}

export interface CreateShipmentRequest {
  order_id: string;
  shipping_method_id: string;
  
  // Package details
  package_count: number;
  total_weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  
  // Destination
  destination_address: Omit<ShippingAddress, 'is_validated' | 'validation_status'>;
  pickup_address?: Omit<ShippingAddress, 'is_validated' | 'validation_status'>;
  
  // Options
  insurance_value?: number;
  requires_signature?: boolean;
  delivery_instructions?: string;
  special_handling?: string[];
  
  // Timing
  ship_date?: string;
  
  // Package details
  packages?: Omit<PackageDetail, 'id'>[];
  
  // Notes
  customer_notes?: string;
  internal_notes?: string;
}

export interface UpdateShipmentRequest {
  // Status updates
  status?: Shipment['status'];
  substatus?: string;
  
  // Tracking
  tracking_number?: string;
  
  // Timing
  ship_date?: string;
  estimated_pickup?: string;
  estimated_delivery?: string;
  actual_pickup?: string;
  actual_delivery?: string;
  
  // Cost adjustments
  shipping_cost?: number;
  additional_fees?: number;
  
  // Address updates (limited)
  delivery_instructions?: string;
  
  // Notes
  customer_notes?: string;
  internal_notes?: string;
}

export interface CreateShippingMethodRequest {
  name: string;
  carrier: string;
  carrier_code: string;
  service_code: string;
  service_type: Shipment['service_type'];
  description: string;
  
  // Timing
  estimated_days_min: number;
  estimated_days_max: number;
  pickup_time_cut_off?: string;
  
  // Coverage
  coverage_areas: string[];
  restricted_areas?: string[];
  
  // Pricing
  base_cost: number;
  weight_rate: number;
  dimensional_weight_factor?: number;
  
  // Features
  supports_tracking: boolean;
  supports_insurance: boolean;
  supports_signature_confirmation: boolean;
  supports_saturday_delivery: boolean;
  requires_signature: boolean;
  
  // Restrictions
  max_weight?: number;
  max_dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  prohibited_items?: string[];
  
  active: boolean;
  priority?: number;
}

export interface UpdateShippingMethodRequest {
  name?: string;
  description?: string;
  estimated_days_min?: number;
  estimated_days_max?: number;
  base_cost?: number;
  weight_rate?: number;
  active?: boolean;
  priority?: number;
}

export interface ShipmentListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: Shipment['status'];
  carrier?: string;
  shipping_method_id?: string;
  customer_id?: string;
  order_id?: string;
  
  // Date filters
  ship_date_from?: string;
  ship_date_to?: string;
  created_from?: string;
  created_to?: string;
  delivery_date_from?: string;
  delivery_date_to?: string;
  
  // Status filters
  overdue_only?: boolean;
  exception_only?: boolean;
  
  sort_by?: 'created_at' | 'ship_date' | 'estimated_delivery' | 'shipping_cost' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface ShipmentListResponse {
  data: Shipment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    summary?: {
      total_shipments: number;
      pending_shipments: number;
      in_transit_shipments: number;
      delivered_shipments: number;
      exception_shipments: number;
      total_shipping_cost: number;
      average_delivery_time: number;
      on_time_delivery_rate: number;
    };
  };
}

export interface ShippingStats {
  total_shipments: number;
  pending_shipments: number;
  processing_shipments: number;
  in_transit_shipments: number;
  delivered_shipments: number;
  exception_shipments: number;
  
  // Performance Metrics
  on_time_delivery_rate: number;
  average_delivery_time: number; // in hours
  average_shipping_cost: number;
  delivery_success_rate: number;
  
  // Cost Analysis
  total_shipping_cost: number;
  total_insurance_cost: number;
  cost_per_shipment: number;
  cost_per_kg: number;
  
  // Carrier Performance
  carrier_stats: Array<{
    carrier: string;
    shipments_count: number;
    on_time_rate: number;
    average_cost: number;
    exception_rate: number;
  }>;
  
  // Service Type Analysis
  service_type_distribution: Array<{
    service_type: string;
    count: number;
    percentage: number;
    average_cost: number;
  }>;
  
  // Geographic Analysis
  top_destinations: Array<{
    city: string;
    state: string;
    country: string;
    shipments_count: number;
    average_delivery_time: number;
  }>;
  
  // Timeline Data
  daily_shipments: Array<{
    date: string;
    shipments_sent: number;
    shipments_delivered: number;
    total_cost: number;
    average_delivery_time: number;
  }>;
}

export interface RateQuoteRequest {
  pickup_address: Omit<ShippingAddress, 'is_validated' | 'validation_status'>;
  destination_address: Omit<ShippingAddress, 'is_validated' | 'validation_status'>;
  packages: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'inch';
    };
  }[];
  ship_date?: string;
  insurance_value?: number;
}

class ShippingService {
  private baseUrl = '/shipping';

  /**
   * Get paginated list of shipments with filtering
   */
  async getShipments(params: ShipmentListParams = {}): Promise<ShipmentListResponse> {
    const response = await tenantApiClient.get(`${this.baseUrl}/shipments`, { params });
    return response;
  }

  /**
   * Get a specific shipment by ID
   */
  async getShipment(id: string): Promise<Shipment> {
    const response = await tenantApiClient.get(`${this.baseUrl}/shipments/${id}`);
    return response.data;
  }

  /**
   * Create a new shipment
   */
  async createShipment(data: CreateShipmentRequest): Promise<Shipment> {
    const response = await tenantApiClient.post(`${this.baseUrl}/shipments`, data);
    return response.data;
  }

  /**
   * Update an existing shipment
   */
  async updateShipment(id: string, data: UpdateShipmentRequest): Promise<Shipment> {
    const response = await tenantApiClient.put(`${this.baseUrl}/shipments/${id}`, data);
    return response.data;
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(id: string, reason?: string): Promise<Shipment> {
    const response = await tenantApiClient.post(`${this.baseUrl}/shipments/${id}/cancel`, { reason });
    return response.data;
  }

  /**
   * Process shipment (generate label, confirm pickup, etc.)
   */
  async processShipment(id: string): Promise<Shipment> {
    const response = await tenantApiClient.post(`${this.baseUrl}/shipments/${id}/process`);
    return response.data;
  }

  /**
   * Get shipment tracking information
   */
  async getShipmentTracking(id: string): Promise<TrackingEvent[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/shipments/${id}/tracking`);
    return response.data;
  }

  /**
   * Update shipment tracking manually
   */
  async updateShipmentTracking(id: string, event: {
    status: string;
    substatus?: string;
    description: string;
    event_date?: string;
    location?: {
      city: string;
      state: string;
      country: string;
    };
  }): Promise<TrackingEvent> {
    const response = await tenantApiClient.post(`${this.baseUrl}/shipments/${id}/tracking`, event);
    return response.data;
  }

  /**
   * Get shipping rate quotes
   */
  async getRateQuotes(data: RateQuoteRequest): Promise<ShippingRate[]> {
    const response = await tenantApiClient.post(`${this.baseUrl}/rates/quote`, data);
    return response.data;
  }

  /**
   * Validate shipping address
   */
  async validateAddress(address: Omit<ShippingAddress, 'is_validated' | 'validation_status'>): Promise<{
    is_valid: boolean;
    validation_status: 'valid' | 'invalid' | 'partial' | 'unverified';
    suggested_address?: ShippingAddress;
    validation_errors?: string[];
  }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/addresses/validate`, address);
    return response.data;
  }

  /**
   * Get available shipping methods
   */
  async getShippingMethods(params?: {
    active_only?: boolean;
    service_type?: string;
    carrier?: string;
  }): Promise<ShippingMethod[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/methods`, { params });
    return response.data;
  }

  /**
   * Create shipping method
   */
  async createShippingMethod(data: CreateShippingMethodRequest): Promise<ShippingMethod> {
    const response = await tenantApiClient.post(`${this.baseUrl}/methods`, data);
    return response.data;
  }

  /**
   * Update shipping method
   */
  async updateShippingMethod(id: string, data: UpdateShippingMethodRequest): Promise<ShippingMethod> {
    const response = await tenantApiClient.put(`${this.baseUrl}/methods/${id}`, data);
    return response.data;
  }

  /**
   * Delete shipping method
   */
  async deleteShippingMethod(id: string): Promise<void> {
    await tenantApiClient.delete(`${this.baseUrl}/methods/${id}`);
  }

  /**
   * Get shipping zones
   */
  async getShippingZones(): Promise<ShippingZone[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/zones`);
    return response.data;
  }

  /**
   * Get shipping statistics
   */
  async getShippingStats(params?: {
    date_from?: string;
    date_to?: string;
    carrier?: string;
    service_type?: string;
  }): Promise<ShippingStats> {
    const response = await tenantApiClient.get(`${this.baseUrl}/stats`, { params });
    return response.data;
  }

  /**
   * Generate shipping label
   */
  async generateShippingLabel(shipmentId: string, format: 'pdf' | 'zpl' | 'png' = 'pdf'): Promise<{
    label_url: string;
    label_data?: string; // Base64 encoded for some formats
    tracking_number: string;
  }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/shipments/${shipmentId}/label`, { format });
    return response.data;
  }

  /**
   * Get shipping manifest
   */
  async getShippingManifest(date: string, carrier?: string): Promise<{
    manifest_url: string;
    shipments: string[]; // Shipment IDs included
    total_shipments: number;
    total_weight: number;
  }> {
    const response = await tenantApiClient.get(`${this.baseUrl}/manifest/${date}`, { 
      params: { carrier } 
    });
    return response.data;
  }

  /**
   * Schedule pickup
   */
  async schedulePickup(data: {
    shipment_ids: string[];
    pickup_date: string;
    pickup_time_start: string;
    pickup_time_end: string;
    pickup_address: Omit<ShippingAddress, 'is_validated' | 'validation_status'>;
    special_instructions?: string;
  }): Promise<{
    pickup_id: string;
    confirmation_number: string;
    pickup_window: string;
    estimated_pickup_time: string;
  }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/pickup/schedule`, data);
    return response.data;
  }

  /**
   * Bulk update shipments
   */
  async bulkUpdateShipments(shipmentIds: string[], data: {
    status?: Shipment['status'];
    carrier?: string;
    shipping_method_id?: string;
    ship_date?: string;
    internal_notes?: string;
  }): Promise<{ 
    success: Shipment[]; 
    failed: Array<{ id: string; error: string }> 
  }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/shipments/bulk-update`, { 
      shipment_ids: shipmentIds, 
      ...data 
    });
    return response.data;
  }

  /**
   * Export shipments data
   */
  async exportShipments(params: ShipmentListParams & {
    format: 'csv' | 'excel' | 'pdf';
    include_tracking?: boolean;
  }): Promise<Blob> {
    const response = await tenantApiClient.get(`${this.baseUrl}/shipments/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get shipment dashboard summary
   */
  async getDashboardSummary(): Promise<{
    today: {
      shipments_created: number;
      shipments_shipped: number;
      shipments_delivered: number;
      total_shipping_cost: number;
    };
    weekly: {
      on_time_delivery_rate: number;
      average_delivery_time: number;
      cost_per_shipment: number;
      exception_rate: number;
    };
    alerts: {
      overdue_shipments: number;
      exception_shipments: number;
      cancelled_shipments: number;
      high_value_shipments: number;
    };
  }> {
    const response = await tenantApiClient.get(`${this.baseUrl}/dashboard`);
    return response.data;
  }
}

export const shippingService = new ShippingService();
export default shippingService;