import type { Product } from '@/types/product';

/**
 * Transform backend product response (snake_case) to frontend Product type (camelCase)
 * 
 * SECURITY NOTE:
 * - Frontend uses UUID as ID, NOT database integer ID
 * - Backend should use API Resources to exclude 'id' field from responses
 * - See: app/Http/Resources/ProductResource.php
 */
export function transformProduct(backendProduct: any): Product {
  return {
    id: backendProduct.uuid || backendProduct.id,
    uuid: backendProduct.uuid,
    name: backendProduct.name,
    slug: backendProduct.slug,
    description: backendProduct.description,
    longDescription: backendProduct.long_description,
    images: backendProduct.images || [],
    features: backendProduct.features || [],
    category: backendProduct.category,
    subcategory: backendProduct.subcategory,
    tags: backendProduct.tags || [],
    material: backendProduct.material,
    price: backendProduct.price,
    currency: backendProduct.currency,
    priceUnit: backendProduct.price_unit,
    minOrder: backendProduct.min_order || backendProduct.min_order_quantity,
    specifications: backendProduct.specifications || [],
    customizable: backendProduct.customizable || false,
    customOptions: backendProduct.custom_options || [],
    inStock: backendProduct.in_stock ?? backendProduct.inStock,
    stockQuantity: backendProduct.stock_quantity ?? backendProduct.stockQuantity,
    leadTime: backendProduct.lead_time,
    seoTitle: backendProduct.seo_title,
    seoDescription: backendProduct.seo_description,
    seoKeywords: backendProduct.seo_keywords,
    status: backendProduct.status || 'draft',
    featured: Boolean(backendProduct.is_featured ?? backendProduct.featured ?? backendProduct.isFeatured ?? false),
    createdAt: backendProduct.created_at,
    updatedAt: backendProduct.updated_at,
    
    // Form-related fields
    productType: backendProduct.product_type,
    size: backendProduct.size,
    bahan: backendProduct.bahan,
    bahanOptions: backendProduct.bahan_options,
    kualitas: backendProduct.kualitas,
    kualitasOptions: backendProduct.kualitas_options,
    ketebalan: backendProduct.ketebalan,
    ketebalanOptions: backendProduct.ketebalan_options,
    ukuran: backendProduct.ukuran,
    ukuranOptions: backendProduct.ukuran_options,
    warnaBackground: backendProduct.warna_background,
    designFileUrl: backendProduct.design_file_url,
    customTexts: backendProduct.custom_texts,
    notesWysiwyg: backendProduct.notes_wysiwyg,
  };
}

/**
 * Transform array of backend products
 */
export function transformProducts(backendProducts: any[]): Product[] {
  return backendProducts.map(transformProduct);
}
