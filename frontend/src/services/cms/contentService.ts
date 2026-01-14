import { apiClient } from '../api/client';
import type {
  Content,
  ContentListItem,
  CreateContentInput,
  UpdateContentInput,
  ContentFilters,
  PublishContentInput,
  ScheduleContentInput,
  ApiResponse,
  ApiListResponse,
} from '@/types/cms';

const ADMIN_BASE_URL = '/cms/admin/contents';
const PUBLIC_BASE_URL = '/cms/public/contents';

export const contentService = {
  admin: {
    async list(filters?: ContentFilters): Promise<ApiListResponse<ContentListItem>> {
      const params = new URLSearchParams();
      
      if (filters?.content_type) params.append('content_type', filters.content_type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.author) params.append('author', filters.author);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.sort_order) params.append('sort_order', filters.sort_order);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${ADMIN_BASE_URL}${params.toString() ? `?${params}` : ''}`);
    },

    async getById(uuid: string): Promise<ApiResponse<Content>> {
      return apiClient.get(`${ADMIN_BASE_URL}/${uuid}`);
    },

    async create(input: CreateContentInput): Promise<ApiResponse<Content>> {
      return apiClient.post(ADMIN_BASE_URL, input);
    },

    async update(uuid: string, input: UpdateContentInput): Promise<ApiResponse<Content>> {
      return apiClient.put(`${ADMIN_BASE_URL}/${uuid}`, input);
    },

    async delete(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.delete(`${ADMIN_BASE_URL}/${uuid}`);
    },

    async publish(uuid: string, input?: PublishContentInput): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/publish`, input || {});
    },

    async unpublish(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/unpublish`, {});
    },

    async schedule(uuid: string, input: ScheduleContentInput): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/schedule`, input);
    },

    async archive(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/archive`, {});
    },

    async byType(contentTypeUuid: string, page = 1, perPage = 15): Promise<ApiListResponse<ContentListItem>> {
      return apiClient.get(`${ADMIN_BASE_URL}/by-type/${contentTypeUuid}?page=${page}&per_page=${perPage}`);
    },

    async byCategory(categoryUuid: string, page = 1, perPage = 15): Promise<ApiListResponse<ContentListItem>> {
      return apiClient.get(`${ADMIN_BASE_URL}/by-category/${categoryUuid}?page=${page}&per_page=${perPage}`);
    },

    async byStatus(status: string, page = 1, perPage = 15): Promise<ApiListResponse<ContentListItem>> {
      return apiClient.get(`${ADMIN_BASE_URL}/by-status/${status}?page=${page}&per_page=${perPage}`);
    },

    async byAuthor(authorId: string, page = 1, perPage = 15): Promise<ApiListResponse<ContentListItem>> {
      return apiClient.get(`${ADMIN_BASE_URL}/by-author/${authorId}?page=${page}&per_page=${perPage}`);
    },
  },

  public: {
    async list(filters?: ContentFilters): Promise<ApiListResponse<ContentListItem>> {
      const params = new URLSearchParams();
      
      if (filters?.content_type) params.append('content_type', filters.content_type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.sort_order) params.append('sort_order', filters.sort_order);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${PUBLIC_BASE_URL}${params.toString() ? `?${params}` : ''}`);
    },

    async getBySlug(slug: string): Promise<ApiResponse<Content>> {
      return apiClient.get(`${PUBLIC_BASE_URL}/${slug}`);
    },

    async search(query: string, filters?: ContentFilters): Promise<ApiListResponse<ContentListItem>> {
      const params = new URLSearchParams({ q: query });
      
      if (filters?.content_type) params.append('content_type', filters.content_type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${PUBLIC_BASE_URL}/search?${params}`);
    },

    async byCategory(categorySlug: string, filters?: ContentFilters): Promise<ApiListResponse<ContentListItem>> {
      const params = new URLSearchParams();
      
      if (filters?.content_type) params.append('content_type', filters.content_type);
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.sort_order) params.append('sort_order', filters.sort_order);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${PUBLIC_BASE_URL}/category/${categorySlug}${params.toString() ? `?${params}` : ''}`);
    },

    async byTag(tagSlug: string, filters?: ContentFilters): Promise<ApiListResponse<ContentListItem>> {
      const params = new URLSearchParams();
      
      if (filters?.content_type) params.append('content_type', filters.content_type);
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.sort_order) params.append('sort_order', filters.sort_order);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${PUBLIC_BASE_URL}/tag/${tagSlug}${params.toString() ? `?${params}` : ''}`);
    },

    async byType(contentTypeSlug: string, filters?: ContentFilters): Promise<ApiListResponse<ContentListItem>> {
      const params = new URLSearchParams();
      
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.sort_order) params.append('sort_order', filters.sort_order);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${PUBLIC_BASE_URL}/type/${contentTypeSlug}${params.toString() ? `?${params}` : ''}`);
    },
  },
};
