import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Product } from '@/types/product';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { announceToScreenReader } from '@/lib/utils/accessibility';

interface QuickEditDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<Product>) => Promise<void>;
}

/**
 * Quick Edit Dialog for fast inline product updates
 * Allows editing common fields without full page navigation
 * 
 * Features:
 * - Inline editing of key fields (name, price, stock, status, featured)
 * - Keyboard shortcuts (Enter to save, Esc to cancel)
 * - Form validation
 * - Loading states
 * - Accessibility support
 * 
 * @example
 * <QuickEditDialog
 *   product={selectedProduct}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSave={handleSave}
 * />
 */
export const QuickEditDialog: React.FC<QuickEditDialogProps> = ({
  product,
  open,
  onOpenChange,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    stock_quantity: 0,
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        stock_quantity: product.stock_quantity || 0,
        status: (product.status as 'draft' | 'published' | 'archived') || 'draft',
        featured: product.featured || false,
      });
    }
  }, [product]);

  const handleSave = async () => {
    if (!product) return;

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      announceToScreenReader('Error: Product name is required');
      return;
    }

    if (formData.price < 0) {
      toast.error('Price cannot be negative');
      announceToScreenReader('Error: Price cannot be negative');
      return;
    }

    if (formData.stock_quantity < 0) {
      toast.error('Stock quantity cannot be negative');
      announceToScreenReader('Error: Stock quantity cannot be negative');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(product.uuid || product.id, formData);
      onOpenChange(false);
      announceToScreenReader('Product updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product';
      toast.error(message);
      announceToScreenReader(`Error: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Quick Edit: {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              autoFocus
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="0.00"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                placeholder="0"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'draft' | 'published' | 'archived') =>
                setFormData({ ...formData, status: value })
              }
              disabled={isSaving}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, featured: checked as boolean })
              }
              disabled={isSaving}
            />
            <Label
              htmlFor="featured"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Featured Product
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>

        <div className="text-xs text-muted-foreground text-center pb-2">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> or{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘+Enter</kbd> to save
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickEditDialog;
