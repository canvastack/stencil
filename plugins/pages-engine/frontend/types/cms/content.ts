export interface Content {
  uuid: string;
  content_type: {
    uuid: string;
    name: string;
    slug: string;
  };
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  featured_image: string | null;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  editor_format: 'wysiwyg' | 'markdown' | 'html';
  author: {
    uuid: string;
    name: string;
  };
  categories?: Array<{
    uuid: string;
    name: string;
    slug: string;
  }>;
  tags?: Array<{
    uuid: string;
    name: string;
    slug: string;
  }>;
  metadata: Record<string, any> | null;
  view_count: number;
  comment_count: number;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentListItem {
  uuid: string;
  content_type: {
    uuid: string;
    name: string;
    slug: string;
  };
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  author: {
    uuid: string;
    name: string;
  };
  view_count: number;
  comment_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContentInput {
  content_type_uuid: string;
  title: string;
  slug: string;
  content: {
    wysiwyg?: string;
    markdown?: string;
    html?: string;
  };
  excerpt?: string;
  featured_image?: string;
  categories?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  editor_format?: 'wysiwyg' | 'markdown' | 'html';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  canonical_url?: string;
  is_featured?: boolean;
  is_pinned?: boolean;
  is_commentable?: boolean;
  custom_url?: string;
}

export interface UpdateContentInput {
  title?: string;
  slug?: string;
  content?: {
    wysiwyg?: string;
    markdown?: string;
    html?: string;
  };
  excerpt?: string;
  featured_image?: string;
  categories?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  editor_format?: 'wysiwyg' | 'markdown' | 'html';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  canonical_url?: string;
  is_featured?: boolean;
  is_pinned?: boolean;
  is_commentable?: boolean;
  custom_url?: string;
}

export interface ContentFilters {
  content_type?: string;
  category?: string;
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  author?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'updated_at' | 'published_at' | 'title' | 'view_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface PublishContentInput {
  published_at?: string;
}

export interface ScheduleContentInput {
  scheduled_at: string;
}
