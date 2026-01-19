import { apiClient } from '../api/client';
import type {
  Tag,
  ApiListResponse,
} from '@/types/cms';

const PUBLIC_BASE_URL = '/cms/public/tags';

export const tagService = {
  async list(): Promise<ApiListResponse<Tag>> {
    return apiClient.get(PUBLIC_BASE_URL);
  },
};
