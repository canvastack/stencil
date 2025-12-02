import { tenantApiClient } from '../tenant/tenantApiClient';
import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import * as mockProducts from '@/services/mock/products';

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

      const response = await tenantApiClient.get<PaginatedResponse<Product>>(
        `/products?${params.toString()}`
      );
      return response;
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
      const response = await tenantApiClient.get<Product>(`/products/${id}`);
      return response;
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
      const response = await tenantApiClient.get<Product>(`/products/slug/${slug}`);
      return response;
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
      const response = await tenantApiClient.post<Product>('/products', data);
      return response;
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
      const response = await tenantApiClient.put<Product>(`/products/${id}`, data);
      return response;
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
      const response = await tenantApiClient.get<Product[]>(`/products/featured${params}`);
      return response;
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
      const response = await tenantApiClient.get<Product[]>(`/products/category/${category}${params}`);
      return response;
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
      const response = await tenantApiClient.get<Product[]>(
        `/products/search?q=${encodeURIComponent(query)}`
      );
      return response;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockProducts.searchProducts(query);
    }
  }

  async getProductVariants(id: string): Promise<any[]> {
    try {
      const response = await tenantApiClient.get<any[]>(`/products/${id}/variants`);
      return response;
    } catch (error) {
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
