import { anonymousApiClient } from './anonymousApiClient';
import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse } from '@/types/api';

/**
 * Transform backend API response to frontend Product format
 */
function transformApiProduct(apiProduct: any): Product {
  // Handle wrapped responses: { data: {...} } or direct object
  const product = apiProduct?.data || apiProduct;
  
  if (!product || !product.id) {
    console.warn('transformApiProduct: Invalid product data:', apiProduct);
    throw new Error('Invalid product data received from API');
  }
  
  return {
    id: String(product.id),
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    longDescription: product.longDescription || '',
    images: product.media?.images || [],
    features: product.specifications?.features || [],
    category: product.category?.name || '',
    subcategory: product.subcategory || '',
    tags: product.taxonomy?.tags || [],
    material: product.materials?.material || product.material || '',
    price: (product.pricing?.price || 0) / 100, // Convert from cents to rupiah
    currency: product.pricing?.currency || 'IDR',
    priceUnit: product.pricing?.priceUnit || 'piece',
    minOrder: product.ordering?.minOrderQuantity || 1,
    specifications: product.specifications?.specifications || [],
    customizable: product.customization?.customizable || false,
    customOptions: product.customization?.customOptions || [],
    inStock: product.inventory?.inStock || false,
    stockQuantity: product.inventory?.stockQuantity || 0,
    leadTime: product.ordering?.leadTime || '',
    seoTitle: product.seo?.seoTitle || '',
    seoDescription: product.seo?.seoDescription || '',
    seoKeywords: product.seo?.seoKeywords || [],
    status: product.status || 'published',
    featured: product.marketing?.featured ?? product.is_featured ?? product.featured ?? false,
    createdAt: product.timestamps?.createdAt || product.created_at || '',
    updatedAt: product.timestamps?.updatedAt || product.updated_at || '',
  };
}

/**
 * Service khusus untuk mengakses produk melalui public API dengan tenant context
 * Digunakan pada halaman public untuk mengambil data real dari database per tenant
 */
class PublicProductsService {
  async getProducts(filters?: ProductFilters, tenantSlug?: string): Promise<PaginatedResponse<Product>> {
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

    const endpoint = tenantSlug 
      ? `/public/${tenantSlug}/products?${params.toString()}`
      : `/public/products?${params.toString()}`;
      
    const response = await anonymousApiClient.get<any>(endpoint);
    
    const transformedData = response.data?.map(transformApiProduct) || [];
    
    return {
      data: transformedData,
      current_page: response.meta?.current_page || response.current_page || 1,
      per_page: response.meta?.per_page || response.per_page || 10,
      total: response.meta?.total || response.total || 0,
      last_page: response.meta?.last_page || response.last_page || 1,
    };
  }

  async getProductBySlug(slug: string, tenantSlug?: string): Promise<Product | null> {
    const endpoint = tenantSlug 
      ? `/public/${tenantSlug}/products/slug/${slug}`
      : `/public/products/slug/${slug}`;
      
    const response = await anonymousApiClient.get<any>(endpoint);
    return response ? transformApiProduct(response) : null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const response = await anonymousApiClient.get<any>(`/public/products/${id}`);
    return response ? transformApiProduct(response) : null;
  }

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    params.append('featured', 'true');

    const response = await anonymousApiClient.get<any>(
      `/public/products?${params.toString()}`
    );
    return response.data?.map(transformApiProduct) || [];
  }

  async getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    params.append('category', category);

    const response = await anonymousApiClient.get<any>(
      `/public/products?${params.toString()}`
    );
    return response.data?.map(transformApiProduct) || [];
  }

  async searchProducts(query: string): Promise<Product[]> {
    const params = new URLSearchParams();
    params.append('search', query);

    const response = await anonymousApiClient.get<any>(
      `/public/products?${params.toString()}`
    );
    return response.data?.map(transformApiProduct) || [];
  }
}

export const publicProductsService = new PublicProductsService();
export default publicProductsService;