import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import {
  ProductNameCell,
  ProductCategoryCell,
  ProductPriceCell,
  ProductStockCell,
  ProductStatusCell,
  ProductFeaturedCell,
  ProductActionsCell,
  SortableHeader,
} from '@/components/admin/products/ProductTableCells';
import type { Product } from '@/types/product';
import type { ColumnConfig } from '@/components/admin/ColumnCustomization';

export interface ProductTableColumnsConfig {
  canAccessEdit: boolean;
  canAccessDelete: boolean;
  canAccessCreate: boolean;
  onQuickView: (product: Product) => void;
  onDuplicate: (productId: string) => Promise<void>;
  onDelete: (productId: string) => Promise<void>;
  isSelectMode: boolean;
  isComparisonMode: boolean;
  selectedProducts: Set<string>;
  products: Product[];
  onSelectAll: () => void;
  onToggleSelection: (productId: string) => void;
  columnConfigs: ColumnConfig[];
}

export function getProductTableColumns(config: ProductTableColumnsConfig): ColumnDef<Product>[] {
  const {
    canAccessEdit,
    canAccessDelete,
    canAccessCreate,
    onQuickView,
    onDuplicate,
    onDelete,
    isSelectMode,
    isComparisonMode,
    selectedProducts,
    products,
    onSelectAll,
    onToggleSelection,
    columnConfigs,
  } = config;

  const baseColumns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader label="Product" column={column} />,
      cell: ({ row }) => <ProductNameCell product={row.original} canEdit={canAccessEdit} />,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <ProductCategoryCell categoryName={row.original.category?.name} />
      ),
    },
    {
      accessorKey: 'price',
      header: ({ column }) => <SortableHeader label="Price" column={column} />,
      cell: ({ row }) => (
        <ProductPriceCell
          price={row.original.price}
          currency={row.original.currency}
        />
      ),
    },
    {
      accessorKey: 'stock_quantity',
      header: ({ column }) => <SortableHeader label="Stock" column={column} />,
      cell: ({ row }) => (
        <ProductStockCell stockQuantity={row.original.stock_quantity} />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <ProductStatusCell status={row.original.status} />,
    },
    {
      accessorKey: 'featured',
      header: 'Featured',
      cell: ({ row }) => <ProductFeaturedCell featured={row.original.featured} />,
    },
    {
      accessorKey: 'business_type',
      header: 'Business Type',
      cell: ({ row }) => {
        const product = row.original as any;
        return product.type_display || product.business_type ? (
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {product.type_display || product.business_type}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: 'production_type',
      header: 'Production',
      cell: ({ row }) => {
        const product = row.original as any;
        const variant = product.production_type === 'internal' ? 'default' : 
                       product.production_type === 'vendor' ? 'secondary' : 
                       'outline';
        return product.production_type ? (
          <Badge variant={variant} className="text-xs whitespace-nowrap capitalize">
            {product.production_type}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: 'lead_time',
      header: 'Lead Time',
      cell: ({ row }) => {
        const product = row.original as any;
        return product.lead_time ? (
          <span className="text-sm text-foreground">{product.lead_time}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: 'available_materials',
      header: 'Materials',
      cell: ({ row }) => {
        const product = row.original as any;
        const count = product.available_materials?.length || 0;
        return count > 0 ? (
          <Badge variant="secondary" className="text-xs">
            {count} {count === 1 ? 'material' : 'materials'}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">0</span>
        );
      },
    },
    {
      accessorKey: 'customizable',
      header: 'Custom',
      cell: ({ row }) => {
        const product = row.original as any;
        return product.customizable ? (
          <Check className="w-4 h-4 text-green-500 mx-auto" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground mx-auto" />
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <ProductActionsCell
          product={row.original}
          onQuickView={onQuickView}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          canEdit={canAccessEdit}
          canDelete={canAccessDelete}
          canCreate={canAccessCreate}
        />
      ),
    },
  ];

  if (isSelectMode || isComparisonMode) {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={selectedProducts.size === products.length && products.length > 0}
            onCheckedChange={onSelectAll}
            aria-label={isComparisonMode ? "Select all products for comparison" : "Select all products on current page"}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedProducts.has(row.original.uuid)}
            onCheckedChange={() => onToggleSelection(row.original.uuid)}
            aria-label={`Select product ${row.original.name}${isComparisonMode ? ' for comparison' : ''}`}
            disabled={isComparisonMode && !selectedProducts.has(row.original.uuid) && selectedProducts.size >= 4}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...baseColumns,
    ];
  }

  const visibleColumns = baseColumns.filter(col => {
    const columnConfig = columnConfigs.find(c => c.id === col.id || c.id === col.accessorKey);
    return columnConfig ? columnConfig.visible : true;
  });

  return visibleColumns;
}
