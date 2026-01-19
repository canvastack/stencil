import { apiClient } from '../client';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  MoveCategoryInput,
  ReorderCategoryInput,
  CategoryFilters,
  ApiResponse,
  ApiListResponse,
} from '@canvastencil/types';

const ADMIN_BASE_URL = '/cms/admin/categories';
const PUBLIC_BASE_URL = '/cms/public/categories';

export const categoryService = {
  admin: {
    async list(filters?: CategoryFilters): Promise<ApiListResponse<Category>> {
      const params = new URLSearchParams();
      
      if (filters?.content_type) params.append('content_type', filters.content_type);
      if (filters?.parent) params.append('parent', filters.parent);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${ADMIN_BASE_URL}${params.toString() ? `?${params}` : ''}`);
    },

    async getTree(contentTypeUuid?: string): Promise<ApiResponse<Category[]>> {
      const url = contentTypeUuid 
        ? `${ADMIN_BASE_URL}/tree/${contentTypeUuid}` 
        : `${ADMIN_BASE_URL}/tree`;
      return apiClient.get(url);
    },

    async getById(uuid: string): Promise<ApiResponse<Category>> {
      return apiClient.get(`${ADMIN_BASE_URL}/${uuid}`);
    },

    async create(input: CreateCategoryInput): Promise<ApiResponse<Category>> {
      return apiClient.post(ADMIN_BASE_URL, input);
    },

    async update(uuid: string, input: UpdateCategoryInput): Promise<ApiResponse<Category>> {
      return apiClient.put(`${ADMIN_BASE_URL}/${uuid}`, input);
    },

    async delete(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.delete(`${ADMIN_BASE_URL}/${uuid}`);
    },

    async move(uuid: string, input: MoveCategoryInput): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/move`, input);
    },

    async reorder(uuid: string, input: ReorderCategoryInput): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/reorder`, input);
    },
  },

  public: {
    async list(filters?: CategoryFilters): Promise<ApiListResponse<Category>> {
      const params = new URLSearchParams();
      
      if (filters?.content_type) params.append('content_type', filters.content_type);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${PUBLIC_BASE_URL}${params.toString() ? `?${params}` : ''}`);
    },

    async getTree(contentTypeUuid?: string): Promise<ApiResponse<Category[]>> {
      const params = new URLSearchParams();
      if (contentTypeUuid) params.append('content_type', contentTypeUuid);
      
      return apiClient.get(`${PUBLIC_BASE_URL}/tree${params.toString() ? `?${params}` : ''}`);
    },

    async getBySlug(slug: string): Promise<ApiResponse<Category>> {
      return apiClient.get(`${PUBLIC_BASE_URL}/${slug}`);
    },
  },
};
