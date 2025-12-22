// Application Constants
export const APP_CONFIG = {
  // Pagination
  PRODUCTS_PER_PAGE: 9,
  PRODUCT_CATALOG_PAGE_SIZE: 12,
  USERS_PER_PAGE: 10,
  ITEMS_PER_PAGE: 20,

  // Search & Filters
  SEARCH_DEBOUNCE_MS: 300,

  // File Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_SET: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // 3D Viewer
  VIEWER_HEIGHT: 500,
  AUTO_ROTATE_SPEED: 2,
  MIN_DISTANCE: 3,
  MAX_DISTANCE: 10,

  // Animation
  FADE_IN_DELAY: 0.1,
  SCALE_IN_DELAY: 0.1,

  // API
  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,

  // UI
  SIDEBAR_COLLAPSED_WIDTH: 64,
  SIDEBAR_EXPANDED_WIDTH: 256,
} as const;

// Product Categories
export const PRODUCT_CATEGORIES = [
  'industrial',
  'decorative',
  'corporate',
] as const;

// Product Types
export const PRODUCT_TYPES = [
  'metal',
  'glass',
  'award',
] as const;

// User Roles
export const USER_ROLES = [
  'Admin',
  'Manager',
  'Staff',
  'Viewer',
] as const;

// Status Options
export const STATUS_OPTIONS = [
  'published',
  'draft',
  'archived',
] as const;

// Navigation Items
export const NAVIGATION_ITEMS = [
  { name: "Beranda", path: "/" },
  { name: "Tentang Kami", path: "/about" },
  { name: "Produk", path: "/products" },
  { name: "Kontak", path: "/contact" },
] as const;

// Typing Texts for Hero
export const TYPING_TEXTS = [
  "Presisi tinggi untuk hasil sempurna",
  "Kualitas terbaik dengan harga kompetitif",
  "Teknologi modern untuk desain custom Anda",
  "Pengalaman 15+ tahun melayani klien"
] as const;