export interface ProductSpecification {
  key: string;
  value: string;
}

export interface ProductCustomOption {
  name: string;
  type: 'boolean' | 'text' | 'select' | 'number';
  options?: string[];
  required?: boolean;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface Product {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  description?: string | null;
  longDescription?: string | null;
  images?: string[];
  features?: string[];
  category?: string | { id: string; name: string; slug: string } | null;
  subcategory?: string | null;
  tags?: string[];
  material?: string | null;
  type?: 'physical' | 'digital' | 'service' | null; // Technical type
  business_type?: string | null; // Business domain type (metal_etching, glass_etching, etc)
  type_display?: string | null; // Human-readable label
  size?: string | null; // Default/recommended size
  available_sizes?: string[] | null; // Available size options
  price?: number;
  currency?: string;
  priceUnit?: string;
  minOrder?: number;
  specifications?: ProductSpecification[];
  customizable?: boolean;
  customOptions?: ProductCustomOption[];
  inStock?: boolean;
  stockQuantity: number;
  leadTime?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  rating?: number; // Average rating from reviews
  reviewCount?: number; // Total number of reviews
  reviewSummary?: ReviewSummary;
  createdAt?: string;
  updatedAt?: string;
  // Optional form/order related fields used by admin editor
  productType?: string;
  size?: string;
  bahan?: string;
  bahanOptions?: string[];
  kualitas?: string;
  kualitasOptions?: string[];
  ketebalan?: string;
  ketebalanOptions?: string[];
  ukuran?: string;
  ukuranOptions?: string[];
  warnaBackground?: string;
  designFileUrl?: string;
  customTexts?: Array<{ text: string; placement: string; position: string; color: string }>;
  notesWysiwyg?: string;
  // Business logic fields
  productionType?: 'internal' | 'vendor' | null;
  quotationRequired?: boolean;
  vendorPrice?: number | null;
  markupPercentage?: number | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image?: string;
  order?: number;
  isActive: boolean;
}

export interface ProductFilters {
  // Pagination
  page?: number;
  per_page?: number;
  
  // Search
  search?: string;
  
  // Sorting
  sort?: string;
  order?: string;
  
  // Category filters
  category?: string;
  subcategory?: string;
  categories?: string[];
  
  // Product attributes
  type?: string;
  size?: string;
  material?: string;
  customizable?: boolean;
  
  // Status & availability
  featured?: boolean;
  status?: string;
  inStock?: boolean;
  
  // Price range
  priceMin?: number;
  priceMax?: number;
  
  // Stock range
  stockMin?: number;
  stockMax?: number;
  
  // Rating filter
  minRating?: number;
  min_rating?: number;
  
  // Tags
  tags?: string[];
  
  // Vendors
  vendors?: string[];
  
  // Date filters
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}
