import { apiClient } from '../api/client';
import type {
  Comment,
  SubmitCommentInput,
  CommentFilters,
  BulkCommentAction,
  ApiResponse,
  ApiListResponse,
} from '@/types/cms';

const ADMIN_BASE_URL = '/cms/admin/comments';
const PUBLIC_BASE_URL = '/cms/public/comments';

export const commentService = {
  admin: {
    async list(filters?: CommentFilters): Promise<ApiListResponse<Comment>> {
      const params = new URLSearchParams();
      
      if (filters?.content) params.append('content', filters.content);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));

      return apiClient.get(`${ADMIN_BASE_URL}${params.toString() ? `?${params}` : ''}`);
    },

    async approve(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/approve`, {});
    },

    async reject(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/reject`, {});
    },

    async markAsSpam(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/${uuid}/spam`, {});
    },

    async delete(uuid: string): Promise<ApiResponse<void>> {
      return apiClient.delete(`${ADMIN_BASE_URL}/${uuid}`);
    },

    async bulkApprove(action: BulkCommentAction): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/bulk-approve`, action);
    },

    async bulkDelete(action: BulkCommentAction): Promise<ApiResponse<void>> {
      return apiClient.post(`${ADMIN_BASE_URL}/bulk-delete`, action);
    },
  },

  public: {
    async listForContent(contentUuid: string, page = 1, perPage = 20): Promise<ApiListResponse<Comment>> {
      return apiClient.get(`/cms/public/contents/${contentUuid}/comments?page=${page}&per_page=${perPage}`);
    },

    async submit(input: SubmitCommentInput): Promise<ApiResponse<Comment>> {
      return apiClient.post(PUBLIC_BASE_URL, input);
    },

    async reply(parentUuid: string, input: SubmitCommentInput): Promise<ApiResponse<Comment>> {
      return apiClient.post(`${PUBLIC_BASE_URL}/${parentUuid}/reply`, input);
    },
  },
};
