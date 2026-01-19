import { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Calendar, Archive, FileText } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Skeleton } from '@canvastencil/ui-components';
import { useContentsQuery, useDeleteContentMutation, usePublishContentMutation, useUnpublishContentMutation, useArchiveContentMutation } from '@/hooks/cms';
import { useContentStore } from '@/stores/cms';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function ContentList() {
  const navigate = useNavigate();
  const { filters, setFilters } = useContentStore();
  
  const { data, isLoading } = useContentsQuery(filters);
  const deleteMutation = useDeleteContentMutation();
  const publishMutation = usePublishContentMutation();
  const unpublishMutation = useUnpublishContentMutation();
  const archiveMutation = useArchiveContentMutation();

  const contents = data?.data || [];

  const handleSearch = (value: string) => {
    setFilters({ search: value });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ status: status === 'all' ? undefined : status });
  };

  const handlePublish = (uuid: string) => {
    publishMutation.mutate({ uuid });
  };

  const handleUnpublish = (uuid: string) => {
    unpublishMutation.mutate(uuid);
  };

  const handleArchive = (uuid: string) => {
    archiveMutation.mutate(uuid);
  };

  const handleDelete = (uuid: string) => {
    if (confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      deleteMutation.mutate(uuid);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      published: { variant: 'default', label: 'Published' },
      draft: { variant: 'secondary', label: 'Draft' },
      scheduled: { variant: 'outline', label: 'Scheduled' },
      archived: { variant: 'destructive', label: 'Archived' },
    };
    return variants[status] || variants.draft;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contents</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your CMS contents in one place
          </p>
        </div>
        <Button onClick={() => navigate('/admin/cms/contents/create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>All Contents ({contents.length})</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contents..."
                  className="pl-9"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {contents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No contents found</p>
                <p className="text-sm">Create your first content to get started</p>
              </div>
              <Button onClick={() => navigate('/admin/cms/contents/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contents.map((content) => {
                    const statusInfo = getStatusBadge(content.status);
                    return (
                      <TableRow key={content.uuid}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{content.title}</p>
                            {content.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {content.excerpt}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {content.content_type?.display_name || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {content.author?.name || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {content.published_at 
                              ? formatDistanceToNow(parseISO(content.published_at), { addSuffix: true })
                              : formatDistanceToNow(parseISO(content.created_at), { addSuffix: true })
                            }
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/cms/contents/${content.uuid}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {content.status === 'published' ? (
                                <DropdownMenuItem onClick={() => handleUnpublish(content.uuid)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Unpublish
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handlePublish(content.uuid)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {content.status !== 'archived' && (
                                <DropdownMenuItem onClick={() => handleArchive(content.uuid)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(content.uuid)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
