import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { bulkOperationsService } from '@/services/api/bulkOperations';
import type { 
  BulkActionType, 
  BulkOperationConfig,
  BulkStatusUpdate,
  BulkCategoryUpdate,
  BulkTagsUpdate,
  BulkStockUpdate,
  BulkDuplicateConfig,
  BulkProductionTypeUpdate,
  BulkLeadTimeUpdate,
  BulkBusinessTypeUpdate,
  BulkMaterialsUpdate,
  BulkCustomizableUpdate,
} from '@/types/bulkOperations';
import { cn } from '@/lib/utils';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: BulkActionType;
  productIds: string[];
  onSuccess?: (jobId: string) => void;
}

export const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  open,
  onOpenChange,
  action,
  productIds = [],
  onSuccess,
}) => {
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [category, setCategory] = useState('');
  const [tagsOperation, setTagsOperation] = useState<'add' | 'remove' | 'replace'>('add');
  const [tags, setTags] = useState('');
  const [stockOperation, setStockOperation] = useState<'set' | 'increase' | 'decrease'>('set');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [trackInventory, setTrackInventory] = useState(true);
  const [duplicateCount, setDuplicateCount] = useState('1');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeVariants, setIncludeVariants] = useState(true);
  const [nameSuffix, setNameSuffix] = useState(' - Copy');
  const [productionType, setProductionType] = useState<'internal' | 'vendor' | 'both'>('vendor');
  const [leadTime, setLeadTime] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [materialsOperation, setMaterialsOperation] = useState<'add' | 'remove' | 'replace'>('add');
  const [materials, setMaterials] = useState('');
  const [customizable, setCustomizable] = useState(true);
  const [dryRun, setDryRun] = useState(false);

  const bulkMutation = useMutation({
    mutationFn: async (config: BulkOperationConfig) => {
      return await bulkOperationsService.createBulkOperation(config);
    },
    onSuccess: (job) => {
      toast.success('Bulk operation started', {
        description: `Processing ${productIds.length} products...`,
      });
      onSuccess?.(job.id);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to start bulk operation', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleSubmit = () => {
    let data: any;

    switch (action) {
      case 'update_status':
        data = { status } as BulkStatusUpdate;
        break;
      
      case 'update_category':
        if (!category) {
          toast.error('Please select a category');
          return;
        }
        data = { categorySlug: category } as BulkCategoryUpdate;
        break;
      
      case 'update_tags':
        if (!tags.trim()) {
          toast.error('Please enter tags');
          return;
        }
        data = {
          operation: tagsOperation,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        } as BulkTagsUpdate;
        break;
      
      case 'update_stock':
        data = {
          operation: stockOperation,
          quantity: stockQuantity ? parseInt(stockQuantity) : undefined,
          lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
          trackInventory,
        } as BulkStockUpdate;
        break;
      
      case 'duplicate':
        const count = parseInt(duplicateCount);
        if (isNaN(count) || count < 1 || count > 100) {
          toast.error('Duplicate count must be between 1 and 100');
          return;
        }
        data = {
          count,
          includeImages,
          includeVariants,
          nameSuffix,
        } as BulkDuplicateConfig;
        break;
      
      case 'update_production_type':
        data = { production_type: productionType } as BulkProductionTypeUpdate;
        break;
      
      case 'update_lead_time':
        if (!leadTime.trim()) {
          toast.error('Please enter lead time');
          return;
        }
        data = { lead_time: leadTime } as BulkLeadTimeUpdate;
        break;
      
      case 'update_business_type':
        if (!businessType.trim()) {
          toast.error('Please enter business type');
          return;
        }
        data = { business_type: businessType } as BulkBusinessTypeUpdate;
        break;
      
      case 'add_materials':
        if (!materials.trim()) {
          toast.error('Please enter materials');
          return;
        }
        data = {
          operation: materialsOperation,
          materials: materials.split(',').map(m => m.trim()).filter(Boolean),
        } as BulkMaterialsUpdate;
        break;
      
      case 'toggle_customizable':
        data = { customizable } as BulkCustomizableUpdate;
        break;
      
      default:
        toast.error('Invalid action');
        return;
    }

    const config: BulkOperationConfig = {
      action,
      productIds,
      data,
      dryRun,
    };

    bulkMutation.mutate(config);
  };

  const getDialogTitle = () => {
    switch (action) {
      case 'update_status':
        return 'Bulk Update Status';
      case 'update_category':
        return 'Bulk Change Category';
      case 'update_tags':
        return 'Bulk Manage Tags';
      case 'update_stock':
        return 'Bulk Update Stock';
      case 'update_production_type':
        return 'Bulk Update Production Type';
      case 'update_lead_time':
        return 'Bulk Update Lead Time';
      case 'update_business_type':
        return 'Bulk Update Business Type';
      case 'add_materials':
        return 'Bulk Manage Materials';
      case 'toggle_customizable':
        return 'Bulk Toggle Customizable';
      case 'duplicate':
        return 'Bulk Duplicate Products';
      default:
        return 'Bulk Edit';
    }
  };

  const renderActionFields = () => {
    switch (action) {
      case 'update_status':
        return (
          <div className="space-y-3">
            <Label>New Status</Label>
            <RadioGroup value={status} onValueChange={(v) => setStatus(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="draft" id="draft" />
                <Label htmlFor="draft" className="cursor-pointer">Draft</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="published" id="published" />
                <Label htmlFor="published" className="cursor-pointer">Published</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="archived" id="archived" />
                <Label htmlFor="archived" className="cursor-pointer">Archived</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'update_category':
        return (
          <div className="space-y-3">
            <Label htmlFor="category">Select Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="etching">Etching</SelectItem>
                <SelectItem value="engraving">Engraving</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="award">Awards</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'update_tags':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Operation</Label>
              <RadioGroup value={tagsOperation} onValueChange={(v) => setTagsOperation(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="tag-add" />
                  <Label htmlFor="tag-add" className="cursor-pointer">Add Tags</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remove" id="tag-remove" />
                  <Label htmlFor="tag-remove" className="cursor-pointer">Remove Tags</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="tag-replace" />
                  <Label htmlFor="tag-replace" className="cursor-pointer">Replace All Tags</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="new-arrival, best-seller, on-sale"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple tags with commas
              </p>
            </div>
          </div>
        );

      case 'update_stock':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Stock Operation</Label>
              <RadioGroup value={stockOperation} onValueChange={(v) => setStockOperation(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="set" id="stock-set" />
                  <Label htmlFor="stock-set" className="cursor-pointer">Set to Specific Value</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="increase" id="stock-increase" />
                  <Label htmlFor="stock-increase" className="cursor-pointer">Increase By</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="decrease" id="stock-decrease" />
                  <Label htmlFor="decrease" className="cursor-pointer">Decrease By</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock-qty">Quantity</Label>
              <Input
                id="stock-qty"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="low-stock">Low Stock Threshold (Optional)</Label>
              <Input
                id="low-stock"
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="Enter threshold"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="track-inventory"
                checked={trackInventory}
                onCheckedChange={(checked) => setTrackInventory(!!checked)}
              />
              <Label htmlFor="track-inventory" className="cursor-pointer">
                Enable inventory tracking
              </Label>
            </div>
          </div>
        );

      case 'duplicate':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-count">Number of Copies</Label>
              <Input
                id="duplicate-count"
                type="number"
                min="1"
                max="100"
                value={duplicateCount}
                onChange={(e) => setDuplicateCount(e.target.value)}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 100 copies per product
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name-suffix">Name Suffix</Label>
              <Input
                id="name-suffix"
                value={nameSuffix}
                onChange={(e) => setNameSuffix(e.target.value)}
                placeholder=" - Copy"
              />
              <p className="text-xs text-muted-foreground">
                Will be appended to product names
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-images"
                  checked={includeImages}
                  onCheckedChange={(checked) => setIncludeImages(!!checked)}
                />
                <Label htmlFor="include-images" className="cursor-pointer">
                  Include images
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-variants"
                  checked={includeVariants}
                  onCheckedChange={(checked) => setIncludeVariants(!!checked)}
                />
                <Label htmlFor="include-variants" className="cursor-pointer">
                  Include variants
                </Label>
              </div>
            </div>
          </div>
        );

      case 'update_production_type':
        return (
          <div className="space-y-3">
            <Label>Production Type</Label>
            <RadioGroup value={productionType} onValueChange={(v) => setProductionType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="internal" id="prod-internal" />
                <Label htmlFor="prod-internal" className="cursor-pointer">Internal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vendor" id="prod-vendor" />
                <Label htmlFor="prod-vendor" className="cursor-pointer">Vendor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="prod-both" />
                <Label htmlFor="prod-both" className="cursor-pointer">Both (Hybrid)</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'update_lead_time':
        return (
          <div className="space-y-3">
            <Label htmlFor="lead-time">Lead Time</Label>
            <Input
              id="lead-time"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              placeholder="e.g., 7-10 hari kerja"
            />
            <p className="text-xs text-muted-foreground">
              Example: "7-10 hari kerja", "2 minggu", "1 bulan"
            </p>
          </div>
        );

      case 'update_business_type':
        return (
          <div className="space-y-3">
            <Label htmlFor="business-type">Business Type</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger id="business-type">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metal_etching">Metal Etching</SelectItem>
                <SelectItem value="glass_etching">Glass Etching</SelectItem>
                <SelectItem value="award_plaque">Awards & Plaques</SelectItem>
                <SelectItem value="signage">Signage Solutions</SelectItem>
                <SelectItem value="industrial_etching">Industrial Etching</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'add_materials':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Operation</Label>
              <RadioGroup value={materialsOperation} onValueChange={(v) => setMaterialsOperation(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="mat-add" />
                  <Label htmlFor="mat-add" className="cursor-pointer">Add Materials</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remove" id="mat-remove" />
                  <Label htmlFor="mat-remove" className="cursor-pointer">Remove Materials</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="mat-replace" />
                  <Label htmlFor="mat-replace" className="cursor-pointer">Replace All Materials</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materials">Materials (comma-separated)</Label>
              <Input
                id="materials"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="akrilik, kuningan, tembaga"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple materials with commas
              </p>
            </div>
          </div>
        );

      case 'toggle_customizable':
        return (
          <div className="space-y-3">
            <Label>Customizable Status</Label>
            <RadioGroup value={customizable ? 'true' : 'false'} onValueChange={(v) => setCustomizable(v === 'true')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="custom-true" />
                <Label htmlFor="custom-true" className="cursor-pointer">Enable Customization</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="custom-false" />
                <Label htmlFor="custom-false" className="cursor-pointer">Disable Customization</Label>
              </div>
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            This action will affect {productIds.length} selected products.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {renderActionFields()}

          <Separator />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dry-run"
              checked={dryRun}
              onCheckedChange={(checked) => setDryRun(!!checked)}
            />
            <Label htmlFor="dry-run" className="cursor-pointer text-sm">
              Dry run (preview changes without applying)
            </Label>
          </div>

          {dryRun && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                Dry run mode: Changes will be validated but not saved. Review the results before applying.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={bulkMutation.isPending}>
            {bulkMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {dryRun ? 'Preview' : 'Apply Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
