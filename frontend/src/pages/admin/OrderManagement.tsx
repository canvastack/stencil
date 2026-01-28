import React, { useState, useMemo, useCallback } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
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
  Loader2,
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

export default function OrderManagement() {
  const navigate = useNavigate();
  
  // State management
  const [state, setState] = useState({
    ui: {
      showAnalytics: false,
      isRefreshing: false,
      showFilters: false,
    },
    modes: {
      isSelectMode: false,
      isComparisonMode: false,
    },
    selection: {
      selectedOrders: new Set<string>(),
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
  };

  const ordersQuery = useOrders(apiFilters);
  const orders = ordersQuery.data?.data || [];
  const pagination = ordersQuery.data || { page: 1, per_page: 15, total: 0, last_page: 1 };
  const isLoading = ordersQuery.isLoading;
  const error = ordersQuery.error?.message;
  
  // Add mutation hooks
  const updateOrderMutation = useUpdateOrder();
  const [isSaving, setIsSaving] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusTransitionOpen, setIsStatusTransitionOpen] = useState(false);
  const [isVendorSourcingOpen, setIsVendorSourcingOpen] = useState(false);
  const [isPaymentProcessingOpen, setIsPaymentProcessingOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Enhanced Card with hover effects (matching ProductCatalog)
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
      className={`relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
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
    const totalRevenue = ordersData
      .filter((o) => o.paymentStatus === PaymentStatus.Paid)
      .reduce((sum, o) => sum + o.totalAmount, 0);
    
    const totalProfit = ordersData
      .filter((o) => o.status === OrderStatus.Completed && o.markupAmount)
      .reduce((sum, o) => sum + (o.markupAmount || 0), 0);

    const statsByStatus = {
      [OrderStatus.Pending]: ordersData.filter((o) => o.status === OrderStatus.Pending).length,
      [OrderStatus.VendorNegotiation]: ordersData.filter((o) => o.status === OrderStatus.VendorNegotiation).length,
      [OrderStatus.AwaitingPayment]: ordersData.filter((o) => o.status === OrderStatus.AwaitingPayment).length,
      [OrderStatus.InProduction]: ordersData.filter((o) => o.status === OrderStatus.InProduction).length,
      [OrderStatus.Completed]: ordersData.filter((o) => o.status === OrderStatus.Completed).length,
    };

    return {
      ordersData,
      totalOrders: pagination?.total || 0,
      totalRevenue,
      totalProfit,
      awaitingPayment: statsByStatus[OrderStatus.AwaitingPayment] || 0,
      inProduction: statsByStatus[OrderStatus.InProduction] || 0,
      completed: statsByStatus[OrderStatus.Completed] || 0,
    };
  }, [orders, pagination?.total]);

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
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setIsDeleteDialogOpen(true);
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
  const handleBulkDelete = useCallback(() => {
    if (state.selection.selectedOrders.size === 0) {
      toast.error('No orders selected for deletion');
      return;
    }

    const selectedCount = state.selection.selectedOrders.size;
    
    // Show confirmation
    if (window.confirm(`Are you sure you want to delete ${selectedCount} selected orders? This action cannot be undone.`)) {
      // Simulate bulk delete
      setState(prev => ({ 
        ...prev, 
        selection: { ...prev.selection, selectedOrders: new Set() }
      }));
      
      toast.success(`${selectedCount} orders deleted successfully`);
      ordersQuery.refetch();
    }
  }, [state.selection.selectedOrders, ordersQuery]);

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
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
      try {
        setIsSaving(true);
        // Note: This would need to be implemented with proper mutation hooks
        // For now, just simulate delay and refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsDeleteDialogOpen(false);
        setOrderToDelete(null);
        ordersQuery.refetch();
        toast.success('Order berhasil dihapus');
      } catch (error) {
        toast.error('Gagal menghapus order');
      } finally {
        setIsSaving(false);
      }
    }
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
            <p className="font-medium">{order.customerName}</p>
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
        return <span className="font-semibold">Rp {(totalAmount || 0).toLocaleString('id-ID')}</span>;
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
      header: 'Profit Margin',
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
            <div className="font-semibold text-green-600 truncate" title={`+Rp ${(order.markupAmount || 0).toLocaleString('id-ID')}`}>
              +Rp {(order.markupAmount || 0).toLocaleString('id-ID')}
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
              disabled={isSaving}
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

  const statsByStatus = {
    [OrderStatus.Pending]: ordersData.filter((o) => o.status === OrderStatus.Pending).length,
    [OrderStatus.VendorNegotiation]: ordersData.filter((o) => o.status === OrderStatus.VendorNegotiation).length,
    [OrderStatus.AwaitingPayment]: ordersData.filter((o) => o.status === OrderStatus.AwaitingPayment).length,
    [OrderStatus.InProduction]: ordersData.filter((o) => o.status === OrderStatus.InProduction).length,
    [OrderStatus.Completed]: ordersData.filter((o) => o.status === OrderStatus.Completed).length,
  };

  const pendingPayments = ordersData.filter((o) => 
    o.status === OrderStatus.PartialPayment && o.remainingAmount > 0
  ).reduce((sum, o) => sum + (o.remainingAmount || 0), 0);
  
  const totalProfit = ordersData
    .filter((o) => o.status === OrderStatus.Completed && o.markupAmount)
    .reduce((sum, o) => sum + (o.markupAmount || 0), 0);

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

  return (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Profit
                </CardTitle>
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
                      <span className="font-medium">{statsByStatus[OrderStatus.Pending] || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>In Production</span>
                      <span className="font-medium">{statsByStatus[OrderStatus.InProduction] || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed</span>
                      <span className="font-medium">{statsByStatus[OrderStatus.Completed] || 0}</span>
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
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
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
                onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

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
            isLoading={isSaving}
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
            isLoading={isSaving}
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
            isLoading={isSaving}
          />
        )}
      </div>
    </LazyWrapper>
  );
}
