export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  district: string;
  subdistrict: string;
  village: string;
  municipality: string;
  province: string;
  country: string;
  postalCode?: string;
}

export interface Address {
  street: string;
  city: string;
  district?: string;
  province: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface DateRange {
  from: string | Date;
  to: string | Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface TenantScoped {
  tenantId: string;
}

export interface UserTracked {
  createdBy?: string;
  updatedBy?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export interface FilterParams {
  [key: string]: any;
}

export interface SearchParams {
  query: string;
  fields?: string[];
}
