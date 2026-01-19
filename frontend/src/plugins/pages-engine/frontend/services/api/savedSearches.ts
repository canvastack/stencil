import { tenantApiClient } from './tenantApiClient';
import {
  SavedSearch,
  CreateSavedSearchRequest,
  UpdateSavedSearchRequest,
  SavedSearchesResponse,
} from '@/types/savedSearch';

class SavedSearchesService {
  private readonly basePath = '/saved-searches';

  async getSavedSearches(): Promise<SavedSearch[]> {
    try {
      const response = await tenantApiClient.get<SavedSearchesResponse>(this.basePath);
      return response.data.savedSearches || [];
    } catch (error: any) {
      if (error?.status === 404) {
        return [];
      }
      console.error('Failed to fetch saved searches:', error);
      throw error;
    }
  }

  async getSavedSearch(id: string): Promise<SavedSearch> {
    try {
      const response = await tenantApiClient.get<{ savedSearch: SavedSearch }>(
        `${this.basePath}/${id}`
      );
      return response.data.savedSearch;
    } catch (error) {
      console.error(`Failed to fetch saved search ${id}:`, error);
      throw error;
    }
  }

  async createSavedSearch(data: CreateSavedSearchRequest): Promise<SavedSearch> {
    try {
      const response = await tenantApiClient.post<{ savedSearch: SavedSearch }>(
        this.basePath,
        data
      );
      return response.data.savedSearch;
    } catch (error) {
      console.error('Failed to create saved search:', error);
      throw error;
    }
  }

  async updateSavedSearch(
    id: string,
    data: UpdateSavedSearchRequest
  ): Promise<SavedSearch> {
    try {
      const response = await tenantApiClient.put<{ savedSearch: SavedSearch }>(
        `${this.basePath}/${id}`,
        data
      );
      return response.data.savedSearch;
    } catch (error) {
      console.error(`Failed to update saved search ${id}:`, error);
      throw error;
    }
  }

  async deleteSavedSearch(id: string): Promise<void> {
    try {
      await tenantApiClient.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Failed to delete saved search ${id}:`, error);
      throw error;
    }
  }

  async incrementUsage(id: string): Promise<void> {
    try {
      await tenantApiClient.post(`${this.basePath}/${id}/increment-usage`);
    } catch (error) {
      console.error(`Failed to increment usage for saved search ${id}:`, error);
      // Don't throw error for usage tracking - it's non-critical
      console.warn('Usage increment failed but continuing...');
    }
  }

  async duplicateSavedSearch(id: string, newName: string): Promise<SavedSearch> {
    try {
      const response = await tenantApiClient.post<{ savedSearch: SavedSearch }>(
        `${this.basePath}/${id}/duplicate`,
        { name: newName }
      );
      return response.data.savedSearch;
    } catch (error) {
      console.error(`Failed to duplicate saved search ${id}:`, error);
      throw error;
    }
  }
}

export const savedSearchesService = new SavedSearchesService();
