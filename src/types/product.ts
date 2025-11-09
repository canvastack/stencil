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

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  images: string[];
  features?: string[];
  category: string;
  subcategory?: string;
  tags: string[];
  material: string;
  price: number;
  currency: string;
  priceUnit: string;
  minOrder: number;
  specifications: ProductSpecification[];
  customizable: boolean;
  customOptions?: ProductCustomOption[];
  inStock: boolean;
  stockQuantity?: number;
  leadTime: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
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
  category?: string;
  subcategory?: string;
  featured?: boolean;
  status?: string;
  inStock?: boolean;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}
