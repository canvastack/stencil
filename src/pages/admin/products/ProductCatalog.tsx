import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { useProductsQuery, useDeleteProductMutation, useBulkDeleteProductsMutation, useReorderProductsMutation, useBulkUpdateProductsMutation, useDuplicateProductMutation, type BulkDeleteProgress } from '@/hooks/useProductsQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useProductWebSocket } from '@/hooks/useProductWebSocket';
import type { Product, ProductFilters } from '@/types/product';
import { envConfig } from '@/config/env.config';
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
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { announceToScreenReader } from '@/lib/utils/accessibility';
import { ProductComparisonProvider, useProductComparison } from '@/contexts/ProductComparisonContext';
import { ComparisonBar } from '@/components/products/ComparisonBar';
import { ProductExportService, type ExportFormat } from '@/services/export/productExportService';
import { ProductImportService, type ImportResult } from '@/services/import/productImportService';
import { FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { DraggableProductList } from '@/components/admin/DraggableProductList';
import { AdvancedFiltersPanel } from '@/components/admin/AdvancedFiltersPanel';
import { SavedSearches } from '@/components/admin/SavedSearches';
import { ColumnCustomization, type ColumnConfig } from '@/components/admin/ColumnCustomization';
import { BulkEditDialog } from '@/components/admin/BulkEditDialog';
import { ProductAnalyticsDashboard } from '@/components/admin/ProductAnalyticsDashboard';

export default function ProductCatalog() {
  const { userType, tenant } = useGlobalContext();
  const { isAuthenticated } = useTenantAuth();
  const { canAccess, permissions, roles } = usePermissions();

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
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Error Memuat Katalog Produk</CardTitle>
              </div>
              <CardDescription>
                Terjadi kesalahan yang tidak terduga saat memuat katalog produk.
                Silakan coba muat ulang halaman atau hubungi support jika masalah berlanjut.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Muat Ulang Halaman
              </Button>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline" 
                className="w-full"
              >
                Kembali
              </Button>
            </CardContent>
          </Card>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error('Product Catalog Error:', error, errorInfo);
      }}
    >
      <ProductComparisonProvider>
        <ProductCatalogContent />
      </ProductComparisonProvider>
    </ErrorBoundary>
  );
}

function ProductCatalogContent() {
  const { canAccess } = usePermissions();
  const { addToCompare, comparedProducts, clearComparison } = useProductComparison();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderProducts, setReorderProducts] = useState<Product[]>([]);
  
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([
    { id: 'name', label: 'Product', visible: true, required: true },
    { id: 'category', label: 'Category', visible: true },
    { id: 'price', label: 'Price', visible: true },
    { id: 'stock_quantity', label: 'Stock', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'featured', label: 'Featured', visible: true },
    { id: 'actions', label: 'Actions', visible: true, required: true },
  ]);
  
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

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

  const { data, isLoading, error, refetch } = useProductsQuery(debouncedFilters);
  const deleteProductMutation = useDeleteProductMutation();
  const reorderMutation = useReorderProductsMutation();
  const bulkUpdateMutation = useBulkUpdateProductsMutation();
  const duplicateProductMutation = useDuplicateProductMutation();
  
  const bulkDeleteMutation = useBulkDeleteProductsMutation((progress) => {
    setBulkProgress(progress);
  });

  const { isConnected: wsConnected } = useProductWebSocket({
    enabled: envConfig.features.enableWebSocket,
    showToasts: true,
  });

  const products = data?.data || [];
  const pagination = {
    page: data?.current_page || 1,
    per_page: data?.per_page || APP_CONFIG.PRODUCT_CATALOG_PAGE_SIZE,
    total: data?.total || 0,
    last_page: data?.last_page || 1,
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    toast.success('Product data refreshed');
    announceToScreenReader('Product data refreshed');
  }, [queryClient]);

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

  const handleDuplicateProduct = useCallback((productId: string) => {
    if (!canAccess('products.create')) {
      toast.error('You do not have permission to create products');
      return;
    }
    
    duplicateProductMutation.mutate(productId);
  }, [duplicateProductMutation, canAccess]);

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
      shiftKey: true,
      description: 'Focus search',
      callback: () => {
        searchInputRef.current?.focus();
      },
    },
    {
      key: 'n',
      shiftKey: true,
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
      key: 'r',
      shiftKey: true,
      description: 'Refresh products',
      callback: () => {
        window.location.reload();
      },
    },
    {
      key: 'c',
      shiftKey: true,
      description: 'Clear filters',
      callback: () => {
        handleClearFilters();
        toast.success('Filters cleared');
      },
    },
    {
      key: 's',
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
      key: 'e',
      shiftKey: true,
      description: 'Export products',
      callback: () => {
        if (products.length === 0) {
          toast.error('No products to export');
          return;
        }
        setShowExportDialog(true);
      },
    },
    {
      key: 'i',
      shiftKey: true,
      description: 'Import products',
      callback: () => {
        if (canAccess('products.create')) {
          handleImportClick();
        } else {
          toast.error('You do not have permission to import products');
        }
      },
    },
    {
      key: 'a',
      shiftKey: true,
      description: 'Select all products',
      callback: () => {
        if (products.length === 0) return;
        handleSelectAll();
        announceToScreenReader(`${products.length} products selected`);
      },
    },
    {
      key: 'p',
      shiftKey: true,
      description: 'Compare selected products',
      callback: () => {
        if (selectedProducts.size < 2) {
          toast.error('Select at least 2 products to compare');
          return;
        }
        if (selectedProducts.size > 4) {
          toast.error('You can compare maximum 4 products');
          return;
        }
        handleBulkCompare();
      },
    },
    {
      key: 'd',
      shiftKey: true,
      description: 'Delete selected products',
      callback: () => {
        if (!canAccess('products.delete')) {
          toast.error('You do not have permission to delete products');
          return;
        }
        if (selectedProducts.size === 0) {
          toast.error('No products selected');
          return;
        }
        handleBulkDelete();
      },
    },
    {
      key: 'Escape',
      description: 'Clear selection',
      callback: () => {
        if (selectedProducts.size > 0) {
          setSelectedProducts(new Set());
          toast.info('Selection cleared');
          announceToScreenReader('Selection cleared');
        }
      },
      preventDefault: false,
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

  const handleBulkEdit = useCallback(() => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    if (!canAccess('products.update')) {
      toast.error('You do not have permission to edit products');
      return;
    }

    setShowBulkEditDialog(true);
  }, [selectedProducts, canAccess]);

  const handleBulkEditSave = useCallback(async (productIds: string[], updateData: any) => {
    try {
      await bulkUpdateMutation.mutateAsync({ productIds, updateData });
      setSelectedProducts(new Set());
      setShowBulkEditDialog(false);
      announceToScreenReader(`Successfully updated ${productIds.length} products`);
    } catch (error) {
      console.error('Bulk edit failed', error);
    }
  }, [bulkUpdateMutation]);

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

  const deselectAllProducts = useCallback(() => {
    setSelectedProducts(new Set());
    announceToScreenReader('All products deselected');
  }, []);

  const handleReorder = useCallback(async (reorderedProducts: Product[]) => {
    setReorderProducts(reorderedProducts);
    
    const productIds = reorderedProducts.map(p => p.uuid || p.id);
    
    try {
      await reorderMutation.mutateAsync(productIds);
    } catch (error) {
      setReorderProducts(products);
    }
  }, [reorderMutation, products]);

  const handleToggleReorderMode = useCallback(() => {
    const newReorderMode = !isReorderMode;
    setIsReorderMode(newReorderMode);
    
    if (newReorderMode) {
      setReorderProducts([...products]);
      if (isSelectMode) setIsSelectMode(false);
      if (isComparisonMode) setIsComparisonMode(false);
      deselectAllProducts();
      toast.info('Reorder mode active - Drag products to reorder');
      announceToScreenReader('Reorder mode activated. Drag products to reorder them.');
    } else {
      toast.info('Reorder mode deactivated');
      announceToScreenReader('Reorder mode deactivated');
    }
  }, [isReorderMode, products, isSelectMode, isComparisonMode, deselectAllProducts]);

  // Calculate stats - MEMOIZED to prevent re-calculation on every render
  const stats = useMemo(() => {
    const productsData = products || [];
    return {
      productsData,
      totalProducts: pagination?.total || 0,
      featuredCount: productsData.filter((p) => p.featured).length,
      activeCount: productsData.filter((p) => p.status === 'published').length,
      totalValue: productsData.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0),
    };
  }, [products, pagination?.total]);

  // Memoize columns to prevent recreation on every render
  const toggleProductSelection = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const columns: ColumnDef<Product>[] = useMemo(() => {
    const baseColumns: ColumnDef<Product>[] = [
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
              {canAccess('products.create') && (
                <DropdownMenuItem onClick={() => handleDuplicateProduct(product.uuid)}>
                  <GitCompare className="mr-2 h-4 w-4" />
                  Duplicate Product
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
  ];

  if (isSelectMode || isComparisonMode) {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={selectedProducts.size === products.length && products.length > 0}
            onCheckedChange={handleSelectAll}
            aria-label={isComparisonMode ? "Select all products for comparison" : "Select all products on current page"}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedProducts.has(row.original.uuid)}
            onCheckedChange={() => toggleProductSelection(row.original.uuid)}
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
    const config = columnConfigs.find(c => c.id === col.id || c.id === col.accessorKey);
    return config ? config.visible : true;
  });

  return visibleColumns;
}, [canAccess, formatPrice, handleQuickView, handleDeleteProduct, selectedProducts, products.length, handleSelectAll, isSelectMode, isComparisonMode, toggleProductSelection, columnConfigs]);

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

    if (isReorderMode) {
      return (
        <Card hover={false} className="p-6" role="region" aria-label="Draggable product list for reordering">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Drag products to reorder them. Click <strong>Save Order</strong> when done.
            </p>
          </div>
          <DraggableProductList
            products={reorderProducts}
            onReorder={handleReorder}
            renderProduct={(product) => (
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <ProductImage
                    src={product.images?.[0] || product.image_url}
                    alt={product.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{product.category?.name || 'Uncategorized'}</Badge>
                    <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-semibold">{formatPrice(product.price, product.currency)}</p>
                  <p className="text-sm text-muted-foreground">
                    Stock: {product.stock_quantity || 0}
                  </p>
                </div>
              </div>
            )}
          />
        </Card>
      );
    }

    return (
      <Card hover={false} className="p-6" role="region" aria-label="Product catalog table">
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
  }, [isLoading, error, hasActiveFilters, products.length, filters.search, canAccess, navigate, handleClearFilters, columns, stats.productsData, isReorderMode, reorderProducts, handleReorder, formatPrice]);

  // Product Grid Card Component
  const ProductCard = ({ product }: { product: Product }) => (
    <Card hover={false} className="group transition-all duration-200">
      <div className="relative">
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
          <ProductImage
            src={product.images}
            alt={product.name}
            className="w-full h-full object-cover"
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

        <CardContent className="p-3 md:p-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-base md:text-lg line-clamp-2 hover:text-blue-600 transition-colors">
                <Link to={`/admin/products/${product.uuid}`}>
                  {product.name}
                </Link>
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
            </div>
            
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-base md:text-lg font-bold text-green-600">
                  {formatPrice(product.price, product.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Min. {product.minOrder} {product.priceUnit}
                </p>
              </div>
              
              <Badge variant={product.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                {product.status}
              </Badge>
            </div>
            
            {product.inStock && (
              <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
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
    <Card hover={false}>
      <CardContent className="p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
              {product.images.length > 0 ? (
                <img
                  src={resolveImageUrl(product.images[0])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm md:text-base hover:text-blue-600 transition-colors truncate">
                  <Link to={`/admin/products/${product.uuid}`}>
                    {product.name}
                  </Link>
                </h3>
                {product.featured && (
                  <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground truncate">{product.category?.name || 'Uncategorized'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between md:flex-1 gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <p className="text-base md:text-lg font-bold text-green-600">
                  {formatPrice(product.price, product.currency)}
                </p>
                <Badge variant={product.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                  {product.status}
                </Badge>
              </div>
              
              {product.inStock ? (
                <Badge variant="outline" className="text-green-600 border-green-600 text-xs hidden md:inline-flex">
                  In Stock ({product.stockQuantity})
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs hidden md:inline-flex">Out of Stock</Badge>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <Button variant="outline" size="sm" onClick={() => handleQuickView(product)}>
                <Eye className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
              {canAccess('products.edit') && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/products/${product.uuid}/edit`}>
                    <Edit className="w-3 h-3 md:w-4 md:h-4" />
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
                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              )}
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
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Product Catalog</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage your product inventory and catalog</p>
          </div>
          {canAccess('products.create') && (
            <Button 
              size="sm"
              onClick={() => navigate('/admin/products/new')}
              aria-label="Add new product"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Add Product</span>
            </Button>
          )}
        </div>

        {/* Sticky Toolbar */}
        <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh} 
              disabled={isLoading}
              aria-label="Refresh product list"
              aria-busy={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4 md:mr-2", isLoading && "animate-spin")} />
              <span className="hidden md:inline">Refresh</span>
            </Button>
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              title={wsConnected ? "Real-time sync active" : "Real-time sync disconnected"}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                wsConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              )} />
              <span className="hidden md:inline text-xs text-gray-600 dark:text-gray-400">
                {wsConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <Button 
              variant={showAnalytics ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              aria-label={showAnalytics ? "Hide analytics" : "Show analytics"}
            >
              <BarChart3 className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{showAnalytics ? 'Hide Analytics' : 'Analytics'}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={isLoading || products.length === 0}
                  aria-label="Export product data"
                >
                  <Download className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setExportFormat('csv'); setShowExportDialog(true); }}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setExportFormat('excel'); setShowExportDialog(true); }}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setExportFormat('json'); setShowExportDialog(true); }}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canAccess('products.create') && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                disabled={isLoading}
                aria-label="Import products from file"
              >
                <Upload className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Import</span>
              </Button>
            )}
            <ColumnCustomization
              columns={columnConfigs}
              onColumnsChange={setColumnConfigs}
            />
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isComparisonMode) {
                  setIsComparisonMode(false);
                  deselectAllProducts();
                }
                if (!isSelectMode) {
                  toast.info('Selection mode active');
                } else {
                  deselectAllProducts();
                  toast.info('Selection mode deactivated');
                }
              }}
              aria-label={isSelectMode ? 'Exit selection mode' : 'Enter selection mode for bulk operations'}
            >
              <CheckSquare className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{isSelectMode ? 'Exit Select Mode' : 'Select Mode'}</span>
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setIsComparisonMode(!isComparisonMode);
                if (isSelectMode) {
                  setIsSelectMode(false);
                  deselectAllProducts();
                }
                if (!isComparisonMode) {
                  toast.info('Comparison mode active - Select 2-4 products');
                } else {
                  deselectAllProducts();
                  toast.info('Comparison mode deactivated');
                }
              }}
              aria-label={isComparisonMode ? 'Exit comparison mode' : 'Enter comparison mode'}
            >
              <GitCompare className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{isComparisonMode ? 'Exit Compare' : 'Compare Products'}</span>
            </Button>
            {canAccess('products.edit') && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleToggleReorderMode}
                disabled={isLoading || products.length === 0}
                aria-label={isReorderMode ? 'Exit reorder mode' : 'Enter reorder mode'}
              >
                <GripVertical className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{isReorderMode ? 'Save Order' : 'Reorder Products'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalProducts}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Total items in catalog
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Featured Products
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.featuredCount}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Highlighted items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Products
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeCount}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Published products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Inventory Value
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Total stock value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <ProductAnalyticsDashboard products={products} />
        )}

        {/* Filters */}
        <Card hover={false}>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-4">
              {/* Search */}
              <div className="relative w-full md:flex-1 md:min-w-[250px]">
                <Label htmlFor="product-search" className="sr-only">
                  Search products by name, description, or SKU
                </Label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
                <Input
                  id="product-search"
                  ref={searchInputRef}
                  type="search"
                  role="searchbox"
                  aria-label="Search products by name, description, or SKU"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                <div 
                  role="status" 
                  aria-live="polite" 
                  aria-atomic="true"
                  className="sr-only"
                >
                  {debouncedSearch ? `${products.length} products found` : ''}
                </div>
              </div>

              {/* Advanced Filters */}
              <AdvancedFiltersPanel
                filters={filters}
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters);
                  announceToScreenReader('Filters applied');
                }}
                onClearFilters={() => {
                  handleClearFilters();
                  announceToScreenReader('All filters cleared');
                }}
              />

              {/* Saved Searches */}
              <SavedSearches
                currentFilters={filters}
                onLoadSearch={(loadedFilters) => {
                  setFilters(loadedFilters);
                  announceToScreenReader('Search loaded');
                }}
              />
            </div>
          </CardContent>
        </Card>



        {/* Select Mode Toolbar */}
        {isSelectMode && (
          <Card hover={false} className="p-3 md:p-4 bg-primary/5 border-primary/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  aria-label={`Select all ${products.length} products`}
                >
                  Select All ({products.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllProducts}
                  disabled={selectedProducts.size === 0}
                  aria-label="Deselect all selected products"
                >
                  Deselect All
                </Button>
                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {canAccess('products.update') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkEdit}
                    disabled={selectedProducts.size === 0}
                    aria-label="Bulk edit selected products"
                  >
                    <Edit className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Bulk Edit</span>
                  </Button>
                )}
                
                {canAccess('products.delete') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedProducts.size === 0 || bulkDeleteMutation.isPending}
                    aria-label="Delete selected products"
                  >
                    <Trash2 className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Delete Selected</span>
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSelectMode(false);
                    deselectAllProducts();
                  }}
                  aria-label="Exit selection mode"
                >
                  <X className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Cancel</span>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Comparison Mode Toolbar */}
        {isComparisonMode && (
          <Card hover={false} className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  aria-label={`Select all ${products.length} products for comparison`}
                >
                  Select All ({products.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllProducts}
                  disabled={selectedProducts.size === 0}
                  aria-label="Deselect all selected products"
                >
                  Deselect All
                </Button>
                <span className="text-xs md:text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected for comparison
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkCompare}
                  disabled={selectedProducts.size < 2}
                  aria-label={`Compare ${selectedProducts.size} selected products`}
                >
                  <GitCompare className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Compare {selectedProducts.size >= 2 ? `${selectedProducts.size} Products` : 'Products'}</span>
                  <span className="md:hidden">Compare</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsComparisonMode(false);
                    deselectAllProducts();
                  }}
                  aria-label="Exit comparison mode"
                >
                  <X className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Cancel</span>
                </Button>
              </div>
            </div>
            {selectedProducts.size < 2 && (
              <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300 mt-2">
                Select at least 2 products to compare. Maximum 4 products.
              </p>
            )}
            {selectedProducts.size > 4 && (
              <p className="text-xs md:text-sm text-orange-700 dark:text-orange-300 mt-2">
                You have selected more than 4 products. Only the first 4 will be compared.
              </p>
            )}
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
                  aria-label="Upload product import file (CSV, Excel, or JSON format)"
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

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        products={products.filter(p => selectedProducts.has(p.uuid))}
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        onSave={handleBulkEditSave}
        onCancel={() => setShowBulkEditDialog(false)}
      />
      </div>

      <ComparisonBar />
    </LazyWrapper>
  );
}