import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/types/product';
import { toast } from 'sonner';
import { Loader2, Info, AlertCircle } from 'lucide-react';
import { announceToScreenReader } from '@/lib/utils/accessibility';
import { cn } from '@/lib/utils';

interface BulkEditDialogProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (productIds: string[], data: Partial<Product>) => Promise<void>;
  onCancel?: () => void;
}

type EditMode = 'add' | 'subtract' | 'set' | 'multiply';

interface BulkEditFormData {
  enablePrice: boolean;
  priceMode: EditMode;
  priceValue: number;
  
  enableStock: boolean;
  stockMode: EditMode;
  stockValue: number;
  
  enableStatus: boolean;
  statusValue: 'draft' | 'published' | 'archived';
  
  enableFeatured: boolean;
  featuredValue: boolean;
  
  enableCategory: boolean;
  categoryValue: string;
}

/**
 * Bulk Edit Dialog for mass product updates
 * Allows editing multiple products at once with different operation modes
 * 
 * Features:
 * - Multi-field editing (price, stock, status, featured, category)
 * - Operation modes: Add, Subtract, Set, Multiply (for numeric fields)
 * - Preview of affected products
 * - Batch processing with progress indication
 * - Validation and error handling
 * - Accessibility support
 * 
 * @example
 * <BulkEditDialog
 *   products={selectedProducts}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSave={handleBulkSave}
 * />
 */
export const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  products,
  open,
  onOpenChange,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<BulkEditFormData>({
    enablePrice: false,
    priceMode: 'set',
    priceValue: 0,
    
    enableStock: false,
    stockMode: 'set',
    stockValue: 0,
    
    enableStatus: false,
    statusValue: 'published',
    
    enableFeatured: false,
    featuredValue: false,
    
    enableCategory: false,
    categoryValue: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        enablePrice: false,
        priceMode: 'set',
        priceValue: 0,
        
        enableStock: false,
        stockMode: 'set',
        stockValue: 0,
        
        enableStatus: false,
        statusValue: 'published',
        
        enableFeatured: false,
        featuredValue: false,
        
        enableCategory: false,
        categoryValue: '',
      });
    }
  }, [open]);

  const handleSave = async () => {
    if (products.length === 0) {
      toast.error('No products selected');
      return;
    }

    const hasChanges = formData.enablePrice || formData.enableStock || 
                       formData.enableStatus || formData.enableFeatured || 
                       formData.enableCategory;

    if (!hasChanges) {
      toast.error('Please select at least one field to update');
      announceToScreenReader('Error: No fields selected for update');
      return;
    }

    if (formData.enablePrice && formData.priceValue < 0 && (formData.priceMode === 'set' || formData.priceMode === 'add')) {
      toast.error('Price value cannot be negative');
      return;
    }

    if (formData.enableStock && formData.stockValue < 0 && (formData.stockMode === 'set' || formData.stockMode === 'add')) {
      toast.error('Stock value cannot be negative');
      return;
    }

    try {
      setIsSaving(true);
      
      const updateData: any = {};
      
      if (formData.enablePrice) {
        updateData.priceUpdate = {
          mode: formData.priceMode,
          value: formData.priceValue,
        };
      }
      
      if (formData.enableStock) {
        updateData.stockUpdate = {
          mode: formData.stockMode,
          value: formData.stockValue,
        };
      }
      
      if (formData.enableStatus) {
        updateData.status = formData.statusValue;
      }
      
      if (formData.enableFeatured) {
        updateData.featured = formData.featuredValue;
      }
      
      if (formData.enableCategory) {
        updateData.category = formData.categoryValue;
      }

      const productIds = products.map(p => p.uuid || p.id);
      await onSave(productIds, updateData);
      
      onOpenChange(false);
      announceToScreenReader(`${products.length} products updated successfully`);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update products';
      toast.error(message);
      announceToScreenReader(`Error: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getModeLabel = (mode: EditMode) => {
    switch (mode) {
      case 'set': return 'Set to';
      case 'add': return 'Add';
      case 'subtract': return 'Subtract';
      case 'multiply': return 'Multiply by';
    }
  };

  const getPreviewText = (mode: EditMode, value: number, currentValue: number): string => {
    switch (mode) {
      case 'set': return `→ ${value}`;
      case 'add': return `${currentValue} + ${value} = ${currentValue + value}`;
      case 'subtract': return `${currentValue} - ${value} = ${Math.max(0, currentValue - value)}`;
      case 'multiply': return `${currentValue} × ${value} = ${currentValue * value}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Edit Products</DialogTitle>
          <DialogDescription>
            Edit {products.length} selected product{products.length !== 1 ? 's' : ''}. Changes will be applied to all selected items.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Selected Products Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Products ({products.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg max-h-24 overflow-y-auto">
                {products.slice(0, 10).map(product => (
                  <Badge key={product.id} variant="secondary" className="text-xs">
                    {product.name}
                  </Badge>
                ))}
                {products.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{products.length - 10} more
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Price Update */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enablePrice"
                  checked={formData.enablePrice}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, enablePrice: !!checked })
                  }
                />
                <Label htmlFor="enablePrice" className="text-sm font-medium cursor-pointer">
                  Update Price
                </Label>
              </div>
              
              {formData.enablePrice && (
                <div className="ml-6 space-y-3 p-3 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="priceMode" className="text-xs">Operation</Label>
                      <Select
                        value={formData.priceMode}
                        onValueChange={(value) => 
                          setFormData({ ...formData, priceMode: value as EditMode })
                        }
                      >
                        <SelectTrigger id="priceMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="set">Set to</SelectItem>
                          <SelectItem value="add">Add (+)</SelectItem>
                          <SelectItem value="subtract">Subtract (-)</SelectItem>
                          <SelectItem value="multiply">Multiply (×)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priceValue" className="text-xs">Value</Label>
                      <Input
                        id="priceValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.priceValue}
                        onChange={(e) => 
                          setFormData({ ...formData, priceValue: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  {/* Preview */}
                  {products.length > 0 && products.length <= 5 && (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="font-medium">Preview:</p>
                      {products.map(p => (
                        <p key={p.id} className="ml-2">
                          {p.name}: {p.price} {getPreviewText(formData.priceMode, formData.priceValue, p.price)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Stock Update */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableStock"
                  checked={formData.enableStock}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, enableStock: !!checked })
                  }
                />
                <Label htmlFor="enableStock" className="text-sm font-medium cursor-pointer">
                  Update Stock Quantity
                </Label>
              </div>
              
              {formData.enableStock && (
                <div className="ml-6 space-y-3 p-3 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="stockMode" className="text-xs">Operation</Label>
                      <Select
                        value={formData.stockMode}
                        onValueChange={(value) => 
                          setFormData({ ...formData, stockMode: value as EditMode })
                        }
                      >
                        <SelectTrigger id="stockMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="set">Set to</SelectItem>
                          <SelectItem value="add">Add (+)</SelectItem>
                          <SelectItem value="subtract">Subtract (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stockValue" className="text-xs">Value</Label>
                      <Input
                        id="stockValue"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.stockValue}
                        onChange={(e) => 
                          setFormData({ ...formData, stockValue: parseInt(e.target.value) || 0 })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Status Update */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableStatus"
                  checked={formData.enableStatus}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, enableStatus: !!checked })
                  }
                />
                <Label htmlFor="enableStatus" className="text-sm font-medium cursor-pointer">
                  Update Status
                </Label>
              </div>
              
              {formData.enableStatus && (
                <div className="ml-6 p-3 bg-muted/30 rounded-lg">
                  <Select
                    value={formData.statusValue}
                    onValueChange={(value) => 
                      setFormData({ ...formData, statusValue: value as 'draft' | 'published' | 'archived' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Featured Update */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableFeatured"
                  checked={formData.enableFeatured}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, enableFeatured: !!checked })
                  }
                />
                <Label htmlFor="enableFeatured" className="text-sm font-medium cursor-pointer">
                  Update Featured Status
                </Label>
              </div>
              
              {formData.enableFeatured && (
                <div className="ml-6 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featuredValue"
                      checked={formData.featuredValue}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, featuredValue: !!checked })
                      }
                    />
                    <Label htmlFor="featuredValue" className="text-sm cursor-pointer">
                      Mark as Featured Product
                    </Label>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-medium">Bulk Update Tips:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li><strong>Set to</strong>: Replace current value with new value</li>
                  <li><strong>Add/Subtract</strong>: Modify current value (min: 0)</li>
                  <li><strong>Multiply</strong>: Increase by percentage (e.g., 1.1 = +10%)</li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? `Updating ${products.length} products...` : `Update ${products.length} Products`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
