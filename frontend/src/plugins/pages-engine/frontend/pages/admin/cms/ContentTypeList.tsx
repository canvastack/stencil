import { useState } from 'react';
import { Plus, Search, Grid, List, MoreVertical, Eye, EyeOff, Edit, Trash2, FileText } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Skeleton } from '@canvastencil/ui-components';
import { useContentTypesQuery, useDeleteContentTypeMutation, useActivateContentTypeMutation, useDeactivateContentTypeMutation } from '@/hooks/cms';
import { useContentTypeStore } from '@/stores/cms';
import { useNavigate } from 'react-router-dom';

export default function ContentTypeList() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const { filters, setFilters } = useContentTypeStore();
  
  const { data, isLoading } = useContentTypesQuery(filters);
  const deleteMutation = useDeleteContentTypeMutation();
  const activateMutation = useActivateContentTypeMutation();
  const deactivateMutation = useDeactivateContentTypeMutation();

  const contentTypes = data?.data || [];

  const handleSearch = (value: string) => {
    setFilters({ search: value });
  };

  const handleActivate = (uuid: string) => {
    activateMutation.mutate(uuid);
  };

  const handleDeactivate = (uuid: string) => {
    deactivateMutation.mutate(uuid);
  };

  const handleDelete = (uuid: string) => {
    if (confirm('Are you sure you want to delete this content type? This action cannot be undone.')) {
      deleteMutation.mutate(uuid);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Types</h1>
          <p className="text-muted-foreground mt-1">
            Manage different types of content for your CMS
          </p>
        </div>
        <Button onClick={() => navigate('/admin/cms/content-types/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Content Type
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>All Content Types ({contentTypes.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content types..."
                  className="pl-9"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {contentTypes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No content types found</p>
                <p className="text-sm">Create your first content type to get started</p>
              </div>
              <Button onClick={() => navigate('/admin/cms/content-types/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Content Type
              </Button>
            </div>
          ) : viewMode === 'list' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>System Name</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Contents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentTypes.map((contentType) => (
                  <TableRow key={contentType.uuid}>
                    <TableCell className="font-medium">
                      {contentType.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {contentType.slug}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-xl">{contentType.icon || '📄'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        0 contents
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contentType.is_active ? 'default' : 'secondary'}>
                        {contentType.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/cms/content-types/${contentType.uuid}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {contentType.is_active ? (
                            <DropdownMenuItem onClick={() => handleDeactivate(contentType.uuid)}>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivate(contentType.uuid)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(contentType.uuid)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {contentTypes.map((contentType) => (
                <Card key={contentType.uuid} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{contentType.icon || '📄'}</span>
                        <div>
                          <CardTitle className="text-lg">{contentType.name}</CardTitle>
                          <p className="text-sm text-muted-foreground font-mono">{contentType.slug}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/cms/content-types/${contentType.uuid}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {contentType.is_active ? (
                            <DropdownMenuItem onClick={() => handleDeactivate(contentType.uuid)}>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivate(contentType.uuid)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(contentType.uuid)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">0 contents</span>
                      <Badge variant={contentType.is_active ? 'default' : 'secondary'}>
                        {contentType.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
