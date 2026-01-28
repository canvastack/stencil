import { useLocation, useNavigate } from 'react-router-dom';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui/lazy-components';
import {
  ArrowLeft,
  Package,
  User,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
} from 'lucide-react';
import { OrderStatus, PaymentStatus, type Order } from '@/types/order';
import { OrderWorkflow } from '@/utils/orderWorkflow';

export default function OrderComparison() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get orders from navigation state
  const orders: Order[] = location.state?.orders || [];
  
  if (orders.length === 0) {
    return (
      <LazyWrapper>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            <h1 className="text-2xl font-bold">Order Comparison</h1>
          </div>
          
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Orders to Compare</h2>
            <p className="text-muted-foreground mb-4">
              Please select 2-4 orders from the orders list to compare them.
            </p>
            <Button onClick={() => navigate('/admin/orders')}>
              Go to Orders
            </Button>
          </Card>
        </div>
      </LazyWrapper>
    );
  }

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

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Comparison</h1>
            <p className="text-muted-foreground">
              Comparing {orders.length} orders side by side
            </p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${orders.length}, 1fr)` }}>
          {orders.map((order, index) => (
            <Card key={order.uuid || order.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="w-4 h-4" />
                    Customer
                  </div>
                  <div className="pl-6">
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                  </div>
                </div>

                {/* Order Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Package className="w-4 h-4" />
                    Status
                  </div>
                  <div className="pl-6">
                    <Badge variant={getStatusVariant(order.status)}>
                      {OrderWorkflow.getStatusInfo(order.status).label}
                    </Badge>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="w-4 h-4" />
                    Payment
                  </div>
                  <div className="pl-6">
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                      {order.paymentStatus
                        ?.split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </Badge>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="w-4 h-4" />
                    Total Amount
                  </div>
                  <div className="pl-6">
                    <p className="text-lg font-bold text-primary">
                      Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Order Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Order Date
                  </div>
                  <div className="pl-6">
                    <p className="text-sm">
                      {order.createdAt ? 
                        new Date(order.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                {/* Items Count */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Package className="w-4 h-4" />
                    Items
                  </div>
                  <div className="pl-6">
                    <p className="text-sm">
                      {Array.isArray(order.items) ? order.items.length : 0} item(s)
                    </p>
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      Shipping
                    </div>
                    <div className="pl-6">
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(order.customerNotes || order.internalNotes) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="w-4 h-4" />
                      Notes
                    </div>
                    <div className="pl-6 space-y-1">
                      {order.customerNotes && (
                        <p className="text-xs text-muted-foreground">
                          Customer: {order.customerNotes}
                        </p>
                      )}
                      {order.internalNotes && (
                        <p className="text-xs text-muted-foreground">
                          Internal: {order.internalNotes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/admin/orders/${order.uuid || order.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Section */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Comparison Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  Rp {orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Average Value</p>
                <p className="text-2xl font-bold">
                  Rp {Math.round(orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {orders.filter(order => order.status === OrderStatus.Completed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LazyWrapper>
  );
}