import { tenantApiClient } from './tenantApiClient';
import type {
  BulkOperationConfig,
  BulkOperationJob,
  BulkOperationResult,
  BulkOperationResponse,
  BulkOperationJobListResponse,
  BulkOperationProgress,
  BulkValidationResult,
} from '@/types/bulkOperations';

class BulkOperationsService {
  async validateBulkOperation(config: BulkOperationConfig): Promise<BulkValidationResult> {
    try {
      const response = await tenantApiClient.post<{ validation: BulkValidationResult }>(
        '/products/bulk/validate',
        config
      );
      
      return response.data.validation;
    } catch (error) {
      console.error('Failed to validate bulk operation:', error);
      throw error;
    }
  }

  async createBulkOperation(config: BulkOperationConfig): Promise<BulkOperationJob> {
    try {
      const response = await tenantApiClient.post<BulkOperationResponse>(
        '/products/bulk',
        config
      );
      
      return response.data.job;
    } catch (error) {
      console.error('Failed to create bulk operation:', error);
      throw error;
    }
  }

  async getBulkOperation(jobId: string): Promise<BulkOperationJob> {
    try {
      const response = await tenantApiClient.get<{ job: BulkOperationJob }>(
        `/products/bulk/${jobId}`
      );
      
      return response.data.job;
    } catch (error) {
      console.error('Failed to get bulk operation:', error);
      throw error;
    }
  }

  async getBulkOperations(page = 1, perPage = 20): Promise<BulkOperationJobListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await tenantApiClient.get<BulkOperationJobListResponse>(
        `/products/bulk?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get bulk operations:', error);
      throw error;
    }
  }

  async getBulkOperationProgress(jobId: string): Promise<BulkOperationProgress> {
    try {
      const response = await tenantApiClient.get<{ progress: BulkOperationProgress }>(
        `/products/bulk/${jobId}/progress`
      );
      
      return response.data.progress;
    } catch (error) {
      console.error('Failed to get bulk operation progress:', error);
      throw error;
    }
  }

  async getBulkOperationResult(jobId: string): Promise<BulkOperationResult> {
    try {
      const response = await tenantApiClient.get<{ result: BulkOperationResult }>(
        `/products/bulk/${jobId}/result`
      );
      
      return response.data.result;
    } catch (error) {
      console.error('Failed to get bulk operation result:', error);
      throw error;
    }
  }

  async cancelBulkOperation(jobId: string): Promise<void> {
    try {
      await tenantApiClient.post(`/products/bulk/${jobId}/cancel`);
    } catch (error) {
      console.error('Failed to cancel bulk operation:', error);
      throw error;
    }
  }

  async downloadBulkOperationReport(jobId: string): Promise<Blob> {
    try {
      const response = await tenantApiClient.getAxiosInstance().get(
        `/products/bulk/${jobId}/report`,
        {
          responseType: 'blob',
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to download bulk operation report:', error);
      throw error;
    }
  }

  async deleteBulkOperation(jobId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/bulk/${jobId}`);
    } catch (error) {
      console.error('Failed to delete bulk operation:', error);
      throw error;
    }
  }

  async bulkUpdateStatus(productIds: string[], status: 'draft' | 'published' | 'archived', dryRun = false): Promise<BulkOperationJob> {
    return this.createBulkOperation({
      action: 'update_status',
      productIds,
      data: { status },
      dryRun,
    });
  }

  async bulkUpdateFeatured(productIds: string[], featured: boolean, dryRun = false): Promise<BulkOperationJob> {
    return this.createBulkOperation({
      action: 'update_featured',
      productIds,
      data: { featured },
      dryRun,
    });
  }

  async bulkDelete(productIds: string[], permanent = false, dryRun = false): Promise<BulkOperationJob> {
    return this.createBulkOperation({
      action: 'delete',
      productIds,
      data: { permanent },
      dryRun,
    });
  }
}

export const bulkOperationsService = new BulkOperationsService();
