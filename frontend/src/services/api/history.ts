import { tenantApiClient } from './tenantApiClient';
import type {
  ProductHistory,
  ProductVersion,
  HistoryListResponse,
  VersionListResponse,
  HistoryStatsResponse,
  HistoryFilterOptions,
  RestoreVersionRequest,
  HistoryDiffView,
} from '@/types/history';

class HistoryService {
  async getProductHistory(
    productId: string,
    page = 1,
    perPage = 20,
    filters?: HistoryFilterOptions
  ): Promise<HistoryListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (filters?.action && filters.action.length > 0) {
        params.append('action', filters.action.join(','));
      }
      if (filters?.performedBy && filters.performedBy.length > 0) {
        params.append('performed_by', filters.performedBy.join(','));
      }
      if (filters?.dateFrom) {
        params.append('date_from', filters.dateFrom);
      }
      if (filters?.dateTo) {
        params.append('date_to', filters.dateTo);
      }
      if (filters?.fields && filters.fields.length > 0) {
        params.append('fields', filters.fields.join(','));
      }

      const response = await tenantApiClient.get<HistoryListResponse>(
        `/products/${productId}/history?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get product history:', error);
      throw error;
    }
  }

  async getHistoryEntry(historyId: string): Promise<ProductHistory> {
    try {
      const response = await tenantApiClient.get<{ history: ProductHistory }>(
        `/products/history/${historyId}`
      );
      
      return response.data.history;
    } catch (error) {
      console.error('Failed to get history entry:', error);
      throw error;
    }
  }

  async getProductVersions(productId: string, page = 1, perPage = 20): Promise<VersionListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await tenantApiClient.get<VersionListResponse>(
        `/products/${productId}/versions?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get product versions:', error);
      throw error;
    }
  }

  async getVersion(versionId: string): Promise<ProductVersion> {
    try {
      const response = await tenantApiClient.get<{ version: ProductVersion }>(
        `/products/versions/${versionId}`
      );
      
      return response.data.version;
    } catch (error) {
      console.error('Failed to get version:', error);
      throw error;
    }
  }

  async createVersion(productId: string, label?: string, description?: string): Promise<ProductVersion> {
    try {
      const response = await tenantApiClient.post<{ version: ProductVersion }>(
        `/products/${productId}/versions`,
        {
          label,
          description,
        }
      );
      
      return response.data.version;
    } catch (error) {
      console.error('Failed to create version:', error);
      throw error;
    }
  }

  async restoreVersion(request: RestoreVersionRequest): Promise<ProductVersion> {
    try {
      const response = await tenantApiClient.post<{ version: ProductVersion }>(
        `/products/${request.productId}/versions/${request.versionId}/restore`,
        {
          createBackup: request.createBackup ?? true,
        }
      );
      
      return response.data.version;
    } catch (error) {
      console.error('Failed to restore version:', error);
      throw error;
    }
  }

  async compareVersions(versionId1: string, versionId2: string): Promise<HistoryDiffView[]> {
    try {
      const response = await tenantApiClient.get<{ diff: HistoryDiffView[] }>(
        `/products/versions/compare?version1=${versionId1}&version2=${versionId2}`
      );
      
      return response.data.diff;
    } catch (error) {
      console.error('Failed to compare versions:', error);
      throw error;
    }
  }

  async getHistoryDiff(historyId: string): Promise<HistoryDiffView[]> {
    try {
      const response = await tenantApiClient.get<{ diff: HistoryDiffView[] }>(
        `/products/history/${historyId}/diff`
      );
      
      return response.data.diff;
    } catch (error) {
      console.error('Failed to get history diff:', error);
      throw error;
    }
  }

  async getStats(productId?: string): Promise<HistoryStatsResponse> {
    try {
      const endpoint = productId 
        ? `/products/${productId}/history/stats`
        : '/products/history/stats';

      const response = await tenantApiClient.get<HistoryStatsResponse>(endpoint);
      
      return response.data;
    } catch (error) {
      console.error('Failed to get history stats:', error);
      throw error;
    }
  }

  async deleteVersion(versionId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/versions/${versionId}`);
    } catch (error) {
      console.error('Failed to delete version:', error);
      throw error;
    }
  }

  async exportHistory(productId: string, format: 'csv' | 'json' | 'pdf'): Promise<Blob> {
    try {
      const response = await tenantApiClient.getAxiosInstance().get(
        `/products/${productId}/history/export?format=${format}`,
        {
          responseType: 'blob',
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to export history:', error);
      throw error;
    }
  }
}

export const historyService = new HistoryService();
