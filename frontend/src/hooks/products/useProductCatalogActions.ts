import { useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import {
  useDeleteProductMutation,
  useBulkDeleteProductsMutation,
  useBulkUpdateProductsMutation,
  useReorderProductsMutation,
  useDuplicateProductMutation,
} from '@/hooks/useProductsQuery';
import {
  validateRBACContext,
  validateTenantOwnership,
  logAuditEvent,
  handleRBACError,
  confirmDialog,
} from '@/lib/utils/rbac';
import { announceToScreenReader, announceSelection } from '@/lib/utils/accessibility';
import { queryKeys } from '@/lib/react-query';
import type { Product, ProductFilters } from '@/types/product';

export interface UseProductCatalogActionsProps {
  products: Product[];
  dispatch: React.Dispatch<any>;
  selectedProducts: Set<string>;
}

export interface UseProductCatalogActionsReturn {
  handleDeleteProduct: (productId: string) => Promise<void>;
  handleDuplicateProduct: (productId: string) => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  handleBulkEdit: () => void;
  handleBulkEditSave: (productIds: string[], updateData: Partial<Product>) => Promise<void>;
  handleBulkCompare: () => void;
  handleReorder: (reorderedProducts: Product[]) => Promise<void>;
  handleSelectAll: () => void;
  handleRefresh: () => Promise<void>;
  handleQuickView: (product: Product) => void;
  handleSearchChange: (value: string) => void;
  handleFilterChange: (key: keyof ProductFilters, value: ProductFilters[keyof ProductFilters]) => void;
  handlePageChange: (page: number) => void;
  handleClearFilters: () => void;
  handleToggleReorderMode: () => void;
  toggleProductSelection: (productId: string) => void;
  deselectAllProducts: () => void;
}

export function useProductCatalogActions({
  products,
  dispatch,
  selectedProducts,
}: UseProductCatalogActionsProps): UseProductCatalogActionsReturn {
  const { userType, tenant } = useGlobalContext();
  const { user } = useTenantAuth();
  const { canAccess } = usePermissions();
  const { addToCompare, clearComparison } = useProductComparison();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteProductMutation = useDeleteProductMutation();
  const bulkDeleteMutation = useBulkDeleteProductsMutation((progress) => {
    dispatch({ type: 'SET_BULK_PROGRESS', payload: progress });
  });
  const bulkUpdateMutation = useBulkUpdateProductsMutation();
  const reorderMutation = useReorderProductsMutation();
  const duplicateProductMutation = useDuplicateProductMutation();

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      if (!canAccess('products.delete')) {
        toast.error('You do not have permission to delete products');
        announceToScreenReader('Permission denied: Cannot delete products');
        return;
      }

      if (!user?.uuid) {
        toast.error('Please wait for authentication to complete');
        return;
      }

      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

      const product = products.find(p => p.uuid === productId);
      if (!product) {
        toast.error('Product not found');
        return;
      }

      // validateTenantOwnership removed - backend handles tenant isolation
      // ProductResource doesn't expose tenant_id (security best practice)

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

      await deleteProductMutation.mutateAsync(productId);

      toast.success('Product deleted successfully');
      announceToScreenReader('Product deleted');

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
      if (!canAccess('products.create')) {
        toast.error('You do not have permission to duplicate products');
        announceToScreenReader('Permission denied: Cannot duplicate products');
        return;
      }

      if (!user?.uuid) {
        toast.error('Please wait for authentication to complete');
        return;
      }

      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

      const product = products.find(p => p.uuid === productId);
      if (!product) {
        toast.error('Product not found');
        return;
      }

      // validateTenantOwnership removed - backend handles tenant isolation
      // ProductResource doesn't expose tenant_id (security best practice)

      await duplicateProductMutation.mutateAsync(productId);

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

  const handleBulkDelete = useCallback(async () => {
    try {
      if (selectedProducts.size === 0) {
        toast.error('No products selected');
        return;
      }

      if (!canAccess('products.delete')) {
        toast.error('You do not have permission to delete products');
        announceToScreenReader('Permission denied: Cannot delete products');
        return;
      }

      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

      const selectedProductObjects = products.filter(p => selectedProducts.has(p.uuid));
      
      if (selectedProductObjects.length === 0) {
        toast.error('Selected products not found');
        return;
      }

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

      dispatch({
        type: 'SET_BULK_PROGRESS',
        payload: {
          total: selectedProducts.size,
          completed: 0,
          failed: 0,
          failedIds: [],
        }
      });

      await bulkDeleteMutation.mutateAsync(Array.from(selectedProducts));

      toast.success(`${selectedProducts.size} products deleted successfully`);
      announceToScreenReader(`${selectedProducts.size} products deleted`);
      dispatch({ type: 'CLEAR_SELECTION' });

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
  }, [selectedProducts, canAccess, userType, tenant, user, products, bulkDeleteMutation, dispatch]);

  const handleBulkEdit = useCallback(() => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    if (!canAccess('products.update')) {
      toast.error('You do not have permission to edit products');
      return;
    }

    dispatch({ type: 'OPEN_BULK_EDIT_DIALOG' });
  }, [selectedProducts, canAccess, dispatch]);

  const handleBulkEditSave = useCallback(async (productIds: string[], updateData: Partial<Product>) => {
    try {
      if (!canAccess('products.update')) {
        toast.error('You do not have permission to update products');
        announceToScreenReader('Permission denied: Cannot update products');
        return;
      }

      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

      const selectedProductObjects = products.filter(p => productIds.includes(p.uuid));
      
      if (selectedProductObjects.length === 0) {
        toast.error('Selected products not found');
        return;
      }

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

      await bulkUpdateMutation.mutateAsync({ productIds, updateData });
      
      toast.success(`${productIds.length} products updated successfully`);
      announceToScreenReader(`Successfully updated ${productIds.length} products`);
      
      dispatch({ type: 'CLEAR_SELECTION' });
      dispatch({ type: 'CLOSE_BULK_EDIT_DIALOG' });

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
  }, [bulkUpdateMutation, canAccess, userType, tenant, user, products, dispatch]);

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

    dispatch({ type: 'CLEAR_SELECTION' });

    navigate('/admin/products/compare');
  }, [selectedProducts, products, addToCompare, clearComparison, navigate, dispatch]);

  const handleReorder = useCallback(async (reorderedProducts: Product[]) => {
    try {
      if (!canAccess('products.update')) {
        toast.error('You do not have permission to reorder products');
        announceToScreenReader('Permission denied: Cannot reorder products');
        return;
      }

      validateRBACContext({ userType, tenant, user }, {
        requireTenant: true,
        requireUser: true,
        allowPlatform: false,
      });

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

      dispatch({ type: 'UPDATE_REORDER_PRODUCTS', payload: reorderedProducts });
      
      const productIds = reorderedProducts.map(p => p.uuid || p.id);

      await reorderMutation.mutateAsync(productIds);

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
      dispatch({ type: 'UPDATE_REORDER_PRODUCTS', payload: products });
      handleRBACError(error, {
        operation: 'Reorder Products',
        resourceType: 'Product',
      });
    }
  }, [reorderMutation, products, canAccess, userType, tenant, user, dispatch]);

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.size === products.length) {
      dispatch({ type: 'CLEAR_SELECTION' });
      announceSelection(0, products.length, 'product');
    } else {
      dispatch({ type: 'SELECT_ALL_PRODUCTS', payload: products.map(p => p.uuid) });
      announceSelection(products.length, products.length, 'product');
    }
  }, [selectedProducts.size, products, dispatch]);

  const handleRefresh = useCallback(async () => {
    try {
      dispatch({ type: 'SET_IS_REFRESHING', payload: true });
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      toast.success('Product data refreshed');
      announceToScreenReader('Product data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
      console.error('Refresh failed:', error);
    } finally {
      setTimeout(() => {
        dispatch({ type: 'SET_IS_REFRESHING', payload: false });
      }, 500);
    }
  }, [queryClient, dispatch]);

  const handleQuickView = useCallback((product: Product) => {
    dispatch({ type: 'OPEN_QUICK_VIEW', payload: product });
  }, [dispatch]);

  const handleSearchChange = useCallback((value: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: value });
    dispatch({ type: 'SET_FILTERS', payload: { page: 1 } });
  }, [dispatch]);

  const handleFilterChange = useCallback((key: keyof ProductFilters, value: ProductFilters[keyof ProductFilters]) => {
    dispatch({ 
      type: 'SET_FILTERS', 
      payload: {
        [key]: value === 'all' ? undefined : value,
        page: 1
      }
    });
  }, [dispatch]);

  const handlePageChange = useCallback((page: number) => {
    dispatch({ type: 'SET_FILTERS', payload: { page } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, [dispatch]);

  const handleToggleReorderMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_REORDER_MODE', payload: [...products] });
    toast.info('Reorder mode toggled');
    announceToScreenReader('Reorder mode toggled');
  }, [products, dispatch]);

  const toggleProductSelection = useCallback((productId: string) => {
    dispatch({ type: 'TOGGLE_PRODUCT_SELECTION', payload: productId });
  }, [dispatch]);

  const deselectAllProducts = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
    announceToScreenReader('All products deselected');
  }, [dispatch]);

  return {
    handleDeleteProduct,
    handleDuplicateProduct,
    handleBulkDelete,
    handleBulkEdit,
    handleBulkEditSave,
    handleBulkCompare,
    handleReorder,
    handleSelectAll,
    handleRefresh,
    handleQuickView,
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handleClearFilters,
    handleToggleReorderMode,
    toggleProductSelection,
    deselectAllProducts,
  };
}
