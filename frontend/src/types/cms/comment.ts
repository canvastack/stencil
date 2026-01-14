export interface Comment {
  uuid: string;
  content_uuid: string;
  author_name: string;
  author_email: string;
  author_avatar?: string;
  body: string;
  comment_text?: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  parent_uuid: string | null;
  depth: number;
  approved_at: string | null;
  replies?: Comment[];
  created_at: string;
}

export interface CommentListItem {
  uuid: string;
  content_uuid: string;
  author_name: string;
  author_email: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  parent_uuid: string | null;
  created_at: string;
}

export interface SubmitCommentInput {
  content_uuid: string;
  body: string;
  parent_uuid?: string;
  author_name?: string;
  author_email?: string;
}

export interface CommentFilters {
  content?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'spam';
  search?: string;
  page?: number;
  per_page?: number;
}

export interface BulkCommentAction {
  uuids: string[];
}
