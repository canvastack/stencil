/**
 * SINGLE SOURCE OF TRUTH FOR VENDOR TYPES
 * Aligned with Backend API Response Structure (snake_case)
 * 
 * IMPORTANT: All fields use snake_case to match backend API responses
 * This prevents "[object Object]" display issues and runtime errors
 */

export interface Vendor {
  id: string;
  uuid: string;
  tenant_id: string;
  
  name: string;
  code?: string;
  company?: string;
  company_name?: string;
  brand_name?: string;
  legal_entity_name?: string;
  
  email: string;
  phone?: string;
  mobile_phone?: string;
  contact_person?: string;
  
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    district?: string;
    subdistrict?: string;
    village?: string;
    municipality?: string;
    province?: string;
    country?: string;
    address?: string;
  };
  
  category?: string;
  industry?: string;
  business_type?: string;
  npwp?: string;
  tax_id?: string;
  siup_number?: string;
  business_license?: string;
  website?: string;
  
  status: 'active' | 'inactive' | 'suspended' | 'on_hold' | 'blacklisted';
  quality_tier?: 'standard' | 'premium' | 'exclusive';
  company_size?: 'small' | 'medium' | 'large';
  is_verified?: boolean;
  
  rating?: number;
  overall_rating?: number;
  total_orders?: number;
  total_value?: number;
  completion_rate?: number;
  performance_score?: number;
  
  average_lead_time_days?: number;
  average_lead_time?: string;
  production_capacity_monthly?: number;
  minimum_order_value?: number;
  accepts_rush_orders?: boolean;
  rush_order_surcharge_percent?: number;
  
  bank_name?: string;
  bank_account?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  bank_branch?: string;
  bank_account_details?: BankAccountDetails;
  
  certifications?: string[];
  specializations?: string[];
  payment_terms?: string;
  notes?: string;
  
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface BankAccountDetails {
  bank_name: string;
  account_number: string;
  account_holder: string;
  swift_code?: string;
  bank_branch?: string;
}

export interface VendorFilters {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  
  status?: 'active' | 'inactive' | 'suspended' | 'on_hold' | 'blacklisted';
  quality_tier?: 'standard' | 'premium' | 'exclusive';
  is_verified?: boolean;
  
  city?: string;
  province?: string;
  country?: string;
  
  min_rating?: number;
  accepts_rush_orders?: boolean;
  
  date_from?: string;
  date_to?: string;
  created_from?: string;
  created_to?: string;
  
  material_type?: string;
  specializations?: string[];
  
  include?: ('specializations' | 'contacts' | 'ratings' | 'statistics')[];
}

export interface CreateVendorRequest {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  company?: string;
  contact_person?: string;
  address?: string;
  status?: 'active' | 'inactive';
  bank_account?: string;
  tax_id?: string;
  quality_tier?: 'standard' | 'premium' | 'exclusive';
}

export interface UpdateVendorRequest {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  company?: string;
  contact_person?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
  bank_account?: string;
  tax_id?: string;
  rating?: number;
  performance_score?: number;
  quality_tier?: 'standard' | 'premium' | 'exclusive';
}

export interface VendorSpecialization {
  id: string;
  vendor_id: string;
  name: string;
  category: string;
  experience_years?: number;
  certification?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorEvaluation {
  id: string;
  vendor_id: string;
  order_id: string;
  rating: number;
  quality_score: number;
  delivery_score: number;
  service_score: number;
  communication_score: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPerformanceMetrics {
  vendor_id: string;
  period: string;
  total_orders: number;
  completed_orders: number;
  on_time_deliveries: number;
  on_time_rate: number;
  average_rating: number;
  total_revenue: number;
  quality_acceptance_rate: number;
}

export interface DeliveryMetrics {
  name: string;
  value: number;
  color: string;
}

export interface QualityMetrics {
  category: string;
  count: number;
  percentage: number;
}

export interface VendorQuotation {
  id: string;
  vendor_id: string;
  order_id: string;
  quotation_number: string;
  items: VendorQuotationItem[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total_amount: number;
  valid_until: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface VendorQuotationItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  specifications?: Record<string, unknown>;
}

export type VendorStatus = 'active' | 'inactive' | 'suspended' | 'on_hold' | 'blacklisted';
export type VendorQualityTier = 'standard' | 'premium' | 'exclusive';
