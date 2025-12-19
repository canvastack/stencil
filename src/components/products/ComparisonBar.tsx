import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Trash2 } from 'lucide-react';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';

export const ComparisonBar: React.FC = () => {
  const navigate = useNavigate();
  const { 
    comparedProducts, 
    removeFromCompare, 
    clearComparison,
    maxProducts 
  } = useProductComparison();

  if (comparedProducts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-5xl px-4">
      <Card className="shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-sm font-semibold">
                {comparedProducts.length}/{maxProducts}
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">
                Products to Compare
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {comparedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 min-w-[200px] group hover:bg-secondary transition-colors"
                >
                  {product.images && product.images[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromCompare(product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={clearComparison}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/admin/products/compare')}
              className="gap-2"
              disabled={comparedProducts.length < 2}
            >
              Compare
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
