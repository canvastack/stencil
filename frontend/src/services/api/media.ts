import apiClient from './client';
import { tenantApiClient } from './tenantApiClient';
import { anonymousApiClient } from './anonymousApiClient';
import { PaginatedResponse, ListRequestParams } from '@/types/api';

export interface MediaFile {
  id: string;
  uuid: string;
  tenant_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  url: string;
  folder_id?: string;
  disk: string;
  path: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MediaFolder {
  id: string;
  uuid: string;
  tenant_id: string;
  name: string;
  slug: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFilters extends ListRequestParams {
  folder_id?: string;
  mime_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface UploadMediaRequest {
  file: File;
  folder_id?: string;
  metadata?: Record<string, any>;
}

class MediaService {
  async getMediaFiles(filters?: MediaFilters): Promise<PaginatedResponse<MediaFile>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      if (filters.folder_id) params.append('folder_id', filters.folder_id);
      if (filters.mime_type) params.append('mime_type', filters.mime_type);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
    }

    const response = await apiClient.get<PaginatedResponse<MediaFile>>(
      `/media?${params.toString()}`
    );
    return response;
  }

  async getMediaFileById(id: string): Promise<MediaFile> {
    const response = await apiClient.get<MediaFile>(`/media/${id}`);
    return response;
  }

  async uploadMedia(data: UploadMediaRequest): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.folder_id) {
      formData.append('folder_id', data.folder_id);
    }
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    const response = await apiClient.post<MediaFile>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }

  async deleteMedia(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/media/${id}`);
    return response;
  }

  async updateMedia(id: string, data: Partial<MediaFile>): Promise<MediaFile> {
    const response = await apiClient.put<MediaFile>(`/media/${id}`, data);
    return response;
  }

  async getFolders(): Promise<MediaFolder[]> {
    const response = await apiClient.get<MediaFolder[]>('/media/folders');
    return response;
  }

  async createFolder(name: string, parentId?: string): Promise<MediaFolder> {
    const response = await apiClient.post<MediaFolder>('/media/folders', {
      name,
      parent_id: parentId,
    });
    return response;
  }

  async updateFolder(id: string, name: string): Promise<MediaFolder> {
    const response = await apiClient.put<MediaFolder>(`/media/folders/${id}`, { name });
    return response;
  }

  async deleteFolder(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/media/folders/${id}`);
    return response;
  }

  async bulkUpload(files: File[], folderId?: string): Promise<MediaFile[]> {
    const results: MediaFile[] = [];
    for (const file of files) {
      const result = await this.uploadMedia({
        file,
        folder_id: folderId,
      });
      results.push(result);
    }
    return results;
  }

  async bulkDelete(ids: string[]): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/media/bulk-delete', {
      ids,
    });
    return response;
  }

  async uploadFile(
    file: File,
    options?: {
      folder?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<{
    data: {
      url: string;
      path: string;
      filename: string;
      size: number;
      mime_type: string;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    const response = await tenantApiClient.post<{
      message: string;
      data: {
        url: string;
        path: string;
        filename: string;
        size: number;
        mime_type: string;
      };
    }>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    });

    return response;
  }

  async deleteFile(path: string): Promise<{ message: string }> {
    const response = await tenantApiClient.post<{ message: string }>('/media/delete', {
      path,
    });
    return response;
  }

  async uploadPublicFile(
    file: File,
    options?: {
      folder?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<{
    data: {
      url: string;
      path: string;
      filename: string;
      size: number;
      mime_type: string;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    const response = await anonymousApiClient.post<{
      message: string;
      data: {
        url: string;
        path: string;
        filename: string;
        size: number;
        mime_type: string;
      };
    }>('/public/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    });

    return response;
  }
}

export const mediaService = new MediaService();
export default mediaService;
