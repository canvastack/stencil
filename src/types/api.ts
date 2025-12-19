export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    tenant_id?: string;
    request_id?: string;
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface PaginationLinks {
  first?: string;
  last?: string;
  prev?: string | null;
  next?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
  links?: PaginationLinks;
}

export interface UnwrappedPaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: PaginationLinks;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  code?: string;
}

export interface ListRequestParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface AuthToken {
  token?: string;
  access_token?: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  token?: string;
  access_token?: string;
  token_type: string;
  expires_in: number;
}
