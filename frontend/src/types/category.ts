export interface Category {
  // Core fields
  id: string | number;
  uuid: string;
  name: string;
  slug: string;
  business_type?: string;
  description?: string;
  parent_id?: string | number | null;
  image?: string | null;
  color?: string;
  sort_order: number;
  is_active: boolean;
  
  // Stats
  product_count?: number;
  
  // Metadata
  specifications_template?: Record<string, any>;
  seo_meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // API response additional fields (from backend resource)
  hierarchy?: {
    parentUuid?: string | null;
    level: number;
    path: string;
    fullPath: string;
    breadcrumb: Array<{
      id: number;
      uuid: string;
      name: string;
      slug: string;
    }>;
    hasChildren: boolean;
  };
  
  sortOrder?: number;
  
  media?: {
    image?: string | null;
    icon?: string | null;
    colorScheme?: string;
  };
  
  visibility?: {
    isActive: boolean;
    isFeatured: boolean;
    showInMenu: boolean;
  };
  
  configuration?: {
    allowedMaterials?: string[];
    qualityLevels?: string[];
    customizationOptions?: string[];
    baseMarkupPercentage?: number | null;
    requiresQuote?: boolean;
  };
  
  seo?: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoKeywords?: string[];
  };
  
  stats?: {
    productCount: number;
    hasProducts: boolean;
  };
  
  timestamps?: {
    createdAt: string;
    updatedAt: string;
  };
  
  relationships?: {
    parent?: {
      uuid: string;
      name: string;
      slug: string;
    } | null;
    children?: Array<any>;
  };
  
  // Relations (for frontend use)
  parent?: Category;
  children?: Category[];
  products?: any[];
}

export interface CategoryFilters {
  search?: string;
  parent_id?: string;
  is_active?: boolean;
  sort?: 'name' | 'created_at' | 'sort_order';
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  business_type?: string;
  description?: string;
  parent_id?: string;
  image?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  specifications_template?: Record<string, any>;
  seo_meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export type CategoryStatus = 'active' | 'inactive';