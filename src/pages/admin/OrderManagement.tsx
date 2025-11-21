import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useOrders } from '@/hooks/useOrders';
import { OrderStatus, PaymentStatus, type Order, type OrderItem } from '@/types/order';
import { useNavigate } from 'react-router-dom';

export default function OrderManagement() {
  const navigate = useNavigate();
  const {
    orders,
    pagination,
    isLoading,
    isSaving,
    error,
    fetchOrders,
    fetchOrderById,
    deleteOrder,
    transitionOrderState,
  } = useOrders();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchOrders({
      page: pagination.page,
      per_page: pagination.per_page,
      search: filters.search || undefined,
      status: filters.status || undefined,
    });
  }, []);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleApplyFilters = () => {
    fetchOrders({
      page: 1,
      per_page: pagination.per_page,
      search: filters.search || undefined,
      status: filters.status || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      dateFrom: '',
      dateTo: '',
    });
    fetchOrders({
      page: 1,
      per_page: pagination.per_page,
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
    navigate(`/admin/quotes?order_id=${order.id}`);
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
      await deleteOrder(orderToDelete);
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      await fetchOrders({
        page: pagination.page,
        per_page: pagination.per_page,
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!selectedOrder) return;
    
    try {
      await transitionOrderState(orderId, {
        action: newStatus,
        notes: `Status changed to ${newStatus}`,
      });
      
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus as OrderStatus } : null
      );
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchOrders({
      page: newPage,
      per_page: pagination.per_page,
      search: filters.search || undefined,
      status: filters.status || undefined,
    });
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [OrderStatus.New]: 'default',
      [OrderStatus.SourcingVendor]: 'secondary',
      [OrderStatus.VendorNegotiation]: 'secondary',
      [OrderStatus.CustomerQuotation]: 'default',
      [OrderStatus.WaitingPayment]: 'default',
      [OrderStatus.PaymentReceived]: 'default',
      [OrderStatus.InProduction]: 'default',
      [OrderStatus.QualityCheck]: 'default',
      [OrderStatus.ReadyToShip]: 'secondary',
      [OrderStatus.Shipped]: 'secondary',
      [OrderStatus.Delivered]: 'default',
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
        const items = row.getValue('items') as OrderItem[];
        return `${items.length} item(s)`;
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
        return <span className="font-semibold">Rp {totalAmount.toLocaleString('id-ID')}</span>;
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
        const status = row.getValue('status') as string;
        return (
          <Badge variant={getStatusVariant(status)}>
            {status
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
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
      accessorKey: 'orderDate',
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
        const orderDate = row.getValue('orderDate') as string;
        return new Date(orderDate).toLocaleDateString('id-ID');
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex gap-2">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteOrder(order.id)}
              disabled={isSaving}
              title="Delete Order"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === PaymentStatus.Paid)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const statsByStatus = {
    [OrderStatus.New]: orders.filter((o) => o.status === OrderStatus.New).length,
    [OrderStatus.WaitingPayment]: orders.filter((o) => o.status === OrderStatus.WaitingPayment).length,
    [OrderStatus.InProduction]: orders.filter((o) => o.status === OrderStatus.InProduction).length,
    [OrderStatus.Completed]: orders.filter((o) => o.status === OrderStatus.Completed).length,
  };

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500">Error Loading Orders</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button className="mt-4" onClick={() => fetchOrders()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">Manage customer orders and track status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">New / Waiting</p>
              <p className="text-2xl font-bold">
                {statsByStatus[OrderStatus.New] + statsByStatus[OrderStatus.WaitingPayment]}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Production</p>
              <p className="text-2xl font-bold">{statsByStatus[OrderStatus.InProduction]}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue (Paid)</p>
              <p className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </Card>
      </div>

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
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.last_page}
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
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value={OrderStatus.New}>New</SelectItem>
                    <SelectItem value={OrderStatus.WaitingPayment}>Waiting Payment</SelectItem>
                    <SelectItem value={OrderStatus.InProduction}>In Production</SelectItem>
                    <SelectItem value={OrderStatus.Shipped}>Shipped</SelectItem>
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
                    <SelectItem value="">All Payment Status</SelectItem>
                    <SelectItem value={PaymentStatus.Unpaid}>Unpaid</SelectItem>
                    <SelectItem value={PaymentStatus.PartiallyPaid}>Partially Paid</SelectItem>
                    <SelectItem value={PaymentStatus.Paid}>Paid</SelectItem>
                    <SelectItem value={PaymentStatus.Refunded}>Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleApplyFilters}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Filtering...
                    </>
                  ) : (
                    'Apply'
                  )}
                </Button>
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading orders...</span>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={orders}
              searchKey="orderNumber"
              searchPlaceholder="Search by order number..."
            />
            
            {orders.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.per_page + 1} to{' '}
                  {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} orders
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.last_page) return null;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.last_page || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="customer">Customer Info</TabsTrigger>
                <TabsTrigger value="status">Update Status</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start border-b pb-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          {item.customization && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {Object.entries(item.customization).map(([key, value]) => (
                                <p key={key}>
                                  {key.charAt(0).toUpperCase() + key.slice(1)}: {String(value)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @ Rp {item.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <p className="font-semibold text-lg">Total Amount</p>
                    <p className="font-bold text-2xl text-primary">
                      Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </h3>
                  <p className="text-muted-foreground">{selectedOrder.shippingAddress}</p>
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
                      <p className="text-lg font-medium">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-muted-foreground">{selectedOrder.customerEmail}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-muted-foreground">{selectedOrder.customerPhone}</p>
                    </div>
                    <div>
                      <Label>Order Date</Label>
                      <p className="text-muted-foreground">
                        {new Date(selectedOrder.orderDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
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

              <TabsContent value="status" className="space-y-4">
                <Card className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Order Status</Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(v) => handleUpdateOrderStatus(selectedOrder.id, v)}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={OrderStatus.New}>New</SelectItem>
                        <SelectItem value={OrderStatus.SourcingVendor}>Sourcing Vendor</SelectItem>
                        <SelectItem value={OrderStatus.VendorNegotiation}>Vendor Negotiation</SelectItem>
                        <SelectItem value={OrderStatus.CustomerQuotation}>Customer Quotation</SelectItem>
                        <SelectItem value={OrderStatus.WaitingPayment}>Waiting Payment</SelectItem>
                        <SelectItem value={OrderStatus.PaymentReceived}>Payment Received</SelectItem>
                        <SelectItem value={OrderStatus.InProduction}>In Production</SelectItem>
                        <SelectItem value={OrderStatus.QualityCheck}>Quality Check</SelectItem>
                        <SelectItem value={OrderStatus.ReadyToShip}>Ready To Ship</SelectItem>
                        <SelectItem value={OrderStatus.Shipped}>Shipped</SelectItem>
                        <SelectItem value={OrderStatus.Delivered}>Delivered</SelectItem>
                        <SelectItem value={OrderStatus.Completed}>Completed</SelectItem>
                        <SelectItem value={OrderStatus.Cancelled}>Cancelled</SelectItem>
                        <SelectItem value={OrderStatus.Refunded}>Refunded</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <p className="text-xs text-muted-foreground">Payment status is managed separately</p>
                  </div>
                </Card>
              </TabsContent>
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
    </div>
  );
}
