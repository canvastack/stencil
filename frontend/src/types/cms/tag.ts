export interface Tag {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTagInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateTagInput {
  name?: string;
  slug?: string;
  description?: string;
}

export interface TagFilters {
  search?: string;
  page?: number;
  per_page?: number;
}
