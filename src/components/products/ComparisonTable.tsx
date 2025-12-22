import React, { useMemo, useState } from 'react';
import { X, CheckCircle, XCircle, Minus, TrendingDown, Clock, Package, Eye, Save, Share2, FolderOpen } from 'lucide-react';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ComparisonModal } from './ComparisonModal';
import { SavedComparisonsDialog } from './SavedComparisonsDialog';
import { ShareComparisonDialog } from './ShareComparisonDialog';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/product';

interface ComparisonField {
  label: string;
  key: string;
  getValue: (product: Product) => any;
  format?: (value: any, product: Product) => React.ReactNode;
  highlight?: 'lowest' | 'highest' | 'boolean';
}

export const ComparisonTable: React.FC = () => {
  const { comparedProducts, removeFromCompare, clearComparison } = useProductComparison();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  const comparisonFields: ComparisonField[] = useMemo(() => [
    {
      label: 'Price',
      key: 'price',
      getValue: (p) => p.price,
      format: (value, p) => (
        <div className="text-lg font-bold text-green-600">
          {formatPrice(value, p.currency)}
          {p.priceUnit && <span className="text-sm text-muted-foreground">/{p.priceUnit}</span>}
        </div>
      ),
      highlight: 'lowest',
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
      label: 'Availability',
      key: 'availability',
      getValue: (p) => p.availability || 'in-stock',
      format: (value) => {
        const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
          'in-stock': { label: 'In Stock', variant: 'default' },
          'out-of-stock': { label: 'Out of Stock', variant: 'destructive' },
          'pre-order': { label: 'Pre-order', variant: 'secondary' },
        };
        const config = variants[value] || variants['in-stock'];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      label: 'Customization Options',
      key: 'customization',
      getValue: (p) => p.customizationOptions?.length || 0,
      format: (value) => (
        <div className="flex items-center gap-2">
          {value > 0 ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{value} options</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-gray-400" />
              <span>Not available</span>
            </>
          )}
        </div>
      ),
      highlight: 'highest',
    },
    {
      label: 'Features',
      key: 'features',
      getValue: (p) => p.features?.length || 0,
      format: (value, p) => (
        <div>
          {value > 0 ? (
            <ul className="text-sm space-y-1">
              {p.features?.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
              {(p.features?.length || 0) > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{(p.features?.length || 0) - 3} more
                </li>
              )}
            </ul>
          ) : (
            <span className="text-muted-foreground">No features listed</span>
          )}
        </div>
      ),
    },
  ], []);

  const getHighlightedValue = (field: ComparisonField) => {
    if (!field.highlight) return null;

    const values = comparedProducts.map(p => field.getValue(p)).filter(v => v != null && v !== 0);
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

  if (comparedProducts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-6xl">📊</div>
          <h3 className="text-2xl font-bold">No Products to Compare</h3>
          <p className="text-muted-foreground">
            Add products from the catalog to compare their features, pricing, and specifications side-by-side.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Product Comparison</h2>
            <p className="text-muted-foreground">
              Comparing {comparedProducts.length} product{comparedProducts.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHighlightDifferences(!highlightDifferences)}
            >
              {highlightDifferences ? 'Hide' : 'Show'} Best Values
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Modal View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoadDialogOpen(true)}
              className="gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              Load
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={clearComparison}>
              Clear All
            </Button>
          </div>
        </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, 1fr)` }}>
            <div className="sticky left-0 bg-background z-10">
              <div className="h-[280px] flex items-end pb-4">
                <span className="text-sm font-medium text-muted-foreground">Product</span>
              </div>
            </div>

            {comparedProducts.map((product) => (
              <Card key={product.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-6 w-6"
                  onClick={() => removeFromCompare(product.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="p-4 space-y-3">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
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
              </Card>
            ))}
          </div>

          <Separator className="my-6" />

          {comparisonFields.map((field, idx) => (
            <div key={field.key}>
              <div
                className="grid gap-4 py-4"
                style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, 1fr)` }}
              >
                <div className="sticky left-0 bg-background z-10 flex items-center">
                  <span className="text-sm font-medium">{field.label}</span>
                </div>

                {comparedProducts.map((product) => {
                  const value = field.getValue(product);
                  const formatted = field.format ? field.format(value, product) : value;
                  const highlighted = isHighlighted(field, product);

                  return (
                    <div
                      key={product.id}
                      className={`p-4 rounded-lg transition-colors ${
                        highlighted
                          ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800'
                          : 'bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {highlighted && <TrendingDown className="h-4 w-4 text-green-600 shrink-0" />}
                        <div className="flex-1">{formatted}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {idx < comparisonFields.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>
      </div>

      <ComparisonModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        products={comparedProducts}
        onRemoveProduct={removeFromCompare}
      />

      <SavedComparisonsDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        mode="save"
      />

      <SavedComparisonsDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        mode="load"
      />

      <ShareComparisonDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </>
  );
};
