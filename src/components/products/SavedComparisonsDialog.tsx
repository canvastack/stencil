import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { Save, Loader2, Trash2, Eye, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { comparisonService } from '@/services/api/comparison';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import type { SavedComparison, ComparisonConfig } from '@/types/comparison';
import { cn } from '@/lib/utils';

interface SavedComparisonsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'save' | 'load';
}

export const SavedComparisonsDialog: React.FC<SavedComparisonsDialogProps> = ({
  open,
  onOpenChange,
  mode,
}) => {
  const queryClient = useQueryClient();
  const { comparedProducts, notes, loadComparison, currentComparison } = useProductComparison();
  
  const [name, setName] = useState(currentComparison?.name || '');
  const [description, setDescription] = useState(currentComparison?.description || '');
  const [isPublic, setIsPublic] = useState(currentComparison?.isPublic || false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [comparisonToDelete, setComparisonToDelete] = useState<string | null>(null);

  const { data: savedComparisons, isLoading } = useQuery({
    queryKey: ['saved-comparisons'],
    queryFn: () => comparisonService.getSavedComparisons(1, 50),
    enabled: open && mode === 'load',
  });

  const saveMutation = useMutation({
    mutationFn: async (config: ComparisonConfig & { name: string; description?: string; isPublic?: boolean }) => {
      if (currentComparison) {
        return await comparisonService.updateComparison(currentComparison.id, config);
      }
      return await comparisonService.saveComparison(config);
    },
    onSuccess: () => {
      toast.success(currentComparison ? 'Comparison updated' : 'Comparison saved');
      queryClient.invalidateQueries({ queryKey: ['saved-comparisons'] });
      onOpenChange(false);
      setName('');
      setDescription('');
      setIsPublic(false);
    },
    onError: (error: any) => {
      toast.error('Failed to save comparison', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (comparisonId: string) => {
      return await comparisonService.deleteComparison(comparisonId);
    },
    onSuccess: () => {
      toast.success('Comparison deleted');
      queryClient.invalidateQueries({ queryKey: ['saved-comparisons'] });
      setDeleteConfirmOpen(false);
      setComparisonToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete comparison', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a name for this comparison');
      return;
    }

    if (comparedProducts.length < 2) {
      toast.error('Please add at least 2 products to compare');
      return;
    }

    const config: ComparisonConfig & { name: string; description?: string; isPublic?: boolean } = {
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
      productIds: comparedProducts.map(p => p.id),
      notes,
      highlightDifferences: true,
    };

    saveMutation.mutate(config);
  };

  const handleLoad = (comparison: SavedComparison) => {
    loadComparison(comparison);
    onOpenChange(false);
  };

  const handleDeleteClick = (comparisonId: string) => {
    setComparisonToDelete(comparisonId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (comparisonToDelete) {
      deleteMutation.mutate(comparisonToDelete);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {mode === 'save' ? (currentComparison ? 'Update Comparison' : 'Save Comparison') : 'Load Comparison'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'save'
                ? 'Save your current product comparison for later reference'
                : 'Load a previously saved comparison'}
            </DialogDescription>
          </DialogHeader>

          {mode === 'save' ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Comparison Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Collection Pricing Analysis"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes about this comparison..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <Label htmlFor="isPublic" className="text-sm cursor-pointer">
                  Make this comparison public (visible to team members)
                </Label>
              </div>

              <div className="p-4 bg-secondary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Products in this comparison</span>
                  <Badge variant="secondary">{comparedProducts.length}</Badge>
                </div>
                {notes.length > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium">Notes</span>
                    <Badge variant="outline">{notes.length}</Badge>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[50vh] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : savedComparisons?.comparisons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No saved comparisons yet</p>
                  <p className="text-sm mt-2">Save your first comparison to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedComparisons?.comparisons.map((comparison) => (
                    <div
                      key={comparison.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{comparison.name}</h4>
                            {comparison.isPublic && (
                              <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" />
                                Public
                              </Badge>
                            )}
                          </div>
                          
                          {comparison.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {comparison.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(comparison.createdAt).toLocaleDateString()}
                            </span>
                            <span>{comparison.productCount} products</span>
                            <span>{comparison.accessCount} views</span>
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoad(comparison)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(comparison.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {mode === 'save' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending || !name.trim()}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {currentComparison ? 'Update' : 'Save'} Comparison
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comparison?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this saved comparison.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
