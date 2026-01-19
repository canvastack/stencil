import { apiClient } from '../client';
import type {
  Tag,
  ApiListResponse,
} from '@canvastencil/types';

const PUBLIC_BASE_URL = '/cms/public/tags';

export const tagService = {
  async list(): Promise<ApiListResponse<Tag>> {
    return apiClient.get(PUBLIC_BASE_URL);
  },
};
