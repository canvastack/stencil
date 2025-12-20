import { tenantApiClient } from '../tenant/tenantApiClient';
import { anonymousApiClient } from './anonymousApiClient';
import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import { transformProduct, transformProducts } from '@/utils/productTransform';

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
  stockQuantity: number;
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
      const response = await tenantApiClient.get<PaginatedResponse<any>>(
        `/products?${params.toString()}`
      );
      
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
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const publicResponse = await anonymousApiClient.get<any>(`/public/products/${id}`);
      return transformProduct(publicResponse);
    } catch (publicError) {
      const response = await tenantApiClient.get<any>(`/products/${id}`);
      return transformProduct(response);
    }
  }

  async getProductBySlug(slug: string): Promise<Product> {
    try {
      const publicResponse = await anonymousApiClient.get<any>(`/public/products/slug/${slug}`);
      return transformProduct(publicResponse);
    } catch (publicError) {
      const response = await tenantApiClient.get<any>(`/products/slug/${slug}`);
      return transformProduct(response);
    }
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await tenantApiClient.post<any>('/products', data);
    return transformProduct(response);
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    const response = await tenantApiClient.put<any>(`/products/${id}`, data);
    return transformProduct(response);
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const response = await tenantApiClient.delete<{ message: string }>(`/products/${id}`);
    return response;
  }

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await tenantApiClient.get<any[]>(`/products/featured${params}`);
    return transformProducts(response);
  }

  async getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await tenantApiClient.get<any[]>(`/products/category/${category}${params}`);
    return transformProducts(response);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const response = await tenantApiClient.get<any[]>(
      `/products/search?q=${encodeURIComponent(query)}`
    );
    return transformProducts(response);
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
