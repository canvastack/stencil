import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Check, X, AlertTriangle, Eye } from 'lucide-react';
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
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data, isLoading } = useCommentsQuery({ ...filters, status: activeTab === 'all' ? undefined : activeTab });
  const approveMutation = useApproveCommentMutation();
  const rejectMutation = useRejectCommentMutation();
  const spamMutation = useMarkCommentAsSpamMutation();

  const comments = data?.data || [];
  const counts = data?.counts || { pending: 0, approved: 0, rejected: 0, spam: 0, trash: 0, total: 0 };

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

  const handleViewComment = (comment: any) => {
    setSelectedComment(comment);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedComment(null);
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
            {counts.pending > 0 && (
              <Badge variant="destructive" className="ml-2">
                {counts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            {counts.approved > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.approved}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            {counts.rejected > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.rejected}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="spam">
            Spam
            {counts.spam > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.spam}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            All
            {counts.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.total}
              </Badge>
            )}
          </TabsTrigger>
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
                          <p className="text-sm line-clamp-2">{comment.comment_text}</p>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewComment(comment)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comment Details</DialogTitle>
            <DialogDescription>
              Full comment information and moderation actions
            </DialogDescription>
          </DialogHeader>

          {selectedComment && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Author Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedComment.author_name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedComment.author_email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={selectedComment.status === 'pending' ? 'destructive' : 'secondary'}>
                      {selectedComment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Comment Text</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedComment.comment_text}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Content:</span>
                    <span>{selectedComment.content_title || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">IP Address:</span>
                    <span className="font-mono text-xs">{selectedComment.user_ip || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">User Agent:</span>
                    <span className="font-mono text-xs truncate max-w-xs" title={selectedComment.user_agent}>
                      {selectedComment.user_agent || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDistanceToNow(new Date(selectedComment.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {selectedComment.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleApprove(selectedComment.uuid);
                      handleDialogClose();
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      handleReject(selectedComment.uuid);
                      handleDialogClose();
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      handleMarkAsSpam(selectedComment.uuid);
                      handleDialogClose();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Spam
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
