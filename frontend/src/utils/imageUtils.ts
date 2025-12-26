/**
 * Default placeholder image for products
 */
export const DEFAULT_PRODUCT_IMAGE = '/images/product-placeholder.svg';

/**
 * Resolves image URL - Simplified to trust backend URLs
 * @param img - Image path/URL to resolve
 * @param options - Optional configuration (reserved for future use)
 * @returns Resolved image URL
 * 
 * NOTE: Backend (ProductResource) now handles all URL resolution including:
 * - Full CDN URLs when CDN_URL is configured
 * - Storage URLs with proper prefixes
 * - Already-absolute URLs (passed through)
 * 
 * Frontend should simply trust and use the URLs provided by the backend.
 */
export const resolveImageUrl = (img: string, options?: { prefix?: string; preview?: boolean }): string => {
  // Return default placeholder for null/undefined
  if (!img) return DEFAULT_PRODUCT_IMAGE;
  
  // Backend already provides full URLs - trust and return as-is
  // This includes:
  // - CDN URLs: https://cdn.canvastencil.com/...
  // - Storage URLs: http://localhost:8000/storage/...
  // - Absolute URLs: http://... or https://...
  // - Data URLs: data:image/...
  // - Blob URLs: blob:...
  return img;
};

/**
 * Get product image with fallback to default placeholder
 * @param images - Array of product images
 * @param index - Index of image to retrieve (default: 0)
 * @returns Image URL or default placeholder
 */
export const getProductImage = (images: string[] | undefined | null, index: number = 0): string => {
  if (!images || images.length === 0) {
    return DEFAULT_PRODUCT_IMAGE;
  }
  
  const image = images[index];
  return resolveImageUrl(image);
};