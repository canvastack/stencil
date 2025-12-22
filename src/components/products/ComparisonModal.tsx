import React, { useState } from 'react';
import { X, TrendingDown, Package, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/product';

interface ComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onRemoveProduct?: (productId: string) => void;
}

interface ComparisonField {
  label: string;
  key: string;
  getValue: (product: Product) => any;
  format?: (value: any, product: Product) => React.ReactNode;
  highlight?: 'lowest' | 'highest' | 'boolean';
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  open,
  onOpenChange,
  products,
  onRemoveProduct,
}) => {
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  const comparisonFields: ComparisonField[] = [
    {
      label: 'Price',
      key: 'price',
      getValue: (p) => p.price,
      format: (value, p) => (
        <div className="text-lg font-bold text-green-600 dark:text-green-400">
          {formatPrice(value, p.currency)}
          {p.priceUnit && <span className="text-sm text-muted-foreground ml-1">/{p.priceUnit}</span>}
        </div>
      ),
      highlight: 'lowest',
    },
    {
      label: 'Status',
      key: 'status',
      getValue: (p) => p.status,
      format: (value) => {
        const colors: Record<string, string> = {
          published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          archived: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return (
          <Badge className={colors[value] || colors.draft}>
            {value?.charAt(0).toUpperCase() + value?.slice(1)}
          </Badge>
        );
      },
    },
    {
      label: 'Minimum Order',
      key: 'minOrder',
      getValue: (p) => p.minOrder || 0,
      format: (value, p) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{value} {p.priceUnit || 'pcs'}</span>
        </div>
      ),
      highlight: 'lowest',
    },
    {
      label: 'Maximum Order',
      key: 'maxOrder',
      getValue: (p) => p.maxOrder || 0,
      format: (value, p) => value ? `${value} ${p.priceUnit || 'pcs'}` : 'Unlimited',
      highlight: 'highest',
    },
    {
      label: 'Lead Time',
      key: 'leadTime',
      getValue: (p) => p.leadTime || 'N/A',
      format: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      label: 'Material',
      key: 'material',
      getValue: (p) => p.material || 'N/A',
      format: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      label: 'Category',
      key: 'category',
      getValue: (p) => p.category?.name || 'Uncategorized',
    },
    {
      label: 'Stock',
      key: 'stock',
      getValue: (p) => p.stock || 0,
      format: (value) => (
        <div className="font-medium">
          {value > 0 ? (
            <span className="text-green-600 dark:text-green-400">{value} in stock</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">Out of stock</span>
          )}
        </div>
      ),
    },
  ];

  const getHighlightedValue = (field: ComparisonField) => {
    if (!field.highlight) return null;

    const values = products.map(p => field.getValue(p)).filter(v => v != null && v !== 0);
    if (values.length === 0) return null;

    if (field.highlight === 'lowest') {
      return Math.min(...values.map(v => typeof v === 'number' ? v : 0));
    } else if (field.highlight === 'highest') {
      return Math.max(...values.map(v => typeof v === 'number' ? v : 0));
    }
    return null;
  };

  const isHighlighted = (field: ComparisonField, product: Product) => {
    if (!highlightDifferences) return false;
    const highlightValue = getHighlightedValue(field);
    if (highlightValue === null) return false;
    return field.getValue(product) === highlightValue;
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Product Comparison ({products.length} products)</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHighlightDifferences(!highlightDifferences)}
              >
                {highlightDifferences ? 'Hide' : 'Show'} Best Values
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <div className="space-y-6 pr-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
              {products.map((product) => (
                <div key={product.id} className="relative">
                  {onRemoveProduct && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 z-10 h-6 w-6"
                      onClick={() => onRemoveProduct(product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="p-4 border rounded-lg space-y-3 bg-card">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold line-clamp-2 min-h-[3rem]">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4">
              {comparisonFields.map((field) => (
                <div key={field.key}>
                  <div className="mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{field.label}</span>
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
                    {products.map((product) => {
                      const value = field.getValue(product);
                      const formatted = field.format ? field.format(value, product) : value;
                      const highlighted = isHighlighted(field, product);

                      return (
                        <div
                          key={product.id}
                          className={`p-4 rounded-lg transition-colors ${
                            highlighted
                              ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800'
                              : 'bg-secondary/30 border border-border'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {highlighted && <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />}
                            <div className="flex-1">{formatted}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
