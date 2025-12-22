export interface Category {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  specifications_template?: Record<string, any>;
  seo_meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relations
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