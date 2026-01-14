import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Check, X, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCommentsQuery, useApproveCommentMutation, useRejectCommentMutation, useMarkCommentAsSpamMutation } from '@/hooks/cms';
import { useCommentStore } from '@/stores/cms';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function CommentModeration() {
  const { activeTab, setActiveTab, filters, setFilters } = useCommentStore();
  
  const { data, isLoading } = useCommentsQuery({ ...filters, status: activeTab === 'all' ? undefined : activeTab });
  const approveMutation = useApproveCommentMutation();
  const rejectMutation = useRejectCommentMutation();
  const spamMutation = useMarkCommentAsSpamMutation();

  const comments = data?.data || [];

  const handleSearch = (value: string) => {
    setFilters({ search: value });
  };

  const handleApprove = (uuid: string) => {
    approveMutation.mutate(uuid);
  };

  const handleReject = (uuid: string) => {
    rejectMutation.mutate({ uuid });
  };

  const handleMarkAsSpam = (uuid: string) => {
    spamMutation.mutate(uuid);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comment Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review and moderate user comments
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {comments.filter(c => c.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {comments.filter(c => c.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="spam">Spam</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Comments ({comments.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments..."
                  className="pl-9"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No comments found</p>
                <p className="text-sm">Comments will appear here when users submit them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Author</TableHead>
                      <TableHead className="w-[40%]">Comment</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comments.map((comment) => (
                      <TableRow key={comment.uuid}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{comment.author_name}</p>
                            <p className="text-sm text-muted-foreground">{comment.author_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm line-clamp-2">{comment.content}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {comment.content_title || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {comment.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApprove(comment.uuid)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReject(comment.uuid)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsSpam(comment.uuid)}
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
