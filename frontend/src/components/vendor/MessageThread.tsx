/**
 * MessageThread Component
 * 
 * Displays message thread for quote communication between vendor and admin.
 * Supports sending messages with file attachments.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.6, 13.7, 13.10
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Paperclip, Download, X, AlertCircle, User, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { QuoteMessage } from '@/types/vendor/portal';

export interface MessageThreadProps {
  /**
   * Array of messages in the thread
   */
  messages: QuoteMessage[];
  
  /**
   * Callback when a new message is sent
   */
  onSendMessage: (message: string, attachments?: File[]) => void | Promise<void>;
  
  /**
   * Whether a message is currently being sent
   */
  isSending?: boolean;
  
  /**
   * Whether the quote is expired (disables sending)
   */
  isExpired?: boolean;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export default function MessageThread({
  messages,
  onSendMessage,
  isSending = false,
  isExpired = false,
  className,
}: MessageThreadProps) {
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    // Validate files
    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds 10MB limit`);
        return;
      }

      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setError(`File type "${file.type}" is not allowed`);
        return;
      }
    }

    setAttachments((prev) => [...prev, ...files]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Remove attachment
   */
  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Handle message submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!messageText.trim() && attachments.length === 0) {
      setError('Please enter a message or attach a file');
      return;
    }

    try {
      await onSendMessage(messageText.trim(), attachments);
      setMessageText('');
      setAttachments([]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Get sender icon and color
   */
  const getSenderInfo = (senderType: 'admin' | 'vendor') => {
    if (senderType === 'admin') {
      return {
        icon: Shield,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        label: 'Admin',
      };
    }
    return {
      icon: User,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      label: 'You',
    };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Message Thread</CardTitle>
        <CardDescription>
          Communicate with the admin team about this quote
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages List */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const senderInfo = getSenderInfo(message.sender_type);
              const SenderIcon = senderInfo.icon;
              const isVendor = message.sender_type === 'vendor';

              return (
                <div
                  key={message.uuid}
                  className={cn(
                    'flex gap-3',
                    isVendor && 'flex-row-reverse'
                  )}
                >
                  {/* Sender Icon */}
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    senderInfo.bgColor
                  )}>
                    <SenderIcon className={cn('h-4 w-4', senderInfo.color)} />
                  </div>

                  {/* Message Content */}
                  <div className={cn(
                    'flex-1 space-y-1',
                    isVendor && 'text-right'
                  )}>
                    {/* Sender Name and Time */}
                    <div className={cn(
                      'flex items-center gap-2 text-sm',
                      isVendor && 'justify-end'
                    )}>
                      <span className="font-medium">
                        {message.sender?.name || senderInfo.label}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                      {!message.is_read && message.sender_type === 'admin' && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>

                    {/* Message Text */}
                    <div className={cn(
                      'inline-block p-3 rounded-lg',
                      isVendor
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {message.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            download={attachment.filename}
                            className={cn(
                              'inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded',
                              'hover:bg-accent transition-colors',
                              isVendor && 'bg-primary/10'
                            )}
                          >
                            <Download className="h-3 w-3" />
                            <span>{attachment.filename}</span>
                            <span className="text-muted-foreground">
                              ({formatFileSize(attachment.size)})
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <Separator />

        {/* Send Message Form */}
        {isExpired ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This quote has expired. You can no longer send messages.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Message Input */}
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isSending}
              rows={3}
              className="resize-none"
            />

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Attachments:</p>
                <div className="space-y-1">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Paperclip className="h-3 w-3" />
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                        disabled={isSending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Attach Files
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSending || (!messageText.trim() && attachments.length === 0)}
                className="ml-auto"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>

            {/* File Requirements */}
            <p className="text-xs text-muted-foreground">
              Allowed file types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX. Max size: 10MB per file.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
