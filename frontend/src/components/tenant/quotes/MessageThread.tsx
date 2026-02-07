import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip, X, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Message, SendMessageRequest } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';

interface MessageThreadProps {
  quoteUuid: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export function MessageThread({ quoteUuid }: MessageThreadProps) {
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages, isLoading, error: fetchError } = useQuery<Message[]>({
    queryKey: ['quote-messages', quoteUuid],
    queryFn: async () => {
      const response = await fetch(`/api/quotes/${quoteUuid}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      return data.data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (request: SendMessageRequest) => {
      const formData = new FormData();
      formData.append('message', request.message);

      if (request.attachments) {
        request.attachments.forEach((file) => {
          formData.append('attachments[]', file);
        });
      }

      const response = await fetch(`/api/quotes/${quoteUuid}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear form
      setMessageText('');
      setSelectedFiles([]);
      setError(null);

      // Refetch messages
      queryClient.invalidateQueries({ queryKey: ['quote-messages', quoteUuid] });

      toast.success('Message sent successfully');
    },
    onError: (error: Error) => {
      setError(error.message);
      toast.error('Failed to send message');
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageUuid: string) => {
      const response = await fetch(`/api/quotes/${quoteUuid}/messages/${messageUuid}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-messages', quoteUuid] });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file count
    if (selectedFiles.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
      setError(`Files must be smaller than 10MB: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
    setError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Handle send message
  const handleSendMessage = () => {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage && selectedFiles.length === 0) {
      setError('Please enter a message or attach a file');
      return;
    }

    sendMessageMutation.mutate({
      message: trimmedMessage,
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
    });
  };

  // Handle key press (Ctrl+Enter to send)
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get user initials
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get current user ID (from auth context)
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Messages</span>
          {messages && messages.length > 0 && (
            <Badge variant="secondary">{messages.length} message{messages.length !== 1 ? 's' : ''}</Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages List */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {fetchError && (
            <Alert variant="destructive" className="m-4">
              <AlertDescription>
                Failed to load messages. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !fetchError && messages && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a conversation about this quote
              </p>
            </div>
          )}

          {!isLoading && !fetchError && messages && messages.length > 0 && (
            <div className="space-y-4 py-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.sender_id === currentUserId;
                const isUnread = !message.read_at && !isCurrentUser;

                // Mark as read when viewed
                if (isUnread) {
                  markAsReadMutation.mutate(message.uuid);
                }

                return (
                  <div
                    key={message.uuid}
                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                        {message.sender ? getUserInitials(message.sender.name) : '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Sender Name and Time */}
                      <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-sm font-medium">
                          {message.sender?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {isUnread && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, attachIndex) => (
                              <a
                                key={attachIndex}
                                href={attachment.url || attachment.path}
                                download={attachment.name}
                                className={`flex items-center gap-2 text-xs p-2 rounded ${
                                  isCurrentUser
                                    ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
                                    : 'bg-background hover:bg-background/80'
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                                <span className="flex-1 truncate">{attachment.name}</span>
                                <span className="text-muted-foreground">{formatFileSize(attachment.size)}</span>
                                <Download className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Message Input */}
        <div className="p-4 space-y-3">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message... (Ctrl+Enter to send)"
              className="min-h-[80px] resize-none"
              disabled={sendMessageMutation.isPending}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendMessageMutation.isPending || selectedFiles.length >= MAX_FILES}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Attach Files
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedFiles.length}/{MAX_FILES} files (max 10MB each)
              </span>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || (!messageText.trim() && selectedFiles.length === 0)}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Press Ctrl+Enter to send • Maximum 10MB per file
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
