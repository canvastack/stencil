/**
 * VendorMessages Page
 * 
 * Displays all messages across all quotes for the vendor.
 * Allows vendors to view and respond to messages from admin.
 * 
 * Requirements: 5.10, 10.7 (Vendor Communication)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import vendorApi from '@/services/api/vendorApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  Mail,
  MailOpen,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { QuoteMessage } from '@/types/vendor/portal';

interface QuoteWithMessages {
  quote_uuid: string;
  quote_number: string;
  messages: QuoteMessage[];
  unread_count: number;
  last_message_at: string;
}

export default function VendorMessages() {
  const navigate = useNavigate();

  // State
  const [quotesWithMessages, setQuotesWithMessages] = useState<QuoteWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  /**
   * Fetch all quotes and their messages
   */
  const fetchAllMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all quotes
      const quotesResponse = await vendorApi.getQuotes();

      if (!quotesResponse.success) {
        throw new Error('Failed to fetch quotes');
      }

      // Fetch messages for each quote
      const quotesWithMessagesData: QuoteWithMessages[] = [];

      for (const quote of quotesResponse.data.quotes) {
        try {
          const messagesResponse = await vendorApi.getMessages(quote.uuid);
          
          console.log(`[VendorMessages] Quote ${quote.quote_number}:`, {
            hasData: !!messagesResponse.data,
            isArray: Array.isArray(messagesResponse.data),
            length: messagesResponse.data?.length,
            response: messagesResponse
          });

          // API returns { message, data: [...], pagination }
          if (Array.isArray(messagesResponse.data) && messagesResponse.data.length > 0) {
            const messages = messagesResponse.data;
            const unreadCount = messages.filter(m => !m.read_at).length;
            const lastMessage = messages[messages.length - 1];

            // Safety check for lastMessage
            if (lastMessage) {
              quotesWithMessagesData.push({
                quote_uuid: quote.uuid,
                quote_number: quote.quote_number,
                messages: messages,
                unread_count: unreadCount,
                last_message_at: lastMessage.created_at,
              });
              
              console.log(`[VendorMessages] Added quote ${quote.quote_number} with ${messages.length} messages`);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch messages for quote ${quote.uuid}:`, err);
        }
      }

      // Sort by last message date (newest first)
      quotesWithMessagesData.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setQuotesWithMessages(quotesWithMessagesData);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchAllMessages();
  }, []);

  /**
   * Filter quotes based on active tab
   */
  const filteredQuotes = activeTab === 'unread'
    ? quotesWithMessages.filter(q => q.unread_count > 0)
    : quotesWithMessages;

  /**
   * Calculate total unread count
   */
  const totalUnreadCount = quotesWithMessages.reduce((sum, q) => sum + q.unread_count, 0);

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error Loading Messages</h3>
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAllMessages} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            View and respond to messages from admin
          </p>
        </div>
        <Button onClick={fetchAllMessages} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotesWithMessages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unread Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalUnreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quotesWithMessages.filter(q => q.unread_count > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">
            <Mail className="h-4 w-4 mr-2" />
            All Messages ({quotesWithMessages.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            <MailOpen className="h-4 w-4 mr-2" />
            Unread ({totalUnreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredQuotes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'unread' ? 'No Unread Messages' : 'No Messages Yet'}
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread' 
                    ? 'All messages have been read'
                    : 'Messages will appear here when admin sends you a message'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredQuotes.map((quoteData) => {
              // Safety check: ensure messages array is not empty
              if (!quoteData.messages || quoteData.messages.length === 0) {
                return null;
              }

              const lastMessage = quoteData.messages[quoteData.messages.length - 1];
              
              // Type guard: ensure lastMessage exists
              if (!lastMessage) {
                return null;
              }

              const hasUnread = quoteData.unread_count > 0;

              return (
                <Card 
                  key={quoteData.quote_uuid}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    hasUnread ? 'border-orange-500 border-2' : ''
                  }`}
                  onClick={() => navigate(`/vendor/quotes/${quoteData.quote_uuid}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {quoteData.quote_number}
                          {hasUnread && (
                            <Badge variant="destructive">
                              {quoteData.unread_count} unread
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {quoteData.messages.length} message{quoteData.messages.length !== 1 ? 's' : ''} in this conversation
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Last Message Preview */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          lastMessage.sender_type === 'admin' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {lastMessage.sender?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {lastMessage.sender?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                            </span>
                            {!lastMessage.read_at && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {lastMessage.message}
                          </p>
                          {lastMessage.attachments && lastMessage.attachments.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {lastMessage.attachments.length} attachment{lastMessage.attachments.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {hasUnread ? (
                            <>
                              <MailOpen className="h-4 w-4 text-orange-600" />
                              <span className="text-orange-600 font-medium">
                                {quoteData.unread_count} unread message{quoteData.unread_count !== 1 ? 's' : ''}
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">All messages read</span>
                            </>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          View Conversation
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }).filter(Boolean)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
