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
    uuid: product.uuid || '',
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
    price: product.pricing?.price || product.price || 0,
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
    productionType: product.productionType || null,
    quotationRequired: product.customization?.requiresQuote || product.quotationRequired || false,
    vendorPrice: product.pricing?.vendorPrice || product.vendorPrice || null,
    markupPercentage: product.pricing?.markupPercentage || product.markupPercentage || null,
    rating: product.reviewSummary?.averageRating ?? product.marketing?.averageRating ?? 0,
    reviewCount: product.reviewSummary?.reviewCount ?? product.marketing?.reviewCount ?? 0,
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
      // Pagination
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      
      // Search
      if (filters.search) params.append('search', filters.search);
      
      // Sorting
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      
      // Filters
      if (filters.type) params.append('type', filters.type);
      if (filters.size) params.append('size', filters.size);
      if (filters.material) params.append('material', filters.material);
      if (filters.category) params.append('category', filters.category);
      if (filters.subcategory) params.append('subcategory', filters.subcategory);
      if (filters.status) params.append('status', filters.status);
      if (filters.featured !== undefined) params.append('featured', String(filters.featured));
      if (filters.inStock !== undefined) params.append('in_stock', String(filters.inStock));
      
      // Price range
      if (filters.priceMin !== undefined) params.append('price_min', filters.priceMin.toString());
      if (filters.priceMax !== undefined) params.append('price_max', filters.priceMax.toString());
      
      // Additional filters from ProductFilters type
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tags[]', tag));
      }
      if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach(cat => params.append('categories[]', cat));
      }
      if (filters.vendors && filters.vendors.length > 0) {
        filters.vendors.forEach(vendor => params.append('vendors[]', vendor));
      }
      
      // Stock range
      if (filters.stockMin !== undefined) params.append('stock_min', filters.stockMin.toString());
      if (filters.stockMax !== undefined) params.append('stock_max', filters.stockMax.toString());
      
      // Rating filter (support both minRating and min_rating)
      const minRating = filters.minRating ?? filters.min_rating;
      if (minRating !== undefined && minRating > 0) {
        params.append('min_rating', minRating.toString());
      }
      
      // Date filters
      if (filters.createdAfter) params.append('created_after', filters.createdAfter);
      if (filters.createdBefore) params.append('created_before', filters.createdBefore);
      if (filters.updatedAfter) params.append('updated_after', filters.updatedAfter);
      if (filters.updatedBefore) params.append('updated_before', filters.updatedBefore);
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
      
    console.log('[PublicProductsService] Fetching product by slug:', { slug, tenantSlug, endpoint });
    const response = await anonymousApiClient.get<any>(endpoint);
    console.log('[PublicProductsService] Product response:', response);
    return response ? transformApiProduct(response) : null;
  }

  async getProductById(id: string): Promise<Product | null> {
    // Validate UUID format - if it looks like a slug, use slug endpoint instead
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
      // If not a valid UUID, assume it's a slug and redirect to slug endpoint
      console.warn(`getProductById called with non-UUID value "${id}", redirecting to getProductBySlug`);
      return await this.getProductBySlug(id);
    }
    
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

  /**
   * Get filter options (business_types, sizes, materials) from database
   * Phase 1.4.1: Remove hardcoded frontend filter data
   */
  async getFilterOptions(tenantSlug?: string): Promise<{
    business_types: Array<{ value: string; label: string }>;
    sizes: Array<{ value: string; label: string }>;
    materials: Array<{ value: string; label: string }>;
  }> {
    const baseUrl = tenantSlug ? `/public/${tenantSlug}/products/filter-options` : '/public/products/filter-options';
    
    try {
      const response = await anonymousApiClient.get<{
        data: {
          business_types: Array<{ value: string; label: string }>;
          sizes: Array<{ value: string; label: string }>;
          materials: Array<{ value: string; label: string }>;
        };
      }>(baseUrl);
      
      return response.data;
    } catch (error: any) {
      console.error('[PublicProductsService] Failed to fetch filter options:', error);
      
      // Return empty arrays as fallback
      return {
        business_types: [],
        sizes: [],
        materials: [],
      };
    }
  }
}

export const publicProductsService = new PublicProductsService();
export default publicProductsService;