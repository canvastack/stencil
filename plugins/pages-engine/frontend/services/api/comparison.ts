import { tenantApiClient } from './tenantApiClient';
import type {
  SavedComparison,
  SavedComparisonListResponse,
  ComparisonConfig,
  ComparisonShareLink,
  ComparisonShareResponse,
  ComparisonExportConfig,
  ComparisonExportJob,
  ComparisonExportResponse,
  ComparisonNote,
  ComparisonStatsResponse,
} from '@/types/comparison';

class ComparisonService {
  async saveComparison(config: ComparisonConfig & { name: string; description?: string; isPublic?: boolean }): Promise<SavedComparison> {
    try {
      const response = await tenantApiClient.post<{ comparison: SavedComparison }>(
        '/products/comparisons',
        config
      );
      
      return response.data.comparison;
    } catch (error) {
      console.error('Failed to save comparison:', error);
      throw error;
    }
  }

  async updateComparison(comparisonId: string, updates: Partial<ComparisonConfig> & { name?: string; description?: string; isPublic?: boolean }): Promise<SavedComparison> {
    try {
      const response = await tenantApiClient.put<{ comparison: SavedComparison }>(
        `/products/comparisons/${comparisonId}`,
        updates
      );
      
      return response.data.comparison;
    } catch (error) {
      console.error('Failed to update comparison:', error);
      throw error;
    }
  }

  async getComparison(comparisonId: string): Promise<SavedComparison> {
    try {
      const response = await tenantApiClient.get<{ comparison: SavedComparison }>(
        `/products/comparisons/${comparisonId}`
      );
      
      return response.data.comparison;
    } catch (error) {
      console.error('Failed to get comparison:', error);
      throw error;
    }
  }

  async getSavedComparisons(page = 1, perPage = 20): Promise<SavedComparisonListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await tenantApiClient.get<SavedComparisonListResponse>(
        `/products/comparisons?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get saved comparisons:', error);
      throw error;
    }
  }

  async deleteComparison(comparisonId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/comparisons/${comparisonId}`);
    } catch (error) {
      console.error('Failed to delete comparison:', error);
      throw error;
    }
  }

  async createShareLink(config: ComparisonConfig, options?: { expiresIn?: number; maxAccess?: number }): Promise<ComparisonShareLink> {
    try {
      const response = await tenantApiClient.post<ComparisonShareResponse>(
        '/products/comparisons/share',
        {
          ...config,
          ...options,
        }
      );
      
      return response.data.shareLink;
    } catch (error) {
      console.error('Failed to create share link:', error);
      throw error;
    }
  }

  async getSharedComparison(token: string): Promise<SavedComparison> {
    try {
      const response = await tenantApiClient.get<{ comparison: SavedComparison }>(
        `/products/comparisons/shared/${token}`
      );
      
      return response.data.comparison;
    } catch (error) {
      console.error('Failed to get shared comparison:', error);
      throw error;
    }
  }

  async revokeShareLink(linkId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/comparisons/share/${linkId}`);
    } catch (error) {
      console.error('Failed to revoke share link:', error);
      throw error;
    }
  }

  async exportComparison(config: ComparisonConfig, exportConfig: ComparisonExportConfig): Promise<ComparisonExportJob> {
    try {
      const response = await tenantApiClient.post<ComparisonExportResponse>(
        '/products/comparisons/export',
        {
          comparison: config,
          export: exportConfig,
        }
      );
      
      return response.data.job;
    } catch (error) {
      console.error('Failed to export comparison:', error);
      throw error;
    }
  }

  async getExportJob(jobId: string): Promise<ComparisonExportJob> {
    try {
      const response = await tenantApiClient.get<{ job: ComparisonExportJob }>(
        `/products/comparisons/export/${jobId}`
      );
      
      return response.data.job;
    } catch (error) {
      console.error('Failed to get export job:', error);
      throw error;
    }
  }

  async downloadExport(jobId: string): Promise<Blob> {
    try {
      const response = await tenantApiClient.getAxiosInstance().get(
        `/products/comparisons/export/${jobId}/download`,
        {
          responseType: 'blob',
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to download export:', error);
      throw error;
    }
  }

  async addNote(productId: string, content: string, comparisonId?: string): Promise<ComparisonNote> {
    try {
      const response = await tenantApiClient.post<{ note: ComparisonNote }>(
        '/products/comparisons/notes',
        {
          productId,
          content,
          comparisonId,
        }
      );
      
      return response.data.note;
    } catch (error) {
      console.error('Failed to add note:', error);
      throw error;
    }
  }

  async updateNote(noteId: string, content: string): Promise<ComparisonNote> {
    try {
      const response = await tenantApiClient.put<{ note: ComparisonNote }>(
        `/products/comparisons/notes/${noteId}`,
        { content }
      );
      
      return response.data.note;
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/comparisons/notes/${noteId}`);
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  async getComparisonNotes(comparisonId: string): Promise<ComparisonNote[]> {
    try {
      const response = await tenantApiClient.get<{ notes: ComparisonNote[] }>(
        `/products/comparisons/${comparisonId}/notes`
      );
      
      return response.data.notes;
    } catch (error) {
      console.error('Failed to get comparison notes:', error);
      throw error;
    }
  }

  async getStats(): Promise<ComparisonStatsResponse> {
    try {
      const response = await tenantApiClient.get<ComparisonStatsResponse>(
        '/products/comparisons/stats'
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get comparison stats:', error);
      throw error;
    }
  }
}

export const comparisonService = new ComparisonService();
