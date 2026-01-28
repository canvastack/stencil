import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Plus, MoreVertical, Edit, Trash2, Tag, Package, Search, Filter, RefreshCw, Eye, AlertCircle, TrendingUp, Layers, CheckCircle, XCircle,
  Download, Upload, BarChart3, CheckSquare, GitCompare, GripVertical, FileText, FileSpreadsheet, FileJson, X, Grid3x3, List
} from 'lucide-react';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/useCategories';
import { Category, CategoryFilters } from '@/types/category';
import { Skeleton } from '@/components/ui/skeleton';
import { businessTypesService, BusinessType } from '@/services/api/businessTypes';
import { categoriesService } from '@/services/api/categories';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePermissions } from '@/hooks/usePermissions';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { Navigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { APP_CONFIG } from '@/lib/constants';
import { announceToScreenReader } from '@/lib/utils/accessibility';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTableRowProps {
  category: Category;
  children: React.ReactNode;
}

function SortableTableRow({ category, children }: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'opacity-50',
        'hover:bg-muted/50'
      )}
    >
      <TableCell className="w-12">
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted',
            isDragging && 'cursor-grabbing'
          )}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
}

export default function ProductCategories() {
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
              You do not have permission to view product categories.
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
                <CardTitle>Error Loading Categories</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred while loading product categories.
                Please try reloading the page or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline" 
                className="w-full"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error('Product Categories Error:', error, errorInfo);
      }}
    >
      <ProductCategoriesContent />
    </ErrorBoundary>
  );
}

interface SortableItemProps {
  category: Category;
  isSelectMode: boolean;
  isComparisonMode: boolean;
  isReorderMode: boolean;
  selectedCategories: string[];
  isSaving: boolean;
  onCategorySelect: (categoryId: string, checked: boolean) => void;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

function SortableItem({
  category,
  isSelectMode,
  isComparisonMode,
  isReorderMode,
  selectedCategories,
  isSaving,
  onCategorySelect,
  onEdit,
  onDelete,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: !isReorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeftColor: category.color || '#ff8000',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:shadow-lg transition-all duration-300 border-l-4 overflow-hidden",
        selectedCategories.includes(category.id) && "ring-2 ring-primary shadow-lg",
        isReorderMode && "cursor-move"
      )}
      {...(isReorderMode ? { ...attributes, ...listeners } : {})}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {isReorderMode && (
              <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
            )}
            {(isSelectMode || isComparisonMode) && !isReorderMode && (
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) => onCategorySelect(category.id, !!checked)}
                aria-label={`Select ${category.name}`}
              />
            )}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color || '#ff8000'}20` }}
            >
              <Tag className="w-6 h-6" style={{ color: category.color || '#ff8000' }} />
            </div>
            <div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {category.name}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                /{category.slug}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={(category.visibility?.isActive ?? category.is_active) ? "default" : "secondary"} className="text-xs">
              {(category.visibility?.isActive ?? category.is_active) ? "Active" : "Inactive"}
            </Badge>

            {!isReorderMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast.info(`Viewing products in ${category.name}`)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Products
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(category.id)}
                    className="text-destructive"
                    disabled={isSaving}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {category.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {category.stats?.productCount ?? category.product_count ?? 0} {(category.stats?.productCount ?? category.product_count ?? 0) === 1 ? 'product' : 'products'}
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Created {new Date(category.timestamps?.createdAt || category.created_at).toLocaleDateString()}
          </div>
        </div>

        {!isReorderMode && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => toast.info(`Viewing products in ${category.name}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Products
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(category)}
              disabled={isSaving}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductCategoriesContent() {
  const { canAccess } = usePermissions();
  const {
    categories,
    isLoading,
    isSaving,
    pagination,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CategoryFilters>({
    sort: 'sort_order',
    order: 'asc',
    page: 1,
    per_page: 12,
  });
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [businessTypesLoading, setBusinessTypesLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    business_type: '',
    description: '',
    color: '#ff8000',
    is_active: true,
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showColumnCustomization, setShowColumnCustomization] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reorderedCategories, setReorderedCategories] = useState<Category[]>([]);
  const [tempSortOrders, setTempSortOrders] = useState<Record<string, number>>({});
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, APP_CONFIG.SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearch || undefined, page: 1 }));
    }
  }, [debouncedSearch, filters.search]);

  // Load categories when filters change
  useEffect(() => {
    console.log('[ProductCategories] Fetching categories with filters:', filters);
    fetchCategories(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
  
  // Debug log for categories state changes
  useEffect(() => {
    console.log('[ProductCategories] Categories state changed:', {
      isLoading,
      categoriesLength: categories?.length,
      categoriesIsArray: Array.isArray(categories),
      categories: categories
    });
  }, [categories, isLoading]);

  // Load business types on component mount
  useEffect(() => {
    const loadBusinessTypes = async () => {
      setBusinessTypesLoading(true);
      try {
        const response = await businessTypesService.getBusinessTypes();
        setBusinessTypes(response.data);
      } catch (error) {
        console.error('Failed to load business types:', error);
      } finally {
        setBusinessTypesLoading(false);
      }
    };
    loadBusinessTypes();
  }, []);

  const stats = useMemo(() => {
    const categoriesData = categories || [];
    return {
      totalCategories: pagination?.total || 0,
      activeCount: categoriesData.filter((c) => c.visibility?.isActive ?? c.is_active).length,
      inactiveCount: categoriesData.filter((c) => !(c.visibility?.isActive ?? c.is_active)).length,
      totalProducts: categoriesData.reduce((sum, c) => sum + (c.stats?.productCount ?? c.product_count ?? 0), 0),
    };
  }, [categories, pagination?.total]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({
      sort: 'sort_order',
      order: 'asc',
      page: 1,
      per_page: 12,
    });
    announceToScreenReader('Filters cleared');
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const keyboardShortcuts = useMemo(() => [
    {
      key: '/',
      description: 'Focus search',
      handler: (e: KeyboardEvent) => {
        e.preventDefault();
        searchInputRef.current?.focus();
      },
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'Create new category',
      handler: (e: KeyboardEvent) => {
        if (canAccess('products.create')) {
          e.preventDefault();
          setIsDialogOpen(true);
        }
      },
    },
    {
      key: 'r',
      description: 'Refresh categories',
      handler: (e: KeyboardEvent) => {
        e.preventDefault();
        fetchCategories(filters);
        toast.success('Categories refreshed');
      },
    },
    {
      key: 'Escape',
      description: 'Clear filters',
      handler: () => {
        if (searchQuery || filters.is_active !== undefined) {
          handleClearFilters();
        }
      },
    },
  ], [canAccess, searchQuery, filters, handleClearFilters, fetchCategories]);

  useKeyboardShortcuts(keyboardShortcuts, true);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search || 
      filters.is_active !== undefined || 
      filters.business_type ||
      filters.parent_id
    );
  }, [filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ 
        name: '', 
        slug: '', 
        business_type: '',
        description: '', 
        color: '#ff8000',
        is_active: true,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      business_type: category.business_type || '',
      description: category.description || '',
      color: category.color || '#ff8000',
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      await deleteCategory(id);
    }
  };

  const handleFilterChange = useCallback((key: keyof CategoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchCategories(filters);
      toast.success('Categories refreshed');
      announceToScreenReader('Categories refreshed');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [fetchCategories, filters]);

  const handleToggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev);
    if (isComparisonMode) setIsComparisonMode(false);
    if (!isSelectMode) {
      setSelectedCategories([]);
      toast.info('Selection mode activated');
    } else {
      toast.info('Selection mode deactivated');
    }
  }, [isSelectMode, isComparisonMode]);

  const handleToggleComparisonMode = useCallback(() => {
    setIsComparisonMode(prev => !prev);
    if (isSelectMode) setIsSelectMode(false);
    if (!isComparisonMode) {
      setSelectedCategories([]);
      toast.info('Comparison mode activated - Select 2-4 categories');
    } else {
      toast.info('Comparison mode deactivated');
    }
  }, [isComparisonMode, isSelectMode]);

  const handleToggleReorderMode = useCallback(async () => {
    if (isReorderMode) {
      try {
        let updates;
        
        if (viewMode === 'grid') {
          updates = reorderedCategories.map((category, index) => ({
            id: category.id,
            sort_order: index + 1,
          }));
        } else {
          updates = Object.entries(tempSortOrders).map(([id, sort_order]) => ({
            id,
            sort_order,
          }));
        }
        
        await categoriesService.reorderCategories(updates);
        
        toast.success('Order saved successfully');
        await fetchCategories(filters);
      } catch (error) {
        toast.error('Failed to save category order');
        console.error('Error saving order:', error);
      }
    } else {
      if (viewMode === 'grid') {
        toast.info('Reorder mode activated - Drag to reorder');
      } else {
        toast.info('Reorder mode activated - Edit sort order numbers');
      }
    }
    setIsReorderMode(prev => !prev);
  }, [isReorderMode, reorderedCategories, tempSortOrders, viewMode, fetchCategories, filters]);

  const handleCategorySelect = useCallback((categoryId: string, checked: boolean) => {
    setSelectedCategories(prev => {
      if (checked) {
        const newSelection = [...prev, categoryId];
        if (isComparisonMode && newSelection.length > 4) {
          toast.warning('Maximum 4 categories can be compared');
          return prev;
        }
        return newSelection;
      }
      return prev.filter(id => id !== categoryId);
    });
  }, [isComparisonMode]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setReorderedCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    try {
      const headers = ['ID', 'Name', 'Slug', 'Business Type', 'Description', 'Status', 'Product Count', 'Created At'];
      const rows = categories.map(cat => [
        cat.id,
        cat.name,
        cat.slug,
        cat.business_type || '',
        cat.description || '',
        (cat.visibility?.isActive ?? cat.is_active) ? 'Active' : 'Inactive',
        cat.stats?.productCount ?? cat.product_count ?? 0,
        new Date(cat.timestamps?.createdAt || cat.created_at).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `product-categories-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Categories exported as CSV');
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Failed to export CSV');
    }
  }, [categories]);

  const handleExportJSON = useCallback(() => {
    try {
      const exportData = categories.map(cat => ({
        id: cat.id,
        uuid: cat.uuid,
        name: cat.name,
        slug: cat.slug,
        business_type: cat.business_type,
        description: cat.description,
        color: cat.color,
        is_active: cat.visibility?.isActive ?? cat.is_active,
        product_count: cat.stats?.productCount ?? cat.product_count ?? 0,
        sort_order: cat.sort_order,
        created_at: cat.timestamps?.createdAt || cat.created_at,
        updated_at: cat.timestamps?.updatedAt || cat.updated_at
      }));

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `product-categories-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Categories exported as JSON');
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export JSON error:', error);
      toast.error('Failed to export JSON');
    }
  }, [categories]);

  const handleExportExcel = useCallback(() => {
    try {
      const headers = ['ID', 'Name', 'Slug', 'Business Type', 'Description', 'Status', 'Product Count', 'Created At'];
      const rows = categories.map(cat => [
        cat.id,
        cat.name,
        cat.slug,
        cat.business_type || '',
        cat.description || '',
        (cat.visibility?.isActive ?? cat.is_active) ? 'Active' : 'Inactive',
        cat.stats?.productCount ?? cat.product_count ?? 0,
        new Date(cat.timestamps?.createdAt || cat.created_at).toLocaleDateString()
      ]);

      let csvContent = '\uFEFF';
      csvContent += headers.join('\t') + '\n';
      csvContent += rows.map(row => row.join('\t')).join('\n');

      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `product-categories-${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Categories exported as Excel');
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export Excel error:', error);
      toast.error('Failed to export Excel');
    }
  }, [categories]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedCategories.length === 0) {
      toast.warning('No categories selected');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedCategories.length} ${selectedCategories.length === 1 ? 'category' : 'categories'}? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const deletePromises = selectedCategories.map(categoryId => deleteCategory(categoryId));
      await Promise.all(deletePromises);
      
      toast.success(`Successfully deleted ${selectedCategories.length} ${selectedCategories.length === 1 ? 'category' : 'categories'}`);
      setSelectedCategories([]);
      setIsSelectMode(false);
      await fetchCategories(filters);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some categories. Please try again.');
    }
  }, [selectedCategories, deleteCategory, fetchCategories, filters]);

  const handleImportFile = useCallback(async () => {
    if (!importFile) {
      toast.warning('Please select a file to import');
      return;
    }

    setIsImporting(true);
    try {
      const fileContent = await importFile.text();
      let categoriesToImport: any[] = [];

      if (importFile.name.endsWith('.json')) {
        categoriesToImport = JSON.parse(fileContent);
      } else if (importFile.name.endsWith('.csv')) {
        const lines = fileContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
          const category: any = {};
          
          headers.forEach((header, index) => {
            const value = values[index];
            if (header === 'is_active' || header === 'Status') {
              category.is_active = value === 'Active' || value === 'true';
            } else if (header === 'product_count' || header === 'Product Count') {
              // Skip, this is read-only
            } else if (header === 'sort_order') {
              category.sort_order = parseInt(value) || 0;
            } else if (header.toLowerCase() === 'name') {
              category.name = value;
            } else if (header.toLowerCase() === 'slug') {
              category.slug = value;
            } else if (header.toLowerCase() === 'description') {
              category.description = value;
            } else if (header.toLowerCase() === 'business_type' || header === 'Business Type') {
              category.business_type = value || undefined;
            } else if (header.toLowerCase() === 'color') {
              category.color = value || '#ff8000';
            }
          });
          
          if (category.name) {
            categoriesToImport.push(category);
          }
        }
      } else {
        toast.error('Unsupported file format. Please use CSV or JSON.');
        return;
      }

      if (categoriesToImport.length === 0) {
        toast.warning('No valid categories found in the file');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const category of categoriesToImport) {
        try {
          await createCategory(category);
          successCount++;
        } catch (error) {
          console.error('Failed to import category:', category.name, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} ${successCount === 1 ? 'category' : 'categories'}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
        await fetchCategories(filters);
        setShowImportDialog(false);
        setImportFile(null);
      } else {
        toast.error('Failed to import categories');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to parse import file. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  }, [importFile, createCategory, fetchCategories, filters]);

  useEffect(() => {
    if (categories.length > 0) {
      setReorderedCategories(categories);
      const sortOrders: Record<string, number> = {};
      categories.forEach(cat => {
        sortOrders[cat.id] = cat.sort_order ?? 0;
      });
      setTempSortOrders(sortOrders);
    }
  }, [categories]);

  const tableColumns = useMemo<ColumnDef<Category>[]>(() => {
    const columns: ColumnDef<Category>[] = [];

    if (isSelectMode || isComparisonMode) {
      columns.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value) {
                setSelectedCategories(categories.map(c => c.id));
              } else {
                setSelectedCategories([]);
              }
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedCategories.includes(row.original.id)}
            onCheckedChange={(value) => handleCategorySelect(row.original.id, !!value)}
            aria-label={`Select ${row.original.name}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    if (isReorderMode) {
      columns.push({
        accessorKey: 'sort_order',
        header: 'Order',
        cell: ({ row }) => (
          <Input
            type="number"
            value={tempSortOrders[row.original.id] ?? row.original.sort_order ?? 0}
            onChange={(e) => {
              const newValue = parseInt(e.target.value) || 0;
              setTempSortOrders(prev => ({
                ...prev,
                [row.original.id]: newValue
              }));
            }}
            className="w-20"
            min="0"
          />
        ),
        enableSorting: false,
      });
    }

    columns.push(
      {
        accessorKey: 'name',
        header: 'Category Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${row.original.color || '#ff8000'}20` }}
            >
              <Tag className="w-4 h-4" style={{ color: row.original.color || '#ff8000' }} />
            </div>
            <div>
              <div className="font-medium">{row.original.name}</div>
              <div className="text-xs text-muted-foreground">/{row.original.slug}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'business_type',
        header: 'Business Type',
        cell: ({ row }) => row.original.business_type ? (
          <Badge variant="outline">{row.original.business_type}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        ),
      },
      {
        accessorKey: 'product_count',
        header: 'Products',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span>{row.original.stats?.productCount ?? row.original.product_count ?? 0}</span>
          </div>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={(row.original.visibility?.isActive ?? row.original.is_active) ? "default" : "secondary"}>
            {(row.original.visibility?.isActive ?? row.original.is_active) ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.timestamps?.createdAt || row.original.created_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => toast.info(`Viewing products in ${row.original.name}`)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {canAccess('products.edit') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleEdit(row.original)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canAccess('products.delete') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDelete(row.original.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ),
        enableSorting: false,
      }
    );

    return columns;
  }, [isSelectMode, isComparisonMode, isReorderMode, selectedCategories, categories, tempSortOrders, canAccess, handleCategorySelect, handleEdit, handleDelete]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-light bg-clip-text text-transparent">
            Product Categories
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize your products into categories for better navigation
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingCategory(null);
                setFormData({ 
                  name: '', 
                  slug: '',
                  business_type: '',
                  description: '', 
                  color: '#ff8000',
                  is_active: true,
                });
              }}
              className="bg-gradient-to-r from-primary to-orange-light hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Update the category information below' 
                  : 'Add a new product category to organize your items'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="e.g., Awards & Trophies"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="awards-trophies"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in the URL: /products/{formData.slug || 'category-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type</Label>
                <Select 
                  value={formData.business_type || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, business_type: value === 'none' ? '' : value })}
                  disabled={businessTypesLoading}
                >
                  <SelectTrigger id="business_type">
                    <SelectValue placeholder={businessTypesLoading ? "Loading..." : "Select business type (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Business type classification for products in this category
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Category Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#ff8000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={String(formData.is_active)} 
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Active categories will be visible on the public website
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    `${editingCategory ? 'Update' : 'Create'} Category`
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Categories</DialogTitle>
            <DialogDescription>
              Choose the format to export your categories data
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={handleExportCSV}
              className="w-full justify-start"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export as CSV
            </Button>
            <Button
              onClick={handleExportExcel}
              className="w-full justify-start"
              variant="outline"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export as Excel
            </Button>
            <Button
              onClick={handleExportJSON}
              className="w-full justify-start"
              variant="outline"
            >
              <FileJson className="mr-2 h-4 w-4" />
              Export as JSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Column Customization Dialog */}
      <Dialog open={showColumnCustomization} onOpenChange={setShowColumnCustomization}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Customize Columns</DialogTitle>
            <DialogDescription>
              Select which columns to display in the table view
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="text-sm text-muted-foreground">
              Column customization is available in table view. All columns are currently visible.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Categories</DialogTitle>
            <DialogDescription>
              Upload a CSV or JSON file to import categories
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Select File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                disabled={isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: CSV, JSON
              </p>
            </div>

            {importFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{importFile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(importFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImportFile(null)}
                    disabled={isImporting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Import Format Guidelines:
              </div>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
                <li>CSV: First row must contain headers (Name, Slug, Description, Business Type, Status, Color)</li>
                <li>JSON: Array of objects with properties: name, slug, description, business_type, is_active, color</li>
                <li>Name and Slug are required fields</li>
                <li>Existing categories with same slug will be skipped</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                }}
                disabled={isImporting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportFile}
                disabled={!importFile || isImporting}
                className="flex-1"
              >
                {isImporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comparison Dialog */}
      <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Categories</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of selected categories
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCategories.length >= 2 ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedCategories.length}, 1fr)` }}>
                {selectedCategories.map(categoryId => {
                  const category = categories.find(c => c.id === categoryId);
                  if (!category) return null;
                  
                  return (
                    <Card key={category.id} className="border-l-4" style={{ borderLeftColor: category.color || '#ff8000' }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color || '#ff8000'}20` }}
                          >
                            <Tag className="w-6 h-6" style={{ color: category.color || '#ff8000' }} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <CardDescription className="text-xs">/{category.slug}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={(category.visibility?.isActive ?? category.is_active) ? "default" : "secondary"}>
                          {(category.visibility?.isActive ?? category.is_active) ? "Active" : "Inactive"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Description</div>
                          <div className="text-sm">{category.description || 'No description'}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Business Type</div>
                          <div className="text-sm">{category.business_type || '-'}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Products</div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span>{category.stats?.productCount ?? category.product_count ?? 0}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Color</div>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: category.color || '#ff8000' }}
                            />
                            <span>{category.color || '#ff8000'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Sort Order</div>
                          <div className="text-sm">{category.sort_order ?? '-'}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Created</div>
                          <div className="text-sm">{new Date(category.timestamps?.createdAt || category.created_at).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Updated</div>
                          <div className="text-sm">{new Date(category.timestamps?.updatedAt || category.updated_at).toLocaleString()}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please select at least 2 categories to compare
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            aria-label="Refresh category list"
          >
            <RefreshCw className={`w-4 h-4 md:mr-2 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          
          <Button 
            variant={showAnalytics ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAnalytics(prev => !prev)}
            aria-label={showAnalytics ? "Hide analytics" : "Show analytics"}
          >
            <BarChart3 className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">{showAnalytics ? 'Hide Analytics' : 'Analytics'}</span>
          </Button>

          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            disabled={isLoading || categories.length === 0}
            aria-label={`Export ${categories.length} categories`}
          >
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Export</span>
          </Button>

          {canAccess('products.create') && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
              disabled={isLoading}
              aria-label="Import categories from file"
            >
              <Upload className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Import</span>
            </Button>
          )}

          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowColumnCustomization(true)}
            disabled={viewMode === 'grid'}
            aria-label="Customize table columns"
          >
            <List className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Columns ({viewMode === 'table' ? '7/7' : '-'})</span>
          </Button>

          <Button 
            variant={isSelectMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleSelectMode}
            aria-label={isSelectMode ? 'Exit selection mode' : 'Enter selection mode for bulk operations'}
          >
            <CheckSquare className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">{isSelectMode ? 'Exit Select Mode' : 'Select Mode'}</span>
          </Button>

          <Button 
            variant={isComparisonMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleComparisonMode}
            aria-label={isComparisonMode ? 'Exit comparison mode' : 'Enter comparison mode'}
          >
            <GitCompare className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">{isComparisonMode ? 'Exit Compare' : 'Compare Categories'}</span>
          </Button>

          {canAccess('products.edit') && (
            <Button 
              variant={isReorderMode ? "default" : "outline"}
              size="sm"
              onClick={handleToggleReorderMode}
              disabled={isLoading || categories.length === 0}
              aria-label={isReorderMode ? 'Save reordered categories' : 'Enter reorder mode'}
              title="Drag & drop to reorder categories"
            >
              <GripVertical className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{isReorderMode ? 'Save Order' : 'Reorder Categories'}</span>
            </Button>
          )}

          <Button 
            variant={viewMode === 'table' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(prev => prev === 'grid' ? 'table' : 'grid')}
            aria-label={`Switch to ${viewMode === 'grid' ? 'table' : 'grid'} view`}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4 md:mr-2" /> : <Grid3x3 className="w-4 h-4 md:mr-2" />}
            <span className="hidden md:inline">{viewMode === 'grid' ? 'Table View' : 'Grid View'}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Across all types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground">
              Visible categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveCount}</div>
            <p className="text-xs text-muted-foreground">
              Hidden categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              In all categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search categories by name, slug, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
                    }
                  }}
                  className="pl-10 pr-10"
                  aria-label="Search categories"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilters(prev => ({ ...prev, search: undefined, page: 1 }));
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchQuery && searchQuery !== filters.search && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }))}
                  className="whitespace-nowrap"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Apply
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select 
                value={filters.business_type || 'all'} 
                onValueChange={(value) => 
                  handleFilterChange('business_type', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Business Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Business Types</SelectItem>
                  {businessTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.parent_id || 'all'} 
                onValueChange={(value) => 
                  handleFilterChange('parent_id', value === 'all' ? undefined : (value === 'none' ? null : value))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Parent Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="none">Top Level Only</SelectItem>
                  {categories?.filter(c => !c.parent_id).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.is_active !== undefined ? String(filters.is_active) : 'all'} 
                onValueChange={(value) => 
                  handleFilterChange('is_active', value === 'all' ? undefined : value === 'true')
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.sort || 'sort_order'} 
                onValueChange={(value) => handleFilterChange('sort', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sort_order">Sort Order</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="updated_at">Updated Date</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-l-4 border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="w-8 h-8 rounded" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-10" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : Array.isArray(categories) && categories.length > 0 ? (
        <>
          {/* Bulk Actions Bar */}
          {(isSelectMode || isComparisonMode) && selectedCategories.length > 0 && (
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
                    </span>
                    {isSelectMode && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toast.info('Bulk edit coming soon')}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Selected
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toast.info('Bulk activate coming soon')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Activate
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive"
                          onClick={handleBulkDelete}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    )}
                    {isComparisonMode && selectedCategories.length >= 2 && (
                      <Button size="sm" onClick={() => setShowComparisonDialog(true)}>
                        <GitCompare className="w-4 h-4 mr-2" />
                        Compare {selectedCategories.length} Categories
                      </Button>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedCategories([])}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'grid' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={isReorderMode ? reorderedCategories.map(c => c.id) : categories.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(isReorderMode ? reorderedCategories : categories).map((category) => (
                    <SortableItem
                      key={category.id}
                      category={category}
                      isSelectMode={isSelectMode}
                      isComparisonMode={isComparisonMode}
                      isReorderMode={isReorderMode}
                      selectedCategories={selectedCategories}
                      isSaving={isSaving}
                      onCategorySelect={handleCategorySelect}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <>
              {isReorderMode ? (
                <Card>
                  <CardContent className="p-6">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={reorderedCategories.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Drag & Drop Mode:</strong> Drag the handle icon to reorder categories. Click <strong>Save Order</strong> when done.
                          </p>
                        </div>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Business Type</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reorderedCategories.map((category) => (
                                <SortableTableRow key={category.id} category={category}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-3 h-3 rounded-full flex-shrink-0" 
                                        style={{ backgroundColor: category.color || '#ff8000' }}
                                      />
                                      <div>
                                        <div className="font-medium">{category.name}</div>
                                        <div className="text-sm text-muted-foreground">{category.slug}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {category.business_type ? (
                                      <Badge variant="outline">{category.business_type}</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4 text-muted-foreground" />
                                      <span>{category.stats?.productCount ?? category.product_count ?? 0}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={(category.visibility?.isActive ?? category.is_active) ? "default" : "secondary"}>
                                      {(category.visibility?.isActive ?? category.is_active) ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {new Date(category.timestamps?.createdAt || category.created_at).toLocaleDateString()}
                                  </TableCell>
                                </SortableTableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <DataTable
                      columns={tableColumns}
                      data={categories}
                      searchKey="name"
                      searchPlaceholder="Search categories..."
                      showExport={false}
                      showPrint={false}
                      showPagination={false}
                      loading={isLoading}
                      datasetId="product-categories"
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      ) : null}

      {!isLoading && Array.isArray(categories) && categories.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No categories yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Create your first category to organize your products
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </div>
        </Card>
      )}
      
      {!isLoading && !Array.isArray(categories) && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Tag className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600">Error Loading Categories</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Invalid data received from server. Please try refreshing the page.
              </p>
            </div>
            <Button onClick={() => fetchCategories(filters)} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && Array.isArray(categories) && categories.length > 0 && pagination && (
        <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of <span className="font-semibold text-foreground">{pagination.total} categories</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
              <Select
                value={String(pagination.per_page)}
                onValueChange={(value) => setFilters(prev => ({ ...prev, per_page: Number(value), page: 1 }))}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {pagination.last_page > 1 && (
            <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Page {pagination.page} of {pagination.last_page}
            </div>
            <Pagination className="mx-0 justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(pagination.page - 1)}
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
                          onClick={() => handlePageChange(pageNum)}
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
                    return <PaginationItem key={pageNum}>...</PaginationItem>;
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className={pagination.page === pagination.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
