import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Reply, ThumbsUp } from 'lucide-react';
import { usePublicCommentsQuery, useSubmitCommentMutation, useReplyCommentMutation } from '@/hooks/cms';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { Comment } from '@/types/cms';

interface CommentSectionProps {
  contentUuid: string;
}

export function CommentSection({ contentUuid }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = usePublicCommentsQuery(contentUuid);
  const submitMutation = useSubmitCommentMutation();
  const replyMutation = useReplyCommentMutation();

  const comments = data?.data || [];

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !authorName.trim() || !authorEmail.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        content_uuid: contentUuid,
        author_name: authorName,
        author_email: authorEmail,
        body: commentText,
      });
      
      setCommentText('');
      setAuthorName('');
      setAuthorEmail('');
      toast.success('Comment submitted for moderation');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleReply = async (parentUuid: string) => {
    if (!replyText.trim() || !authorName.trim() || !authorEmail.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await replyMutation.mutateAsync({
        parentUuid,
        input: {
          content_uuid: contentUuid,
          parent_uuid: parentUuid,
          author_name: authorName,
          author_email: authorEmail,
          body: replyText,
        },
      });
      
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply submitted for moderation');
    } catch (error) {
      console.error('Failed to submit reply:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Leave a Comment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="Your email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
            />
          </div>

          <Textarea
            placeholder="Write your comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
          />

          <Button 
            onClick={handleSubmitComment}
            disabled={submitMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {submitMutation.isPending ? 'Submitting...' : 'Submit Comment'}
          </Button>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold">Comments</h3>
            {comments.map((comment) => (
              <CommentItem
                key={comment.uuid}
                comment={comment}
                onReply={(uuid) => setReplyingTo(uuid)}
                replyingTo={replyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                handleReply={handleReply}
                authorName={authorName}
                authorEmail={authorEmail}
                setAuthorName={setAuthorName}
                setAuthorEmail={setAuthorEmail}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CommentItemProps {
  comment: Comment;
  onReply: (uuid: string) => void;
  replyingTo: string | null;
  replyText: string;
  setReplyText: (text: string) => void;
  handleReply: (uuid: string) => void;
  authorName: string;
  authorEmail: string;
  setAuthorName: (name: string) => void;
  setAuthorEmail: (email: string) => void;
}

function CommentItem({ 
  comment, 
  onReply, 
  replyingTo, 
  replyText, 
  setReplyText, 
  handleReply,
  authorName,
  authorEmail,
  setAuthorName,
  setAuthorEmail,
}: CommentItemProps) {
  const isReplying = replyingTo === comment.uuid;

  return (
    <div className="space-y-3 pb-4 border-b last:border-0">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={comment.author_avatar || undefined} />
          <AvatarFallback>
            {comment.author_name?.charAt(0).toUpperCase() || 'A'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.author_name || 'Anonymous'}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <p className="text-sm">{comment.body || comment.comment_text}</p>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.uuid)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            <Button variant="ghost" size="sm">
              <ThumbsUp className="h-3 w-3 mr-1" />
              Like
            </Button>
          </div>

          {isReplying && (
            <div className="space-y-3 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Your name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  size={1}
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  size={1}
                />
              </div>
              <Textarea
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleReply(comment.uuid)}
                >
                  Submit Reply
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onReply(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.uuid}
              comment={reply}
              onReply={onReply}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
              authorName={authorName}
              authorEmail={authorEmail}
              setAuthorName={setAuthorName}
              setAuthorEmail={setAuthorEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
