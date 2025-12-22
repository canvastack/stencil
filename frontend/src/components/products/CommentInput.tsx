import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Paperclip, X, Loader2, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { commentsService } from '@/services/api/comments';
import type { CommentAttachment } from '@/types/comments';
import { toast } from 'sonner';

interface CommentInputProps {
  onSubmit: (content: string, mentions?: string[], attachmentIds?: string[]) => void;
  onCancel?: () => void;
  initialContent?: string;
  initialAttachments?: CommentAttachment[];
  isSubmitting?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  onCancel,
  initialContent = '',
  initialAttachments = [],
  isSubmitting = false,
  placeholder = 'Write a comment...',
  compact = false,
}) => {
  const [content, setContent] = useState(initialContent);
  const [attachments, setAttachments] = useState<CommentAttachment[]>(initialAttachments);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => commentsService.uploadAttachment(file),
    onSuccess: (attachment) => {
      setAttachments([...attachments, attachment]);
      toast.success('File attached');
    },
    onError: (error: any) => {
      toast.error('Failed to upload file', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File too large', {
          description: 'Maximum file size is 10MB',
        });
        return;
      }

      uploadMutation.mutate(file);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await commentsService.deleteAttachment(attachmentId);
      setAttachments(attachments.filter(a => a.id !== attachmentId));
      toast.success('Attachment removed');
    } catch (error: any) {
      toast.error('Failed to remove attachment', {
        description: error?.message || 'An error occurred',
      });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    onSubmit(
      content,
      mentions.length > 0 ? mentions : undefined,
      attachments.length > 0 ? attachments.map(a => a.id) : undefined
    );

    setContent('');
    setAttachments([]);
  };

  const handleCancel = () => {
    setContent(initialContent);
    setAttachments(initialAttachments);
    onCancel?.();
  };

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const newContent = 
      content.slice(0, lastAtIndex) + 
      `@${username} ` + 
      textAfterCursor;

    setContent(newContent);
    setShowMentions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = lastAtIndex + username.length + 2;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const mockUsers = [
    { id: '1', name: 'John Doe', username: 'johndoe' },
    { id: '2', name: 'Jane Smith', username: 'janesmith' },
    { id: '3', name: 'Bob Wilson', username: 'bobwilson' },
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className="resize-none pr-20"
          disabled={isSubmitting}
        />

        <Popover open={showMentions} onOpenChange={setShowMentions}>
          <PopoverTrigger asChild>
            <div className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowMentions(!showMentions)}
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground px-2 py-1">
                Mention someone
              </p>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user.username)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                  >
                    <div className="font-medium">@{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.name}</div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground px-2 py-2">
                  No users found
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <Badge
              key={attachment.id}
              variant="secondary"
              className="gap-2 pr-1"
            >
              <Paperclip className="h-3 w-3" />
              <span className="text-xs">{attachment.fileName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveAttachment(attachment.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting || uploadMutation.isPending}
            className="gap-2"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
            Attach
          </Button>
          <span className="text-xs text-muted-foreground">
            {content.length} characters
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};
