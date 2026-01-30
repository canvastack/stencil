import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { useCustomers } from '@/hooks/useCustomers';
import { useDeleteLoading } from '@/hooks/useDeleteLoading';
import { useCustomerExportImport } from '@/hooks/customers/useCustomerExportImport';
import type { Customer, CustomerFilters as BaseCustomerFilters, CustomerType, CustomerStatus } from '@/types/customer';

type ExtendedCustomerFilters = BaseCustomerFilters & { page?: number; per_page?: number };
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  Building,
  User,
  DollarSign,
  ShoppingBag,
  Download,
  Upload,
  UserCheck,
  Calendar,
  TrendingUp,
  X,
  RefreshCw,
  BarChart3,
  CheckSquare,
  FileText,
  FileSpreadsheet,
  FileJson,
  AlertCircle
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { APP_CONFIG } from '@/lib/constants';
import type { ExportFormat } from '@/services/export/customerExportService';

export default function CustomerDatabase() {
  const navigate = useNavigate();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Remove searchQuery state since we're using DataTable's built-in search
  // const [searchQuery, setSearchQuery] = useState('');
  // const debouncedSearch = useDebounce(searchQuery, APP_CONFIG.SEARCH_DEBOUNCE_MS || 300);
  
  const [filters, setFilters] = useState<ExtendedCustomerFilters>({
    search: '',
    customerType: undefined,
    status: undefined,
    city: '', // Keep as 'city' for backend compatibility but use as contact filter
    minOrders: undefined,
    minSpent: undefined,
    page: 1,
    per_page: 20, // Add default per_page
  });

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { 
    customers, 
    pagination,
    overallStats,
    filteredStats,
    isLoading, 
    error, 
    fetchCustomers,
    fetchCustomerStats,
    deleteCustomer 
  } = useCustomers();

  // Delete loading functionality
  const deleteLoading = useDeleteLoading({
    onDelete: async (customerId: string) => {
      await deleteCustomer(customerId);
    },
    onSuccess: (customerId: string) => {
      toast.success('Customer deleted successfully');
    },
    onError: (customerId: string, error: any) => {
      console.error('Delete failed:', error);
      toast.error('Failed to delete customer');
    },
  });

  // Export/Import functionality
  const exportImport = useCustomerExportImport({
    customers,
    selectedCustomers,
    onImportSuccess: () => {
      fetchCustomers(filters);
      setShowImportDialog(false);
      setImportResult(null);
    },
  });

  // Update filters when search changes from DataTable
  // useEffect(() => {
  //   if (debouncedSearch !== filters.search) {
  //     setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  //   }
  // }, [debouncedSearch, filters.search]);

  // Fetch customers when filters change
  useEffect(() => {
    fetchCustomers(filters);
  }, [filters, fetchCustomers]);

  // Fetch overall stats on component mount
  useEffect(() => {
    fetchCustomerStats();
  }, [fetchCustomerStats]);

  // Debug pagination data
  useEffect(() => {
    console.log('[CustomerDatabase] Pagination Debug:', {
      isLoading,
      customersLength: customers.length,
      pagination,
      paginationLastPage: pagination?.last_page,
      shouldShowPagination: !isLoading && customers.length > 0 && pagination && pagination.last_page > 1,
      filters
    });
  }, [isLoading, customers.length, pagination, filters]);

  const handleFilterChange = useCallback((key: keyof ExtendedCustomerFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: key === 'page' ? value : 1, // Reset to page 1 when other filters change
    }));
  }, []);

  // Remove these handlers since we're using DataTable's built-in controls
  // const handleSearchChange = useCallback((value: string) => {
  //   setSearchQuery(value);
  // }, []);

  // const handleClearSearch = useCallback(() => {
  //   setSearchQuery('');
  //   setFilters(prev => ({ ...prev, search: '' }));
  // }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchCustomers(filters);
      toast.success('Customer data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchCustomers, filters]);

  const handleViewCustomer = useCallback((customer: Customer) => {
    // Navigate to customer detail page instead of opening modal
    navigate(`/admin/customers/${customer.id}`);
  }, [navigate]);

  const handleSendEmail = useCallback((customer: Customer) => {
    // Check if email is configured first
    // For now, redirect to email settings with a helpful message
    toast.info(`To send emails to ${customer.name}, please configure email settings first.`, {
      action: {
        label: 'Configure Email',
        onClick: () => navigate('/admin/settings/general?tab=email')
      }
    });
  }, [navigate]);

  const handleViewOrders = useCallback((customer: Customer) => {
    // Navigate to customer detail page with orders tab active
    navigate(`/admin/customers/${customer.id}?tab=orders`);
  }, [navigate]);

  const handleDeleteCustomer = useCallback(async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      await deleteLoading.handleDelete(customerId);
    }
  }, [deleteLoading]);

  const handleSelectCustomer = useCallback((customerId: string) => {
    setSelectedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    }
  }, [customers, selectedCustomers.size]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedCustomers.size === 0) {
      toast.error('No customers selected');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedCustomers.size} customers? This action cannot be undone.`)) {
      try {
        // Start delete loading for all selected customers
        for (const customerId of selectedCustomers) {
          deleteLoading.startDelete(customerId);
        }
        
        // Delete customers sequentially to avoid overwhelming the server
        for (const customerId of selectedCustomers) {
          try {
            await deleteCustomer(customerId);
            deleteLoading.endDelete(customerId);
          } catch (error) {
            deleteLoading.endDelete(customerId);
            console.error(`Failed to delete customer ${customerId}:`, error);
          }
        }
        
        setSelectedCustomers(new Set());
        toast.success(`${selectedCustomers.size} customers deleted successfully`);
      } catch (error) {
        // Clear all delete loading states on general error
        deleteLoading.clearAll();
        toast.error('Failed to delete some customers');
      }
    }
  }, [selectedCustomers, deleteCustomer, deleteLoading]);

  const handleExport = useCallback((format: ExportFormat) => {
    exportImport.handleExport(format, false);
  }, [exportImport]);

  const handleExportSelected = useCallback((format: ExportFormat) => {
    exportImport.handleExport(format, true);
  }, [exportImport]);

  const handleImportClick = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const result = await exportImport.handleFileSelect(event);
    if (result) {
      setImportResult(result);
    }
  }, [exportImport]);

  const handleImportConfirm = useCallback(async () => {
    await exportImport.handleImportConfirm(importResult);
  }, [exportImport, importResult]);

  const handleImportCancel = useCallback(() => {
    setShowImportDialog(false);
    setImportResult(null);
    exportImport.handleCancelImport();
  }, [exportImport]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    handleFilterChange('page', page);
  }, [handleFilterChange]);

  // DataTable callback handlers
  const handleDataTableSearch = useCallback((value: string) => {
    handleFilterChange('search', value);
  }, [handleFilterChange]);

  const handleDataTablePageSizeChange = useCallback((pageSize: number) => {
    handleFilterChange('per_page', pageSize);
  }, [handleFilterChange]);

  const handleClearFilters = () => {
    // setSearchQuery(''); // Remove this since we're using DataTable's search
    setFilters({
      search: '',
      customerType: undefined,
      status: undefined,
      city: '', // Keep as 'city' for backend compatibility but represents contact filter
      minOrders: undefined,
      minSpent: undefined,
      page: 1,
      per_page: 20,
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search || 
      filters.customerType || 
      filters.status || 
      filters.city ||
      filters.minOrders ||
      filters.minSpent
    );
  }, [filters]);

  // Real-time sync indicator (placeholder)
  const wsConnected = false;

  // Enhanced Card with hover effects and shine animation
  const EnhancedCard = ({ 
    children, 
    className = "",
    ...props 
  }: { 
    children: React.ReactNode; 
    className?: string;
    [key: string]: any;
  }) => (
    <Card 
      className={cn(
        "relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        isRefreshing && "animate-pulse",
        className
      )}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
      {children}
    </Card>
  );

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: CustomerType) => {
    return type === 'business' ? (
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        <Building className="w-3 h-3 mr-1" />
        Business
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-600 border-gray-600">
        <User className="w-3 h-3 mr-1" />
        Individual
      </Badge>
    );
  };

  // Table columns configuration with selection support
  const columns: ColumnDef<Customer>[] = [
    ...(isSelectMode ? [{
      id: 'select',
      header: ({ table }: { table: any }) => (
        <div className="flex items-center">
          <Checkbox
            checked={selectedCustomers.size === customers.length && customers.length > 0}
            onCheckedChange={handleSelectAll}
            aria-label="Select all customers on current page"
            className="translate-y-[2px]"
          />
        </div>
      ),
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center">
          <Checkbox
            checked={selectedCustomers.has(row.original.id)}
            onCheckedChange={() => handleSelectCustomer(row.original.id)}
            aria-label={`Select customer ${row.original.name}`}
            className="translate-y-[2px]"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }] : []),
    {
      accessorKey: 'name',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold">{customer.name}</div>
              <div className="text-sm text-muted-foreground">{customer.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'customerType',
      header: 'Type',
      cell: ({ row }) => getTypeBadge(row.original.customerType),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.company || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Phone className="w-3 h-3" />
              <span>{customer.phone || '-'}</span>
            </div>
            {customer.city && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{customer.city}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'totalOrders',
      header: 'Orders',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-center">
            <div className="font-semibold">{customer.totalOrders}</div>
            <div className="text-xs text-muted-foreground">orders</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalSpent',
      header: 'Total Spent',
      cell: ({ row }) => (
        <div className="text-right font-semibold text-green-600">
          {formatCurrency(row.original.totalSpent)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.createdAt ? format(new Date(row.original.createdAt), 'dd/MM/yyyy') : 'N/A'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/customers/${customer.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Customer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendEmail(customer)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewOrders(customer)}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteCustomer(customer.id)}
                className="text-red-600"
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

  // Calculate summary stats from filtered data (current table)
  // Use filtered stats from backend API response
  const filteredTotalCustomers = filteredStats?.total || 0;
  const filteredActiveCustomers = filteredStats?.active || 0;
  const filteredBusinessCustomers = filteredStats?.business || 0;
  const filteredTotalRevenue = filteredStats?.totalRevenue || 0;

  // Overall stats from backend (entire tenant)
  const overallTotalCustomers = overallStats?.total || 0;
  const overallActiveCustomers = overallStats?.active || 0;
  const overallBusinessCustomers = overallStats?.business || 0;
  const overallTotalRevenue = overallStats?.totalRevenue || 0;

  // Debug logging
  useEffect(() => {
    console.log('[CustomerDatabase] Overall Stats Debug:', {
      overallStats,
      overallTotalCustomers,
      overallActiveCustomers,
      overallBusinessCustomers,
      overallTotalRevenue
    });
    console.log('[CustomerDatabase] Filtered Stats Debug:', {
      filteredStats,
      filteredTotalCustomers,
      filteredActiveCustomers,
      filteredBusinessCustomers,
      filteredTotalRevenue
    });
  }, [overallStats, overallTotalCustomers, overallActiveCustomers, overallBusinessCustomers, overallTotalRevenue, filteredStats, filteredTotalCustomers, filteredActiveCustomers, filteredBusinessCustomers, filteredTotalRevenue]);

  return (
    <LazyWrapper>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Database</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage your customer information and relationships</p>
          </div>
          <Button 
            size="sm"
            onClick={() => navigate('/admin/customers/new')}
            aria-label="Add new customer"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Add Customer</span>
          </Button>
        </div>

        {/* Sticky Toolbar with Backdrop Blur */}
        <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh} 
              disabled={isLoading || isRefreshing}
              aria-label="Refresh customer list"
              aria-busy={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 md:mr-2", (isLoading || isRefreshing) && "animate-spin")} />
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
                  disabled={isLoading || customers.length === 0}
                  aria-label={`Export ${customers.length} customers in various formats`}
                  aria-haspopup="menu"
                >
                  <Download className="w-4 h-4 md:mr-2" aria-hidden="true" />
                  <span className="hidden md:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" role="menu" aria-label="Export format options">
                <DropdownMenuLabel>Export All ({customers.length} customers)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleExport('csv')}
                  role="menuitem"
                  aria-label="Export all customers as CSV file"
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExport('xlsx')}
                  role="menuitem"
                  aria-label="Export all customers as Excel file"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExport('json')}
                  role="menuitem"
                  aria-label="Export all customers as JSON file"
                >
                  <FileJson className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export as JSON
                </DropdownMenuItem>
                {isSelectMode && selectedCustomers.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Export Selected ({selectedCustomers.size} customers)</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => handleExportSelected('csv')}
                      role="menuitem"
                      aria-label="Export selected customers as CSV file"
                    >
                      <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                      Selected as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleExportSelected('xlsx')}
                      role="menuitem"
                      aria-label="Export selected customers as Excel file"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
                      Selected as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleExportSelected('json')}
                      role="menuitem"
                      aria-label="Export selected customers as JSON file"
                    >
                      <FileJson className="mr-2 h-4 w-4" aria-hidden="true" />
                      Selected as JSON
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleImportClick}
              disabled={isLoading}
              aria-label="Import customers from file"
            >
              <Upload className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Import</span>
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedCustomers(new Set());
                toast.info(isSelectMode ? 'Selection mode deactivated' : 'Selection mode active');
              }}
              aria-label={isSelectMode ? 'Exit selection mode' : 'Enter selection mode for bulk operations'}
            >
              <CheckSquare className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{isSelectMode ? 'Exit Select Mode' : 'Select Mode'}</span>
            </Button>
          </div>
        </div>

        {/* 4-Column Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <EnhancedCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {overallStats ? overallTotalCustomers : (isLoading ? '...' : '0')}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Total per tenant
                </p>
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-600">{filteredTotalCustomers}</div>
                  <div className="text-xs text-muted-foreground">dalam tabel</div>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>

          <EnhancedCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Customers
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {overallStats ? overallActiveCustomers : (isLoading ? '...' : '0')}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Total aktif
                </p>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">{filteredActiveCustomers}</div>
                  <div className="text-xs text-muted-foreground">dalam tabel</div>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>

          <EnhancedCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Business Customers
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {overallStats ? overallBusinessCustomers : (isLoading ? '...' : '0')}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Total bisnis
                </p>
                <div className="text-right">
                  <div className="text-sm font-medium text-purple-600">{filteredBusinessCustomers}</div>
                  <div className="text-xs text-muted-foreground">dalam tabel</div>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>

          <EnhancedCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {overallStats ? formatCurrency(overallTotalRevenue) : (isLoading ? '...' : 'Rp 0')}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Total pendapatan
                </p>
                <div className="text-right">
                  <div className="text-sm font-medium text-yellow-600">
                    {formatCurrency(filteredTotalRevenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">dalam tabel</div>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
        </div>

        {/* Analytics Dashboard (placeholder) */}
        {showAnalytics && (
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
              <CardDescription>Detailed insights into customer behavior and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Customer analytics dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters Card */}
        <Card className="p-4 md:p-6">
          {/* Single Row for All Controls - aligned with DataTable controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Filters:
            </div>
            <div className="flex gap-2 flex-wrap flex-1">
              <Select
                value={filters.customerType || 'all'}
                onValueChange={(value) => handleFilterChange('customerType', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Customer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Contact..."
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-[120px]"
              />
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

          {/* Error State */}
          {error && (
            <EmptyState
              icon={AlertCircle}
              title="Failed to load customers"
              description={typeof error === 'string' ? error : (error as any)?.message || 'An error occurred while loading customers'}
              action={{
                label: 'Try Again',
                onClick: handleRefresh,
                icon: RefreshCw,
              }}
            />
          )}

          {/* Empty States */}
          {!isLoading && !error && customers.length === 0 && !hasActiveFilters && (
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Get started by adding your first customer to the database"
              action={{
                label: 'Add First Customer',
                onClick: () => navigate('/admin/customers/new'),
                icon: Plus,
              }}
            />
          )}

          {!isLoading && !error && customers.length === 0 && hasActiveFilters && (
            <EmptyState
              icon={Search}
              title="No customers found"
              description="No customers match your current filters. Try adjusting your search criteria."
              action={{
                label: 'Clear Filters',
                onClick: handleClearFilters,
                icon: X,
              }}
            />
          )}

          {/* Data Table */}
          {!error && (customers.length > 0 || isLoading) && (
            <DataTable
              columns={columns}
              data={customers}
              searchKey="name"
              searchPlaceholder="Search customers..."
              loading={isLoading || isRefreshing}
              datasetId="customer-database"
              showPagination={true}
              deletingIds={deleteLoading.deletingIds}
              getRowId={(customer) => customer.id}
              onRowClick={(customer) => {
                navigate(`/admin/customers/${customer.id}`);
              }}
              onSearchChange={handleDataTableSearch}
              onPageSizeChange={handleDataTablePageSizeChange}
              externalPagination={{
                pageIndex: (pagination?.page || 1) - 1, // Convert to 0-based index
                pageSize: pagination?.per_page || 20,
                pageCount: pagination?.last_page || 1,
                total: pagination?.total || 0,
                onPageChange: (pageIndex) => {
                  handleFilterChange('page', pageIndex + 1); // Convert back to 1-based
                }
              }}
            />
          )}

          {/* Pagination - Remove this section since we're using DataTable's built-in pagination */}

        </Card>

        {/* Floating Action Panel for Selected Items */}
        {isSelectMode && selectedCustomers.size > 0 && (
          <Card className="fixed bottom-4 right-4 p-4 shadow-2xl z-40 min-w-[300px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{selectedCustomers.size} Selected</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomers(new Set())}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  Delete {selectedCustomers.size}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSelected('csv')}
                >
                  Export Selected
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Hidden File Input for Import */}
        <input
          ref={exportImport.fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Customers</DialogTitle>
              <DialogDescription>
                Upload a CSV or JSON file to import customer data
              </DialogDescription>
            </DialogHeader>
            
            {!importResult ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Choose a file to import</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supported formats: CSV, JSON
                  </p>
                  <Button onClick={() => exportImport.fileInputRef.current?.click()}>
                    Select File
                  </Button>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Don't have a file? Download our template
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportImport.handleDownloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      File parsed successfully
                    </span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <p>Total rows: {importResult.totalRows}</p>
                    <p>Valid rows: {importResult.validRows}</p>
                    {importResult.errors.length > 0 && (
                      <p>Errors: {importResult.errors.length}</p>
                    )}
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Import Warnings
                    </h4>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 5).map((error: string, index: number) => (
                        <p key={index}>• {error}</p>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p>... and {importResult.errors.length - 5} more</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Preview (first 3 rows)</h4>
                  <div className="text-sm space-y-2 max-h-32 overflow-y-auto">
                    {importResult.data.slice(0, 3).map((customer: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-muted-foreground">{customer.email}</span>
                        <span className="text-muted-foreground">{customer.customerType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={handleImportCancel}>
                Cancel
              </Button>
              {importResult && (
                <Button onClick={handleImportConfirm} disabled={importResult.validRows === 0}>
                  Import {importResult.validRows} Customers
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Detailed information about the customer
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Type</Label>
                      <p>{getTypeBadge(selectedCustomer.customerType)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <p>{getStatusBadge(selectedCustomer.status)}</p>
                    </div>
                  </div>
                </div>

                {selectedCustomer.customerType === 'business' && (
                  <div>
                    <h4 className="font-semibold mb-2">Business Information</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm text-muted-foreground">Company</Label>
                        <p className="font-medium">{selectedCustomer.company || '-'}</p>
                      </div>
                      {selectedCustomer.taxId && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Tax ID</Label>
                          <p className="font-medium">{selectedCustomer.taxId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics & Activity */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Total Orders</span>
                      </div>
                      <span className="font-bold">{selectedCustomer.totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Total Spent</span>
                      </div>
                      <span className="font-bold">{formatCurrency(selectedCustomer.totalSpent)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Member Since</span>
                      </div>
                      <span className="font-bold">
                        {format(new Date(selectedCustomer.createdAt), 'MMM yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm">Avg Order Value</span>
                      </div>
                      <span className="font-bold">
                        {selectedCustomer.totalOrders > 0 
                          ? formatCurrency(selectedCustomer.totalSpent / selectedCustomer.totalOrders)
                          : formatCurrency(0)
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            {selectedCustomer && (
              <>
                <Button variant="outline" asChild>
                  <Link to={`/admin/customers/${selectedCustomer.id}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Customer
                  </Link>
                </Button>
                <Button asChild>
                  <Link to={`/admin/orders?customer=${selectedCustomer.id}`}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    View Orders
                  </Link>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </LazyWrapper>
  );
}