import React from 'react';
import { useResponsive, touchTargets } from '@/hooks/useResponsive';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/ui/product-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, Trash2, MoreHorizontal, Star, Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatters';
import { darkModeClasses } from '@/lib/utils/darkMode';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { Product } from '@/types/product';
import type { ColumnDef } from '@tanstack/react-table';

interface ResponsiveProductListProps {
  products: Product[];
  columns: ColumnDef<Product>[];
  isLoading?: boolean;
  onQuickView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const ResponsiveProductList: React.FC<ResponsiveProductListProps> = ({
  products,
  columns,
  isLoading = false,
  onQuickView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  const { showMobileLayout } = useResponsive();

  if (showMobileLayout) {
    return (
      <div className="space-y-4" role="list" aria-label="Product list">
        {products.map((product, index) => (
          <ProductCard
            key={product.uuid}
            product={product}
            onQuickView={onQuickView}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            index={index}
          />
        ))}
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={products}
      searchKey="name"
      searchPlaceholder="Search products..."
      loading={isLoading}
      datasetId="product-catalog-desktop"
    />
  );
};

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  index,
}) => {
  return (
    <Card
      className={cn(
        'touch-manipulation transition-all duration-200',
        darkModeClasses.card.default,
        darkModeClasses.card.hover
      )}
      role="listitem"
      aria-posinset={index + 1}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-shrink-0">
            <ProductImage
              src={product.images?.[0] || product.image_url}
              alt={`${product.name} - ${product.category?.name || 'No category'}`}
              className={cn(
                'w-24 h-24 rounded-lg object-cover',
                darkModeClasses.bg.elevated
              )}
              role="img"
            />
            {product.featured && (
              <div className="absolute -top-1 -right-1">
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-1.5 py-0.5"
                  aria-label="Featured product"
                >
                  <Star className="w-3 h-3" aria-hidden="true" />
                </Badge>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3
                className={cn(
                  'font-semibold text-base truncate',
                  darkModeClasses.text.primary
                )}
              >
                <Link
                  to={`/admin/products/${product.uuid}`}
                  className="hover:text-primary transition-colors"
                  aria-label={`View details for ${product.name}`}
                >
                  {product.name}
                </Link>
              </h3>
              <p className={cn('text-sm', darkModeClasses.text.secondary)}>
                {product.sku || 'No SKU'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'font-bold text-lg',
                  'text-green-600 dark:text-green-400'
                )}
                aria-label={`Price: ${formatPrice(product.price, product.currency)}`}
              >
                {formatPrice(product.price, product.currency)}
              </span>
              <Badge
                variant={product.stock_quantity > 10 ? 'default' : 'secondary'}
                className="text-xs"
                aria-label={`Stock: ${product.stock_quantity} units`}
              >
                <Package className="w-3 h-3 mr-1" aria-hidden="true" />
                {product.stock_quantity} in stock
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={product.status === 'published' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {product.status}
              </Badge>
              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category.name}
                </Badge>
              )}
            </div>

            <div className={cn('flex gap-2', touchTargets.spacing)}>
              <Button
                size="sm"
                variant="outline"
                className={cn('flex-1', touchTargets.minSize)}
                onClick={() => onQuickView?.(product)}
                aria-label={`Quick view ${product.name}`}
              >
                <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                View
              </Button>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className={cn('flex-1', touchTargets.minSize)}
                  onClick={() => onEdit?.(product)}
                  aria-label={`Edit ${product.name}`}
                >
                  <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                  Edit
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={touchTargets.minSize}
                    aria-label={`More actions for ${product.name}`}
                    aria-haspopup="menu"
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" role="menu">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild role="menuitem">
                    <Link to={`/admin/products/${product.uuid}`}>
                      <Package className="h-4 w-4 mr-2" aria-hidden="true" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem asChild role="menuitem">
                      <Link to={`/admin/products/${product.uuid}/edit`}>
                        <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                        Edit Product
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete?.(product.uuid)}
                      className={cn(
                        darkModeClasses.status.error.text,
                        'focus:bg-red-50 dark:focus:bg-red-950'
                      )}
                      role="menuitem"
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
