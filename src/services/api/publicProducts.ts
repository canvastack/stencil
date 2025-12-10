import { anonymousApiClient } from './anonymousApiClient';
import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse } from '@/types/api';
import * as mockProducts from '@/services/mock/products';

const USE_MOCK = false; // Use real API data from database

/**
 * Transform backend API response to frontend Product format
 */
function transformApiProduct(apiProduct: any): Product {
  return {
    id: String(apiProduct.id),
    name: apiProduct.name || '',
    slug: apiProduct.slug || '',
    description: apiProduct.description || '',
    longDescription: apiProduct.longDescription || '',
    images: apiProduct.media?.images || [],
    features: apiProduct.specifications?.features || [],
    category: apiProduct.category?.name || '',
    subcategory: apiProduct.subcategory || '',
    tags: apiProduct.taxonomy?.tags || [],
    material: apiProduct.materials?.material || apiProduct.material || '',
    price: (apiProduct.pricing?.price || 0) / 100, // Convert from cents to rupiah
    currency: apiProduct.pricing?.currency || 'IDR',
    priceUnit: apiProduct.pricing?.priceUnit || 'piece',
    minOrder: apiProduct.ordering?.minOrderQuantity || 1,
    specifications: apiProduct.specifications?.specifications || [],
    customizable: apiProduct.customization?.customizable || false,
    customOptions: apiProduct.customization?.customOptions || [],
    inStock: apiProduct.inventory?.inStock || false,
    stockQuantity: apiProduct.inventory?.stockQuantity || 0,
    leadTime: apiProduct.ordering?.leadTime || '',
    seoTitle: apiProduct.seo?.seoTitle || '',
    seoDescription: apiProduct.seo?.seoDescription || '',
    seoKeywords: apiProduct.seo?.seoKeywords || [],
    status: apiProduct.status || 'published',
    featured: apiProduct.marketing?.featured || false,
    createdAt: apiProduct.timestamps?.createdAt || '',
    updatedAt: apiProduct.timestamps?.updatedAt || '',
  };
}

/**
 * Service khusus untuk mengakses produk melalui public API dengan tenant context
 * Digunakan pada halaman public untuk mengambil data real dari database per tenant
 */
class PublicProductsService {
  async getProducts(filters?: ProductFilters, tenantSlug?: string): Promise<PaginatedResponse<Product>> {
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

      // Use tenant-specific public API endpoint untuk mengambil data real dari database
      const endpoint = tenantSlug 
        ? `/public/${tenantSlug}/products?${params.toString()}`
        : `/public/products?${params.toString()}`;
        
      const response = await anonymousApiClient.get<any>(endpoint);
      
      // Transform the API response to match frontend Product type
      const transformedData = response.data?.map(transformApiProduct) || [];
      
      return {
        data: transformedData,
        current_page: response.meta?.current_page || response.current_page || 1,
        per_page: response.meta?.per_page || response.per_page || 10,
        total: response.meta?.total || response.total || 0,
        last_page: response.meta?.last_page || response.last_page || 1,
      };
    } catch (error) {
      console.warn('Public API not available, falling back to mock data:', error);
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

  async getProductBySlug(slug: string, tenantSlug?: string): Promise<Product | null> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.getProductBySlug(slug));
    }

    try {
      // Use tenant-specific public API endpoint untuk mengambil data real dari database
      const endpoint = tenantSlug 
        ? `/public/${tenantSlug}/products/slug/${slug}`
        : `/public/products/slug/${slug}`;
        
      const response = await anonymousApiClient.get<any>(endpoint);
      return response ? transformApiProduct(response) : null;
    } catch (error) {
      console.warn('Public API not available, falling back to mock data:', error);
      return mockProducts.getProductBySlug(slug);
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.getProductById(id));
    }

    try {
      // Use public API endpoint untuk mengambil data real dari database
      const response = await anonymousApiClient.get<any>(`/public/products/${id}`);
      return response ? transformApiProduct(response) : null;
    } catch (error) {
      console.warn('Public API not available, falling back to mock data:', error);
      return mockProducts.getProductById(id);
    }
  }

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.getFeaturedProducts(limit));
    }

    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      params.append('featured', 'true');

      const response = await anonymousApiClient.get<any>(
        `/public/products?${params.toString()}`
      );
      return response.data?.map(transformApiProduct) || [];
    } catch (error) {
      console.warn('Public API not available, falling back to mock data:', error);
      return mockProducts.getFeaturedProducts(limit);
    }
  }

  async getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.getProductsByCategory(category, limit));
    }

    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      params.append('category', category);

      const response = await anonymousApiClient.get<any>(
        `/public/products?${params.toString()}`
      );
      return response.data?.map(transformApiProduct) || [];
    } catch (error) {
      console.warn('Public API not available, falling back to mock data:', error);
      return mockProducts.getProductsByCategory(category, limit);
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (USE_MOCK) {
      return Promise.resolve(mockProducts.searchProducts(query));
    }

    try {
      const params = new URLSearchParams();
      params.append('search', query);

      const response = await anonymousApiClient.get<any>(
        `/public/products?${params.toString()}`
      );
      return response.data?.map(transformApiProduct) || [];
    } catch (error) {
      console.warn('Public API not available, falling back to mock data:', error);
      return mockProducts.searchProducts(query);
    }
  }
}

export const publicProductsService = new PublicProductsService();
export default publicProductsService;