import { createUrl } from './url';

export const generatePath = (path: string, params: Record<string, string> = {}, query: Record<string, string> = {}) => {
  // Replace route parameters (:param) with actual values
  const routePath = Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    path
  );

  // Add query parameters
  const queryString = Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  // Combine path with query string
  const fullPath = queryString ? `${routePath}?${queryString}` : routePath;

  // Create full URL with base path
  return createUrl(fullPath);
};

// Routes configuration
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:slug',
  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  // Add other routes as needed
} as const;

// Helper functions for commonly used routes
export const getProductDetailPath = (slug: string, preview = false) => {
  return generatePath(ROUTES.PRODUCT_DETAIL, { slug }, preview ? { preview: 'true' } : {});
};

export const getAdminPath = (path = '') => {
  return generatePath(ROUTES.ADMIN + (path.startsWith('/') ? path : `/${path}`));
};