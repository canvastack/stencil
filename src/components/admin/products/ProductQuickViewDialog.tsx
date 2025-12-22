import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/ui/product-image';
import { Package, Edit, Star } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatters';
import type { Product } from '@/types/product';

export interface ProductQuickViewDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

export function ProductQuickViewDialog({
  open,
  product,
  onClose,
}: ProductQuickViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="max-w-4xl" aria-describedby="quick-view-description">
        <DialogHeader>
          <DialogTitle>Product Quick View</DialogTitle>
          <DialogDescription id="quick-view-description">
            Preview product details and specifications
          </DialogDescription>
        </DialogHeader>
        
        {product && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <ProductImage
                  src={product.images}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{product.name}</h3>
                <p className="text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(product.price, product.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Minimum order: {product.minOrder} {product.priceUnit}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {product.description}
                </p>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
                {product.featured && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {product.inStock ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {product && (
            <>
              <Button variant="outline" asChild>
                <Link to={`/admin/products/${product.uuid}`}>
                  <Package className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </Button>
              <Button asChild>
                <Link to={`/admin/products/${product.uuid}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </Link>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
