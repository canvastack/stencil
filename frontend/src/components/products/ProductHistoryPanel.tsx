import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  History, 
  Download, 
  RotateCcw, 
  GitBranch, 
  Filter,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Edit
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { historyService } from '@/services/api/history';
import type { ProductHistory, ProductVersion, HistoryDiffView } from '@/types/history';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface ProductHistoryPanelProps {
  productId: string;
}

const DiffViewer: React.FC<{ diff: HistoryDiffView[] }> = ({ diff }) => {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleField = (field: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(field)) {
      newExpanded.delete(field);
    } else {
      newExpanded.add(field);
    }
    setExpandedFields(newExpanded);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getDiffIcon = (diffType: string) => {
    switch (diffType) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'modified':
        return <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return null;
    }
  };

  const getDiffColor = (diffType: string) => {
    switch (diffType) {
      case 'added':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'removed':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      case 'modified':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-secondary/20 border-border';
    }
  };

  return (
    <div className="space-y-2">
      {diff.map((item, index) => {
        const isExpanded = expandedFields.has(item.field);
        const hasDiff = item.isDifferent;

        return (
          <div
            key={index}
            className={`border rounded-lg p-3 ${hasDiff ? getDiffColor(item.diffType) : 'bg-secondary/10'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasDiff && getDiffIcon(item.diffType)}
                <span className="font-medium text-sm">{item.fieldLabel}</span>
                {hasDiff && (
                  <Badge variant="outline" className="text-xs">
                    {item.diffType}
                  </Badge>
                )}
              </div>
              {hasDiff && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleField(item.field)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {isExpanded && hasDiff && (
              <div className="mt-3 space-y-2">
                {item.diffType !== 'added' && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/10 rounded border border-red-200 dark:border-red-800/50">
                    <p className="text-xs text-muted-foreground mb-1">Old Value:</p>
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {formatValue(item.oldValue)}
                    </pre>
                  </div>
                )}
                {item.diffType !== 'removed' && (
                  <div className="p-2 bg-green-50 dark:bg-green-950/10 rounded border border-green-200 dark:border-green-800/50">
                    <p className="text-xs text-muted-foreground mb-1">New Value:</p>
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {formatValue(item.newValue)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const HistoryItem: React.FC<{ history: ProductHistory; onViewDiff: (historyId: string) => void }> = ({ 
  history,
  onViewDiff 
}) => {
  const getActionBadge = (action: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      created: { label: 'Created', variant: 'default' },
      updated: { label: 'Updated', variant: 'secondary' },
      deleted: { label: 'Deleted', variant: 'destructive' },
      published: { label: 'Published', variant: 'default' },
      unpublished: { label: 'Unpublished', variant: 'outline' },
      archived: { label: 'Archived', variant: 'secondary' },
      restored: { label: 'Restored', variant: 'default' },
    };
    const config = variants[action] || variants.updated;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <Avatar className="h-8 w-8">
        <AvatarImage src={history.performedByAvatar} />
        <AvatarFallback>{getInitials(history.performedByName)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{history.performedByName}</span>
            {getActionBadge(history.action)}
            {history.changeCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {history.changeCount} change{history.changeCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(history.performedAt), { addSuffix: true })}
          </span>
        </div>

        {history.changes && history.changes.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Modified: {history.changes.map(c => c.fieldLabel).join(', ')}
          </div>
        )}

        {history.changeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDiff(history.id)}
            className="gap-2 h-7"
          >
            <GitBranch className="h-3 w-3" />
            View Changes
          </Button>
        )}
      </div>
    </div>
  );
};

const VersionItem: React.FC<{ 
  version: ProductVersion; 
  onRestore: (versionId: string) => void;
  onCompare: (versionId: string) => void;
}> = ({ version, onRestore, onCompare }) => {
  return (
    <div className="flex gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <span className="font-medium">Version {version.versionNumber}</span>
            {version.isCurrent && (
              <Badge variant="default">Current</Badge>
            )}
            {version.label && (
              <Badge variant="outline">{version.label}</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(version.createdAt), 'PPp')}
          </span>
        </div>

        {version.description && (
          <p className="text-sm text-muted-foreground">{version.description}</p>
        )}

        <div className="text-xs text-muted-foreground">
          Created by {version.createdByName}
        </div>

        {!version.isCurrent && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(version.id)}
              className="gap-2 h-7"
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCompare(version.id)}
              className="gap-2 h-7"
            >
              <GitBranch className="h-3 w-3" />
              Compare
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductHistoryPanel: React.FC<ProductHistoryPanelProps> = ({ productId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'history' | 'versions'>('history');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['product-history', productId, filterAction],
    queryFn: () => historyService.getProductHistory(
      productId,
      1,
      50,
      filterAction !== 'all' ? { action: [filterAction] } : undefined
    ),
  });

  const { data: versionsData, isLoading: versionsLoading } = useQuery({
    queryKey: ['product-versions', productId],
    queryFn: () => historyService.getProductVersions(productId, 1, 50),
    enabled: activeTab === 'versions',
  });

  const { data: stats } = useQuery({
    queryKey: ['history-stats', productId],
    queryFn: () => historyService.getStats(productId),
  });

  const { data: diffData, isLoading: diffLoading } = useQuery({
    queryKey: ['history-diff', selectedHistoryId],
    queryFn: () => historyService.getHistoryDiff(selectedHistoryId!),
    enabled: !!selectedHistoryId && diffDialogOpen,
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) =>
      historyService.restoreVersion({ versionId, productId, createBackup: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-history', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-versions', productId] });
      queryClient.invalidateQueries({ queryKey: ['history-stats', productId] });
      toast.success('Version restored successfully');
      setRestoreDialogOpen(false);
      setSelectedVersionId(null);
    },
    onError: (error: any) => {
      toast.error('Failed to restore version', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleViewDiff = (historyId: string) => {
    setSelectedHistoryId(historyId);
    setDiffDialogOpen(true);
  };

  const handleRestoreVersion = (versionId: string) => {
    setSelectedVersionId(versionId);
    setRestoreDialogOpen(true);
  };

  const handleConfirmRestore = () => {
    if (selectedVersionId) {
      restoreMutation.mutate(selectedVersionId);
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const blob = await historyService.exportHistory(productId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-history-${productId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('History exported successfully');
    } catch (error: any) {
      toast.error('Failed to export history', {
        description: error?.message || 'An error occurred',
      });
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Change History</h3>
            </div>
            {stats && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {stats.totalChanges} change{stats.totalChanges !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline">
                  {stats.totalVersions} version{stats.totalVersions !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  History
                  {stats && <span className="text-xs">({stats.totalChanges})</span>}
                </TabsTrigger>
                <TabsTrigger value="versions" className="gap-2">
                  <GitBranch className="h-4 w-4" />
                  Versions
                  {stats && <span className="text-xs">({stats.totalVersions})</span>}
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                {activeTab === 'history' && (
                  <>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="created">Created</SelectItem>
                        <SelectItem value="updated">Updated</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <TabsContent value="history" className="mt-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !historyData || historyData.history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No history yet</p>
                  <p className="text-sm mt-1">Changes will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {historyData.history.map((item) => (
                      <HistoryItem
                        key={item.id}
                        history={item}
                        onViewDiff={handleViewDiff}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="versions" className="mt-4">
              {versionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !versionsData || versionsData.versions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No versions saved</p>
                  <p className="text-sm mt-1">Create snapshots to track major changes</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {versionsData.versions.map((version) => (
                      <VersionItem
                        key={version.id}
                        version={version}
                        onRestore={handleRestoreVersion}
                        onCompare={() => {}}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Change Details</DialogTitle>
            <DialogDescription>
              Review the changes made to this product
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {diffLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : diffData ? (
              <DiffViewer diff={diffData} />
            ) : (
              <p className="text-center text-muted-foreground py-12">No changes to display</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this version? This will create a backup of the current state before restoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore}>
              Restore Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
