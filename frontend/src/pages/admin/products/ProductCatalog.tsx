import React, { useCallback, useEffect, useMemo } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { useProductsQuery } from '@/hooks/useProductsQuery';
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Product, ProductFilters } from '@/types/product';
import { productCatalogReducer, initialProductCatalogState } from '@/reducers/productCatalogReducer';
import { Progress } from '@/components/ui/progress';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ProductImage } from '@/components/ui/product-image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { KeyboardShortcutsDialog } from '@/components/admin/KeyboardShortcutsDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Plus, 
  Search, 
  Filter, 
  Package,
  Star,
  Download,
  Upload,
  DollarSign,
  TrendingUp,
  X,
  GitCompare,
  BarChart3,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { announceToScreenReader, announceLoading } from '@/lib/utils/accessibility';
import { ProductComparisonProvider } from '@/contexts/ProductComparisonContext';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { ComparisonBar } from '@/components/products/ComparisonBar';
import { FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/formatters';
import { DraggableProductList } from '@/components/admin/DraggableProductList';
import { ColumnCustomization } from '@/components/admin/ColumnCustomization';
import { BulkEditDialog } from '@/components/admin/BulkEditDialog';
import { ProductAnalyticsDashboard } from '@/components/admin/ProductAnalyticsDashboard';
import { useProductCatalogActions } from '@/hooks/products/useProductCatalogActions';
import { useProductExportImport } from '@/hooks/products/useProductExportImport';
import { getProductTableColumns } from '@/config/products/productTableColumns';
import { getProductKeyboardShortcuts } from '@/config/products/productKeyboardShortcuts';
import { ProductQuickViewDialog } from '@/components/admin/products/ProductQuickViewDialog';
import { ProductExportDialog } from '@/components/admin/products/ProductExportDialog';
import { ProductImportDialog } from '@/components/admin/products/ProductImportDialog';

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

  const bypassPermissions = import.meta.env.VITE_BYPASS_PERMISSIONS === 'true';

  if (!canAccess('products.view') && !bypassPermissions) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              You do not have permission to view product catalog.
            </CardDescription>
            {import.meta.env.DEV && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <div className="font-semibold text-yellow-800">Development Info:</div>
                <div className="mt-1 text-yellow-700">Permissions: {JSON.stringify(permissions)}</div>
                <div className="text-yellow-700">Roles: {JSON.stringify(roles)}</div>
                <div className="mt-2 text-yellow-600">Set VITE_BYPASS_PERMISSIONS=true in .env to bypass</div>
              </div>
            )}
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
  const navigate = useNavigate();
  const { canAccess } = usePermissions();
  
  const [state, dispatch] = React.useReducer(
    productCatalogReducer,
    initialProductCatalogState
  );

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(state.search.query, APP_CONFIG.SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    dispatch({ type: 'SET_IS_SEARCHING', payload: state.search.query !== debouncedSearch });
  }, [state.search.query, debouncedSearch]);

  useEffect(() => {
    if (debouncedSearch !== state.filters.search) {
      dispatch({ type: 'SET_FILTERS', payload: { search: debouncedSearch, page: 1 } });
    }
  }, [debouncedSearch, state.filters.search]);

  const { data, isLoading, error } = useProductsQuery(state.filters);
  const { data: categoriesData } = useCategoriesQuery({ per_page: 100 });
  
  useEffect(() => {
    announceLoading(isLoading, 'products');
  }, [isLoading]);

  const { isConnected: wsConnected } = { isConnected: false };

  const products = data?.data || [];
  const pagination = {
    page: data?.current_page || 1,
    per_page: data?.per_page || APP_CONFIG.PRODUCT_CATALOG_PAGE_SIZE,
    total: data?.total || 0,
    last_page: data?.last_page || 1,
  };

  const actions = useProductCatalogActions({
    products,
    dispatch,
    selectedProducts: state.selection.selectedProducts,
  });

  const exportImport = useProductExportImport({
    products,
    dispatch,
  });

  useKeyboardNavigation(products, {
    onEnter: (index) => {
      if (products[index]) {
        actions.handleQuickView(products[index]);
      }
    },
    onEscape: () => {
      if (state.selection.selectedProducts.size > 0) {
        dispatch({ type: 'CLEAR_SELECTION' });
      }
    },
    announceItems: true,
    itemName: 'product',
  });

  const stats = useMemo(() => {
    const productsData = products || [];
    return {
      productsData,
      totalProducts: pagination?.total || 0,
      featuredCount: productsData.filter((p) => p.featured).length,
      activeCount: productsData.filter((p) => p.status === 'published').length,
      totalValue: productsData.reduce((sum, p) => sum + ((p.price || 0) * (p.stockQuantity || 0)), 0),
    };
  }, [products, pagination?.total]);

  const columns = useMemo(() => getProductTableColumns({
    canAccessEdit: canAccess('products.edit'),
    canAccessDelete: canAccess('products.delete'),
    canAccessCreate: canAccess('products.create'),
    onQuickView: actions.handleQuickView,
    onDuplicate: actions.handleDuplicateProduct,
    onDelete: actions.handleDeleteProduct,
    isSelectMode: state.modes.isSelectMode,
    isComparisonMode: state.modes.isComparisonMode,
    selectedProducts: state.selection.selectedProducts,
    products,
    onSelectAll: actions.handleSelectAll,
    onToggleSelection: actions.toggleProductSelection,
    columnConfigs: state.columns,
  }), [
    canAccess, 
    actions.handleQuickView,
    actions.handleDuplicateProduct,
    actions.handleDeleteProduct,
    actions.handleSelectAll,
    actions.toggleProductSelection,
    state.modes.isSelectMode,
    state.modes.isComparisonMode,
    state.selection.selectedProducts,
    products,
    state.columns
  ]);

  const keyboardShortcuts = useMemo(() => getProductKeyboardShortcuts({
    products,
    canAccessCreate: canAccess('products.create'),
    canAccessDelete: canAccess('products.delete'),
    selectedProductsSize: state.selection.selectedProducts.size,
    onFocusSearch: () => searchInputRef.current?.focus(),
    onNavigateToNew: () => {
      if (canAccess('products.create')) {
        navigate('/admin/products/new');
      } else {
        toast.error('You do not have permission to create products');
      }
    },
    onRefresh: () => window.location.reload(),
    onClearFilters: () => {
      actions.handleClearFilters();
      toast.success('Filters cleared');
    },
    onToggleSelection: () => {
      if (state.selection.selectedProducts.size > 0) {
        dispatch({ type: 'CLEAR_SELECTION' });
        toast.info('Selection cleared');
      } else {
        actions.handleSelectAll();
        toast.info('All products selected');
      }
    },
    onOpenExportDialog: () => {
      if (products.length === 0) {
        toast.error('No products to export');
        return;
      }
      dispatch({ type: 'OPEN_EXPORT_DIALOG' });
    },
    onOpenImportDialog: () => {
      if (canAccess('products.create')) {
        exportImport.handleImportClick();
      } else {
        toast.error('You do not have permission to import products');
      }
    },
    onSelectAll: () => {
      if (products.length === 0) return;
      actions.handleSelectAll();
      announceToScreenReader(`${products.length} products selected`);
    },
    onBulkCompare: () => {
      if (state.selection.selectedProducts.size < 2) {
        toast.error('Select at least 2 products to compare');
        return;
      }
      if (state.selection.selectedProducts.size > 4) {
        toast.error('You can compare maximum 4 products');
        return;
      }
      actions.handleBulkCompare();
    },
    onBulkDelete: () => {
      if (!canAccess('products.delete')) {
        toast.error('You do not have permission to delete products');
        return;
      }
      if (state.selection.selectedProducts.size === 0) {
        toast.error('No products selected');
        return;
      }
      actions.handleBulkDelete();
    },
    onClearSelection: () => {
      if (state.selection.selectedProducts.size > 0) {
        dispatch({ type: 'CLEAR_SELECTION' });
        toast.info('Selection cleared');
        announceToScreenReader('Selection cleared');
      }
    },
    onToggleKeyboardHelp: () => {
      dispatch({ type: 'TOGGLE_KEYBOARD_HELP' });
    },
  }), [
    products,
    canAccess,
    state.selection.selectedProducts,
    navigate,
    actions,
    exportImport,
    searchInputRef,
  ]);

  useKeyboardShortcuts(keyboardShortcuts, true);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      state.filters.search || 
      state.filters.category || 
      state.filters.status || 
      state.filters.featured !== undefined ||
      state.filters.inStock !== undefined
    );
  }, [state.filters]);

  const renderContent = useCallback(() => {
    const isBulkDeleting = state.bulk.progress !== null;

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

    if (!isLoading && !isBulkDeleting && !hasActiveFilters && products.length === 0) {
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

    if (!isLoading && !isBulkDeleting && state.filters.search && products.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title="No products found"
          description={`No products match your search "${state.filters.search}". Try different keywords or clear filters.`}
          action={{
            label: 'Clear Search',
            onClick: actions.handleClearFilters,
            icon: X,
          }}
        />
      );
    }

    if (!isLoading && !isBulkDeleting && hasActiveFilters && products.length === 0) {
      return (
        <EmptyState
          icon={Filter}
          title="No products match filters"
          description="Try adjusting your filters or search criteria to see more results."
          action={{
            label: 'Clear All Filters',
            onClick: actions.handleClearFilters,
            icon: X,
          }}
        />
      );
    }

    if (state.modes.isReorderMode) {
      return (
        <Card hover={false} className="p-6" role="region" aria-label="Draggable product list for reordering">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Drag products to reorder them. Click <strong>Save Order</strong> when done.
            </p>
          </div>
          <DraggableProductList
            products={state.reorder.products}
            onReorder={actions.handleReorder}
            renderProduct={(product) => (
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <ProductImage
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{product.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {typeof product.category === 'string' ? product.category : product.category?.name || 'Uncategorized'}
                    </Badge>
                    <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-semibold">{formatPrice(product.price || 0, product.currency)}</p>
                  <p className="text-sm text-muted-foreground">
                    Stock: {product.stockQuantity || 0}
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
          loading={isLoading || state.ui.isRefreshing || isBulkDeleting}
          datasetId="product-catalog"
          showPagination={false}
          onRowClick={(product) => {
            if (canAccess('products.edit')) {
              navigate(`/admin/products/${product.uuid}/edit`);
            }
          }}
        />
      </Card>
    );
  }, [
    isLoading,
    error,
    hasActiveFilters,
    products.length,
    state.filters.search,
    state.modes.isReorderMode,
    state.reorder.products,
    state.ui.isRefreshing,
    state.bulk.progress,
    canAccess,
    navigate,
    actions,
    columns,
    stats.productsData,
  ]);

  return (
    <LazyWrapper>
      <KeyboardShortcutsDialog 
        open={state.ui.showKeyboardHelp} 
        onOpenChange={() => dispatch({ type: 'TOGGLE_KEYBOARD_HELP' })}
      />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
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

        <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={actions.handleRefresh} 
              disabled={isLoading || state.ui.isRefreshing}
              aria-label="Refresh product list"
              aria-busy={state.ui.isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 md:mr-2", (isLoading || state.ui.isRefreshing) && "animate-spin")} />
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
              variant={state.ui.showAnalytics ? "default" : "outline"}
              size="sm"
              onClick={() => dispatch({ type: 'TOGGLE_ANALYTICS' })}
              aria-label={state.ui.showAnalytics ? "Hide analytics" : "Show analytics"}
            >
              <BarChart3 className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{state.ui.showAnalytics ? 'Hide Analytics' : 'Analytics'}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={isLoading || products.length === 0}
                  aria-label={`Export ${products.length} products in various formats`}
                  aria-haspopup="menu"
                >
                  <Download className="w-4 h-4 md:mr-2" aria-hidden="true" />
                  <span className="hidden md:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" role="menu" aria-label="Export format options">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => { dispatch({ type: 'SET_EXPORT_FORMAT', payload: 'csv' }); dispatch({ type: 'OPEN_EXPORT_DIALOG' }); }}
                  role="menuitem"
                  aria-label="Export products as CSV file"
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => { dispatch({ type: 'SET_EXPORT_FORMAT', payload: 'xlsx' as any }); dispatch({ type: 'OPEN_EXPORT_DIALOG' }); }}
                  role="menuitem"
                  aria-label="Export products as Excel file"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => { dispatch({ type: 'SET_EXPORT_FORMAT', payload: 'json' }); dispatch({ type: 'OPEN_EXPORT_DIALOG' }); }}
                  role="menuitem"
                  aria-label="Export products as JSON file"
                >
                  <FileJson className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canAccess('products.create') && (
              <Button 
                variant="outline"
                size="sm"
                onClick={exportImport.handleImportClick}
                disabled={isLoading}
                aria-label="Import products from file"
              >
                <Upload className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Import</span>
              </Button>
            )}
            <ColumnCustomization
              columns={state.columns}
              onColumnsChange={(cols) => dispatch({ type: 'UPDATE_COLUMN_CONFIGS', payload: cols })}
            />
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                dispatch({ type: 'TOGGLE_SELECT_MODE' });
                if (state.modes.isComparisonMode) {
                  dispatch({ type: 'TOGGLE_COMPARISON_MODE' });
                }
                toast.info(state.modes.isSelectMode ? 'Selection mode deactivated' : 'Selection mode active');
              }}
              aria-label={state.modes.isSelectMode ? 'Exit selection mode' : 'Enter selection mode for bulk operations'}
            >
              <CheckSquare className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{state.modes.isSelectMode ? 'Exit Select Mode' : 'Select Mode'}</span>
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                dispatch({ type: 'TOGGLE_COMPARISON_MODE' });
                if (state.modes.isSelectMode) {
                  dispatch({ type: 'TOGGLE_SELECT_MODE' });
                }
                toast.info(state.modes.isComparisonMode ? 'Comparison mode deactivated' : 'Comparison mode active - Select 2-4 products');
              }}
              aria-label={state.modes.isComparisonMode ? 'Exit comparison mode' : 'Enter comparison mode'}
            >
              <GitCompare className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{state.modes.isComparisonMode ? 'Exit Compare' : 'Compare Products'}</span>
            </Button>
            {canAccess('products.edit') && (
              <Button 
                variant="outline"
                size="sm"
                onClick={actions.handleToggleReorderMode}
                disabled={isLoading || products.length === 0}
                aria-label={state.modes.isReorderMode ? 'Exit reorder mode' : 'Enter reorder mode'}
              >
                <GripVertical className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{state.modes.isReorderMode ? 'Save Order' : 'Reorder Products'}</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className={cn(state.ui.isRefreshing && "animate-pulse")}>
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

          <Card className={cn(state.ui.isRefreshing && "animate-pulse")}>
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

          <Card className={cn(state.ui.isRefreshing && "animate-pulse")}>
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

          <Card className={cn(state.ui.isRefreshing && "animate-pulse")}>
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

        {state.ui.showAnalytics && <ProductAnalyticsDashboard />}

        <Card className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products by name, SKU, or description..."
                  value={state.search.query}
                  onChange={(e) => actions.handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      dispatch({ type: 'SET_FILTERS', payload: { search: state.search.query, page: 1 } });
                    }
                  }}
                  className="pl-10 pr-10"
                  aria-label="Search products"
                />
                {state.search.query && (
                  <button
                    type="button"
                    onClick={actions.handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {state.search.query && (state.search.isSearching || state.search.query !== state.filters.search) && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => dispatch({ type: 'SET_FILTERS', payload: { search: state.search.query, page: 1 } })}
                  className="whitespace-nowrap"
                  disabled={state.search.isSearching}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {state.search.isSearching ? 'Searching...' : 'Apply'}
                </Button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select
                value={state.filters.type || 'all'}
                onValueChange={(value) => actions.handleFilterChange('type', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="metal_etching">Metal Etching</SelectItem>
                  <SelectItem value="glass_etching">Glass Etching</SelectItem>
                  <SelectItem value="award_plaque">Awards & Plaques</SelectItem>
                  <SelectItem value="signage">Signage Solutions</SelectItem>
                  <SelectItem value="industrial_etching">Industrial Etching</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={state.filters.category || 'all'}
                onValueChange={(value) => actions.handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesData?.data?.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={state.filters.size || 'all'}
                onValueChange={(value) => actions.handleFilterChange('size', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="10x15">10x15 cm</SelectItem>
                  <SelectItem value="15x20">15x20 cm</SelectItem>
                  <SelectItem value="20x30">20x30 cm</SelectItem>
                  <SelectItem value="25x35">25x35 cm</SelectItem>
                  <SelectItem value="30x40">30x40 cm</SelectItem>
                  <SelectItem value="custom">Custom Size</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={state.filters.material || 'all'}
                onValueChange={(value) => actions.handleFilterChange('material', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  <SelectItem value="Acrylic">Acrylic</SelectItem>
                  <SelectItem value="Brass">Brass</SelectItem>
                  <SelectItem value="Copper">Copper</SelectItem>
                  <SelectItem value="Stainless Steel">Stainless Steel</SelectItem>
                  <SelectItem value="Aluminum">Aluminum</SelectItem>
                  <SelectItem value="Glass">Glass</SelectItem>
                  <SelectItem value="Wood">Wood</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={state.filters.status || 'all'}
                onValueChange={(value) => actions.handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={actions.handleClearFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {renderContent()}

          {!isLoading && products.length > 0 && (
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                Menampilkan {((pagination.page - 1) * pagination.per_page) + 1} hingga {Math.min(pagination.page * pagination.per_page, pagination.total)} dari <span className="font-semibold text-foreground">{pagination.total} produk</span>
                {state.filters.status && (
                  <span className="ml-2">
                    (Status: <span className="font-medium capitalize">{state.filters.status}</span>)
                  </span>
                )}
              </div>
              
              {pagination.last_page > 1 && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    Halaman {pagination.page} dari {pagination.last_page}
                  </div>
                  <Pagination className="mx-0 justify-end">
                    <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => actions.handlePageChange(pagination.page - 1)}
                        className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: pagination.last_page }, (_, i) => {
                      const pageNum = i + 1;
                      
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.last_page ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => actions.handlePageChange(pageNum)}
                              isActive={pagination.page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        pageNum === pagination.page - 2 ||
                        pageNum === pagination.page + 2
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => actions.handlePageChange(pagination.page + 1)}
                        className={pagination.page === pagination.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                </div>
              )}
            </div>
          )}
        </Card>

        {(state.modes.isSelectMode || state.modes.isComparisonMode) && state.selection.selectedProducts.size > 0 && (
          <Card className="fixed bottom-4 right-4 p-4 shadow-2xl z-40 min-w-[300px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{state.selection.selectedProducts.size} Selected</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {canAccess('products.delete') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={actions.handleBulkDelete}
                  >
                    Delete {state.selection.selectedProducts.size}
                  </Button>
                )}
                {canAccess('products.edit') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={actions.handleBulkEdit}
                  >
                    Bulk Edit
                  </Button>
                )}
                {state.modes.isComparisonMode && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={actions.handleBulkCompare}
                    disabled={state.selection.selectedProducts.size < 2 || state.selection.selectedProducts.size > 4}
                  >
                    Compare
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      <ProductQuickViewDialog
        open={state.ui.isQuickViewOpen}
        product={state.selection.selectedProduct}
        onClose={() => dispatch({ type: 'CLOSE_QUICK_VIEW' })}
      />

      <ProductExportDialog
        open={state.ui.showExportDialog}
        isExporting={state.export.isExporting}
        productCount={pagination?.total || products.length}
        onExport={exportImport.handleExport}
        onClose={() => dispatch({ type: 'CLOSE_EXPORT_DIALOG' })}
      />

      <ProductImportDialog
        open={state.ui.showImportDialog}
        isImporting={state.import.isImporting}
        file={state.import.file}
        result={state.import.result}
        fileInputRef={exportImport.fileInputRef}
        onFileSelect={exportImport.handleFileSelect}
        onImportConfirm={() => exportImport.handleImportConfirm(state.import.result)}
        onDownloadTemplate={exportImport.handleDownloadTemplate}
        onCancel={exportImport.handleCancelImport}
      />

      {state.bulk.progress && state.bulk.progress.total > 0 && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-6 shadow-2xl rounded-lg border-2 border-blue-500 z-50 min-w-[350px] max-w-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Deleting Products</h4>
              <span className="text-sm text-muted-foreground font-medium">
                {state.bulk.progress.completed + state.bulk.progress.failed}/{state.bulk.progress.total}
              </span>
            </div>
            
            <Progress 
              value={((state.bulk.progress.completed + state.bulk.progress.failed) / state.bulk.progress.total) * 100} 
              className="h-3"
              indicatorClassName={state.bulk.progress.failed > 0 ? "bg-orange-500" : "bg-blue-600"}
            />
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-green-600">
                  ✓ {state.bulk.progress.completed} succeeded
                </span>
                {state.bulk.progress.failed > 0 && (
                  <span className="text-red-600">
                    ✗ {state.bulk.progress.failed} failed
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {state.bulk.progress.completed + state.bulk.progress.failed < state.bulk.progress.total 
                ? 'Please wait, do not close this page...' 
                : 'Operation completed'}
            </p>
          </div>
        </div>
      )}

      <BulkEditDialog
        productIds={Array.from(state.selection.selectedProducts)}
        open={state.ui.showBulkEditDialog}
        onOpenChange={(open) => {
          if (open) dispatch({ type: 'OPEN_BULK_EDIT_DIALOG' });
          else dispatch({ type: 'CLOSE_BULK_EDIT_DIALOG' });
        }}
        action="update_status"
        onSuccess={(jobId: string) => {
          console.log('Bulk edit job started:', jobId);
          dispatch({ type: 'CLOSE_BULK_EDIT_DIALOG' });
          toast.success('Bulk edit operation started');
        }}
      />

      <ComparisonBar />
    </LazyWrapper>
  );
}
