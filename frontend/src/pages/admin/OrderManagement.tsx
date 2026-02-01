import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { useDeleteLoading } from '@/hooks/useDeleteLoading';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  DataTable,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/lazy-components';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PortalTooltip,
  PortalTooltipContent,
  PortalTooltipProvider,
  PortalTooltipTrigger,
} from '@/components/ui/portal-tooltip';
import {
  Eye,
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  FileText,
  User,
  MapPin,
  ArrowUpDown,
  Trash2,
  X,
  MessageSquare,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  CheckSquare,
  GitCompare,
  Search,
  TrendingUp,
  FileSpreadsheet,
  FileJson,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { useOrders, useUpdateOrder } from '@/hooks/useOrders';
import { OrderStatus, PaymentStatus, PaymentType, type Order, type OrderItem } from '@/types/order';
import { OrderWorkflow } from '@/utils/orderWorkflow';
import { OrderStatusTransition } from '@/components/orders/OrderStatusTransition';
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper';
import { VendorSourcing } from '@/components/orders/VendorSourcing';
import { PaymentProcessing } from '@/components/orders/PaymentProcessing';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { logAuthDebugInfo, validateTenantAuth } from '@/utils/authDebug';
import { CompactCurrencyDisplay, CurrencyDisplay } from '@/components/common/CurrencyDisplay';

export default function OrderManagement() {
  const navigate = useNavigate();
  
  // Authentication validation on component mount
  useEffect(() => {
    const authValidation = validateTenantAuth();
    if (!authValidation.isValid) {
      console.error('❌ [OrderManagement] Authentication validation failed:', authValidation.error);
      logAuthDebugInfo();
      
      toast.error(`Authentication Error: ${authValidation.error}`);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
      return;
    }
    
    console.log('✅ [OrderManagement] Authentication validation passed');
    console.log('🔧 [OrderManagement] Tooltip debugging - Component mounted');
  }, [navigate]);
  
  // State management
  const [state, setState] = useState({
    ui: {
      showAnalytics: false,
      isRefreshing: false,
      showFilters: false,
      isChangingPageSize: false, // Add loading state for page size changes
      isChangingPage: false, // Add loading state for page changes
    },
    modes: {
      isSelectMode: false,
      isComparisonMode: false,
    },
    selection: {
      selectedOrders: new Set<string>(),
    },
    pagination: {
      page: 1,
      perPage: 15,
    },
  });

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Create API compatible filters
  const apiFilters = {
    search: filters.search || undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page: state.pagination.page,
    per_page: state.pagination.perPage,
  };

  const ordersQuery = useOrders(apiFilters);
  const orders = ordersQuery.data?.data || [];
  const pagination = {
    page: ordersQuery.data?.current_page || 1,
    per_page: ordersQuery.data?.per_page || state.pagination.perPage, // Use state value as fallback
    total: ordersQuery.data?.total || 0,
    last_page: ordersQuery.data?.last_page || 1
  };
  
  // Debug pagination values
  console.log('🔧 [OrderManagement] Pagination values:', {
    statePerPage: state.pagination.perPage,
    apiPerPage: ordersQuery.data?.per_page,
    finalPerPage: pagination.per_page,
    externalPaginationPageSize: state.pagination.perPage
  });
  const isLoading = ordersQuery.isLoading || state.ui.isChangingPageSize || state.ui.isChangingPage;
  const error = ordersQuery.error?.message;
  
  // Check for authentication errors
  const authValidation = validateTenantAuth();
  const hasAuthError = !authValidation.isValid;
  
  // Effect to clear page size loading state when API call completes
  useEffect(() => {
    if (!ordersQuery.isLoading && (state.ui.isChangingPageSize || state.ui.isChangingPage)) {
      // Clear the loading states when API call completes
      setState(prev => ({
        ...prev,
        ui: { 
          ...prev.ui, 
          isChangingPageSize: false,
          isChangingPage: false
        }
      }));
    }
  }, [ordersQuery.isLoading, state.ui.isChangingPageSize, state.ui.isChangingPage]);
  
  // Authentication Error Component
  const AuthErrorDisplay = () => {
    if (!hasAuthError) return null;
    
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Authentication Error
          </CardTitle>
          <CardDescription className="text-red-600">
            {authValidation.error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-red-600">
              Unable to load orders due to authentication issues. Please log in again.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/login')}
                className="bg-red-600 hover:bg-red-700"
              >
                Go to Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  logAuthDebugInfo();
                  toast.info('Authentication debug info logged to console');
                }}
              >
                Debug Info
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Add mutation hooks
  const updateOrderMutation = useUpdateOrder();
  
  // Delete loading functionality
  const deleteLoading = useDeleteLoading({
    onDelete: async (orderId: string) => {
      // Simulate API call - replace with actual delete API
      await new Promise(resolve => setTimeout(resolve, 1500));
      // TODO: Replace with actual API call
      // await ordersService.deleteOrder(orderId);
    },
    onSuccess: (orderId: string) => {
      toast.success('Order deleted successfully');
      ordersQuery.refetch();
    },
    onError: (orderId: string, error: any) => {
      console.error('Delete failed:', error);
      toast.error('Failed to delete order');
    },
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isStatusTransitionOpen, setIsStatusTransitionOpen] = useState(false);
  const [isVendorSourcingOpen, setIsVendorSourcingOpen] = useState(false);
  const [isPaymentProcessingOpen, setIsPaymentProcessingOpen] = useState(false);

  // Enhanced Card with hover effects (matching ProductCatalog)
  const EnhancedCard = ({ 
    children, 
    className = "",
    allowTooltipOverflow = false,
    ...props 
  }: { 
    children: React.ReactNode; 
    className?: string;
    allowTooltipOverflow?: boolean;
    [key: string]: any;
  }) => (
    <Card 
      className={`relative ${allowTooltipOverflow ? '' : 'overflow-hidden'} group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
      {...props}
    >
      {/* Shine effect - only show if overflow is hidden */}
      {!allowTooltipOverflow && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
      )}
      {children}
    </Card>
  );

  // Action handlers
  const handleRefresh = useCallback(() => {
    setState(prev => ({ ...prev, ui: { ...prev.ui, isRefreshing: true } }));
    ordersQuery.refetch().finally(() => {
      setState(prev => ({ ...prev, ui: { ...prev.ui, isRefreshing: false } }));
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setState(prev => ({ ...prev, ui: { ...prev.ui, isChangingPage: true } }));
    setFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all',
      dateFrom: '',
      dateTo: '',
    });
    toast.success('Filters cleared');
  }, []);

  // Enhanced statistics with animations
  const stats = useMemo(() => {
    const ordersData = orders || [];
    
    console.log('📊 [OrderManagement] Calculating stats from orders:', {
      ordersCount: ordersData.length,
      sampleOrder: ordersData[0],
      allStatuses: ordersData.map(o => o.status),
      allPaymentStatuses: ordersData.map(o => o.paymentStatus),
      markupAmounts: ordersData.map(o => ({ orderNumber: o.orderNumber, markupAmount: o.markupAmount, status: o.status }))
    });
    
    // Calculate total revenue from all paid orders
    const totalRevenue = ordersData
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // Calculate total profit from ALL orders with markup (not just completed)
    // PT CEX business model: profit exists when markup_amount is available
    const totalProfit = ordersData
      .filter((o) => o.markupAmount && o.markupAmount > 0)
      .reduce((sum, o) => sum + (o.markupAmount || 0), 0);

    // Count orders awaiting payment - include multiple status types
    const awaitingPayment = ordersData.filter((o) => 
      // Payment status based
      o.paymentStatus === 'unpaid' || 
      o.paymentStatus === 'partially_paid' ||
      // Order status based (using correct enum values)
      o.status === 'pending' ||
      o.status === 'awaiting_payment' ||
      // Vendor sourcing stage (still awaiting customer decision)
      o.status === 'vendor_sourcing' ||
      o.status === 'vendor_negotiation' ||
      o.status === 'customer_quote'
    ).length;
    
    const inProduction = ordersData.filter((o) => 
      o.status === 'in_production' || 
      o.status === 'quality_control' ||
      o.status === 'shipping'
    ).length;
    
    // Count completed orders - only use correct enum value
    const completed = ordersData.filter((o) => 
      o.status === 'completed'
    ).length;

    // Status breakdown for analytics
    const statsByStatus = {
      pending: ordersData.filter((o) => o.status === 'pending').length,
      vendor_sourcing: ordersData.filter((o) => o.status === 'vendor_sourcing').length,
      vendor_negotiation: ordersData.filter((o) => o.status === 'vendor_negotiation').length,
      customer_quote: ordersData.filter((o) => o.status === 'customer_quote').length,
      awaiting_payment: ordersData.filter((o) => o.status === 'awaiting_payment').length,
      partial_payment: ordersData.filter((o) => o.status === 'partial_payment').length,
      full_payment: ordersData.filter((o) => o.status === 'full_payment').length,
      in_production: ordersData.filter((o) => o.status === 'in_production').length,
      quality_control: ordersData.filter((o) => o.status === 'quality_control').length,
      shipping: ordersData.filter((o) => o.status === 'shipping').length,
      completed: ordersData.filter((o) => o.status === 'completed').length,
      cancelled: ordersData.filter((o) => o.status === 'cancelled').length,
    };

    const calculatedStats = {
      ordersData,
      totalOrders: ordersData.length, // Use actual data length instead of pagination
      totalRevenue,
      totalProfit,
      awaitingPayment,
      inProduction,
      completed,
      statsByStatus,
    };
    
    console.log('📊 [OrderManagement] Calculated stats:', calculatedStats);
    console.log('💰 [OrderManagement] Profit calculation details:', {
      ordersWithMarkup: ordersData.filter(o => o.markupAmount && o.markupAmount > 0).length,
      totalProfitCalculated: totalProfit,
      profitBreakdown: ordersData
        .filter(o => o.markupAmount && o.markupAmount > 0)
        .map(o => ({ orderNumber: o.orderNumber, markup: o.markupAmount, status: o.status }))
    });
    console.log('💵 [OrderManagement] Revenue calculation details:', {
      paidOrders: ordersData.filter(o => o.paymentStatus === 'paid').length,
      totalRevenueCalculated: totalRevenue,
      revenueBreakdown: ordersData
        .filter(o => o.paymentStatus === 'paid')
        .map(o => ({ orderNumber: o.orderNumber, amount: o.totalAmount, status: o.status, paymentStatus: o.paymentStatus }))
    });
    
    return calculatedStats;
  }, [orders]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search || 
      filters.status !== 'all' || 
      filters.paymentStatus !== 'all' ||
      filters.dateFrom ||
      filters.dateTo
    );
  }, [filters]);

  const handleViewOrder = async (order: Order) => {
    // Navigate to order detail page
    navigate(`/admin/orders/${order.uuid || order.id}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      await deleteLoading.handleDelete(orderId);
    }
  };

  const handleViewQuotes = (order: Order) => {
    // Navigate to quotes page with order filter
    navigate(`/admin/quotes?order_id=${order.uuid || order.id}`);
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setIsStatusTransitionOpen(true);
  };

  const handleVendorSourcing = (order: Order) => {
    setSelectedOrder(order);
    setIsVendorSourcingOpen(true);
  };

  const handlePaymentProcessing = (order: Order) => {
    setSelectedOrder(order);
    setIsPaymentProcessingOpen(true);
  };

  // Enhanced action handlers for bulk operations
  const handleSelectAll = useCallback(() => {
    if (state.selection.selectedOrders.size === orders.length) {
      setState(prev => ({ 
        ...prev, 
        selection: { ...prev.selection, selectedOrders: new Set() }
      }));
      toast.info('Selection cleared');
    } else {
      setState(prev => ({ 
        ...prev, 
        selection: { 
          ...prev.selection, 
          selectedOrders: new Set(orders.map(order => order.uuid || order.id))
        }
      }));
      toast.success(`${orders.length} orders selected`);
    }
  }, [orders, state.selection.selectedOrders.size]);

  const toggleOrderSelection = useCallback((orderId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selection.selectedOrders);
      if (newSelected.has(orderId)) {
        newSelected.delete(orderId);
      } else {
        newSelected.add(orderId);
      }
      return {
        ...prev,
        selection: { ...prev.selection, selectedOrders: newSelected }
      };
    });
  }, []);

  // Export functionality
  const handleExport = useCallback((format: 'csv' | 'excel' | 'json') => {
    if (orders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const selectedOrdersData = state.selection.selectedOrders.size > 0 
      ? orders.filter(order => state.selection.selectedOrders.has(order.uuid || order.id))
      : orders;

    // Simulate export functionality
    const exportData = selectedOrdersData.map(order => ({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    }));

    // Create and download file
    const dataStr = format === 'json' 
      ? JSON.stringify(exportData, null, 2)
      : exportData.map(row => Object.values(row).join(',')).join('\n');
    
    const dataBlob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedOrdersData.length} orders as ${format.toUpperCase()}`);
  }, [orders, state.selection.selectedOrders]);

  // Import functionality
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.success(`Import file selected: ${file.name}`);
        // Here you would implement actual file processing
        // For now, just show success message
        setTimeout(() => {
          toast.success('Orders imported successfully');
          ordersQuery.refetch();
        }, 1000);
      }
    };
    input.click();
  }, [ordersQuery]);

  // Bulk operations
  const handleBulkDelete = useCallback(async () => {
    if (state.selection.selectedOrders.size === 0) {
      toast.error('No orders selected for deletion');
      return;
    }

    const selectedCount = state.selection.selectedOrders.size;
    
    // Show confirmation
    if (window.confirm(`Are you sure you want to delete ${selectedCount} selected orders? This action cannot be undone.`)) {
      try {
        // Start delete loading for all selected orders
        for (const orderId of state.selection.selectedOrders) {
          deleteLoading.startDelete(orderId);
        }
        
        // Delete orders sequentially to avoid overwhelming the server
        for (const orderId of state.selection.selectedOrders) {
          try {
            // Simulate API call - replace with actual delete API
            await new Promise(resolve => setTimeout(resolve, 800));
            deleteLoading.endDelete(orderId);
          } catch (error) {
            deleteLoading.endDelete(orderId);
            console.error(`Failed to delete order ${orderId}:`, error);
          }
        }
        
        // Clear selection and refresh
        setState(prev => ({ 
          ...prev, 
          selection: { ...prev.selection, selectedOrders: new Set() }
        }));
        
        toast.success(`${selectedCount} orders deleted successfully`);
        ordersQuery.refetch();
      } catch (error) {
        // Clear all delete loading states on general error
        deleteLoading.clearAll();
        toast.error('Failed to delete some orders');
      }
    }
  }, [state.selection.selectedOrders, deleteLoading, ordersQuery]);

  const handleBulkEdit = useCallback(() => {
    if (state.selection.selectedOrders.size === 0) {
      toast.error('No orders selected for editing');
      return;
    }

    toast.info(`Bulk edit for ${state.selection.selectedOrders.size} orders - Feature coming soon`);
  }, [state.selection.selectedOrders]);

  // Enhanced compare functionality
  const handleBulkCompare = useCallback(() => {
    const selectedCount = state.selection.selectedOrders.size;
    
    if (selectedCount < 2) {
      toast.error('Select at least 2 orders to compare');
      return;
    }
    
    if (selectedCount > 4) {
      toast.error('You can compare maximum 4 orders at once');
      return;
    }

    // Get selected orders data
    const selectedOrdersData = orders.filter(order => 
      state.selection.selectedOrders.has(order.uuid || order.id)
    );

    // Navigate to comparison page or open comparison modal
    navigate('/admin/orders/compare', { 
      state: { 
        orders: selectedOrdersData,
        orderIds: Array.from(state.selection.selectedOrders)
      }
    });
    
    toast.success(`Comparing ${selectedCount} orders`);
  }, [state.selection.selectedOrders, orders, navigate]);

  // Order Comparison Bar Component
  const OrderComparisonBar = () => {
    if (!state.modes.isComparisonMode || state.selection.selectedOrders.size === 0) {
      return null;
    }

    const selectedOrdersData = orders.filter(order => 
      state.selection.selectedOrders.has(order.uuid || order.id)
    );

    return (
      <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 shadow-2xl z-50 min-w-[400px] max-w-[800px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Compare Orders ({state.selection.selectedOrders.size}/4)</h4>
              <Badge variant="outline">{state.selection.selectedOrders.size} selected</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState(prev => ({ 
                ...prev, 
                selection: { ...prev.selection, selectedOrders: new Set() }
              }))}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {selectedOrdersData.map((order) => (
              <div key={order.uuid || order.id} className="flex-shrink-0 p-2 border rounded-lg bg-muted/50 min-w-[120px]">
                <div className="text-xs font-medium truncate">{order.orderNumber}</div>
                <div className="text-xs text-muted-foreground truncate">{order.customerName}</div>
                <div className="text-xs font-semibold">Rp {order.totalAmount?.toLocaleString('id-ID')}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 mt-1"
                  onClick={() => toggleOrderSelection(order.uuid || order.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleBulkCompare}
              disabled={state.selection.selectedOrders.size < 2}
              className="flex-1"
            >
              Compare Orders
            </Button>
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ 
                ...prev, 
                modes: { ...prev.modes, isComparisonMode: false },
                selection: { ...prev.selection, selectedOrders: new Set() }
              }))}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const handleVendorAssigned = async (orderId: string, vendorId: string): Promise<void> => {
    try {
      // Update order with vendor assignment
      await updateOrderMutation.mutateAsync({
        id: orderId,
        data: {
          status: OrderStatus.VendorNegotiation
        }
      });
    } catch (error) {
      throw error; // Re-throw for component handling
    }
  };

  const handleStatusTransition = async (orderId: string, newStatus: OrderStatus, notes: string) => {
    try {
      // Update order status using proper mutation hooks
      await updateOrderMutation.mutateAsync({
        id: orderId,
        data: {
          status: newStatus
        }
      });
      
      setIsStatusTransitionOpen(false);
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Failed to update order status');
      throw error; // Re-throw for component handling
    }
  };

  const handlePaymentProcessed = async (orderId: string, paymentData: any) => {
    try {
      // Update order with payment information
      await updateOrderMutation.mutateAsync({
        id: orderId,
        data: paymentData
      });
      
      setIsPaymentProcessingOpen(false);
      toast.success('Payment processed successfully');
    } catch (error) {
      throw error; // Re-throw for component handling
    }
  };

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, ui: { ...prev.ui, isChangingPage: true } }));
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [OrderStatus.Draft]: 'outline',
      [OrderStatus.Pending]: 'secondary',
      [OrderStatus.VendorSourcing]: 'default',
      [OrderStatus.VendorNegotiation]: 'default',
      [OrderStatus.CustomerQuote]: 'secondary',
      [OrderStatus.AwaitingPayment]: 'default',
      [OrderStatus.PartialPayment]: 'secondary',
      [OrderStatus.FullPayment]: 'outline',
      [OrderStatus.InProduction]: 'default',
      [OrderStatus.QualityControl]: 'secondary',
      [OrderStatus.Shipping]: 'default',
      [OrderStatus.Completed]: 'outline',
      [OrderStatus.Cancelled]: 'destructive',
      [OrderStatus.Refunded]: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      [PaymentStatus.Unpaid]: 'bg-red-500/10 text-red-500',
      [PaymentStatus.PartiallyPaid]: 'bg-yellow-500/10 text-yellow-500',
      [PaymentStatus.Paid]: 'bg-green-500/10 text-green-500',
      [PaymentStatus.Refunded]: 'bg-orange-500/10 text-orange-500',
      [PaymentStatus.Cancelled]: 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  const columns: ColumnDef<Order>[] = [
    // Selection column for bulk operations - matching ProductCatalog design
    ...(state.modes.isSelectMode || state.modes.isComparisonMode ? [{
      id: 'select',
      header: ({ table }: any) => (
        <Checkbox
          checked={state.selection.selectedOrders.size === orders.length && orders.length > 0}
          onCheckedChange={handleSelectAll}
          aria-label={state.modes.isComparisonMode ? "Select all orders for comparison" : "Select all orders on current page"}
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={state.selection.selectedOrders.has(row.original.uuid || row.original.id)}
          onCheckedChange={() => toggleOrderSelection(row.original.uuid || row.original.id)}
          aria-label={`Select order ${row.original.orderNumber}${state.modes.isComparisonMode ? ' for comparison' : ''}`}
          disabled={state.modes.isComparisonMode && !state.selection.selectedOrders.has(row.original.uuid || row.original.id) && state.selection.selectedOrders.size >= 4}
        />
      ),
      size: 50,
    }] : []),
    {
      accessorKey: 'orderNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Order Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
            onClick={() => navigate(`/admin/orders/${order.uuid || order.id}`)}
          >
            {order.orderNumber}
          </Button>
        );
      },
    },
    {
      accessorKey: 'customerName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div>
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
              onClick={() => navigate(`/admin/customers/${order.customerId}`)}
            >
              {order.customerName}
            </Button>
            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => {
        const items = row.getValue('items') as OrderItem[] | undefined;
        return `${items?.length || 0} item(s)`;
      },
    },
    {
      accessorKey: 'totalAmount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const totalAmount = row.getValue('totalAmount') as number;
        return (
          <span className="font-semibold">
            <CompactCurrencyDisplay amount={totalAmount || 0} />
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as OrderStatus;
        if (!status) {
          return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
        }
        const statusInfo = OrderWorkflow.getStatusInfo(status);
        return (
          <Badge variant={getStatusVariant(status)} className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
            {statusInfo?.label || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Payment
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const paymentStatus = row.getValue('paymentStatus') as string;
        if (!paymentStatus) {
          return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
        }
        return (
          <Badge className={getPaymentStatusColor(paymentStatus)}>
            {paymentStatus
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'paymentType',
      header: 'Payment Type',
      size: 200,
      minSize: 180,
      cell: ({ row }) => {
        const paymentType = row.getValue('paymentType') as PaymentType;
        const order = row.original;
        
        if (!paymentType) {
          return <span className="text-muted-foreground text-xs">Not Set</span>;
        }
        
        return (
          <div className="min-w-0 w-full">
            <Badge className={
              paymentType === PaymentType.DP50 ? 
              'bg-amber-100 text-amber-800 whitespace-nowrap' : 
              'bg-green-100 text-green-800 whitespace-nowrap'
            }>
              {paymentType === PaymentType.DP50 ? 'DP 50%' : 'Full 100%'}
            </Badge>
            {(order.paidAmount || 0) > 0 && (
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div className="truncate" title={`Paid: Rp ${(order.paidAmount || 0).toLocaleString('id-ID')}`}>
                  Paid: Rp {(order.paidAmount || 0).toLocaleString('id-ID')}
                </div>
                {(order.remainingAmount || 0) > 0 && (
                  <div className="text-orange-600 truncate" title={`Remaining: Rp ${(order.remainingAmount || 0).toLocaleString('id-ID')}`}>
                    Remaining: Rp {(order.remainingAmount || 0).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'markupAmount',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 h-auto font-medium hover:bg-transparent"
          >
            Profit Margin
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center cursor-help">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">i</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <div className="font-semibold">Rumus Profit Margin:</div>
                <div>Markup Amount = Customer Price - Vendor Cost</div>
                <div>Profit % = (Markup Amount / Vendor Cost) × 100%</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      size: 160,
      minSize: 140,
      cell: ({ row }) => {
        const order = row.original;
        if (!order.markupAmount || !order.vendorCost || !order.customerPrice) {
          return <span className="text-muted-foreground text-xs">N/A</span>;
        }
        
        const profitPercentage = ((order.markupAmount / order.vendorCost) * 100);
        
        return (
          <div className="min-w-0 w-full">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-green-600 truncate" title={`+Rp ${(order.markupAmount || 0).toLocaleString('id-ID')}`}>
                +Rp {(order.markupAmount || 0).toLocaleString('id-ID')}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center cursor-help">
                    <span className="text-xs text-green-600 dark:text-green-400 font-bold">i</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-2">
                    <div className="font-semibold">Detail Profit Calculation:</div>
                    <div className="space-y-1 text-sm">
                      <div>Customer Price: Rp {(order.customerPrice || 0).toLocaleString('id-ID')}</div>
                      <div>Vendor Cost: Rp {(order.vendorCost || 0).toLocaleString('id-ID')}</div>
                      <div className="border-t pt-1 mt-1">
                        <div className="font-semibold">Markup: Rp {(order.markupAmount || 0).toLocaleString('id-ID')}</div>
                        <div>Profit Margin: {profitPercentage.toFixed(1)}%</div>
                      </div>
                      <div className="text-xs opacity-75 mt-2">
                        Formula: (Customer Price - Vendor Cost) / Vendor Cost × 100%
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {profitPercentage.toFixed(1)}% margin
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Order Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue('createdAt') as string;
        return new Date(createdAt).toLocaleDateString('id-ID');
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original;
        const validNextStatuses = OrderWorkflow.getValidNextStatuses(order.status);
        const canTransition = validNextStatuses.length > 0;
        const needsVendor = order.status === OrderStatus.VendorSourcing && !order.vendorId;
        
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewOrder(order)}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewQuotes(order)}
              title="View Quotes"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            {needsVendor && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVendorSourcing(order)}
                title="Find Vendor"
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <User className="w-4 h-4" />
              </Button>
            )}
            {canTransition && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUpdateStatus(order)}
                title="Update Status"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteOrder(order.uuid || order.id)}
              title="Delete Order"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Ensure orders is always an array
  const ordersData = orders || [];

  // Stats Cards Skeleton Component (Enhanced)
  const StatsCardsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 bg-card rounded-lg border animate-pulse">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="w-10 h-10 bg-muted rounded-lg"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-16"></div>
            <div className="h-3 bg-muted rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const totalRevenue = ordersData
    .filter((o) => o.paymentStatus === PaymentStatus.Paid)
    .reduce((sum, o) => sum + o.totalAmount, 0);



  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500">Error Loading Orders</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button className="mt-4" onClick={() => ordersQuery.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show authentication error if present
  if (hasAuthError) {
    return (
      <div className="p-6 space-y-6">
        <AuthErrorDisplay />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <LazyWrapper>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">

        
        {/* Header Section - Matching ProductCatalog */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Order Management</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage customer orders and track status</p>
          </div>
          <Button 
            size="sm"
            onClick={() => navigate('/admin/orders/new')}
            aria-label="Create new order"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">New Order</span>
          </Button>
        </div>

        {/* Sticky Toolbar - Matching ProductCatalog */}
        <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh} 
              disabled={isLoading || state.ui.isRefreshing}
              aria-label="Refresh order list"
              aria-busy={state.ui.isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 md:mr-2", (isLoading || state.ui.isRefreshing) && "animate-spin")} />
              <span className="hidden md:inline">Refresh</span>
            </Button>
            
            {/* Live Status Indicator */}
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              title="Real-time order updates"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="hidden md:inline text-xs text-gray-600 dark:text-gray-400">Live</span>
            </div>

            <Button 
              variant={state.ui.showAnalytics ? "default" : "outline"}
              size="sm"
              onClick={() => setState(prev => ({ 
                ...prev, 
                ui: { ...prev.ui, showAnalytics: !prev.ui.showAnalytics }
              }))}
              aria-label={state.ui.showAnalytics ? "Hide analytics" : "Show analytics"}
            >
              <BarChart3 className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{state.ui.showAnalytics ? 'Hide Analytics' : 'Analytics'}</span>
            </Button>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={isLoading || orders.length === 0}
                  aria-label={`Export ${orders.length} orders in various formats`}
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
                  onClick={() => handleExport('csv')}
                  role="menuitem"
                  aria-label="Export orders as CSV file"
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExport('excel')}
                  role="menuitem"
                  aria-label="Export orders as Excel file"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExport('json')}
                  role="menuitem"
                  aria-label="Export orders as JSON file"
                >
                  <FileJson className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline"
              size="sm"
              onClick={handleImport}
              disabled={isLoading}
              aria-label="Import orders from file"
            >
              <Upload className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Import</span>
            </Button>

            <Button 
              variant={state.modes.isSelectMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setState(prev => ({ 
                  ...prev, 
                  modes: { 
                    ...prev.modes, 
                    isSelectMode: !prev.modes.isSelectMode,
                    isComparisonMode: false // Always disable comparison mode when toggling select mode
                  },
                  selection: { ...prev.selection, selectedOrders: new Set() } // Clear selection when toggling
                }));
                toast.info(state.modes.isSelectMode ? 'Selection mode deactivated' : 'Selection mode active');
              }}
              aria-label={state.modes.isSelectMode ? 'Exit selection mode' : 'Enter selection mode for bulk operations'}
            >
              <CheckSquare className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{state.modes.isSelectMode ? 'Exit Select Mode' : 'Select Mode'}</span>
            </Button>

            <Button 
              variant={state.modes.isComparisonMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setState(prev => ({ 
                  ...prev, 
                  modes: { 
                    ...prev.modes, 
                    isComparisonMode: !prev.modes.isComparisonMode,
                    isSelectMode: false // Always disable select mode when toggling comparison mode
                  },
                  selection: { ...prev.selection, selectedOrders: new Set() } // Clear selection when toggling
                }));
                toast.info(state.modes.isComparisonMode ? 'Comparison mode deactivated' : 'Comparison mode active - Select 2-4 orders');
              }}
              aria-label={state.modes.isComparisonMode ? 'Exit comparison mode' : 'Enter comparison mode'}
            >
              <GitCompare className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{state.modes.isComparisonMode ? 'Exit Compare' : 'Compare Orders'}</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Statistics Cards - 4 Column Layout */}
        {isLoading ? (
          <StatsCardsSkeleton />
        ) : (
          <PortalTooltipProvider delayDuration={300}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8 mb-16">
            <EnhancedCard className={cn(state.ui.isRefreshing && "animate-pulse")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalOrders}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total orders in system
                </p>
              </CardContent>
            </EnhancedCard>

            <EnhancedCard className={cn(state.ui.isRefreshing && "animate-pulse")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Awaiting Payment
                </CardTitle>
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.awaitingPayment}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Pending payments
                </p>
              </CardContent>
            </EnhancedCard>

            <EnhancedCard className={cn(state.ui.isRefreshing && "animate-pulse")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-1">
                  <PortalTooltip>
                    <PortalTooltipTrigger asChild>
                      <div 
                        className="cursor-help"
                        title="Total Revenue Formula: Sum of all PAID orders' total amounts. Filter: paymentStatus === 'paid'. Business Logic: Only confirmed revenue from completed payments."
                        onClick={() => console.log('Tooltip clicked - Total Revenue')}
                      >
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          Total Revenue
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        </CardTitle>
                      </div>
                    </PortalTooltipTrigger>
                    <PortalTooltipContent 
                      side="bottom" 
                      className="max-w-md p-4 bg-white dark:bg-gray-800 border shadow-xl z-[9999] rounded-lg"
                      sideOffset={10}
                      avoidCollisions={true}
                      collisionPadding={20}
                    >
                      <div className="space-y-3">
                        <p className="font-semibold text-sm">Total Revenue Calculation:</p>
                        <p className="text-xs text-muted-foreground">Sum of all PAID orders' total amounts</p>
                        
                        {/* Real Calculation Breakdown */}
                        <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-3 rounded border">
                          <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📊 Real Data Breakdown:</p>
                          <div className="space-y-1">
                            <p><strong>Total Orders:</strong> {stats.ordersData.length} orders</p>
                            <p><strong>Paid Orders:</strong> {stats.ordersData.filter(o => o.paymentStatus === 'paid').length} orders</p>
                            <p><strong>Revenue Calculation:</strong></p>
                            <div className="ml-2 space-y-0.5 text-xs">
                              {stats.ordersData
                                .filter(o => o.paymentStatus === 'paid')
                                .slice(0, 5) // Show first 5 paid orders
                                .map((order, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span>{order.orderNumber}:</span>
                                    <span>Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              {stats.ordersData.filter(o => o.paymentStatus === 'paid').length > 5 && (
                                <div className="text-gray-500">
                                  ... +{stats.ordersData.filter(o => o.paymentStatus === 'paid').length - 5} more paid orders
                                </div>
                              )}
                            </div>
                            <div className="border-t pt-1 mt-2">
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                <strong>Total Revenue: Rp {stats.totalRevenue.toLocaleString('id-ID')}</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border">
                          <p><strong>Filter:</strong> paymentStatus === 'paid'</p>
                          <p><strong>Formula:</strong> Sum of totalAmount from each paid order</p>
                          <p><strong>Business Logic:</strong> Only confirmed revenue from completed payments</p>
                        </div>
                      </div>
                    </PortalTooltipContent>
                  </PortalTooltip>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  Rp {stats.totalRevenue.toLocaleString('id-ID')}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Completed orders
                </p>
              </CardContent>
            </EnhancedCard>

            <EnhancedCard className={cn(state.ui.isRefreshing && "animate-pulse")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-1">
                  <PortalTooltip>
                    <PortalTooltipTrigger asChild>
                      <div 
                        className="cursor-help"
                        title="Total Profit Formula: Sum of all orders' markup amounts. Filter: markupAmount > 0. PT CEX Model: Profit = Customer Price - Vendor Cost."
                        onClick={() => console.log('Tooltip clicked - Total Profit')}
                      >
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          Total Profit
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        </CardTitle>
                      </div>
                    </PortalTooltipTrigger>
                    <PortalTooltipContent 
                      side="bottom" 
                      className="max-w-md p-4 bg-white dark:bg-gray-800 border shadow-xl z-[9999] rounded-lg"
                      sideOffset={10}
                      avoidCollisions={true}
                      collisionPadding={20}
                    >
                      <div className="space-y-3">
                        <p className="font-semibold text-sm">Total Profit Calculation:</p>
                        <p className="text-xs text-muted-foreground">Sum of all orders' markup amounts</p>
                        
                        {/* Real Calculation Breakdown */}
                        <div className="text-xs bg-purple-50 dark:bg-purple-900/20 p-3 rounded border">
                          <p className="font-semibold text-purple-800 dark:text-purple-200 mb-2">💰 Real Data Breakdown:</p>
                          <div className="space-y-1">
                            <p><strong>Total Orders:</strong> {stats.ordersData.length} orders</p>
                            <p><strong>Orders with Profit:</strong> {stats.ordersData.filter(o => o.markupAmount && o.markupAmount > 0).length} orders</p>
                            <p><strong>Profit Calculation:</strong></p>
                            <div className="ml-2 space-y-0.5 text-xs">
                              {stats.ordersData
                                .filter(o => o.markupAmount && o.markupAmount > 0)
                                .slice(0, 5) // Show first 5 profitable orders
                                .map((order, index) => {
                                  const profitMargin = order.vendorCost > 0 ? ((order.markupAmount / order.vendorCost) * 100).toFixed(1) : '0';
                                  return (
                                    <div key={index} className="space-y-0.5">
                                      <div className="flex justify-between font-medium">
                                        <span>{order.orderNumber}:</span>
                                        <span className="text-green-600">+Rp {(order.markupAmount || 0).toLocaleString('id-ID')}</span>
                                      </div>
                                      <div className="text-xs text-gray-500 ml-2">
                                        Customer: Rp {(order.customerPrice || 0).toLocaleString('id-ID')} - Vendor: Rp {(order.vendorCost || 0).toLocaleString('id-ID')} = {profitMargin}% margin
                                      </div>
                                    </div>
                                  );
                                })}
                              {stats.ordersData.filter(o => o.markupAmount && o.markupAmount > 0).length > 5 && (
                                <div className="text-gray-500">
                                  ... +{stats.ordersData.filter(o => o.markupAmount && o.markupAmount > 0).length - 5} more profitable orders
                                </div>
                              )}
                            </div>
                            <div className="border-t pt-1 mt-2">
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                <strong>Total Profit: Rp {stats.totalProfit.toLocaleString('id-ID')}</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border">
                          <p><strong>Filter:</strong> markupAmount &gt; 0</p>
                          <p><strong>PT CEX Model:</strong> Profit = Customer Price - Vendor Cost</p>
                          <p><strong>Formula:</strong> Sum of markupAmount from each order</p>
                          <p><strong>Business Logic:</strong> Profit exists when markup is calculated</p>
                        </div>
                      </div>
                    </PortalTooltipContent>
                  </PortalTooltip>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  Rp {stats.totalProfit.toLocaleString('id-ID')}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Profit margins
                </p>
              </CardContent>
            </EnhancedCard>
          </div>
          </PortalTooltipProvider>
        )}

        {/* Analytics Dashboard - Conditional */}
        {state.ui.showAnalytics && (
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Order Analytics Dashboard</CardTitle>
              <CardDescription>Comprehensive order performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Order Status Distribution</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Pending</span>
                      <span className="font-medium">{stats.statsByStatus?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>In Production</span>
                      <span className="font-medium">{stats.statsByStatus?.in_production || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed</span>
                      <span className="font-medium">{stats.statsByStatus?.completed || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Revenue Metrics</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Average Order Value</span>
                      <span className="font-medium">
                        Rp {stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toLocaleString('id-ID') : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Profit Margin</span>
                      <span className="font-medium">
                        {stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Filter Section */}
        <Card className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search orders by number, customer name, or email..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-10"
                  aria-label="Search orders"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select
                value={filters.status}
                onValueChange={(value) => {
                  setState(prev => ({ ...prev, ui: { ...prev.ui, isChangingPage: true } }));
                  setFilters(prev => ({ ...prev, status: value }));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={OrderStatus.Draft}>Draft</SelectItem>
                  <SelectItem value={OrderStatus.Pending}>Pending</SelectItem>
                  <SelectItem value={OrderStatus.VendorSourcing}>Vendor Sourcing</SelectItem>
                  <SelectItem value={OrderStatus.VendorNegotiation}>Vendor Negotiation</SelectItem>
                  <SelectItem value={OrderStatus.CustomerQuote}>Customer Quote</SelectItem>
                  <SelectItem value={OrderStatus.AwaitingPayment}>Awaiting Payment</SelectItem>
                  <SelectItem value={OrderStatus.PartialPayment}>Partial Payment</SelectItem>
                  <SelectItem value={OrderStatus.FullPayment}>Full Payment</SelectItem>
                  <SelectItem value={OrderStatus.InProduction}>In Production</SelectItem>
                  <SelectItem value={OrderStatus.QualityControl}>Quality Control</SelectItem>
                  <SelectItem value={OrderStatus.Shipping}>Shipping</SelectItem>
                  <SelectItem value={OrderStatus.Completed}>Completed</SelectItem>
                  <SelectItem value={OrderStatus.Cancelled}>Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.paymentStatus}
                onValueChange={(value) => {
                  setState(prev => ({ ...prev, ui: { ...prev.ui, isChangingPage: true } }));
                  setFilters(prev => ({ ...prev, paymentStatus: value }));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Status</SelectItem>
                  <SelectItem value={PaymentStatus.Unpaid}>Unpaid</SelectItem>
                  <SelectItem value={PaymentStatus.PartiallyPaid}>Partially Paid</SelectItem>
                  <SelectItem value={PaymentStatus.Paid}>Paid</SelectItem>
                  <SelectItem value={PaymentStatus.Refunded}>Refunded</SelectItem>
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

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={ordersData}
            searchKey="orderNumber"
            searchPlaceholder="Search by order number..."
            loading={isLoading || state.ui.isRefreshing}
            datasetId="order-management"
            deletingIds={deleteLoading.deletingIds}
            getRowId={(row: unknown) => {
              const order = row as Order;
              return order.uuid || order.id;
            }}
            externalPagination={{
              pageIndex: pagination.page - 1, // DataTable uses 0-based indexing
              pageSize: state.pagination.perPage, // Use state value for consistency
              pageCount: pagination.last_page,
              total: pagination.total,
              onPageChange: (page: number) => {
                setState(prev => ({
                  ...prev,
                  ui: { ...prev.ui, isChangingPage: true },
                  pagination: { ...prev.pagination, page: page + 1 } // Convert back to 1-based
                }));
              }
            }}
            onPageSizeChange={(pageSize: number) => {
              console.log('🔧 [OrderManagement] Page size change requested:', {
                newPageSize: pageSize,
                currentStatePerPage: state.pagination.perPage,
                currentPaginationPerPage: pagination.per_page
              });
              
              // Set loading state for page size change
              setState(prev => ({
                ...prev,
                ui: { ...prev.ui, isChangingPageSize: true },
                pagination: {
                  ...prev.pagination,
                  perPage: pageSize,
                  page: 1 // Reset to first page when changing per page
                }
              }));
            }}
          />
        </Card>

        {/* Floating Action Panel for Selected Orders - Only for Select Mode */}
        {state.modes.isSelectMode && state.selection.selectedOrders.size > 0 && (
          <Card className="fixed bottom-4 right-4 p-4 shadow-2xl z-40 min-w-[300px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{state.selection.selectedOrders.size} Selected</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setState(prev => ({ 
                    ...prev, 
                    selection: { ...prev.selection, selectedOrders: new Set() }
                  }))}
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
                  Delete {state.selection.selectedOrders.size}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEdit}
                >
                  Bulk Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                >
                  Export Selected
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Order Comparison Bar - Only for Compare Mode */}
        <OrderComparisonBar />

        {/* Order Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <Tabs defaultValue="details" className="w-full">
                {(() => {
                  const validNextStatuses = OrderWorkflow.getValidNextStatuses(selectedOrder.status);
                  const canTransition = validNextStatuses.length > 0;
                  
                  return (
                    <TabsList className={`grid w-full ${canTransition ? 'grid-cols-4' : 'grid-cols-3'}`}>
                      <TabsTrigger value="details">Order Details</TabsTrigger>
                      <TabsTrigger value="customer">Customer Info</TabsTrigger>
                      <TabsTrigger value="progress">Progress</TabsTrigger>
                      {canTransition && (
                        <TabsTrigger value="status">Update Status</TabsTrigger>
                      )}
                    </TabsList>
                  );
                })()}

                <TabsContent value="details" className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order Items
                    </h3>
                    <div className="space-y-3">
                      {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item, index) => {
                        const itemPrice = item?.price || 0;
                        const itemQuantity = item?.quantity || 0;
                        const itemTotal = itemPrice * itemQuantity;
                        
                        return (
                          <div key={index} className="flex justify-between items-start border-b pb-3">
                            <div className="flex-1">
                              <p className="font-medium">{item?.productName || 'Unknown Product'}</p>
                              <p className="text-sm text-muted-foreground">Quantity: {itemQuantity}</p>
                              {item?.customization && Object.keys(item.customization).length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Customization: {JSON.stringify(item.customization)}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                Rp {itemTotal.toLocaleString('id-ID')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @ Rp {itemPrice.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <p className="font-semibold text-lg">Total Amount</p>
                      <p className="font-bold text-2xl text-primary">
                        Rp {(selectedOrder.totalAmount || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Shipping Address
                    </h3>
                    <p className="text-muted-foreground">{
                      selectedOrder.shippingAddress || 'Tidak ada alamat pengiriman'
                    }</p>
                  </Card>

                  {(selectedOrder.customerNotes || selectedOrder.internalNotes) && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Notes
                      </h3>
                      {selectedOrder.customerNotes && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground">Customer Notes:</p>
                          <p className="text-muted-foreground">{selectedOrder.customerNotes}</p>
                        </div>
                      )}
                      {selectedOrder.internalNotes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Internal Notes:</p>
                          <p className="text-muted-foreground">{selectedOrder.internalNotes}</p>
                        </div>
                      )}
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="customer" className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Full Name</Label>
                        <p className="text-lg font-medium">{
                          typeof selectedOrder.customerName === 'string' ? selectedOrder.customerName : 'N/A'
                        }</p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="text-muted-foreground">{
                          typeof selectedOrder.customerEmail === 'string' ? selectedOrder.customerEmail : 'N/A'
                        }</p>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <p className="text-muted-foreground">{
                          typeof selectedOrder.customerPhone === 'string' ? selectedOrder.customerPhone : 'N/A'
                        }</p>
                      </div>
                      <div>
                        <Label>Order Date</Label>
                        <p className="text-muted-foreground">
                          {selectedOrder.createdAt ? 
                            new Date(selectedOrder.createdAt).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }) : 'Tanggal tidak tersedia'
                          }
                        </p>
                      </div>
                      {selectedOrder.estimatedDelivery && (
                        <div>
                          <Label>Estimated Delivery</Label>
                          <p className="text-muted-foreground">
                            {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="progress" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Order Progress Tracker
                    </h3>
                    <OrderStatusStepper currentStatus={selectedOrder.status as OrderStatus} />
                  </Card>
                </TabsContent>

                {(() => {
                  const validNextStatuses = OrderWorkflow.getValidNextStatuses(selectedOrder.status);
                  const canTransition = validNextStatuses.length > 0;
                  
                  return canTransition ? (
                    <TabsContent value="status" className="space-y-4">
                      <Card className="p-4 space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Current Status</Label>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <Badge variant={getStatusVariant(selectedOrder.status)}>
                                {OrderWorkflow.getStatusInfo(selectedOrder.status).label}
                              </Badge>
                              <div className="text-sm text-muted-foreground ml-auto">
                                {OrderWorkflow.getStatusInfo(selectedOrder.status).phase} Phase
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {OrderWorkflow.getStatusInfo(selectedOrder.status).description}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setIsDetailDialogOpen(false);
                                setTimeout(() => {
                                  setIsStatusTransitionOpen(true);
                                }, 100);
                              }}
                              className="flex-1"
                              variant="default"
                            >
                              <ArrowUpDown className="w-4 h-4 mr-2" />
                              Update Order Status
                            </Button>
                          </div>
                          
                          <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">
                              💡 Status Update Info
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              Status transitions include business rule validation, required actions, and transition notes for proper workflow management.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Payment Status</Label>
                          <Select value={selectedOrder.paymentStatus} disabled>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={PaymentStatus.Unpaid}>Unpaid</SelectItem>
                              <SelectItem value={PaymentStatus.PartiallyPaid}>Partially Paid</SelectItem>
                              <SelectItem value={PaymentStatus.Paid}>Paid</SelectItem>
                              <SelectItem value={PaymentStatus.Refunded}>Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">Payment status is managed separately</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePaymentProcessing(selectedOrder)}
                              className="text-xs"
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              Manage Payment
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </TabsContent>
                  ) : null;
                })()}
              </Tabs>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Status Transition Dialog */}
        {selectedOrder && (
          <OrderStatusTransition
            order={selectedOrder}
            isOpen={isStatusTransitionOpen}
            onClose={() => {
              setIsStatusTransitionOpen(false);
              setSelectedOrder(null);
            }}
            onTransition={handleStatusTransition}
            isLoading={updateOrderMutation.isPending}
          />
        )}

        {/* Vendor Sourcing Dialog */}
        {selectedOrder && (
          <VendorSourcing
            order={selectedOrder}
            isOpen={isVendorSourcingOpen}
            onClose={() => {
              setIsVendorSourcingOpen(false);
              setSelectedOrder(null);
            }}
            onVendorAssigned={handleVendorAssigned}
            isLoading={updateOrderMutation.isPending}
          />
        )}

        {/* Payment Processing Dialog */}
        {selectedOrder && (
          <PaymentProcessing
            order={selectedOrder}
            isOpen={isPaymentProcessingOpen}
            onClose={() => {
              setIsPaymentProcessingOpen(false);
              setSelectedOrder(null);
            }}
            onPaymentProcessed={handlePaymentProcessed}
            isLoading={updateOrderMutation.isPending}
          />
        )}
      </div>
    </LazyWrapper>
    </TooltipProvider>
  );
}
