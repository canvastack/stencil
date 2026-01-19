import { apiClient } from '../client';
import type {
  BuildUrlInput,
  PreviewUrlInput,
  BuiltUrl,
  ApiResponse,
} from '@canvastencil/types';

const BASE_URL = '/cms/admin/urls';

export const urlService = {
  async build(input: BuildUrlInput): Promise<ApiResponse<BuiltUrl>> {
    return apiClient.post(`${BASE_URL}/build`, input);
  },

  async preview(input: PreviewUrlInput): Promise<ApiResponse<BuiltUrl>> {
    return apiClient.post(`${BASE_URL}/preview`, input);
  },
};
