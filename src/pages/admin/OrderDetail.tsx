import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  DollarSign,
  Truck,
  Clock,
  MapPin,
  User,
  FileText,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatus, PaymentStatus, type Order } from '@/types/order';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentOrder,
    isLoading,
    isSaving,
    error,
    fetchOrderById,
    getOrderPayments,
    getOrderShipments,
    getOrderHistory,
    transitionOrderState,
  } = useOrders();

  const [payments, setPayments] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderDetails();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    if (!id) return;

    await fetchOrderById(id);

    setLoadingPayments(true);
    try {
      const paymentData = await getOrderPayments(id);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoadingPayments(false);
    }

    setLoadingShipments(true);
    try {
      const shipmentData = await getOrderShipments(id);
      setShipments(Array.isArray(shipmentData) ? shipmentData : []);
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setLoadingShipments(false);
    }

    setLoadingTimeline(true);
    try {
      const historyData = await getOrderHistory(id);
      setTimeline(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!currentOrder) return;

    try {
      await transitionOrderState(currentOrder.id, {
        action: newStatus,
        notes: `Status changed to ${newStatus}`,
      });

      await loadOrderDetails();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !currentOrder) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>

        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Order</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'Order not found or could not be loaded'}
          </p>
          <Button onClick={() => navigate('/admin/orders')}>Back to Orders</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{currentOrder.orderNumber}</h1>
          <p className="text-muted-foreground">Order ID: {currentOrder.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(currentOrder.status)} className="mt-1">
                {currentOrder.status
                  .split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-lg font-bold">
                Rp {currentOrder.totalAmount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge className={getPaymentStatusColor(currentOrder.paymentStatus)} className="mt-1">
                {currentOrder.paymentStatus
                  .split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="text-sm font-medium">
                {new Date(currentOrder.orderDate).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h3>

            <div className="space-y-4">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    {item.customization && Object.keys(item.customization).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        {Object.entries(item.customization).map(([key, value]) => (
                          <p key={key}>
                            <span className="font-medium capitalize">{key}:</span> {String(value)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    <p className="text-xs text-muted-foreground">
                      @ Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">Rp {currentOrder.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {currentOrder.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span className="font-medium">Rp {currentOrder.tax.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {currentOrder.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className="font-medium">Rp {currentOrder.shippingCost.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {currentOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-Rp {currentOrder.discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">Rp {currentOrder.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <p className="text-lg font-semibold">{currentOrder.customerName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-muted-foreground break-all">{currentOrder.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-muted-foreground">{currentOrder.customerPhone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Customer ID</Label>
                  <p className="text-sm text-muted-foreground">{currentOrder.customerId}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h3>

              <div className="space-y-4">
                <p className="text-muted-foreground whitespace-pre-wrap">{currentOrder.shippingAddress}</p>

                {currentOrder.billingAddress && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Billing Address</h4>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {currentOrder.billingAddress}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {(currentOrder.customerNotes || currentOrder.internalNotes) && (
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes
              </h3>

              <div className="space-y-4">
                {currentOrder.customerNotes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">CUSTOMER NOTES</p>
                    <p className="text-muted-foreground">{currentOrder.customerNotes}</p>
                  </div>
                )}
                {currentOrder.internalNotes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">INTERNAL NOTES</p>
                    <p className="text-muted-foreground">{currentOrder.internalNotes}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Update Order Status</h3>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Order Status</Label>
                <Select value={currentOrder.status} onValueChange={handleStatusChange} disabled={isSaving}>
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

              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating status...
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment History
            </h3>

            {loadingPayments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading payments...</span>
              </div>
            ) : payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No payments recorded yet</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center border rounded-lg p-3">
                    <div>
                      <p className="font-medium">{payment.method || 'Payment'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.paid_at || payment.created_at).toLocaleDateString('id-ID')}
                      </p>
                      {payment.notes && <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rp {(payment.amount || 0).toLocaleString('id-ID')}</p>
                      {payment.status && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {payment.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Information
            </h3>

            {loadingShipments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading shipments...</span>
              </div>
            ) : shipments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No shipments yet</p>
            ) : (
              <div className="space-y-4">
                {shipments.map((shipment, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{shipment.method || 'Standard Shipping'}</p>
                        {shipment.status && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {shipment.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        Rp {(shipment.cost || 0).toLocaleString('id-ID')}
                      </p>
                    </div>

                    {shipment.tracking_number && (
                      <div>
                        <p className="text-xs text-muted-foreground">Tracking Number</p>
                        <p className="font-mono text-sm">{shipment.tracking_number}</p>
                      </div>
                    )}

                    {shipment.shipped_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipped:</span>
                        <span>{new Date(shipment.shipped_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    )}

                    {shipment.delivered_at && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Delivered:</span>
                        <span>{new Date(shipment.delivered_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Order Timeline</h3>

            {loadingTimeline ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading timeline...</span>
              </div>
            ) : timeline.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No timeline events available</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="relative pb-4 last:pb-0">
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-12 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{event.action || event.status}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.timestamp || event.created_at).toLocaleDateString(
                                  'id-ID',
                                  {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </p>
                            </div>
                            {event.status && (
                              <Badge variant="outline" className="text-xs">
                                {event.status
                                  .split('_')
                                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ')}
                              </Badge>
                            )}
                          </div>

                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          )}

                          {event.notes && (
                            <p className="text-sm text-muted-foreground italic">{event.notes}</p>
                          )}

                          {event.actor && (
                            <p className="text-xs text-muted-foreground mt-2">By: {event.actor}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
