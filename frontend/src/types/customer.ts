import { LocationData } from './common';

export type CustomerType = 'individual' | 'business';
export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  customerType: CustomerType;
  status: CustomerStatus;
  location?: LocationData;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  totalOrders: number;
  totalSpent: number;
  notes?: string;
  taxId?: string;
  businessLicense?: string;
  createdAt: string;
  updatedAt: string;
  lastOrderDate?: string;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  customerType: CustomerType;
  status?: CustomerStatus;
  location?: LocationData;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
  taxId?: string;
  businessLicense?: string;
}

export interface CustomerFilters {
  customerType?: CustomerType;
  status?: CustomerStatus;
  search?: string;
  city?: string;
  province?: string;
  minOrders?: number;
  minSpent?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  page?: number;
  per_page?: number;
}
