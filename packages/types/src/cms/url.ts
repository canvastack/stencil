export interface ContentUrl {
  uuid: string;
  content_uuid: string;
  url_path: string;
  is_canonical: boolean;
  redirect_count: number;
  created_at: string;
}

export interface BuildUrlInput {
  content_type_uuid: string;
  content_data: {
    slug: string;
    title: string;
    categories?: string[];
    published_at?: string;
  };
}

export interface PreviewUrlInput {
  pattern: string;
  content_data: {
    slug: string;
    title: string;
    categories?: string[];
    published_at?: string;
  };
}

export interface BuiltUrl {
  url_path: string;
  is_valid: boolean;
  conflicts: string[];
}
