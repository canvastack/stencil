import { tenantApiClient } from './tenantApiClient';
import type {
  ExportConfig,
  ExportJob,
  ExportResponse,
  ExportJobListResponse,
  ImportConfig,
  ImportJob,
  ImportResponse,
  ImportJobListResponse,
  ImportProgress,
  ImportPreview,
  ImportValidationResult,
} from '@/types/importExport';

class ImportExportService {
  async createExportJob(config: ExportConfig): Promise<ExportJob> {
    try {
      const response = await tenantApiClient.post<ExportResponse>(
        '/products/export',
        config
      );
      
      return response.data.job;
    } catch (error) {
      console.error('Failed to create export job:', error);
      throw error;
    }
  }

  async getExportJob(jobId: string): Promise<ExportJob> {
    try {
      const response = await tenantApiClient.get<{ job: ExportJob }>(
        `/products/export/${jobId}`
      );
      
      return response.data.job;
    } catch (error) {
      console.error('Failed to get export job:', error);
      throw error;
    }
  }

  async getExportJobs(page = 1, perPage = 20): Promise<ExportJobListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await tenantApiClient.get<ExportJobListResponse>(
        `/products/export?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get export jobs:', error);
      throw error;
    }
  }

  async downloadExportFile(jobId: string): Promise<Blob> {
    try {
      const response = await tenantApiClient.getAxiosInstance().get(
        `/products/export/${jobId}/download`,
        {
          responseType: 'blob',
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to download export file:', error);
      throw error;
    }
  }

  async deleteExportJob(jobId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/export/${jobId}`);
    } catch (error) {
      console.error('Failed to delete export job:', error);
      throw error;
    }
  }

  async previewImport(file: File): Promise<ImportPreview> {
    try {
      const response = await tenantApiClient.uploadFile<{ preview: ImportPreview }>(
        '/products/import/preview',
        file
      );
      
      return response.data.preview;
    } catch (error) {
      console.error('Failed to preview import:', error);
      throw error;
    }
  }

  async validateImport(config: ImportConfig): Promise<ImportValidationResult> {
    try {
      const formData = new FormData();
      formData.append('file', config.file);
      formData.append('format', config.format);
      formData.append('dry_run', 'true');
      
      if (config.mapping) {
        formData.append('mapping', JSON.stringify(config.mapping));
      }

      const response = await tenantApiClient.getAxiosInstance().post<{
        data: { validation: ImportValidationResult };
      }>(
        '/products/import/validate',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.data.validation;
    } catch (error) {
      console.error('Failed to validate import:', error);
      throw error;
    }
  }

  async createImportJob(config: ImportConfig): Promise<ImportJob> {
    try {
      const formData = new FormData();
      formData.append('file', config.file);
      formData.append('format', config.format);
      formData.append('dry_run', config.dryRun ? 'true' : 'false');
      formData.append('update_existing', config.updateExisting ? 'true' : 'false');
      formData.append('skip_errors', config.skipErrors ? 'true' : 'false');
      
      if (config.batchSize) {
        formData.append('batch_size', config.batchSize.toString());
      }
      
      if (config.mapping) {
        formData.append('mapping', JSON.stringify(config.mapping));
      }

      const response = await tenantApiClient.getAxiosInstance().post<ImportResponse>(
        '/products/import',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.job;
    } catch (error) {
      console.error('Failed to create import job:', error);
      throw error;
    }
  }

  async getImportJob(jobId: string): Promise<ImportJob> {
    try {
      const response = await tenantApiClient.get<{ job: ImportJob }>(
        `/products/import/${jobId}`
      );
      
      return response.data.job;
    } catch (error) {
      console.error('Failed to get import job:', error);
      throw error;
    }
  }

  async getImportJobs(page = 1, perPage = 20): Promise<ImportJobListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await tenantApiClient.get<ImportJobListResponse>(
        `/products/import?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get import jobs:', error);
      throw error;
    }
  }

  async getImportProgress(jobId: string): Promise<ImportProgress> {
    try {
      const response = await tenantApiClient.get<{ progress: ImportProgress }>(
        `/products/import/${jobId}/progress`
      );
      
      return response.data.progress;
    } catch (error) {
      console.error('Failed to get import progress:', error);
      throw error;
    }
  }

  async cancelImportJob(jobId: string): Promise<void> {
    try {
      await tenantApiClient.post(`/products/import/${jobId}/cancel`);
    } catch (error) {
      console.error('Failed to cancel import job:', error);
      throw error;
    }
  }

  async downloadErrorLog(jobId: string): Promise<Blob> {
    try {
      const response = await tenantApiClient.getAxiosInstance().get(
        `/products/import/${jobId}/errors`,
        {
          responseType: 'blob',
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to download error log:', error);
      throw error;
    }
  }

  async deleteImportJob(jobId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/import/${jobId}`);
    } catch (error) {
      console.error('Failed to delete import job:', error);
      throw error;
    }
  }

  async downloadTemplate(format: 'csv' | 'excel'): Promise<Blob> {
    try {
      const response = await tenantApiClient.getAxiosInstance().get(
        `/products/import/template?format=${format}`,
        {
          responseType: 'blob',
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to download template:', error);
      throw error;
    }
  }
}

export const importExportService = new ImportExportService();
