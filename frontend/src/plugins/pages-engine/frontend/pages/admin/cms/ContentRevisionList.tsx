import { useState } from 'react';
import { History, RotateCcw, Eye, Clock, User } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Skeleton } from '@canvastencil/ui-components';
import { useRevisionsForContentQuery, useRevertRevisionMutation } from '@/hooks/cms';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { Revision } from '@/types/cms';

export default function ContentRevisionList() {
  const { contentUuid } = useParams<{ contentUuid: string }>();
  const navigate = useNavigate();
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data, isLoading, refetch } = useRevisionsForContentQuery(contentUuid!);
  const revertMutation = useRevertRevisionMutation();

  const revisions = data?.data || [];

  const handleRevert = async (revisionUuid: string) => {
    if (confirm('Are you sure you want to revert to this revision? This action will create a new revision with the content from this version.')) {
      try {
        await revertMutation.mutateAsync(revisionUuid);
        refetch();
      } catch (error) {
        console.error('Failed to revert revision:', error);
      }
    }
  };

  const handlePreview = (revision: Revision) => {
    setSelectedRevision(revision);
    setIsPreviewOpen(true);
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

  if (!contentUuid) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Invalid content UUID
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revision History</h1>
          <p className="text-muted-foreground mt-1">
            View and restore previous versions of this content
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back to Content
        </Button>
      </div>

      {revisions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Revisions Yet</h3>
            <p className="text-muted-foreground">
              Revisions will appear here as you edit and save this content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>All Revisions ({revisions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Version</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revisions.map((revision, index) => (
                  <TableRow key={revision.uuid} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          v{revision.version_number}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{revision.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{revision.created_by.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(revision.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(revision)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        {index !== 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevert(revision.uuid)}
                            disabled={revertMutation.isPending}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Revert
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Revision Preview: v{selectedRevision?.version_number}
            </DialogTitle>
            <DialogDescription>
              Created by {selectedRevision?.created_by.name} on {selectedRevision?.created_at && new Date(selectedRevision.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Title</h3>
              <p className="text-foreground">{selectedRevision?.title}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Content</h3>
              <div 
                className="prose dark:prose-invert max-w-none p-4 rounded-lg border bg-muted/50"
                dangerouslySetInnerHTML={{ __html: selectedRevision?.body || '' }}
              />
            </div>
            {selectedRevision?.metadata && Object.keys(selectedRevision.metadata).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Metadata</h3>
                <pre className="p-4 rounded-lg border bg-muted/50 text-sm overflow-x-auto">
                  {JSON.stringify(selectedRevision.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
