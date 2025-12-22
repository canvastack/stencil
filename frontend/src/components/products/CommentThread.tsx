import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Reply, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Paperclip,
  Download
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CommentInput } from './CommentInput';
import { commentsService } from '@/services/api/comments';
import type { CommentThread as CommentThreadType, ProductComment } from '@/types/comments';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CommentThreadProps {
  thread: CommentThreadType;
  productId: string;
  onResolve: (commentId: string, isResolved: boolean) => void;
}

interface CommentItemProps {
  comment: ProductComment;
  productId: string;
  isReply?: boolean;
  onReplySuccess?: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  productId,
  isReply = false,
  onReplySuccess 
}) => {
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => commentsService.deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-threads', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-stats', productId] });
      toast.success('Comment deleted');
      setDeleteConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error('Failed to delete comment', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { content: string; mentions?: string[]; attachmentIds?: string[] }) =>
      commentsService.updateComment(comment.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-threads', productId] });
      toast.success('Comment updated');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update comment', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: (data: { content: string; mentions?: string[] }) =>
      commentsService.replyToComment(comment.id, data.content, data.mentions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-threads', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-stats', productId] });
      toast.success('Reply added');
      setIsReplying(false);
      onReplySuccess?.();
    },
    onError: (error: any) => {
      toast.error('Failed to add reply', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleEdit = (content: string, mentions?: string[], attachmentIds?: string[]) => {
    updateMutation.mutate({ content, mentions, attachmentIds });
  };

  const handleReply = (content: string, mentions?: string[]) => {
    replyMutation.mutate({ content, mentions });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.createdByAvatar} />
          <AvatarFallback>{getInitials(comment.createdByName)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.createdByName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
            {comment.mentions && comment.mentions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {comment.mentions.length} mention{comment.mentions.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {isEditing ? (
            <CommentInput
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              initialContent={comment.content}
              initialAttachments={comment.attachments}
              isSubmitting={updateMutation.isPending}
              placeholder="Edit your comment..."
            />
          ) : (
            <>
              <div className="text-sm bg-secondary/20 rounded-lg p-3">
                <p className="whitespace-pre-wrap">{comment.content}</p>
                
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {comment.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 p-2 bg-background rounded border"
                      >
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs flex-1 truncate">{attachment.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          {(attachment.fileSize / 1024).toFixed(1)} KB
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => window.open(attachment.fileUrl, '_blank')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplying(!isReplying)}
                    className="gap-1 h-7 text-xs"
                  >
                    <Reply className="h-3 w-3" />
                    Reply
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2">
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="gap-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {isReplying && !isEditing && (
            <div className="mt-2">
              <CommentInput
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                isSubmitting={replyMutation.isPending}
                placeholder="Write a reply..."
                compact
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-3 mt-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  productId={productId}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({ thread, productId, onResolve }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`border rounded-lg p-4 ${thread.isResolved ? 'bg-secondary/20' : 'bg-card'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {thread.isResolved ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          )}
          <span className="font-medium text-sm">
            {thread.isResolved ? 'Resolved' : 'Open'} Discussion
          </span>
          {thread.totalReplies > 0 && (
            <Badge variant="secondary" className="text-xs">
              {thread.totalReplies} {thread.totalReplies === 1 ? 'reply' : 'replies'}
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onResolve(thread.rootComment.id, thread.isResolved)}
          className="gap-2"
        >
          {thread.isResolved ? (
            <>
              <XCircle className="h-4 w-4" />
              Reopen
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Resolve
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          <CommentItem
            comment={thread.rootComment}
            productId={productId}
            onReplySuccess={() => setIsExpanded(true)}
          />
        </div>
      )}
    </div>
  );
};
