import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { useProductsQuery, useDeleteProductMutation, useBulkDeleteProductsMutation, useReorderProductsMutation, useBulkUpdateProductsMutation, useDuplicateProductMutation, type BulkDeleteProgress } from '@/hooks/useProductsQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useProductWebSocket } from '@/hooks/useProductWebSocket';
import type { Product, ProductFilters } from '@/types/product';
import { productCatalogReducer, initialProductCatalogState } from '@/reducers/productCatalogReducer';
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
import { 
  ProductNameCell,
  ProductCategoryCell,
  ProductPriceCell,
  ProductStockCell,
  ProductStatusCell,
  ProductFeaturedCell,
  ProductActionsCell,
  SortableHeader
} from '@/components/admin/products/ProductTableCells';
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
import { announceToScreenReader, announceSelection, announceLoading } from '@/lib/utils/accessibility';
import { ProductComparisonProvider, useProductComparison } from '@/contexts/ProductComparisonContext';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { darkModeClasses } from '@/lib/utils/darkMode';
import { useResponsive } from '@/hooks/useResponsive';
import { ComparisonBar } from '@/components/products/ComparisonBar';
import { ProductExportService, type ExportFormat } from '@/services/export/productExportService';
import { ProductImportService, type ImportResult } from '@/services/import/productImportService';
import { FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/formatters';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { 
  validateRBACContext, 
  validateTenantOwnership, 
  logAuditEvent, 
  handleRBACError,
  confirmDialog
} from '@/lib/utils/rbac';
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
  const { userType, tenant, user } = useGlobalContext();
  const { canAccess } = usePermissions();
  const { addToCompare, comparedProducts, clearComparison } = useProductComparison();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [state, dispatch] = React.useReducer(
    productCatalogReducer,
    initialProductCatalogState
  );

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { isMobile, isTablet, isDesktop, showMobileLayout } = useResponsive();

  const debouncedSearch = useDebounce(state.search.query, APP_CONFIG.SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    dispatch({ type: 'SET_IS_SEARCHING', payload: state.search.query !== debouncedSearch });
  }, [state.search.query, debouncedSearch]);

  const debouncedFilters = useMemo(() => ({
    ...state.filters,
    search: debouncedSearch,
  }), [state.filters, debouncedSearch]);

  const { data, isLoading, error, refetch } = useProductsQuery(debouncedFilters);
  
  useEffect(() => {
    announceLoading(isLoading, 'products');
  }, [isLoading]);
  const deleteProductMutation = useDeleteProductMutation();
  const reorderMutation = useReorderProductsMutation();
  const bulkUpdateMutation = useBulkUpdateProductsMutation();
  const duplicateProductMutation = useDuplicateProductMutation();
  
  const bulkDeleteMutation = useBulkDeleteProductsMutation((progress) => {
    dispatch({ type: 'SET_BULK_PROGRESS', payload: progress });
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

  const {
    selectedIndex,
    setSelectedIndex,
    clearSelection: clearKeyboardSelection,
    isKeyboardMode,
    setContainerRef,
    getItemProps,
  } = useKeyboardNavigation(products, {
    onEnter: (index) => {
      if (products[index]) {
        handleQuickView(products[index]);
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

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    toast.success('Product data refreshed');
    announceToScreenReader('Product data refreshed');
  }, [queryClient]);

  const handleSearchChange = useCallback((value: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: value });
    dispatch({ type: 'SET_FILTERS', payload: { page: 1 } });
  }, []);

  const handleFilterChange = useCallback((key: keyof ProductFilters, value: ProductFilters[keyof ProductFilters]) => {
    dispatch({ 
      type: 'SET_FILTERS', 
      payload: {
        [key]: value === 'all' ? undefined : value,
        page: 1
      }
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    dispatch({ type: 'SET_FILTERS', payload: { page } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleQuickView = useCallback((product: Product) => {
    dispatch({ type: 'OPEN_QUICK_VIEW', payload: product });
  }, []);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      // 1. Client-side permission check
      if (!canAccess('products.delete')) {
        toast.error('You do not have permission to delete products');
        announceToScreenReader('Permission denied: Cannot delete products');
        return;
      }

      // 2. Validate RBAC context
      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

      // 3. Find product untuk tenant validation
      const product = products.find(p => p.uuid === productId);
      if (!product) {
        toast.error('Product not found');
        return;
      }

      // 4. Validate tenant ownership
      validateTenantOwnership(product.tenant_id, tenant?.uuid, 'product');

      // 5. Confirm action
      const confirmed = await confirmDialog({
        title: 'Delete Product',
        description: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmVariant: 'destructive',
      });

      if (!confirmed) {
        logAuditEvent({
          action: 'product.delete.cancelled',
          resourceType: 'product',
          resourceId: productId,
          tenantId: tenant?.uuid,
          userId: user?.uuid,
          status: 'failed',
        });
        return;
      }

      // 6. API call with explicit tenant context
      // Backend MUST validate:
      // - User has products.delete permission
      // - Product belongs to user's tenant
      // - Audit log the deletion
      await deleteProductMutation.mutateAsync(productId);

      // 7. Success feedback dengan audit trail
      toast.success('Product deleted successfully');
      announceToScreenReader('Product deleted');

      // 8. Log action for audit
      logAuditEvent({
        action: 'product.delete',
        resourceType: 'product',
        resourceId: productId,
        tenantId: tenant?.uuid,
        userId: user?.uuid,
        userEmail: user?.email,
        status: 'success',
        metadata: {
          productName: product.name,
          productSku: product.sku,
        },
      });
    } catch (error) {
      handleRBACError(error, {
        operation: 'Delete Product',
        resourceType: 'Product',
        resourceId: productId,
      });
    }
  }, [canAccess, userType, tenant, user, products, deleteProductMutation]);

  const handleDuplicateProduct = useCallback(async (productId: string) => {
    try {
      // 1. Permission check
      if (!canAccess('products.create')) {
        toast.error('You do not have permission to duplicate products');
        announceToScreenReader('Permission denied: Cannot duplicate products');
        return;
      }

      // 2. Check authentication before validation
      if (!user?.uuid) {
        toast.error('Please wait for authentication to complete');
        return;
      }

      // 3. Validate RBAC context
      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

      // 4. Find product untuk tenant validation
      const product = products.find(p => p.uuid === productId);
      if (!product) {
        toast.error('Product not found');
        return;
      }

      // 5. Validate tenant ownership
      validateTenantOwnership(product.tenant_id, tenant?.uuid, 'product');

      // 6. API call
      await duplicateProductMutation.mutateAsync(productId);

      // 7. Success + audit
      toast.success(`Product "${product.name}" duplicated successfully`);
      announceToScreenReader('Product duplicated');

      logAuditEvent({
        action: 'product.duplicate',
        resourceType: 'product',
        resourceId: productId,
        tenantId: tenant?.uuid,
        userId: user?.uuid,
        status: 'success',
        metadata: {
          originalProductName: product.name,
        },
      });
    } catch (error) {
      handleRBACError(error, {
        operation: 'Duplicate Product',
        resourceType: 'Product',
        resourceId: productId,
      });
    }
  }, [canAccess, userType, tenant, user, products, duplicateProductMutation]);

  // formatPrice removed - now using cached formatter from @/lib/utils/formatters

  const handleClearFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      dispatch({ type: 'SET_IS_EXPORTING', payload: true });
      
      if (products.length === 0) {
        toast.warning('No products to export');
        return;
      }
      
      ProductExportService.export(products, { format });
      
      toast.success(`Successfully exported ${products.length} products as ${format.toUpperCase()}`);
      dispatch({ type: 'CLOSE_EXPORT_DIALOG' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export products';
      toast.error(message);
      console.error('Product export failed', error);
    } finally {
      dispatch({ type: 'SET_IS_EXPORTING', payload: false });
    }
  }, [products]);

  const handleImportClick = useCallback(() => {
    if (!canAccess('products.create')) {
      toast.error('You do not have permission to import products');
      return;
    }
    dispatch({ type: 'OPEN_IMPORT_DIALOG' });
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
    
    dispatch({ type: 'SET_IMPORT_FILE', payload: file });
    
    try {
      dispatch({ type: 'SET_IS_IMPORTING', payload: true });
      
      const result = await ProductImportService.parseFile(file);
      dispatch({ type: 'SET_IMPORT_RESULT', payload: result });
      
      if (result.failed > 0) {
        toast.warning(`Parsed ${result.success} valid rows, ${result.failed} rows have errors`);
      } else {
        toast.success(`Successfully validated ${result.success} products`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      toast.error(message);
      console.error('Import parse failed', error);
      
      dispatch({ type: 'SET_IMPORT_FILE', payload: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      dispatch({ type: 'SET_IS_IMPORTING', payload: false });
    }
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!state.import.result || state.import.result.data.length === 0) {
      toast.error('No valid data to import');
      return;
    }

    try {
      dispatch({ type: 'SET_IS_IMPORTING', payload: true });
      
      toast.info(`This will import ${state.import.result.data.length} products. Backend integration coming soon.`);
      
      dispatch({ type: 'CLOSE_IMPORT_DIALOG' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import products';
      toast.error(message);
      console.error('Product import failed', error);
    } finally {
      dispatch({ type: 'SET_IS_IMPORTING', payload: false });
    }
  }, [state.import.result]);

  const handleDownloadTemplate = useCallback(() => {
    ProductImportService.generateTemplate();
    toast.success('Import template downloaded');
  }, []);

  const handleCancelImport = useCallback(() => {
    dispatch({ type: 'CLOSE_IMPORT_DIALOG' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      state.filters.search || 
      state.filters.category || 
      state.filters.status || 
      state.filters.featured !== undefined ||
      state.filters.inStock !== undefined
    );
  }, [state.filters]);

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
        if (state.selection.selectedProducts.size > 0) {
          dispatch({ type: 'CLEAR_SELECTION' });
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
        dispatch({ type: 'OPEN_EXPORT_DIALOG' });
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
        if (state.selection.selectedProducts.size < 2) {
          toast.error('Select at least 2 products to compare');
          return;
        }
        if (state.selection.selectedProducts.size > 4) {
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
        if (state.selection.selectedProducts.size === 0) {
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
        if (state.selection.selectedProducts.size > 0) {
          dispatch({ type: 'CLEAR_SELECTION' });
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
        dispatch({ type: 'TOGGLE_KEYBOARD_HELP' });
      },
      preventDefault: true,
    },
  ], true);

  const handleSelectAll = useCallback(() => {
    if (state.selection.selectedProducts.size === products.length) {
      dispatch({ type: 'CLEAR_SELECTION' });
      announceSelection(0, products.length, 'product');
    } else {
      dispatch({ type: 'SELECT_ALL_PRODUCTS', payload: products.map(p => p.uuid) });
      announceSelection(products.length, products.length, 'product');
    }
  }, [state.selection.selectedProducts.size, products]);

  const handleBulkDelete = useCallback(async () => {
    const selectedProducts = state.selection.selectedProducts;
    try {
      // 1. Validation checks
      if (selectedProducts.size === 0) {
        toast.error('No products selected');
        return;
      }

      if (!canAccess('products.delete')) {
        toast.error('You do not have permission to delete products');
        announceToScreenReader('Permission denied: Cannot delete products');
        return;
      }

      // 2. Validate RBAC context
      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

      // 3. Get selected products untuk tenant validation
      const selectedProductObjects = products.filter(p => selectedProducts.has(p.uuid));
      
      if (selectedProductObjects.length === 0) {
        toast.error('Selected products not found');
        return;
      }

      // 4. Validate all products belong to current tenant
      const invalidProducts = selectedProductObjects.filter(
        p => p.tenant_id !== tenant?.uuid
      );

      if (invalidProducts.length > 0) {
        toast.error(`Cannot delete products from other tenants`);
        console.error('[RBAC] Attempted to delete products from other tenant', {
          invalidProducts: invalidProducts.map(p => ({ uuid: p.uuid, tenant_id: p.tenant_id })),
          currentTenant: tenant?.uuid,
        });
        return;
      }

      // 5. Confirm bulk action
      const confirmed = await confirmDialog({
        title: `Delete ${selectedProducts.size} Products`,
        description: 'This will permanently delete all selected products. This action cannot be undone.',
        confirmText: 'Delete All',
        confirmVariant: 'destructive',
      });

      if (!confirmed) {
        logAuditEvent({
          action: 'product.bulk_delete.cancelled',
          resourceType: 'product',
          resourceIds: Array.from(selectedProducts),
          tenantId: tenant?.uuid,
          userId: user?.uuid,
          status: 'failed',
          metadata: {
            count: selectedProducts.size,
          },
        });
        return;
      }

      // 6. Initialize progress tracking
      dispatch({
        type: 'SET_BULK_PROGRESS',
        payload: {
          total: selectedProducts.size,
          completed: 0,
          failed: 0,
          failedIds: [],
        }
      });

      // 7. Backend validates:
      // - Each product belongs to user's tenant
      // - User has permission for each operation
      // - Atomic transaction or rollback on failure
      await bulkDeleteMutation.mutateAsync(Array.from(selectedProducts));

      // 8. Success feedback
      toast.success(`${selectedProducts.size} products deleted successfully`);
      announceToScreenReader(`${selectedProducts.size} products deleted`);
      dispatch({ type: 'CLEAR_SELECTION' });

      // 9. Audit log
      logAuditEvent({
        action: 'product.bulk_delete',
        resourceType: 'product',
        resourceIds: Array.from(selectedProducts),
        tenantId: tenant?.uuid,
        userId: user?.uuid,
        userEmail: user?.email,
        status: 'success',
        metadata: {
          count: selectedProducts.size,
          productNames: selectedProductObjects.map(p => p.name),
        },
      });
    } catch (error) {
      handleRBACError(error, {
        operation: 'Bulk Delete Products',
        resourceType: 'Product',
      });
    } finally {
      setTimeout(() => {
        dispatch({ type: 'SET_BULK_PROGRESS', payload: null });
      }, 2000);
    }
  }, [state.selection.selectedProducts, canAccess, userType, tenant, user, products, bulkDeleteMutation]);

  const handleBulkEdit = useCallback(() => {
    if (state.selection.selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    if (!canAccess('products.update')) {
      toast.error('You do not have permission to edit products');
      return;
    }

    dispatch({ type: 'OPEN_BULK_EDIT_DIALOG' });
  }, [state.selection.selectedProducts, canAccess]);

  const handleBulkEditSave = useCallback(async (productIds: string[], updateData: Partial<Product>) => {
    try {
      // 1. Permission check
      if (!canAccess('products.update')) {
        toast.error('You do not have permission to update products');
        announceToScreenReader('Permission denied: Cannot update products');
        return;
      }

      // 2. Validate RBAC context
      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

      // 3. Get selected products untuk tenant validation
      const selectedProductObjects = products.filter(p => productIds.includes(p.uuid));
      
      if (selectedProductObjects.length === 0) {
        toast.error('Selected products not found');
        return;
      }

      // 4. Validate all products belong to current tenant
      const invalidProducts = selectedProductObjects.filter(
        p => p.tenant_id !== tenant?.uuid
      );

      if (invalidProducts.length > 0) {
        toast.error(`Cannot update products from other tenants`);
        console.error('[RBAC] Attempted to update products from other tenant', {
          invalidProducts: invalidProducts.map(p => ({ uuid: p.uuid, tenant_id: p.tenant_id })),
          currentTenant: tenant?.uuid,
        });
        return;
      }

      // 5. Backend validates and applies updates
      await bulkUpdateMutation.mutateAsync({ productIds, updateData });
      
      // 6. Success feedback
      toast.success(`${productIds.length} products updated successfully`);
      announceToScreenReader(`Successfully updated ${productIds.length} products`);
      
      dispatch({ type: 'CLEAR_SELECTION' });
      dispatch({ type: 'CLOSE_BULK_EDIT_DIALOG' });

      // 7. Audit log
      logAuditEvent({
        action: 'product.bulk_update',
        resourceType: 'product',
        resourceIds: productIds,
        tenantId: tenant?.uuid,
        userId: user?.uuid,
        userEmail: user?.email,
        status: 'success',
        metadata: {
          count: productIds.length,
          updateData,
        },
      });
    } catch (error) {
      handleRBACError(error, {
        operation: 'Bulk Update Products',
        resourceType: 'Product',
      });
    }
  }, [bulkUpdateMutation, canAccess, userType, tenant, user, products]);

  const handleBulkCompare = useCallback(() => {
    const selectedProducts = state.selection.selectedProducts;
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

    dispatch({ type: 'CLEAR_SELECTION' });

    navigate('/admin/products/compare');
  }, [state.selection.selectedProducts, products, addToCompare, clearComparison, navigate]);

  const deselectAllProducts = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
    announceToScreenReader('All products deselected');
  }, []);

  const handleReorder = useCallback(async (reorderedProducts: Product[]) => {
    try {
      // 1. Permission check
      if (!canAccess('products.update')) {
        toast.error('You do not have permission to reorder products');
        announceToScreenReader('Permission denied: Cannot reorder products');
        return;
      }

      // 2. Validate RBAC context
      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

      // 3. Validate all products belong to current tenant
      const invalidProducts = reorderedProducts.filter(
        p => p.tenant_id !== tenant?.uuid
      );

      if (invalidProducts.length > 0) {
        toast.error(`Cannot reorder products from other tenants`);
        console.error('[RBAC] Attempted to reorder products from other tenant', {
          invalidProducts: invalidProducts.map(p => ({ uuid: p.uuid, tenant_id: p.tenant_id })),
          currentTenant: tenant?.uuid,
        });
        dispatch({ type: 'UPDATE_REORDER_PRODUCTS', payload: products });
        return;
      }

      // 4. Update UI optimistically
      dispatch({ type: 'UPDATE_REORDER_PRODUCTS', payload: reorderedProducts });
      
      const productIds = reorderedProducts.map(p => p.uuid || p.id);
      
      // 5. Backend validates and saves order
      await reorderMutation.mutateAsync(productIds);

      // 6. Audit log
      logAuditEvent({
        action: 'product.reorder',
        resourceType: 'product',
        resourceIds: productIds,
        tenantId: tenant?.uuid,
        userId: user?.uuid,
        status: 'success',
        metadata: {
          count: productIds.length,
        },
      });
    } catch (error) {
      // Rollback on error
      dispatch({ type: 'UPDATE_REORDER_PRODUCTS', payload: products });
      handleRBACError(error, {
        operation: 'Reorder Products',
        resourceType: 'Product',
      });
    }
  }, [reorderMutation, products, canAccess, userType, tenant, user]);

  const handleToggleReorderMode = useCallback(() => {
    if (state.modes.isReorderMode) {
      dispatch({ type: 'EXIT_REORDER_MODE' });
      toast.info('Reorder mode deactivated');
      announceToScreenReader('Reorder mode deactivated');
    } else {
      dispatch({ type: 'ENTER_REORDER_MODE', payload: [...products] });
      dispatch({ type: 'CLEAR_SELECTION' });
      toast.info('Reorder mode active - Drag products to reorder');
      announceToScreenReader('Reorder mode activated. Drag products to reorder them.');
    }
  }, [state.modes.isReorderMode, products]);

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
    dispatch({ type: 'TOGGLE_PRODUCT_SELECTION', payload: productId });
  }, []);

  const columns: ColumnDef<Product>[] = useMemo(() => {
    const baseColumns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader label="Product" column={column} />,
      cell: ({ row }) => <ProductNameCell product={row.original} />,
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
      id: 'actions',
      cell: ({ row }) => (
        <ProductActionsCell
          product={row.original}
          onQuickView={handleQuickView}
          onDuplicate={handleDuplicateProduct}
          onDelete={handleDeleteProduct}
          canEdit={canAccess('products.edit')}
          canDelete={canAccess('products.delete')}
          canCreate={canAccess('products.create')}
        />
      ),
    },
  ];

  if (state.modes.isSelectMode || state.modes.isComparisonMode) {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={state.selection.selectedProducts.size === products.length && products.length > 0}
            onCheckedChange={handleSelectAll}
            aria-label={state.modes.isComparisonMode ? "Select all products for comparison" : "Select all products on current page"}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={state.selection.selectedProducts.has(row.original.uuid)}
            onCheckedChange={() => toggleProductSelection(row.original.uuid)}
            aria-label={`Select product ${row.original.name}${state.modes.isComparisonMode ? ' for comparison' : ''}`}
            disabled={state.modes.isComparisonMode && !state.selection.selectedProducts.has(row.original.uuid) && state.selection.selectedProducts.size >= 4}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...baseColumns,
    ];
  }

  const visibleColumns = baseColumns.filter(col => {
    const config = state.columns.find(c => c.id === col.id || c.id === col.accessorKey);
    return config ? config.visible : true;
  });

  return visibleColumns;
}, [canAccess, handleQuickView, handleDeleteProduct, handleDuplicateProduct, state.selection.selectedProducts, products.length, handleSelectAll, state.modes.isSelectMode, state.modes.isComparisonMode, toggleProductSelection, state.columns]);

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

    if (!isLoading && state.filters.search && products.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title="No products found"
          description={`No products match your search "${state.filters.search}". Try different keywords or clear filters.`}
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
  }, [isLoading, error, hasActiveFilters, products.length, state.filters.search, canAccess, navigate, handleClearFilters, columns, stats.productsData, state.modes.isReorderMode, state.reorder.products, handleReorder]);

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
        open={state.ui.showKeyboardHelp} 
        onOpenChange={() => dispatch({ type: 'TOGGLE_KEYBOARD_HELP' })}
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
                  onClick={() => { dispatch({ type: 'SET_EXPORT_FORMAT', payload: 'excel' }); dispatch({ type: 'OPEN_EXPORT_DIALOG' }); }}
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
                onClick={handleImportClick}
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
                if (!state.modes.isSelectMode) {
                  toast.info('Selection mode active');
                } else {
                  toast.info('Selection mode deactivated');
                }
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
                if (!state.modes.isComparisonMode) {
                  toast.info('Comparison mode active - Select 2-4 products');
                } else {
                  toast.info('Comparison mode deactivated');
                }
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
                onClick={handleToggleReorderMode}
                disabled={isLoading || products.length === 0}
                aria-label={state.modes.isReorderMode ? 'Exit reorder mode' : 'Enter reorder mode'}
              >
                <GripVertical className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{state.modes.isReorderMode ? 'Save Order' : 'Reorder Products'}</span>
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
        {state.ui.showAnalytics && (
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
                  value={state.search.query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
                {state.search.isSearching && (
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
                filters={state.filters}
                onFiltersChange={(newFilters) => {
                  dispatch({ type: 'SET_FILTERS', payload: newFilters });
                  announceToScreenReader('Filters applied');
                }}
                onClearFilters={() => {
                  handleClearFilters();
                  announceToScreenReader('All filters cleared');
                }}
              />

              {/* Saved Searches */}
              <SavedSearches
                currentFilters={state.filters}
                onLoadSearch={(loadedFilters) => {
                  dispatch({ type: 'SET_FILTERS', payload: loadedFilters });
                  announceToScreenReader('Search loaded');
                }}
              />
            </div>
          </CardContent>
        </Card>



        {/* Select Mode Toolbar */}
        {state.modes.isSelectMode && (
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
                  disabled={state.selection.selectedProducts.size === 0}
                  aria-label="Deselect all selected products"
                >
                  Deselect All
                </Button>
                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">
                  {state.selection.selectedProducts.size} product{state.selection.selectedProducts.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {canAccess('products.update') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkEdit}
                    disabled={state.selection.selectedProducts.size === 0}
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
                    disabled={state.selection.selectedProducts.size === 0 || bulkDeleteMutation.isPending}
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
                    dispatch({ type: 'TOGGLE_SELECT_MODE' });
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
        {state.modes.isComparisonMode && (
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
                  disabled={state.selection.selectedProducts.size === 0}
                  aria-label="Deselect all selected products"
                >
                  Deselect All
                </Button>
                <span className="text-xs md:text-sm font-medium text-blue-900 dark:text-blue-100">
                  {state.selection.selectedProducts.size} product{state.selection.selectedProducts.size !== 1 ? 's' : ''} selected for comparison
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkCompare}
                  disabled={state.selection.selectedProducts.size < 2}
                  aria-label={`Compare ${state.selection.selectedProducts.size} selected products`}
                >
                  <GitCompare className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Compare {state.selection.selectedProducts.size >= 2 ? `${state.selection.selectedProducts.size} Products` : 'Products'}</span>
                  <span className="md:hidden">Compare</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    dispatch({ type: 'TOGGLE_COMPARISON_MODE' });
                    deselectAllProducts();
                  }}
                  aria-label="Exit comparison mode"
                >
                  <X className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Cancel</span>
                </Button>
              </div>
            </div>
            {state.selection.selectedProducts.size < 2 && (
              <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300 mt-2">
                Select at least 2 products to compare. Maximum 4 products.
              </p>
            )}
            {state.selection.selectedProducts.size > 4 && (
              <p className="text-xs md:text-sm text-orange-700 dark:text-orange-300 mt-2">
                You have selected more than 4 products. Only the first 4 will be compared.
              </p>
            )}
          </Card>
        )}

        {/* Products Data Table with Empty States */}
        {renderContent()}

      {/* Quick View Dialog */}
      <Dialog open={state.ui.isQuickViewOpen} onOpenChange={(open) => {
        if (!open) dispatch({ type: 'CLOSE_QUICK_VIEW' });
      }}>
        <DialogContent className="max-w-4xl" aria-describedby="quick-view-description">
          <DialogHeader>
            <DialogTitle>Product Quick View</DialogTitle>
            <DialogDescription id="quick-view-description">
              Preview product details and specifications
            </DialogDescription>
          </DialogHeader>
          
          {state.selection.selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <ProductImage
                    src={state.selection.selectedProduct.images}
                    alt={state.selection.selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{state.selection.selectedProduct.name}</h3>
                  <p className="text-muted-foreground">{state.selection.selectedProduct.category?.name || 'Uncategorized'}</p>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(state.selection.selectedProduct.price, state.selection.selectedProduct.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Minimum order: {state.selection.selectedProduct.minOrder} {state.selection.selectedProduct.priceUnit}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {state.selection.selectedProduct.description}
                  </p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={state.selection.selectedProduct.status === 'published' ? 'default' : 'secondary'}>
                    {state.selection.selectedProduct.status}
                  </Badge>
                  {state.selection.selectedProduct.featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {state.selection.selectedProduct.inStock ? (
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
            <Button variant="outline" onClick={() => dispatch({ type: 'CLOSE_QUICK_VIEW' })}>
              Close
            </Button>
            {state.selection.selectedProduct && (
              <>
                <Button variant="outline" asChild>
                  <Link to={`/admin/products/${state.selection.selectedProduct.uuid}`}>
                    <Package className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </Button>
                <Button asChild>
                  <Link to={`/admin/products/${state.selection.selectedProduct.uuid}/edit`}>
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
      <Dialog open={state.ui.showExportDialog} onOpenChange={(open) => {
        if (open) dispatch({ type: 'OPEN_EXPORT_DIALOG' });
        else dispatch({ type: 'CLOSE_EXPORT_DIALOG' });
      }}>
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
              disabled={state.export.isExporting}
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
              disabled={state.export.isExporting}
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
              disabled={state.export.isExporting}
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
              disabled={state.export.isExporting}
            >
              <FileJson className="w-4 h-4 mr-2" />
              <div className="flex-1 text-left">
                <div className="font-medium">JSON (.json)</div>
                <div className="text-xs text-muted-foreground">Developer-friendly format for APIs</div>
              </div>
            </Button>
          </div>
          
          {state.export.isExporting && (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Exporting products...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={state.ui.showImportDialog} onOpenChange={handleCancelImport}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Upload a CSV, Excel, or JSON file to bulk import products
            </DialogDescription>
          </DialogHeader>
          
          {!state.import.result ? (
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="import-file-input"
                  disabled={state.import.isImporting}
                  aria-label="Upload product import file (CSV, Excel, or JSON format)"
                />
                <label
                  htmlFor="import-file-input"
                  className={`cursor-pointer block ${state.import.isImporting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      {state.import.isImporting ? 'Processing file...' : 'Click to upload file'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supported formats: CSV, Excel (.xlsx, .xls), JSON
                    </p>
                  </div>
                  {state.import.isImporting && (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mt-3" />
                  )}
                </label>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={state.import.isImporting}
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
              {state.import.file && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{state.import.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(state.import.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{state.import.result.success}</p>
                    <p className="text-sm text-muted-foreground">Valid Products</p>
                  </div>
                </Card>
                <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{state.import.result.failed}</p>
                    <p className="text-sm text-muted-foreground">Invalid Rows</p>
                  </div>
                </Card>
              </div>

              {state.import.result.errors.length > 0 && (
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Validation Errors
                      </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {state.import.result.errors.slice(0, 10).map((error, idx) => (
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
                      {state.import.result.errors.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center">
                          And {state.import.result.errors.length - 10} more errors...
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {state.import.result.success > 0 && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ {state.import.result.success} products are ready to be imported
                    {state.import.result.failed > 0 && `. ${state.import.result.failed} rows will be skipped due to errors.`}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelImport}
              disabled={state.import.isImporting}
            >
              Cancel
            </Button>
            {state.import.result && state.import.result.success > 0 && (
              <Button
                onClick={handleImportConfirm}
                disabled={state.import.isImporting}
              >
                {state.import.isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {state.import.result.success} Products
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Progress Indicator */}
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

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        products={products.filter(p => state.selection.selectedProducts.has(p.uuid))}
        open={state.ui.showBulkEditDialog}
        onOpenChange={(open) => {
          if (open) dispatch({ type: 'OPEN_BULK_EDIT_DIALOG' });
          else dispatch({ type: 'CLOSE_BULK_EDIT_DIALOG' });
        }}
        onSave={handleBulkEditSave}
        onCancel={() => dispatch({ type: 'CLOSE_BULK_EDIT_DIALOG' })}
      />
      </div>

      <ComparisonBar />
    </LazyWrapper>
  );
}