import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '@/services/cms/commentService';
import type {
  Comment,
  CommentListItem,
  SubmitCommentInput,
  CommentFilters,
  ApiResponse,
  ApiListResponse,
} from '@/types/cms';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/react-query';
import { TenantContextError, AuthError } from '@/lib/errors';

export const useCommentsQuery = (filters?: CommentFilters) => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: queryKeys.comments.list(filters),
    queryFn: async (): Promise<ApiListResponse<CommentListItem>> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }

      logger.debug('[CMS] Fetching comments', { filters, tenantId: tenant.uuid });
      return await commentService.admin.list(filters);
    },
    enabled: !!tenant?.uuid && !!user?.id && userType === 'tenant',
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });
};

export const useCommentsForContentQuery = (contentUuid?: string) => {
  return useQuery({
    queryKey: queryKeys.comments.forContent(contentUuid || ''),
    queryFn: async (): Promise<ApiListResponse<CommentListItem>> => {
      if (!contentUuid) {
        throw new Error('Content UUID is required');
      }

      logger.debug('[CMS] Fetching comments for content', { contentUuid });
      return await commentService.public.listForContent(contentUuid);
    },
    enabled: !!contentUuid,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const usePublicCommentsQuery = useCommentsForContentQuery;

export const useSubmitCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitCommentInput) => {
      logger.debug('[CMS] Submitting comment', { input });
      return await commentService.public.submit(input);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.comments.forContent(variables.content_id) 
      });
      toast.success('Comment submitted successfully', {
        description: 'Your comment is pending moderation.',
      });
      logger.info('[CMS] Comment submitted', { uuid: data.data.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to submit comment', {
        description: error?.message || 'An error occurred while submitting your comment.',
      });
      logger.error('[CMS] Failed to submit comment', { error: error.message });
    },
  });
};

export const useReplyCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parentUuid, input }: { parentUuid: string; input: SubmitCommentInput }) => {
      logger.debug('[CMS] Replying to comment', { parentUuid, input });
      return await commentService.public.reply(parentUuid, input);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.comments.forContent(variables.input.content_id) 
      });
      toast.success('Reply submitted successfully', {
        description: 'Your reply is pending moderation.',
      });
      logger.info('[CMS] Comment reply submitted', { uuid: data.data.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to submit reply', {
        description: error?.message || 'An error occurred while submitting your reply.',
      });
      logger.error('[CMS] Failed to submit reply', { error: error.message });
    },
  });
};

export const useApproveCommentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Approving comment', { uuid, tenantId: tenant?.uuid });
      return await commentService.admin.approve(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      toast.success('Comment approved', {
        description: 'The comment is now visible to the public.',
      });
      logger.info('[CMS] Comment approved', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to approve comment', {
        description: error?.message || 'An error occurred while approving the comment.',
      });
      logger.error('[CMS] Failed to approve comment', { error: error.message });
    },
  });
};

export const useRejectCommentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async ({ uuid, reason }: { uuid: string; reason?: string }) => {
      logger.debug('[CMS] Rejecting comment', { uuid, reason, tenantId: tenant?.uuid });
      return await commentService.admin.reject(uuid, reason);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      toast.success('Comment rejected', {
        description: 'The comment has been rejected.',
      });
      logger.info('[CMS] Comment rejected', { uuid: variables.uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to reject comment', {
        description: error?.message || 'An error occurred while rejecting the comment.',
      });
      logger.error('[CMS] Failed to reject comment', { error: error.message });
    },
  });
};

export const useMarkCommentAsSpamMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Marking comment as spam', { uuid, tenantId: tenant?.uuid });
      return await commentService.admin.markAsSpam(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      toast.success('Comment marked as spam', {
        description: 'The comment has been marked as spam and hidden.',
      });
      logger.info('[CMS] Comment marked as spam', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to mark comment as spam', {
        description: error?.message || 'An error occurred while marking the comment as spam.',
      });
      logger.error('[CMS] Failed to mark comment as spam', { error: error.message });
    },
  });
};

export const useDeleteCommentMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuid: string) => {
      logger.debug('[CMS] Deleting comment', { uuid, tenantId: tenant?.uuid });
      return await commentService.admin.delete(uuid);
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.removeQueries({ queryKey: queryKeys.comments.detail(uuid) });
      toast.success('Comment deleted successfully', {
        description: 'The comment has been permanently deleted.',
      });
      logger.info('[CMS] Comment deleted', { uuid });
    },
    onError: (error: any) => {
      toast.error('Failed to delete comment', {
        description: error?.message || 'An error occurred while deleting the comment.',
      });
      logger.error('[CMS] Failed to delete comment', { error: error.message });
    },
  });
};

export const useBulkApproveCommentsMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuids: string[]) => {
      logger.debug('[CMS] Bulk approving comments', { uuids, tenantId: tenant?.uuid });
      return await commentService.admin.bulkApprove(uuids);
    },
    onSuccess: (data, uuids) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      toast.success('Comments approved', {
        description: `${uuids.length} comments have been approved.`,
      });
      logger.info('[CMS] Bulk comments approved', { count: uuids.length });
    },
    onError: (error: any) => {
      toast.error('Failed to approve comments', {
        description: error?.message || 'An error occurred while approving the comments.',
      });
      logger.error('[CMS] Failed to bulk approve comments', { error: error.message });
    },
  });
};

export const useBulkDeleteCommentsMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (uuids: string[]) => {
      logger.debug('[CMS] Bulk deleting comments', { uuids, tenantId: tenant?.uuid });
      return await commentService.admin.bulkDelete(uuids);
    },
    onSuccess: (data, uuids) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      toast.success('Comments deleted', {
        description: `${uuids.length} comments have been deleted.`,
      });
      logger.info('[CMS] Bulk comments deleted', { count: uuids.length });
    },
    onError: (error: any) => {
      toast.error('Failed to delete comments', {
        description: error?.message || 'An error occurred while deleting the comments.',
      });
      logger.error('[CMS] Failed to bulk delete comments', { error: error.message });
    },
  });
};
