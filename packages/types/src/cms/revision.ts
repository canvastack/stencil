export interface Revision {
  uuid: string;
  content_uuid: string;
  version_number: number;
  title: string;
  body: string;
  metadata: Record<string, any> | null;
  created_by: {
    uuid: string;
    name: string;
  };
  created_at: string;
}

export interface RevisionFilters {
  page?: number;
  per_page?: number;
}
