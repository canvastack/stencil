export interface Category {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  parent_uuid: string | null;
  sort_order: number;
  metadata: Record<string, any> | null;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface CategoryListItem {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  parent_uuid: string | null;
  sort_order: number;
  content_count?: number;
  children_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryTreeNode {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  parent_uuid: string | null;
  sort_order: number;
  path: string;
  depth: number;
  content_count?: number;
  children: CategoryTreeNode[];
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  content_type_uuid: string;
  name: string;
  slug: string;
  description?: string;
  parent_uuid?: string;
  sort_order?: number;
  metadata?: Record<string, any>;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface MoveCategoryInput {
  parent_uuid: string | null;
}

export interface ReorderCategoryInput {
  sort_order: number;
}

export interface CategoryFilters {
  content_type?: string;
  parent?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}
