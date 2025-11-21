export interface Shipment {
  id: string;
  uuid: string;
  tenant_id: string;
  order_id: string;
  order_number?: string;
  customer_name?: string;
  tracking_number?: string;
  carrier: string;
  shipping_method_id: string;
  shipping_method_name?: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'cancelled';
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  shipping_cost: number;
  insurance_cost?: number;
  destination_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  origin_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  estimated_delivery?: string;
  actual_delivery?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  description?: string;
  estimated_days: number;
  base_cost: number;
  weight_rate?: number;
  zone_rates?: Array<{
    zone: string;
    rate: number;
  }>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  id: string;
  type: 'customer' | 'warehouse' | 'pickup';
  name: string;
  company?: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateShipmentRequest {
  order_id: string;
  carrier: string;
  shipping_method_id: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  destination_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  notes?: string;
}

export interface UpdateShipmentRequest {
  tracking_number?: string;
  status?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  notes?: string;
}

export interface ShipmentTracking {
  id: string;
  shipment_id: string;
  status: string;
  location?: string;
  description: string;
  timestamp: string;
  created_at: string;
}