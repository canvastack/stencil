export interface ContentType {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  default_url_pattern: string | null;
  scope: 'platform' | 'tenant';
  is_active: boolean;
  is_commentable: boolean;
  is_categorizable: boolean;
  is_taggable: boolean;
  is_revisioned: boolean;
  metadata: Record<string, any> | null;
  contents_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateContentTypeInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  default_url_pattern?: string;
  is_commentable?: boolean;
  is_categorizable?: boolean;
  is_taggable?: boolean;
  is_revisioned?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateContentTypeInput {
  name?: string;
  description?: string;
  icon?: string;
  default_url_pattern?: string;
  is_commentable?: boolean;
  is_categorizable?: boolean;
  is_taggable?: boolean;
  is_revisioned?: boolean;
  metadata?: Record<string, any>;
}

export interface ContentTypeFilters {
  scope?: 'all' | 'platform' | 'tenant';
  is_active?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}
