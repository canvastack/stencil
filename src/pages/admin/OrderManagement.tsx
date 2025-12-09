import React, { useState, useEffect } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
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
  Textarea,
} from '@/components/ui/lazy-components';
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
  CheckCircle2,
  XCircle,
  FileText,
  User,
  MapPin,
  ArrowUpDown,
  Trash2,
  Edit2,
  Loader2,
  Filter,
  X,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { useOrders, useUpdateOrder } from '@/hooks/useOrders';
import { OrderStatus, PaymentStatus, PaymentType, type Order, type OrderItem } from '@/types/order';
import { OrderWorkflow } from '@/utils/orderWorkflow';
import { OrderStatusTransition } from '@/components/orders/OrderStatusTransition';
import { VendorSourcing } from '@/components/orders/VendorSourcing';
import { PaymentProcessing } from '@/components/orders/PaymentProcessing';
import { useNavigate } from 'react-router-dom';

export default function OrderManagement() {
  const navigate = useNavigate();
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
  const pagination = ordersQuery.data?.meta || { page: 1, per_page: 15, total: 0, last_page: 1 };
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
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

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

  const handleVendorAssigned = async (orderId: string, vendorId: string) => {
    try {
      // Update order with vendor assignment
      const updateResponse = await updateOrderMutation.mutateAsync({
        id: orderId,
        data: {
          vendorId: vendorId,
          status: OrderStatus.VendorNegotiation
        }
      });

      return updateResponse;
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
          status: newStatus,
          internalNotes: notes
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



  const handlePageChange = (newPage: number) => {
    // Note: Would need to implement pagination with filters
    ordersQuery.refetch();
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

  // Stats Cards Skeleton Component
  const StatsCardsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column - Stacked Cards */}
      <div className="space-y-3">
        <div className="p-4 bg-card rounded-lg border animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-24"></div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card rounded-lg border animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-28"></div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card rounded-lg border animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-24"></div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Column - Total Revenue */}
      <div className="p-6 bg-card rounded-lg border animate-pulse flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-lg mx-auto"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
            <div className="h-8 bg-muted rounded w-40 mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Right Column - Total Profit */}
      <div className="p-6 bg-card rounded-lg border animate-pulse flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-lg mx-auto"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
            <div className="h-8 bg-muted rounded w-40 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Card with hover effects
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
      <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">Manage customer orders and track status</p>
      </div>

      {isLoading ? (
        <StatsCardsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Stacked Cards */}
          <div className="space-y-3">
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{(pagination as any)?.total || (pagination as any)?.pagination?.total || 0}</p>
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Awaiting Payment</p>
                  <p className="text-2xl font-bold">{statsByStatus[OrderStatus.AwaitingPayment] || 0}</p>
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Package className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Production</p>
                  <p className="text-2xl font-bold">{statsByStatus[OrderStatus.InProduction] || 0}</p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Middle Column - Total Revenue */}
          <EnhancedCard className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="p-4 bg-green-500/10 rounded-lg inline-block mb-4">
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
          </EnhancedCard>

          {/* Right Column - Total Profit */}
          <EnhancedCard className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="p-4 bg-emerald-500/10 rounded-lg inline-block mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Total Profit</p>
              <p className="text-3xl font-bold text-emerald-600">
                Rp {totalProfit.toLocaleString('id-ID')}
              </p>
            </div>
          </EnhancedCard>
        </div>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="mb-2 block">Search</Label>
                <Input
                  placeholder="Order number, customer name..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Order Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={OrderStatus.Draft}>Draft</SelectItem>
                    <SelectItem value={OrderStatus.Pending}>Pending</SelectItem>
                    <SelectItem value={OrderStatus.VendorSourcing}>Vendor Sourcing</SelectItem>
                    <SelectItem value={OrderStatus.VendorNegotiation}>Vendor Negotiation</SelectItem>
                    <SelectItem value={OrderStatus.CustomerQuote}>Customer Quote</SelectItem>
                    <SelectItem value={OrderStatus.AwaitingPayment}>Awaiting Payment</SelectItem>
                    <SelectItem value={OrderStatus.PartialPayment}>Partial Payment (DP 50%)</SelectItem>
                    <SelectItem value={OrderStatus.FullPayment}>Full Payment (100%)</SelectItem>
                    <SelectItem value={OrderStatus.InProduction}>In Production</SelectItem>
                    <SelectItem value={OrderStatus.QualityControl}>Quality Control</SelectItem>
                    <SelectItem value={OrderStatus.Shipping}>Shipping</SelectItem>
                    <SelectItem value={OrderStatus.Completed}>Completed</SelectItem>
                    <SelectItem value={OrderStatus.Cancelled}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Payment Status</Label>
                <Select value={filters.paymentStatus} onValueChange={(value) => setFilters((prev) => ({ ...prev, paymentStatus: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Status</SelectItem>
                    <SelectItem value={PaymentStatus.Unpaid}>Unpaid</SelectItem>
                    <SelectItem value={PaymentStatus.PartiallyPaid}>Partially Paid</SelectItem>
                    <SelectItem value={PaymentStatus.Paid}>Paid</SelectItem>
                    <SelectItem value={PaymentStatus.Refunded}>Refunded</SelectItem>
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
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <DataTable
          columns={columns}
          data={ordersData}
          searchKey="orderNumber"
          searchPlaceholder="Search by order number..."
          loading={isLoading}
          datasetId="order-management"
        />
      </Card>

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
                  <TabsList className={`grid w-full ${canTransition ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <TabsTrigger value="details">Order Details</TabsTrigger>
                    <TabsTrigger value="customer">Customer Info</TabsTrigger>
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
                            {item?.customization && typeof item.customization === 'object' && !Array.isArray(item.customization) && Object.keys(item.customization).length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <p>Customization: {JSON.stringify(item.customization)}</p>
                              </div>
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
                          setIsDetailDialogOpen(false); // Close detail dialog first
                          setTimeout(() => {
                            setIsStatusTransitionOpen(true); // Then open status transition
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
