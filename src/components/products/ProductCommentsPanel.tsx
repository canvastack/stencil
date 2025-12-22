import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, CheckCircle2, XCircle, Loader2, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CommentThread } from './CommentThread';
import { CommentInput } from './CommentInput';
import { commentsService } from '@/services/api/comments';
import type { ProductComment, CommentThread as CommentThreadType } from '@/types/comments';
import { toast } from 'sonner';

interface ProductCommentsPanelProps {
  productId: string;
}

export const ProductCommentsPanel: React.FC<ProductCommentsPanelProps> = ({ productId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unresolved'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'most-replies'>('recent');

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['product-comments', productId, activeTab, sortBy],
    queryFn: () => commentsService.getProductComments(productId, 1, 50),
  });

  const { data: threadsData } = useQuery({
    queryKey: ['comment-threads', productId],
    queryFn: () => commentsService.getCommentThreads(productId, 1, 50),
  });

  const { data: stats } = useQuery({
    queryKey: ['comment-stats', productId],
    queryFn: () => commentsService.getStats(productId),
  });

  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; mentions?: string[]; attachmentIds?: string[] }) =>
      commentsService.createComment({
        productId,
        content: data.content,
        mentions: data.mentions,
        attachmentIds: data.attachmentIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-threads', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-stats', productId] });
      toast.success('Comment added');
    },
    onError: (error: any) => {
      toast.error('Failed to add comment', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const resolveThreadMutation = useMutation({
    mutationFn: (commentId: string) => commentsService.resolveThread(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-threads', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-stats', productId] });
      toast.success('Thread resolved');
    },
    onError: (error: any) => {
      toast.error('Failed to resolve thread', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const unresolveThreadMutation = useMutation({
    mutationFn: (commentId: string) => commentsService.unresolveThread(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-threads', productId] });
      queryClient.invalidateQueries({ queryKey: ['comment-stats', productId] });
      toast.success('Thread reopened');
    },
    onError: (error: any) => {
      toast.error('Failed to reopen thread', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleSubmitComment = (content: string, mentions?: string[], attachmentIds?: string[]) => {
    createCommentMutation.mutate({ content, mentions, attachmentIds });
  };

  const handleResolveThread = (commentId: string, isResolved: boolean) => {
    if (isResolved) {
      unresolveThreadMutation.mutate(commentId);
    } else {
      resolveThreadMutation.mutate(commentId);
    }
  };

  const filteredThreads = threadsData?.threads.filter(thread => {
    if (activeTab === 'unresolved') {
      return !thread.isResolved;
    }
    return true;
  }) || [];

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      case 'oldest':
        return new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
      case 'most-replies':
        return b.totalReplies - a.totalReplies;
      default:
        return 0;
    }
  });

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Comments & Discussions</h3>
          </div>
          {stats && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {stats.totalComments} comment{stats.totalComments !== 1 ? 's' : ''}
              </Badge>
              {stats.unresolvedThreads > 0 && (
                <Badge variant="destructive">
                  {stats.unresolvedThreads} unresolved
                </Badge>
              )}
            </div>
          )}
        </div>

        <CommentInput
          onSubmit={handleSubmitComment}
          isSubmitting={createCommentMutation.isPending}
          placeholder="Start a discussion about this product..."
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unresolved')}>
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  All
                  {stats && <span className="text-xs">({stats.totalThreads})</span>}
                </TabsTrigger>
                <TabsTrigger value="unresolved" className="gap-2">
                  Unresolved
                  {stats && stats.unresolvedThreads > 0 && (
                    <span className="text-xs">({stats.unresolvedThreads})</span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most-replies">Most Replies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedThreads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No comments yet</p>
              <p className="text-sm mt-1">Be the first to start a discussion</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {sortedThreads.map((thread) => (
                  <CommentThread
                    key={thread.id}
                    thread={thread}
                    productId={productId}
                    onResolve={handleResolveThread}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </Card>
  );
};
