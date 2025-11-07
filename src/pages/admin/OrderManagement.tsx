import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  customization?: {
    size?: string;
    material?: string;
    color?: string;
    customText?: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  shippingAddress: string;
  notes: string;
  orderDate: string;
  estimatedDelivery: string;
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    customerName: 'Budi Santoso',
    customerEmail: 'budi@email.com',
    customerPhone: '+62 812 3456 7890',
    items: [
      {
        productId: 'prod-001',
        productName: 'Crystal Award Trophy',
        quantity: 5,
        price: 350000,
        customization: {
          customText: 'Best Employee 2025',
        },
      },
    ],
    totalAmount: 1750000,
    status: 'processing',
    paymentStatus: 'paid',
    shippingAddress: 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta',
    notes: 'Mohon dikemas dengan extra hati-hati',
    orderDate: '2025-01-15',
    estimatedDelivery: '2025-01-25',
  },
  {
    id: '2',
    orderNumber: 'ORD-2025-002',
    customerName: 'Siti Nurhaliza',
    customerEmail: 'siti@email.com',
    customerPhone: '+62 813 9876 5432',
    items: [
      {
        productId: 'prod-002',
        productName: 'Stainless Steel Plaque',
        quantity: 10,
        price: 250000,
        customization: {
          size: '30cm x 20cm',
          material: 'Stainless Steel 304',
        },
      },
    ],
    totalAmount: 2500000,
    status: 'pending',
    paymentStatus: 'unpaid',
    shippingAddress: 'Jl. Thamrin No. 45, Jakarta Selatan, DKI Jakarta',
    notes: '',
    orderDate: '2025-01-16',
    estimatedDelivery: '2025-01-23',
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-003',
    customerName: 'Ahmad Dhani',
    customerEmail: 'ahmad@email.com',
    customerPhone: '+62 821 5555 4444',
    items: [
      {
        productId: 'prod-005',
        productName: 'Acrylic LED Sign Custom',
        quantity: 2,
        price: 450000,
        customization: {
          size: '40cm x 30cm',
          color: 'RGB',
        },
      },
    ],
    totalAmount: 900000,
    status: 'completed',
    paymentStatus: 'paid',
    shippingAddress: 'Jl. Gatot Subroto No. 789, Bandung, Jawa Barat',
    notes: 'Tolong kirim sebelum tanggal 20',
    orderDate: '2025-01-10',
    estimatedDelivery: '2025-01-20',
  },
];

// columns are declared inside the component so local handlers (e.g. handleViewOrder)
// are available and we can safely reference row.original for non-accessor fields.

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    toast.success('Order status updated');
  };

  const handleUpdatePaymentStatus = (
    orderId: string,
    newStatus: Order['paymentStatus']
  ) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, paymentStatus: newStatus } : order
      )
    );
    toast.success('Payment status updated');
  };

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const processingOrders = orders.filter((o) => o.status === 'processing').length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const customerName = row.getValue("customerName") as string;
        const customerEmail = (row.original as Order).customerEmail;
        const customerPhone = (row.original as Order).customerPhone;
        return (
          <div>
            <p className="font-medium">{customerName}</p>
            <p className="text-xs text-muted-foreground">{customerEmail}</p>
            <p className="text-xs text-muted-foreground">{customerPhone}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.getValue("items") as OrderItem[];
        return `${items.length} item(s)`;
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const totalAmount = row.getValue("totalAmount") as number;
        return (
          <span className="font-semibold">Rp {totalAmount.toLocaleString('id-ID')}</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as Order['status'];
        const variants = {
          pending: 'secondary',
          processing: 'default',
          completed: 'default',
          cancelled: 'destructive',
        };
        return (
          <Badge variant={variants[status] as any}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payment
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const paymentStatus = row.getValue("paymentStatus") as Order['paymentStatus'];
        const colors = {
          unpaid: 'bg-red-500/10 text-red-500',
          paid: 'bg-green-500/10 text-green-500',
          refunded: 'bg-orange-500/10 text-orange-500',
        };
        return (
          <Badge className={colors[paymentStatus]}>
            {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "orderDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const orderDate = row.getValue("orderDate") as string;
        return new Date(orderDate).toLocaleDateString('id-ID');
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewOrder(order)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">Manage customer orders and track status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingOrders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processing</p>
              <p className="text-2xl font-bold">{processingOrders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="p-6">
        <DataTable
          columns={columns}
          data={orders}
          searchKey="orderNumber"
          searchPlaceholder="Search by order number, customer name, or email..."
        />
      </Card>

      {/* Order Detail Dialog */}
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
                      <div
                        key={index}
                        className="flex justify-between items-start border-b pb-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                          {item.customization && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.customization.size && (
                                <p>Size: {item.customization.size}</p>
                              )}
                              {item.customization.material && (
                                <p>Material: {item.customization.material}</p>
                              )}
                              {item.customization.color && (
                                <p>Color: {item.customization.color}</p>
                              )}
                              {item.customization.customText && (
                                <p>Custom Text: "{item.customization.customText}"</p>
                              )}
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

                {selectedOrder.notes && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Notes
                    </h3>
                    <p className="text-muted-foreground">{selectedOrder.notes}</p>
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
                      <p className="text-muted-foreground">
                        {selectedOrder.customerEmail}
                      </p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-muted-foreground">
                        {selectedOrder.customerPhone}
                      </p>
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
                    <div>
                      <Label>Estimated Delivery</Label>
                      <p className="text-muted-foreground">
                        {new Date(selectedOrder.estimatedDelivery).toLocaleDateString(
                          'id-ID',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <Card className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Order Status</Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(v: any) =>
                        handleUpdateStatus(selectedOrder.id, v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select
                      value={selectedOrder.paymentStatus}
                      onValueChange={(v: any) =>
                        handleUpdatePaymentStatus(selectedOrder.id, v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
