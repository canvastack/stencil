import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import * as mockProducts from '@/services/mock/products';
import { getContextAwareClient } from './contextAwareClients';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

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

export const createContextAwareProductsService = (userType: 'anonymous' | 'platform' | 'tenant') => {
  const apiClient = getContextAwareClient(userType);
  
  return {
    async getProducts(params?: ListRequestParams & ProductFilters): Promise<PaginatedResponse<Product>> {
      if (USE_MOCK) {
        return Promise.resolve(mockProducts.getProducts(params));
      }
      
      try {
        // Different endpoints based on user context
        let endpoint = '/products';
        if (userType === 'platform') {
          endpoint = '/platform/products';
        } else if (userType === 'tenant') {
          endpoint = '/admin/products';
        } else {
          endpoint = '/public/products';
        }

        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        const response = await apiClient.get<PaginatedResponse<Product>>(`${endpoint}?${queryParams.toString()}`);
        return response.data || response as any;
      } catch (error) {
        console.error('Products API call failed, falling back to mock data:', error);
        return Promise.resolve(mockProducts.getProducts(params));
      }
    },

    async getProductById(id: string): Promise<Product> {
      if (USE_MOCK) {
        return Promise.resolve(mockProducts.getProductById(id));
      }
      
      try {
        let endpoint = `/products/${id}`;
        if (userType === 'platform') {
          endpoint = `/platform/products/${id}`;
        } else if (userType === 'tenant') {
          endpoint = `/admin/products/${id}`;
        } else {
          endpoint = `/public/products/${id}`;
        }

        const response = await apiClient.get<Product>(endpoint);
        return response.data || response as any;
      } catch (error) {
        console.error('Product API call failed, falling back to mock data:', error);
        return Promise.resolve(mockProducts.getProductById(id));
      }
    },

    async createProduct(data: CreateProductRequest): Promise<Product> {
      if (USE_MOCK) {
        return Promise.resolve(mockProducts.createProduct(data as any));
      }
      
      try {
        let endpoint = '/admin/products';
        if (userType === 'platform') {
          endpoint = '/platform/products';
        }

        const response = await apiClient.post<Product>(endpoint, data);
        return response.data || response as any;
      } catch (error) {
        console.error('Create product API call failed, falling back to mock data:', error);
        return Promise.resolve(mockProducts.createProduct(data as any));
      }
    },

    async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
      if (USE_MOCK) {
        return Promise.resolve(mockProducts.updateProduct(id, data as any));
      }
      
      try {
        let endpoint = `/admin/products/${id}`;
        if (userType === 'platform') {
          endpoint = `/platform/products/${id}`;
        }

        const response = await apiClient.put<Product>(endpoint, data);
        return response.data || response as any;
      } catch (error) {
        console.error('Update product API call failed, falling back to mock data:', error);
        return Promise.resolve(mockProducts.updateProduct(id, data as any));
      }
    },

    async deleteProduct(id: string): Promise<boolean> {
      if (USE_MOCK) {
        return Promise.resolve(mockProducts.deleteProduct(id));
      }
      
      try {
        let endpoint = `/admin/products/${id}`;
        if (userType === 'platform') {
          endpoint = `/platform/products/${id}`;
        }

        await apiClient.delete(endpoint);
        return true;
      } catch (error) {
        console.error('Delete product API call failed, falling back to mock data:', error);
        return Promise.resolve(mockProducts.deleteProduct(id));
      }
    }
  };
};