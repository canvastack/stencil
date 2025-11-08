import { LocationData } from './common';

export type VendorStatus = 'active' | 'inactive' | 'suspended';
export type VendorCategory = 'Raw Material' | 'Manufacturer' | 'Service Provider' | 'Other';

export interface Vendor {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  contactPerson: string;
  category: string;
  status: VendorStatus;
  rating: number;
  totalOrders: number;
  location: LocationData;
  address?: string;
  notes: string;
  paymentTerms: string;
  taxId: string;
  bankAccount?: string;
  bankName?: string;
  specializations?: string[];
  leadTime?: string;
  minimumOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorFormData {
  name: string;
  code: string;
  email: string;
  phone: string;
  contactPerson: string;
  category: string;
  status?: VendorStatus;
  location: LocationData;
  address?: string;
  notes?: string;
  paymentTerms: string;
  taxId: string;
  bankAccount?: string;
  bankName?: string;
  specializations?: string[];
  leadTime?: string;
  minimumOrder?: number;
}

export interface VendorFilters {
  category?: string;
  status?: VendorStatus;
  search?: string;
  city?: string;
  province?: string;
  minRating?: number;
  specializations?: string[];
  limit?: number;
  offset?: number;
}

export interface VendorQuotation {
  id: string;
  vendorId: string;
  orderId: string;
  quotationNumber: string;
  items: VendorQuotationItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  validUntil: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface VendorQuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specifications?: Record<string, any>;
}
