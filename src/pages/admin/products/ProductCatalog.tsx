import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { useProductsQuery, useDeleteProductMutation, useBulkDeleteProductsMutation, type BulkDeleteProgress } from '@/hooks/useProductsQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Product, ProductFilters } from '@/types/product';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ProductImage } from '@/components/ui/product-image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { KeyboardShortcutsDialog } from '@/components/admin/KeyboardShortcutsDialog';
import { Kbd } from '@/components/ui/kbd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Package,
  Star,
  ShoppingCart,
  Download,
  Upload,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
  X,
  GitCompare,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { ProductComparisonProvider, useProductComparison } from '@/contexts/ProductComparisonContext';
import { ComparisonBar } from '@/components/products/ComparisonBar';
import { ProductExportService, type ExportFormat } from '@/services/export/productExportService';
import { ProductImportService, type ImportResult } from '@/services/import/productImportService';
import { FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

export default function ProductCatalog() {
  const { userType, tenant } = useGlobalContext();
  const { isAuthenticated } = useTenantAuth();
  const { canAccess } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/tenant/login" replace />;
  }

  if (userType !== 'tenant') {
    return <Navigate to="/tenant/login" replace />;
  }

  if (!tenant?.uuid) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Tenant Context Not Available</CardTitle>
            <CardDescription>
              Unable to load tenant information. Please contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // TEMPORARY: Development bypass for permissions
  const bypassPermissions = import.meta.env.VITE_BYPASS_PERMISSIONS === 'true';

  if (!canAccess('products.view') && !bypassPermissions) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              You do not have permission to view product catalog.
              {import.meta.env.DEV && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <p className="font-semibold text-yellow-800">Development Info:</p>
                  <p className="mt-1 text-yellow-700">Permissions: {JSON.stringify(permissions)}</p>
                  <p className="text-yellow-700">Roles: {JSON.stringify(roles)}</p>
                  <p className="mt-2 text-yellow-600">Set VITE_BYPASS_PERMISSIONS=true in .env to bypass</p>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProductComparisonProvider>
      <ProductCatalogContent />
    </ProductComparisonProvider>
  );
}

// Enhanced Card component - defined OUTSIDE to prevent recreation
const EnhancedCard = React.memo(({ 
  children, 
  className = "",
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string;
  [key: string]: any;
}) => (
  <Card 
    className={`relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
    {...props}
  >
    {/* Shine effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
    {children}
  </Card>
));
EnhancedCard.displayName = 'EnhancedCard';

function ProductCatalogContent() {
  const { canAccess } = usePermissions();
  const { addToCompare, comparedProducts, clearComparison } = useProductComparison();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    per_page: APP_CONFIG.PRODUCT_CATALOG_PAGE_SIZE,
    search: '',
    category: '',
    status: '',
    featured: undefined,
    inStock: undefined,
  });
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<BulkDeleteProgress | null>(null);
  
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchQuery, APP_CONFIG.SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (searchQuery !== debouncedSearch) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, debouncedSearch]);

  const debouncedFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch,
  }), [filters, debouncedSearch]);

  const { data, isLoading, error } = useProductsQuery(debouncedFilters);
  const deleteProductMutation = useDeleteProductMutation();
  
  const bulkDeleteMutation = useBulkDeleteProductsMutation((progress) => {
    setBulkProgress(progress);
  });

  const products = data?.data || [];
  const pagination = {
    page: data?.current_page || 1,
    per_page: data?.per_page || APP_CONFIG.PRODUCT_CATALOG_PAGE_SIZE,
    total: data?.total || 0,
    last_page: data?.last_page || 1,
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setFilters(prev => ({ 
      ...prev, 
      page: 1
    }));
  }, []);

  const handleFilterChange = useCallback((key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1 // Reset to first page on filter change
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleQuickView = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  }, []);

  const handleDeleteProduct = useCallback((productId: string) => {
    if (!canAccess('products.delete')) {
      toast.error('You do not have permission to delete products');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProductMutation.mutate(productId);
    }
  }, [deleteProductMutation, canAccess]);

  const formatPrice = useCallback((price: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
    }).format(price);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      per_page: APP_CONFIG.PRODUCT_CATALOG_PAGE_SIZE,
      search: '',
      category: '',
      status: '',
      featured: undefined,
      inStock: undefined,
    });
    setSearchQuery('');
  }, []);

  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      
      if (products.length === 0) {
        toast.warning('No products to export');
        return;
      }
      
      ProductExportService.export(products, { format });
      
      toast.success(`Successfully exported ${products.length} products as ${format.toUpperCase()}`);
      setShowExportDialog(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export products';
      toast.error(message);
      console.error('Product export failed', error);
    } finally {
      setIsExporting(false);
    }
  }, [products]);

  const handleImportClick = useCallback(() => {
    if (!canAccess('products.create')) {
      toast.error('You do not have permission to import products');
      return;
    }
    setShowImportDialog(true);
  }, [canAccess]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Invalid file format. Please upload CSV, Excel, or JSON file.');
      return;
    }
    
    setImportFile(file);
    
    try {
      setIsImporting(true);
      
      const result = await ProductImportService.parseFile(file);
      setImportResult(result);
      
      if (result.failed > 0) {
        toast.warning(`Parsed ${result.success} valid rows, ${result.failed} rows have errors`);
      } else {
        toast.success(`Successfully validated ${result.success} products`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      toast.error(message);
      console.error('Import parse failed', error);
      
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!importResult || importResult.data.length === 0) {
      toast.error('No valid data to import');
      return;
    }

    try {
      setIsImporting(true);
      
      toast.info(`This will import ${importResult.data.length} products. Backend integration coming soon.`);
      
      setShowImportDialog(false);
      setImportFile(null);
      setImportResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import products';
      toast.error(message);
      console.error('Product import failed', error);
    } finally {
      setIsImporting(false);
    }
  }, [importResult]);

  const handleDownloadTemplate = useCallback(() => {
    ProductImportService.generateTemplate();
    toast.success('Import template downloaded');
  }, []);

  const handleCancelImport = useCallback(() => {
    setShowImportDialog(false);
    setImportFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search || 
      filters.category || 
      filters.status || 
      filters.featured !== undefined ||
      filters.inStock !== undefined
    );
  }, [filters]);

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      description: 'Focus search',
      callback: () => {
        searchInputRef.current?.focus();
      },
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'New product',
      callback: () => {
        if (canAccess('products.create')) {
          navigate('/admin/products/new');
        } else {
          toast.error('You do not have permission to create products');
        }
      },
    },
    {
      key: 'f',
      ctrlKey: true,
      description: 'Toggle filters',
      callback: () => {
        setShowFilters(prev => !prev);
      },
    },
    {
      key: 'r',
      ctrlKey: true,
      description: 'Refresh products',
      callback: () => {
        window.location.reload();
      },
    },
    {
      key: 'c',
      ctrlKey: true,
      shiftKey: true,
      description: 'Clear filters',
      callback: () => {
        handleClearFilters();
        toast.success('Filters cleared');
      },
    },
    {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      description: 'Toggle selection mode',
      callback: () => {
        if (selectedProducts.size > 0) {
          setSelectedProducts(new Set());
          toast.info('Selection cleared');
        } else {
          handleSelectAll();
          toast.info('All products selected');
        }
      },
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      callback: () => {
        setShowKeyboardHelp(true);
      },
      preventDefault: true,
    },
  ], true);

  const handleToggleSelection = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.uuid)));
    }
  }, [selectedProducts.size, products]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    if (!canAccess('products.delete')) {
      toast.error('You do not have permission to delete products');
      return;
    }

    if (!window.confirm(`Delete ${selectedProducts.size} products? This action cannot be undone.`)) {
      return;
    }

    setBulkProgress({
      total: selectedProducts.size,
      completed: 0,
      failed: 0,
      failedIds: [],
    });

    try {
      await bulkDeleteMutation.mutateAsync(Array.from(selectedProducts));
      setSelectedProducts(new Set());
    } finally {
      setTimeout(() => {
        setBulkProgress(null);
      }, 2000);
    }
  }, [selectedProducts, canAccess, bulkDeleteMutation]);

  const handleBulkCompare = useCallback(() => {
    if (selectedProducts.size === 0) {
      toast.error('Tidak ada produk yang dipilih');
      return;
    }

    if (selectedProducts.size < 2) {
      toast.error('Pilih minimal 2 produk untuk perbandingan');
      return;
    }

    if (selectedProducts.size > 4) {
      toast.error('Maksimal 4 produk dapat dibandingkan');
      return;
    }

    clearComparison();

    const selectedProductObjects = products.filter(p => selectedProducts.has(p.uuid));
    selectedProductObjects.forEach(product => addToCompare(product));

    setSelectedProducts(new Set());

    navigate('/admin/products/compare');
  }, [selectedProducts, products, addToCompare, clearComparison, navigate]);

  // Calculate stats - MEMOIZED to prevent re-calculation on every render
  const stats = useMemo(() => {
    const productsData = products || [];
    return {
      productsData,
      totalProducts: pagination?.total || 0,
      featuredProducts: productsData.filter((p) => p.featured).length,
      activeProducts: productsData.filter((p) => p.status === 'active').length,
      totalValue: productsData.reduce((sum, p) => sum + (p.price || 0), 0),
    };
  }, [products, pagination?.total]);

  // Memoize columns to prevent recreation on every render
  const columns: ColumnDef<Product>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={selectedProducts.size === products.length && products.length > 0}
          onCheckedChange={handleSelectAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedProducts.has(row.original.uuid)}
          onCheckedChange={() => handleToggleSelection(row.original.uuid)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-3">
            <ProductImage
              src={product.images?.[0] || product.image_url}
              alt={product.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const product = row.original;
        return <Badge variant="outline">{product.category?.name || 'Uncategorized'}</Badge>;
      },
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const formatted = formatPrice(product.price, product.currency);
        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: 'stock_quantity',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-2">
            <span>{product.stock_quantity}</span>
            {product.stock_quantity <= 10 && (
              <Badge variant="destructive" className="text-xs">
                Low Stock
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Badge
            variant={
              product.status === 'published'
                ? 'default'
                : product.status === 'draft'
                ? 'secondary'
                : 'destructive'
            }
          >
            {product.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'featured',
      header: 'Featured',
      cell: ({ row }) => {
        const product = row.original;
        return product.featured ? (
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
        ) : null;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleQuickView(product)}>
                <Eye className="mr-2 h-4 w-4" />
                Quick View
              </DropdownMenuItem>
              {canAccess('products.edit') && (
                <DropdownMenuItem>
                  <Link to={`/admin/products/${product.uuid}/edit`} className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Product
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canAccess('products.delete') && (
                <DropdownMenuItem 
                  onClick={() => handleDeleteProduct(product.uuid)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [canAccess, formatPrice, handleQuickView, handleDeleteProduct, selectedProducts, products.length, handleSelectAll, handleToggleSelection]);

  const renderContent = useCallback(() => {
    if (!isLoading && error) {
      return (
        <EmptyState
          icon={AlertCircle}
          title="Failed to load products"
          description={typeof error === 'string' ? error : error?.message || 'An error occurred while loading products'}
          action={{
            label: 'Try Again',
            onClick: () => window.location.reload(),
            icon: RefreshCw,
          }}
        />
      );
    }

    if (!isLoading && !hasActiveFilters && products.length === 0) {
      return (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Get started by adding your first product to the catalog"
          action={canAccess('products.create') ? {
            label: 'Add First Product',
            onClick: () => navigate('/admin/products/new'),
            icon: Plus,
          } : undefined}
        />
      );
    }

    if (!isLoading && filters.search && products.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title="No products found"
          description={`No products match your search "${filters.search}". Try different keywords or clear filters.`}
          action={{
            label: 'Clear Search',
            onClick: handleClearFilters,
            icon: X,
          }}
        />
      );
    }

    if (!isLoading && hasActiveFilters && products.length === 0) {
      return (
        <EmptyState
          icon={Filter}
          title="No products match filters"
          description="Try adjusting your filters or search criteria to see more results."
          action={{
            label: 'Clear All Filters',
            onClick: handleClearFilters,
            icon: X,
          }}
        />
      );
    }

    return (
      <Card className="p-6" role="region" aria-label="Product catalog table">
        <DataTable
          columns={columns}
          data={stats.productsData}
          searchKey="name"
          searchPlaceholder="Search products..."
          loading={isLoading}
          datasetId="product-catalog"
        />
      </Card>
    );
  }, [isLoading, error, hasActiveFilters, products.length, filters.search, canAccess, navigate, handleClearFilters, columns, stats.productsData]);

  // Product Grid Card Component
  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <div className="relative">
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
          <ProductImage
            src={product.images}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleQuickView(product)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Quick View
                </DropdownMenuItem>
                {canAccess('products.edit') && (
                  <DropdownMenuItem asChild>
                    <Link to={`/admin/products/${product.uuid}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to={`/admin/products/${product.uuid}`}>
                    <Package className="mr-2 h-4 w-4" />
                    Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canAccess('products.delete') && (
                  <DropdownMenuItem
                    onClick={() => handleDeleteProduct(product.uuid)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-lg line-clamp-2 hover:text-blue-600 transition-colors">
                <Link to={`/admin/products/${product.uuid}`}>
                  {product.name}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(product.price, product.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Min. order: {product.minOrder} {product.priceUnit}
                </p>
              </div>
              
              <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
            </div>
            
            {product.inStock && product.stockQuantity !== undefined && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="w-3 h-3" />
                <span>Stock: {product.stockQuantity}</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );

  // Product List Row Component  
  const ProductRow = ({ product }: { product: Product }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
            {product.images.length > 0 ? (
              <img
                src={resolveImageUrl(product.images[0])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold hover:text-blue-600 transition-colors">
                    <Link to={`/admin/products/${product.uuid}`}>
                      {product.name}
                    </Link>
                  </h3>
                  {product.featured && (
                    <Star className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  {product.description}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(product.price, product.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Min. {product.minOrder} {product.priceUnit}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4">
                <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
                
                {product.inStock ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    In Stock ({product.stockQuantity || 0})
                  </Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleQuickView(product)}>
                  <Eye className="w-4 h-4" />
                </Button>
                {canAccess('products.edit') && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/products/${product.uuid}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
                {canAccess('products.delete') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProduct(product.uuid)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <LazyWrapper>
      <KeyboardShortcutsDialog 
        open={showKeyboardHelp} 
        onOpenChange={setShowKeyboardHelp}
      />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your product inventory and catalog</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Stacked Cards */}
          <div className="space-y-3">
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  )}
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Featured</p>
                  {isLoading ? (
                    <div className="h-8 w-12 bg-muted animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold">{stats.featuredProducts}</p>
                  )}
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Active</p>
                  {isLoading ? (
                    <div className="h-8 w-12 bg-muted animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold">{stats.activeProducts}</p>
                  )}
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Middle Column - Total Value */}
          <EnhancedCard className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="p-4 bg-blue-500/10 rounded-lg inline-block mb-4">
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Total Value</p>
              {isLoading ? (
                <div className="h-9 w-40 bg-muted animate-pulse rounded mx-auto"></div>
              ) : (
                <p className="text-3xl font-bold text-blue-600">
                  {formatPrice(stats.totalValue, 'IDR')}
                </p>
              )}
            </div>
          </EnhancedCard>

          {/* Right Column - Quick Actions */}
          <EnhancedCard className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-4">
              <div className="p-4 bg-purple-500/10 rounded-lg inline-block mb-4">
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <div className="space-y-2">
                {canAccess('products.create') && (
                  <Button asChild className="w-full">
                    <Link to="/admin/products/new" className="flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                      <span className="ml-auto text-xs opacity-60">
                        <Kbd>Ctrl</Kbd>+<Kbd>N</Kbd>
                      </span>
                    </Link>
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setShowExportDialog(true)}
                    disabled={isLoading || products.length === 0}
                    aria-label="Export products to file"
                    aria-disabled={isLoading || products.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1" aria-hidden="true" />
                    Export
                  </Button>
                  {canAccess('products.create') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={handleImportClick}
                      disabled={isLoading}
                      aria-label="Import products from file"
                      aria-disabled={isLoading}
                    >
                      <Upload className="w-4 h-4 mr-1" aria-hidden="true" />
                      Import
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {/* Filters */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                aria-controls="product-filters-panel"
                aria-label={showFilters ? 'Hide product filters' : 'Show product filters'}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                <span className="ml-2 text-xs opacity-60" aria-hidden="true">
                  <Kbd>Ctrl</Kbd>+<Kbd>F</Kbd>
                </span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKeyboardHelp(true)}
              className="text-muted-foreground"
            >
              <Kbd>?</Kbd>
              <span className="ml-2">Shortcuts</span>
            </Button>
          </div>

          {showFilters && (
            <div id="product-filters-panel" className="space-y-4 border-t pt-4" role="region" aria-label="Product filters">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="mb-2 flex items-center justify-between">
                    <span>Search</span>
                    <span className="text-xs opacity-60 font-normal">
                      <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      ref={searchInputRef}
                      placeholder="Product name, description, SKU..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pr-10"
                      aria-label="Search products by name, description, or SKU"
                      aria-describedby={isSearching ? "search-status" : undefined}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                        <span id="search-status" className="sr-only" aria-live="polite">Searching for products...</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="category-filter" className="mb-2 block">Category</Label>
                  <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger id="category-filter" aria-label="Filter products by category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="etching">Etching</SelectItem>
                      <SelectItem value="engraving">Engraving</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="award">Awards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter" className="mb-2 block">Status</Label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger id="status-filter" aria-label="Filter products by status">
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Filters auto-applied
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    disabled={isLoading}
                    size="icon"
                    aria-label="Clear all filters"
                    title="Clear all filters"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>



        {/* Bulk Actions Bar */}
        {selectedProducts.size > 0 && !isLoading && !error && products.length > 0 && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedProducts.size === products.length}
                  onCheckedChange={handleSelectAll}
                  aria-label={`Select all ${products.length} products`}
                  aria-describedby="bulk-selection-status"
                />
                <span id="bulk-selection-status" className="font-medium" aria-live="polite">
                  {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProducts(new Set())}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkCompare}
                  disabled={selectedProducts.size < 2 || selectedProducts.size > 4}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Selected
                </Button>
                {canAccess('products.delete') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Products Data Table with Empty States */}
        {renderContent()}

      {/* Quick View Dialog */}
      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="max-w-4xl" aria-describedby="quick-view-description">
          <DialogHeader>
            <DialogTitle>Product Quick View</DialogTitle>
            <DialogDescription id="quick-view-description">
              Preview product details and specifications
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <ProductImage
                    src={selectedProduct.images}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-muted-foreground">{selectedProduct.category?.name || 'Uncategorized'}</p>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(selectedProduct.price, selectedProduct.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Minimum order: {selectedProduct.minOrder} {selectedProduct.priceUnit}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProduct.description}
                  </p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={selectedProduct.status === 'published' ? 'default' : 'secondary'}>
                    {selectedProduct.status}
                  </Badge>
                  {selectedProduct.featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {selectedProduct.inStock ? (
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
            <Button variant="outline" onClick={() => setIsQuickViewOpen(false)}>
              Close
            </Button>
            {selectedProduct && (
              <>
                <Button variant="outline" asChild>
                  <Link to={`/admin/products/${selectedProduct.uuid}`}>
                    <Package className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </Button>
                <Button asChild>
                  <Link to={`/admin/products/${selectedProduct.uuid}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Product
                  </Link>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Products</DialogTitle>
            <DialogDescription>
              Choose a format to export {pagination?.total || products.length} products
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('xlsx')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <div className="flex-1 text-left">
                <div className="font-medium">Excel (.xlsx)</div>
                <div className="text-xs text-muted-foreground">Excel spreadsheet with formatting</div>
              </div>
              <Badge variant="secondary" className="ml-2">Recommended</Badge>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              <div className="flex-1 text-left">
                <div className="font-medium">CSV (.csv)</div>
                <div className="text-xs text-muted-foreground">Universal format for spreadsheet apps</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              <div className="flex-1 text-left">
                <div className="font-medium">PDF (.pdf)</div>
                <div className="text-xs text-muted-foreground">Printable document format</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('json')}
              disabled={isExporting}
            >
              <FileJson className="w-4 h-4 mr-2" />
              <div className="flex-1 text-left">
                <div className="font-medium">JSON (.json)</div>
                <div className="text-xs text-muted-foreground">Developer-friendly format for APIs</div>
              </div>
            </Button>
          </div>
          
          {isExporting && (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Exporting products...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={handleCancelImport}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Upload a CSV, Excel, or JSON file to bulk import products
            </DialogDescription>
          </DialogHeader>
          
          {!importResult ? (
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="import-file-input"
                  disabled={isImporting}
                />
                <label
                  htmlFor="import-file-input"
                  className={`cursor-pointer block ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      {isImporting ? 'Processing file...' : 'Click to upload file'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supported formats: CSV, Excel (.xlsx, .xls), JSON
                    </p>
                  </div>
                  {isImporting && (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mt-3" />
                  )}
                </label>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={isImporting}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download Import Template
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-2">Import Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Required columns: Name, Slug, Description, Category, Price</li>
                      <li>Product slugs must be unique and URL-friendly (lowercase, numbers, hyphens)</li>
                      <li>Prices must be positive numbers</li>
                      <li>Status: draft, published, or archived (optional, default: draft)</li>
                      <li>Featured: Yes/No (optional, default: No)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {importFile && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{importFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{importResult.success}</p>
                    <p className="text-sm text-muted-foreground">Valid Products</p>
                  </div>
                </Card>
                <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-sm text-muted-foreground">Invalid Rows</p>
                  </div>
                </Card>
              </div>

              {importResult.errors.length > 0 && (
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Validation Errors
                      </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {importResult.errors.slice(0, 10).map((error, idx) => (
                        <div key={idx} className="text-xs bg-white dark:bg-gray-900 p-2 rounded">
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            Row {error.row}:
                          </p>
                          <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 mt-1">
                            {error.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center">
                          And {importResult.errors.length - 10} more errors...
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {importResult.success > 0 && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ {importResult.success} products are ready to be imported
                    {importResult.failed > 0 && `. ${importResult.failed} rows will be skipped due to errors.`}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelImport}
              disabled={isImporting}
            >
              Cancel
            </Button>
            {importResult && importResult.success > 0 && (
              <Button
                onClick={handleImportConfirm}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {importResult.success} Products
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Progress Indicator */}
      {bulkProgress && bulkProgress.total > 0 && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-6 shadow-2xl rounded-lg border-2 border-blue-500 z-50 min-w-[350px] max-w-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Deleting Products</h4>
              <span className="text-sm text-muted-foreground font-medium">
                {bulkProgress.completed + bulkProgress.failed}/{bulkProgress.total}
              </span>
            </div>
            
            <Progress 
              value={((bulkProgress.completed + bulkProgress.failed) / bulkProgress.total) * 100} 
              className="h-3"
              indicatorClassName={bulkProgress.failed > 0 ? "bg-orange-500" : "bg-blue-600"}
            />
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-green-600">
                  ✓ {bulkProgress.completed} succeeded
                </span>
                {bulkProgress.failed > 0 && (
                  <span className="text-red-600">
                    ✗ {bulkProgress.failed} failed
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {bulkProgress.completed + bulkProgress.failed < bulkProgress.total 
                ? 'Please wait, do not close this page...' 
                : 'Operation completed'}
            </p>
          </div>
        </div>
      )}
      </div>

      <ComparisonBar />
    </LazyWrapper>
  );
}