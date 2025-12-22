import { ProductFilters } from './product';

export interface SavedSearch {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  filters: ProductFilters;
  isPublic: boolean;
  userId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsedAt?: string;
}

export interface CreateSavedSearchRequest {
  name: string;
  description?: string;
  filters: ProductFilters;
  isPublic: boolean;
}

export interface UpdateSavedSearchRequest {
  name?: string;
  description?: string;
  filters?: ProductFilters;
  isPublic?: boolean;
}

export interface SavedSearchesResponse {
  savedSearches: SavedSearch[];
  total: number;
}
