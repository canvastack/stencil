export interface CommentMention {
  id: string;
  uuid: string;
  userId: string;
  userName: string;
  userEmail: string;
  position: number;
}

export interface CommentAttachment {
  id: string;
  uuid: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ProductComment {
  id: string;
  uuid: string;
  productId: string;
  parentId?: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdByAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  editedAt?: string;
  isEdited: boolean;
  mentions?: CommentMention[];
  attachments?: CommentAttachment[];
  replies?: ProductComment[];
  replyCount: number;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface CommentThread {
  id: string;
  uuid: string;
  productId: string;
  rootComment: ProductComment;
  totalReplies: number;
  lastActivityAt: string;
  participants: Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
  }>;
  isResolved: boolean;
}

export interface CreateCommentRequest {
  productId: string;
  parentId?: string;
  content: string;
  mentions?: string[];
  attachmentIds?: string[];
}

export interface UpdateCommentRequest {
  content: string;
  mentions?: string[];
  attachmentIds?: string[];
}

export interface CommentListResponse {
  comments: ProductComment[];
  threads: CommentThread[];
  total: number;
  page: number;
  perPage: number;
}

export interface CommentUploadResponse {
  attachment: CommentAttachment;
  message: string;
}

export interface CommentStatsResponse {
  totalComments: number;
  totalThreads: number;
  unresolvedThreads: number;
  recentActivity: ProductComment[];
  topContributors: Array<{
    userId: string;
    userName: string;
    commentCount: number;
  }>;
}
