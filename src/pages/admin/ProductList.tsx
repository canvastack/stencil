import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { resolveImageUrl } from '@/utils/imageUtils';
import { Badge } from '@/components/ui/badge';
import { BulkDataTable, BulkAction } from '@/components/ui/bulk-data-table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, ArrowUpDown, Filter, X, AlertCircle, Package } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "images",
    header: "Image",
    cell: ({ row }) => {
      const images = row.getValue("images") as string[];
      return (
        <img
          src={resolveImageUrl(images[0])}
          alt={row.getValue("name")}
          className="w-16 h-16 object-cover rounded"
        />
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const slug = (row.original as Product).slug;
      return (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">{slug}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      const currency = (row.original as Product).currency;
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency || 'IDR',
      }).format(price);
    },
  },
  {
    accessorKey: "stockQuantity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const inStock = (row.original as Product).inStock;
      const stockQuantity = row.getValue("stockQuantity") as number;
      return (
        <Badge variant={inStock ? 'default' : 'secondary'}>
          {inStock ? `${stockQuantity || 0} in stock` : 'Out of stock'}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === 'published' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      );
    },
  },
];

export default function ProductList() {
  const {
    products,
    pagination,
    isLoading,
    isSaving,
    error,
    fetchProducts,
    deleteProduct,
  } = useProducts();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
  });

  useEffect(() => {
    fetchProducts({
      page: pagination.page,
      per_page: pagination.per_page,
      search: filters.search || undefined,
      status: filters.status || undefined,
      category: filters.category || undefined,
    });
  }, []);

  const handleApplyFilters = () => {
    fetchProducts({
      page: 1,
      per_page: pagination.per_page,
      search: filters.search || undefined,
      status: filters.status || undefined,
      category: filters.category || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
    });
    fetchProducts({
      page: 1,
      per_page: pagination.per_page,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProductToDelete(productId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      await fetchProducts({
        page: pagination.page,
        per_page: pagination.per_page,
      });
    }
  };

  const handleBulkDelete = async (selectedProducts: Product[]) => {
    if (selectedProducts.length === 0) return;
    
    const confirmBulk = window.confirm(
      `Are you sure you want to delete ${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''}?`
    );
    
    if (!confirmBulk) return;

    try {
      setIsSaving(true);
      for (const product of selectedProducts) {
        await deleteProduct(product.id);
      }
      await fetchProducts({
        page: pagination.page,
        per_page: pagination.per_page,
      });
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkStatusUpdate = async (selectedProducts: Product[], status: string) => {
    if (selectedProducts.length === 0) return;
    
    try {
      setIsSaving(true);
      // Mock bulk status update - replace with real API
      console.log(`Updating ${selectedProducts.length} products to status: ${status}`);
      await fetchProducts({
        page: pagination.page,
        per_page: pagination.per_page,
      });
    } catch (error) {
      console.error('Bulk status update failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Publish Selected',
      action: (products: Product[]) => handleBulkStatusUpdate(products, 'published'),
      icon: Plus,
    },
    {
      label: 'Archive Selected',
      action: (products: Product[]) => handleBulkStatusUpdate(products, 'archived'),
    },
    {
      label: 'Delete Selected',
      action: handleBulkDelete,
      variant: 'destructive',
      icon: Trash2,
    },
  ];

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      fetchProducts({
        page: pagination.page - 1,
        per_page: pagination.per_page,
        search: filters.search || undefined,
        status: filters.status || undefined,
        category: filters.category || undefined,
      });
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.last_page) {
      fetchProducts({
        page: pagination.page + 1,
        per_page: pagination.per_page,
        search: filters.search || undefined,
        status: filters.status || undefined,
        category: filters.category || undefined,
      });
    }
  };

  const actionColumns: ColumnDef<Product>[] = [
    ...columns,
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const product = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/products/${product.slug}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/products/${product.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/products/${product.id}`}>
                  <Package className="mr-2 h-4 w-4" />
                  Manage Variants
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteProduct(product.id)}
                disabled={isSaving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Link to="/admin/products/new">
          <Button disabled={isLoading || isSaving}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error loading products</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProducts({
                page: pagination.page,
                per_page: pagination.per_page,
                search: filters.search || undefined,
                status: filters.status || undefined,
                category: filters.category || undefined,
              })}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              disabled={isLoading}
              className="flex-1"
            />
            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === 'all' ? '' : value }))}>
              <SelectTrigger disabled={isLoading} className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              disabled={isLoading}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            <Button
              onClick={handleApplyFilters}
              disabled={isLoading}
            >
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>

          {showFilters && (
            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Filter by category"
                  value={filters.category}
                  onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        {isLoading && products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
            <BulkDataTable
              columns={actionColumns}
              data={products}
              searchKey="name"
              searchPlaceholder="Search products..."
              bulkActions={bulkActions}
              enableBulkSelect={true}
            />

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.per_page + 1} to{' '}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={pagination.page === 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium px-3">
                  Page {pagination.page} of {pagination.last_page}
                </div>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={pagination.page === pagination.last_page || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this product? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isSaving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSaving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
