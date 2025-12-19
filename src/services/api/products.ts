import { tenantApiClient } from '../tenant/tenantApiClient';
import { anonymousApiClient } from './anonymousApiClient';
import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import * as mockProducts from '@/services/mock/products';
import { transformProduct, transformProducts } from '@/utils/productTransform';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

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
  specifications?: Array<{ key: string; value: string }>;
  customizable?: boolean;
  customOptions?: any[];
  inStock: boolean;
  stockQuantity?: number;
  leadTime?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status?: string;
  featured?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

class ProductsService {
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    if (USE_MOCK) {
      const mockData = mockProducts.getProducts(filters);
      return Promise.resolve({
        data: Array.isArray(mockData) ? mockData : [],
        current_page: filters?.page || 1,
        per_page: filters?.per_page || 10,
        total: Array.isArray(mockData) ? mockData.length : 0,
        last_page: 1,
      });
    }

    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.per_page) params.append('per_page', filters.per_page.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.order) params.append('order', filters.order);
        if (filters.category) params.append('category', filters.category);
        if (filters.subcategory) params.append('subcategory', filters.subcategory);
        if (filters.status) params.append('status', filters.status);
        if (filters.featured !== undefined) params.append('featured', String(filters.featured));
        if (filters.inStock !== undefined) params.append('in_stock', String(filters.inStock));
        if (filters.priceMin !== undefined) params.append('price_min', filters.priceMin.toString());
        if (filters.priceMax !== undefined) params.append('price_max', filters.priceMax.toString());
      }

      // Try public API first for public pages
      try {
        const publicResponse = await anonymousApiClient.get<PaginatedResponse<any>>(
          `/public/products?${params.toString()}`
        );
        
        if (import.meta.env.DEV && publicResponse.data?.[0]) {
          console.log('📦 Sample backend product (PUBLIC API):', publicResponse.data[0]);
        }
        
        return {
          ...publicResponse,
          data: transformProducts(publicResponse.data),
        };
      } catch (publicError) {
        // Fall back to tenant API if public API fails
        const response = await tenantApiClient.get<PaginatedResponse<any>>(
          `/products?${params.toString()}`
        );
        
        // DEBUG: Log backend response structure
        console.group('🔍 BACKEND RESPONSE DEBUG');
        console.log('Total products received:', response.data?.length);
        if (response.data?.[0]) {
          console.log('First product raw data:', response.data[0]);
          console.log('Featured field check:', {
            featured: response.data[0].featured,
            is_featured: response.data[0].is_featured,
            isFeatured: response.data[0].isFeatured,
            has_featured_key: 'featured' in response.data[0],
            has_is_featured_key: 'is_featured' in response.data[0],
            all_keys: Object.keys(response.data[0])
          });
        }
        console.groupEnd();
        
        return {
          ...response,
          data: transformProducts(response.data),
        };
      }
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      const mockData = mockProducts.getProducts(filters);
      return {
        data: Array.isArray(mockData) ? mockData : [],
        current_page: filters?.page || 1,
        per_page: filters?.per_page || 10,
        total: Array.isArray(mockData) ? mockData.length : 0,
        last_page: 1,
      };
    }
  }

  async getProductById(id: string): Promise<Product> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.getProductById(id));
    }

    try {
      // Try public API first
      try {
        const publicResponse = await anonymousApiClient.get<any>(`/public/products/${id}`);
        return transformProduct(publicResponse);
      } catch (publicError) {
        // Fall back to tenant API
        const response = await tenantApiClient.get<any>(`/products/${id}`);
        return transformProduct(response);
      }
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockProducts.getProductById(id);
    }
  }

  async getProductBySlug(slug: string): Promise<Product> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.getProductBySlug(slug));
    }

    try {
      // Try public API first
      try {
        const publicResponse = await anonymousApiClient.get<any>(`/public/products/slug/${slug}`);
        return transformProduct(publicResponse);
      } catch (publicError) {
        // Fall back to tenant API
        const response = await tenantApiClient.get<any>(`/products/slug/${slug}`);
        return transformProduct(response);
      }
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockProducts.getProductBySlug(slug);
    }
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.createProduct(data));
    }

    try {
      const response = await tenantApiClient.post<any>('/products', data);
      return transformProduct(response);
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockProducts.createProduct(data);
    }
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    if (USE_MOCK) {
      const updated = mockProducts.updateProduct(id, data);
      if (!updated) throw new Error('Product not found');
      return Promise.resolve(updated);
    }

    try {
      const response = await tenantApiClient.put<any>(`/products/${id}`, data);
      return transformProduct(response);
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      const updated = mockProducts.updateProduct(id, data);
      if (!updated) throw new Error('Product not found');
      return updated;
    }
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    if (USE_MOCK) {
      mockProducts.deleteProduct(id);
      return Promise.resolve({ message: 'Product deleted' });
    }

    try {
      const response = await tenantApiClient.delete<{ message: string }>(`/products/${id}`);
      return response;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      mockProducts.deleteProduct(id);
      return { message: 'Product deleted' };
    }
  }

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.getFeaturedProducts(limit));
    }

    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await tenantApiClient.get<any[]>(`/products/featured${params}`);
      return transformProducts(response);
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockProducts.getFeaturedProducts(limit);
    }
  }

  async getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.getProductsByCategory(category, limit));
    }

    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await tenantApiClient.get<any[]>(`/products/category/${category}${params}`);
      return transformProducts(response);
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockProducts.getProductsByCategory(category, limit);
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.searchProducts(query));
    }

    try {
      const response = await tenantApiClient.get<any[]>(
        `/products/search?q=${encodeURIComponent(query)}`
      );
      return transformProducts(response);
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockProducts.searchProducts(query);
    }
  }

  async getProductVariants(id: string): Promise<any[]> {
    try {
      const response = await tenantApiClient.get<any[]>(`/products/${id}/variants`);
      return response;
    } catch (error: any) {
      if (error?.status === 404) {
        return [];
      }
      console.error('Failed to fetch product variants:', error);
      return [];
    }
  }

  async createVariant(productId: string, data: any): Promise<any> {
    try {
      const response = await tenantApiClient.post<any>(`/products/${productId}/variants`, data);
      return response;
    } catch (error) {
      console.error('Failed to create product variant:', error);
      throw error;
    }
  }

  async updateVariant(productId: string, variantId: string, data: any): Promise<any> {
    try {
      const response = await tenantApiClient.put<any>(`/products/${productId}/variants/${variantId}`, data);
      return response;
    } catch (error) {
      console.error('Failed to update product variant:', error);
      throw error;
    }
  }

  async deleteVariant(productId: string, variantId: string): Promise<{ message: string }> {
    try {
      const response = await tenantApiClient.delete<{ message: string }>(`/products/${productId}/variants/${variantId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete product variant:', error);
      throw error;
    }
  }
}

export const productsService = new ProductsService();
export default productsService;
