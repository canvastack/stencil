import { tenantApiClient } from './tenantApiClient';
import type {
  ProductComment,
  CommentThread,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentListResponse,
  CommentAttachment,
  CommentUploadResponse,
  CommentStatsResponse,
} from '@/types/comments';

class CommentsService {
  async getProductComments(productId: string, page = 1, perPage = 20): Promise<CommentListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await tenantApiClient.get<CommentListResponse>(
        `/products/${productId}/comments?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get product comments:', error);
      throw error;
    }
  }

  async getComment(commentId: string): Promise<ProductComment> {
    try {
      const response = await tenantApiClient.get<{ comment: ProductComment }>(
        `/products/comments/${commentId}`
      );
      
      return response.data.comment;
    } catch (error) {
      console.error('Failed to get comment:', error);
      throw error;
    }
  }

  async createComment(request: CreateCommentRequest): Promise<ProductComment> {
    try {
      const response = await tenantApiClient.post<{ comment: ProductComment }>(
        `/products/${request.productId}/comments`,
        request
      );
      
      return response.data.comment;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }

  async updateComment(commentId: string, request: UpdateCommentRequest): Promise<ProductComment> {
    try {
      const response = await tenantApiClient.put<{ comment: ProductComment }>(
        `/products/comments/${commentId}`,
        request
      );
      
      return response.data.comment;
    } catch (error) {
      console.error('Failed to update comment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/comments/${commentId}`);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  }

  async replyToComment(commentId: string, content: string, mentions?: string[]): Promise<ProductComment> {
    try {
      const response = await tenantApiClient.post<{ comment: ProductComment }>(
        `/products/comments/${commentId}/replies`,
        {
          content,
          mentions,
        }
      );
      
      return response.data.comment;
    } catch (error) {
      console.error('Failed to reply to comment:', error);
      throw error;
    }
  }

  async resolveThread(commentId: string): Promise<ProductComment> {
    try {
      const response = await tenantApiClient.post<{ comment: ProductComment }>(
        `/products/comments/${commentId}/resolve`
      );
      
      return response.data.comment;
    } catch (error) {
      console.error('Failed to resolve thread:', error);
      throw error;
    }
  }

  async unresolveThread(commentId: string): Promise<ProductComment> {
    try {
      const response = await tenantApiClient.post<{ comment: ProductComment }>(
        `/products/comments/${commentId}/unresolve`
      );
      
      return response.data.comment;
    } catch (error) {
      console.error('Failed to unresolve thread:', error);
      throw error;
    }
  }

  async uploadAttachment(file: File): Promise<CommentAttachment> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await tenantApiClient.getAxiosInstance().post<CommentUploadResponse>(
        '/products/comments/attachments',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.attachment;
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw error;
    }
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      await tenantApiClient.delete(`/products/comments/attachments/${attachmentId}`);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      throw error;
    }
  }

  async getCommentThreads(productId: string, page = 1, perPage = 10): Promise<{ threads: CommentThread[]; total: number }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await tenantApiClient.get<{ threads: CommentThread[]; total: number }>(
        `/products/${productId}/comment-threads?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get comment threads:', error);
      throw error;
    }
  }

  async getStats(productId?: string): Promise<CommentStatsResponse> {
    try {
      const endpoint = productId 
        ? `/products/${productId}/comments/stats`
        : '/products/comments/stats';

      const response = await tenantApiClient.get<CommentStatsResponse>(endpoint);
      
      return response.data;
    } catch (error) {
      console.error('Failed to get comment stats:', error);
      throw error;
    }
  }

  async searchComments(query: string, productId?: string): Promise<ProductComment[]> {
    try {
      const params = new URLSearchParams({
        q: query,
      });

      if (productId) {
        params.append('product_id', productId);
      }

      const response = await tenantApiClient.get<{ comments: ProductComment[] }>(
        `/products/comments/search?${params.toString()}`
      );
      
      return response.data.comments;
    } catch (error) {
      console.error('Failed to search comments:', error);
      throw error;
    }
  }
}

export const commentsService = new CommentsService();
