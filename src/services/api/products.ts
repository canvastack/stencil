import { Product, ProductFilters } from '@/types/product';
import apiClient from './client';
import * as mockProducts from '@/services/mock/products';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  if (USE_MOCK) {
    return Promise.resolve(mockProducts.getProducts(filters));
  }
  
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get<Product[]>(`/admin/products?${params.toString()}`);
    return response as unknown as Product[];
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockProducts.getProducts(filters);
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockProducts.getProductById(id));
  }
  
  try {
    const response = await apiClient.get<Product>(`/admin/products/${id}`);
    return response as unknown as Product;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockProducts.getProductById(id);
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockProducts.getProductBySlug(slug));
  }
  
  try {
    const response = await apiClient.get<Product>(`/admin/products/slug/${slug}`);
    return response as unknown as Product;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockProducts.getProductBySlug(slug);
  }
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  if (USE_MOCK) {
    return Promise.resolve(mockProducts.createProduct(data));
  }
  
  try {
    const response = await apiClient.post<Product>('/admin/products', data);
    return response as unknown as Product;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockProducts.createProduct(data);
  }
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  if (USE_MOCK) {
    const updated = mockProducts.updateProduct(id, data);
    if (!updated) throw new Error('Product not found');
    return Promise.resolve(updated);
  }
  
  try {
    const response = await apiClient.put<Product>(`/admin/products/${id}`, data);
    return response as unknown as Product;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    const updated = mockProducts.updateProduct(id, data);
    if (!updated) throw new Error('Product not found');
    return updated;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (USE_MOCK) {
    return Promise.resolve(mockProducts.deleteProduct(id));
  }
  
  try {
    await apiClient.delete(`/admin/products/${id}`);
    return true;
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockProducts.deleteProduct(id);
  }
}

export async function getFeaturedProducts(limit?: number): Promise<Product[]> {
  if (USE_MOCK) {
    return Promise.resolve(mockProducts.getFeaturedProducts(limit));
  }
  
  try {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<Product[]>(`/admin/products/featured${params}`);
    return response as unknown as Product[];
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockProducts.getFeaturedProducts(limit);
  }
}

export async function getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
  if (USE_MOCK) {
    return Promise.resolve(mockProducts.getProductsByCategory(category, limit));
  }
  
  try {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<Product[]>(`/admin/products/category/${category}${params}`);
    return response as unknown as Product[];
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockProducts.getProductsByCategory(category, limit);
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (USE_MOCK) {
    return Promise.resolve(mockProducts.searchProducts(query));
  }
  
  try {
    const response = await apiClient.get<Product[]>(`/admin/products/search?q=${encodeURIComponent(query)}`);
    return response as unknown as Product[];
  } catch (error) {
    console.error('API call failed, falling back to mock data:', error);
    return mockProducts.searchProducts(query);
  }
}

export function resetProducts(): void {
  if (USE_MOCK) {
    mockProducts.resetProducts();
  }
}
