import { apiClient } from '../api/client';
import type {
  ContentType,
  CreateContentTypeInput,
  UpdateContentTypeInput,
  ContentTypeFilters,
  ApiResponse,
  ApiListResponse,
} from '@/types/cms';

const ADMIN_BASE_URL = '/cms/admin/content-types';
const PUBLIC_BASE_URL = '/cms/public/content-types';

export const contentTypeService = {
  admin: {
    async list(filters?: ContentTypeFilters): Promise<ApiListResponse<ContentType>> {
      const params = new URLSearchParams();
      
      if (filters?.scope) params.append('scope', filters.scope);
      if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${ADMIN_BASE_URL}${params.toString() ? `?${params}` : ''}`);
    },

    async getById(uuid: string): Promise<ApiResponse<ContentType>> {
      return apiClient.get(`${ADMIN_BASE_URL}/${uuid}`);
    },

    async create(input: CreateContentTypeInput): Promise<ApiResponse<ContentType>> {
      return apiClient.post(ADMIN_BASE_URL, input);
    },

    async update(uuid: string, input: UpdateContentTypeInput): Promise<ApiResponse<ContentType>> {
      return apiClient.put(`${ADMIN_BASE_URL}/${uuid}`, input);
    },

    async delete(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.delete(`${ADMIN_BASE_URL}/${uuid}`);
    },

    async activate(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/activate`, {});
    },

    async deactivate(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/deactivate`, {});
    },

    async getContentsCount(uuid: string): Promise<ApiResponse<{ uuid: string; name: string; contents_count: number }>> {
      return apiClient.get(`${ADMIN_BASE_URL}/${uuid}/contents/count`);
    },
  },

  public: {
    async list(filters?: ContentTypeFilters): Promise<ApiListResponse<ContentType>> {
      const params = new URLSearchParams();
      
      if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${PUBLIC_BASE_URL}${params.toString() ? `?${params}` : ''}`);
    },

    async getBySlug(slug: string): Promise<ApiResponse<ContentType>> {
      return apiClient.get(`${PUBLIC_BASE_URL}/${slug}`);
    },
  },
};
