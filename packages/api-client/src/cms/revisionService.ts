import { apiClient } from '../client';
import type {
  Revision,
  RevisionFilters,
  ApiResponse,
  ApiListResponse,
} from '@canvastencil/types';

const BASE_URL = '/cms/admin/revisions';

export const revisionService = {
  async listForContent(contentUuid: string, filters?: RevisionFilters): Promise<ApiListResponse<Revision>> {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));

    return apiClient.get(`${BASE_URL}/content/${contentUuid}${params.toString() ? `?${params}` : ''}`);
  },

  async getById(uuid: string): Promise<ApiResponse<Revision>> {
    return apiClient.get(`${BASE_URL}/${uuid}`);
  },

  async revert(uuid: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${BASE_URL}/${uuid}/revert`, {});
  },
};
