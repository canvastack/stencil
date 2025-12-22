import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
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
import {
  ChevronDown,
  Edit,
  DollarSign,
  Folder,
  Tags,
  Package,
  Star,
  Copy,
  Trash2,
  FileCheck,
  Archive,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { bulkOperationsService } from '@/services/api/bulkOperations';
import { BulkEditDialog } from './BulkEditDialog';
import { BulkPriceUpdateDialog } from './BulkPriceUpdateDialog';
import { BulkOperationProgress } from './BulkOperationProgress';
import type { BulkActionType, BulkActionOption } from '@/types/bulkOperations';

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onSelectionClear: () => void;
  onOperationComplete?: () => void;
}

const BULK_ACTIONS: BulkActionOption[] = [
  {
    value: 'update_status',
    label: 'Update Status',
    description: 'Change status for selected products',
    icon: FileCheck,
    requiresDialog: true,
  },
  {
    value: 'update_featured',
    label: 'Set Featured',
    description: 'Mark/unmark as featured',
    icon: Star,
    requiresDialog: false,
  },
  {
    value: 'update_price',
    label: 'Update Prices',
    description: 'Adjust prices in bulk',
    icon: DollarSign,
    requiresDialog: true,
  },
  {
    value: 'update_category',
    label: 'Change Category',
    description: 'Move to different category',
    icon: Folder,
    requiresDialog: true,
  },
  {
    value: 'update_tags',
    label: 'Manage Tags',
    description: 'Add or remove tags',
    icon: Tags,
    requiresDialog: true,
  },
  {
    value: 'update_stock',
    label: 'Update Stock',
    description: 'Adjust inventory quantities',
    icon: Package,
    requiresDialog: true,
  },
  {
    value: 'duplicate',
    label: 'Duplicate Products',
    description: 'Create copies of selected products',
    icon: Copy,
    requiresDialog: true,
  },
  {
    value: 'delete',
    label: 'Delete Products',
    description: 'Remove selected products',
    icon: Trash2,
    requiresDialog: false,
    dangerous: true,
  },
];

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedIds,
  onSelectionClear,
  onOperationComplete,
}) => {
  const [selectedAction, setSelectedAction] = useState<BulkActionType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFeaturedConfirm, setShowFeaturedConfirm] = useState(false);
  const [featuredValue, setFeaturedValue] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const handleActionSelect = (action: BulkActionType) => {
    setSelectedAction(action);

    switch (action) {
      case 'update_status':
      case 'update_category':
      case 'update_tags':
      case 'update_stock':
      case 'duplicate':
        setShowEditDialog(true);
        break;
      
      case 'update_price':
        setShowPriceDialog(true);
        break;
      
      case 'update_featured':
        setShowFeaturedConfirm(true);
        break;
      
      case 'delete':
        setShowDeleteConfirm(true);
        break;
    }
  };

  const handleBulkDelete = async () => {
    try {
      const job = await bulkOperationsService.bulkDelete(selectedIds, false);
      setCurrentJobId(job.id);
      setShowProgress(true);
      setShowDeleteConfirm(false);
      
      toast.success('Bulk delete started', {
        description: `Deleting ${selectedIds.length} products...`,
      });
    } catch (error: any) {
      toast.error('Failed to start bulk delete', {
        description: error?.message || 'An error occurred',
      });
    }
  };

  const handleBulkFeatured = async () => {
    try {
      const job = await bulkOperationsService.bulkUpdateFeatured(selectedIds, featuredValue);
      setCurrentJobId(job.id);
      setShowProgress(true);
      setShowFeaturedConfirm(false);
      
      toast.success('Bulk update started', {
        description: `Updating ${selectedIds.length} products...`,
      });
    } catch (error: any) {
      toast.error('Failed to start bulk update', {
        description: error?.message || 'An error occurred',
      });
    }
  };

  const handleBulkPublish = async (status: 'draft' | 'published' | 'archived') => {
    try {
      const job = await bulkOperationsService.bulkUpdateStatus(selectedIds, status);
      setCurrentJobId(job.id);
      setShowProgress(true);
      
      toast.success('Bulk status update started', {
        description: `Updating ${selectedIds.length} products to ${status}...`,
      });
    } catch (error: any) {
      toast.error('Failed to start bulk update', {
        description: error?.message || 'An error occurred',
      });
    }
  };

  const handleOperationComplete = () => {
    setShowProgress(false);
    setCurrentJobId(null);
    onSelectionClear();
    onOperationComplete?.();
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <Badge variant="secondary" className="text-sm font-medium">
          {selectedIds.length} selected
        </Badge>

        <div className="flex items-center gap-2 flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Bulk Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Choose an action</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {BULK_ACTIONS.filter(a => !a.dangerous).map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.value}
                    onClick={() => handleActionSelect(action.value)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div>
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
              
              <DropdownMenuSeparator />
              
              {BULK_ACTIONS.filter(a => a.dangerous).map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.value}
                    onClick={() => handleActionSelect(action.value)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div>
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkPublish('published')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkPublish('draft')}
            >
              <FileCheck className="mr-2 h-4 w-4" />
              Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkPublish('archived')}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onSelectionClear}>
          Clear Selection
        </Button>
      </div>

      <BulkEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        action={selectedAction || 'update_status'}
        productIds={selectedIds}
        onSuccess={(jobId) => {
          setCurrentJobId(jobId);
          setShowProgress(true);
          setShowEditDialog(false);
        }}
      />

      <BulkPriceUpdateDialog
        open={showPriceDialog}
        onOpenChange={setShowPriceDialog}
        productIds={selectedIds}
        onSuccess={(jobId) => {
          setCurrentJobId(jobId);
          setShowProgress(true);
          setShowPriceDialog(false);
        }}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} products?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will move the selected products to trash. You can restore them later
              from the trash. To permanently delete, you'll need to empty the trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFeaturedConfirm} onOpenChange={setShowFeaturedConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update featured status?</AlertDialogTitle>
            <AlertDialogDescription>
              Choose whether to mark or unmark the selected {selectedIds.length} products as featured.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 py-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setFeaturedValue(true);
                handleBulkFeatured();
              }}
            >
              <Star className="mr-2 h-4 w-4" />
              Mark as Featured
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setFeaturedValue(false);
                handleBulkFeatured();
              }}
            >
              Remove Featured
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showProgress && currentJobId && (
        <BulkOperationProgress
          jobId={currentJobId}
          onComplete={handleOperationComplete}
        />
      )}
    </>
  );
};
