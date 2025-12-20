import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import { getContextAwareClient, getContextAwareEndpoint, UserType } from './contextAwareClients';
import { ApiError, AuthError, PermissionError, NotFoundError } from '@/lib/errors';

export interface CreateProductRequest {
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  images: string[];
  category: string;
  subcategory?: string;
  tags?: string[];
  material: string;
  price: number;
  currency?: string;
  priceUnit?: string;
  minOrder?: number;
  maxOrder?: number;
  leadTime?: string;
  availability?: 'in-stock' | 'out-of-stock' | 'pre-order';
  features?: string[];
  specifications?: Record<string, any>;
  customizationOptions?: Array<{
    name: string;
    type: 'text' | 'select' | 'color' | 'image';
    required: boolean;
    options?: string[];
  }>;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export const createContextAwareProductsService = (userType: UserType) => {
  const apiClient = getContextAwareClient(userType);
  
  const handleError = (error: any, operation: string): never => {
    if (error.response?.status === 401) {
      throw new AuthError('Session expired, please login again', error);
    }
    
    if (error.response?.status === 403) {
      throw new PermissionError('You do not have permission to perform this action', error);
    }
    
    if (error.response?.status === 404) {
      throw new NotFoundError('Resource not found', error);
    }
    
    throw new ApiError(`Failed to ${operation}`, error);
  };
  
  return {
    async getProducts(params?: ListRequestParams & ProductFilters, signal?: AbortSignal): Promise<PaginatedResponse<Product>> {
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products');
        const queryParams = new URLSearchParams();
        
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        const response = await apiClient.get<PaginatedResponse<Product>>(
          `${endpoint}?${queryParams.toString()}`,
          { signal }
        );
        return response as any;
      } catch (error) {
        handleError(error, 'fetch products');
      }
    },

    async getProductById(id: string, signal?: AbortSignal): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/${id}`);
        const response = await apiClient.get<Product>(endpoint, { signal });
        return response.data as Product;
      } catch (error) {
        handleError(error, 'fetch product');
      }
    },

    async getProductBySlug(slug: string, signal?: AbortSignal): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/slug/${slug}`);
        const response = await apiClient.get<Product>(endpoint, { signal });
        return response.data as Product;
      } catch (error) {
        handleError(error, 'fetch product');
      }
    },

    async createProduct(data: CreateProductRequest): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products');
        const response = await apiClient.post<Product>(endpoint, data);
        return response.data as Product;
      } catch (error) {
        handleError(error, 'create product');
      }
    },

    async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/${id}`);
        const response = await apiClient.put<Product>(endpoint, data);
        return response.data as Product;
      } catch (error) {
        handleError(error, 'update product');
      }
    },

    async deleteProduct(id: string): Promise<boolean> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/${id}`);
        await apiClient.delete(endpoint);
        return true;
      } catch (error) {
        handleError(error, 'delete product');
      }
    },

    async toggleFeatured(id: string): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/${id}/toggle-featured`);
        const response = await apiClient.patch<Product>(endpoint);
        return response.data as Product;
      } catch (error) {
        handleError(error, 'toggle featured status');
      }
    },

    async updateStock(id: string, stockQuantity: number): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/${id}/stock`);
        const response = await apiClient.patch<Product>(endpoint, { stock_quantity: stockQuantity });
        return response.data as Product;
      } catch (error) {
        handleError(error, 'update stock');
      }
    },

    async bulkDelete(ids: string[]): Promise<{ success: boolean; deleted: number }> {
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products/bulk-delete');
        const response = await apiClient.post<{ success: boolean; deleted: number }>(endpoint, { ids });
        return response.data;
      } catch (error) {
        handleError(error, 'bulk delete products');
      }
    },

    async bulkStatusUpdate(ids: string[], status: string): Promise<{ success: boolean; updated: number }> {
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products/bulk-status');
        const response = await apiClient.post<{ success: boolean; updated: number }>(endpoint, { ids, status });
        return response.data;
      } catch (error) {
        handleError(error, 'bulk update status');
      }
    },

    async reorderProducts(productIds: string[]): Promise<{ success: boolean; message: string }> {
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products/reorder');
        const response = await apiClient.post<{ success: boolean; message: string }>(endpoint, { product_ids: productIds });
        return response.data;
      } catch (error) {
        handleError(error, 'reorder products');
      }
    },

    async bulkUpdateProducts(productIds: string[], updateData: {
      priceUpdate?: { mode: 'set' | 'add' | 'subtract' | 'multiply'; value: number };
      stockUpdate?: { mode: 'set' | 'add' | 'subtract'; value: number };
      status?: 'draft' | 'published' | 'archived';
      featured?: boolean;
      category?: string;
    }): Promise<{ updated: number; failed: number; errors?: any[] }> {
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products/bulk-update');
        const response = await apiClient.post<{ updated: number; failed: number; errors?: any[] }>(
          endpoint, 
          { 
            product_ids: productIds,
            ...updateData 
          }
        );
        return response.data;
      } catch (error) {
        handleError(error, 'bulk update products');
      }
    },

    async duplicateProduct(id: string): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/${id}/duplicate`);
        const response = await apiClient.post<Product>(endpoint);
        return response.data as Product;
      } catch (error) {
        handleError(error, 'duplicate product');
      }
    }
  };
};
