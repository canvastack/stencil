import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Package,
  DollarSign,
  MapPin,
  User,
  FileText,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useOrder, useOrderPayments, useOrderShipments, useOrderHistory, useTransitionOrderState } from '@/hooks/useOrders';
import { OrderStatus } from '@/types/order';
import { BusinessStage, OrderProgressCalculator } from '@/utils/OrderProgressCalculator';
import { EnhancedOrderStepper } from '@/components/orders/EnhancedOrderStepper';
import { EnhancedTimelineTab } from '@/components/orders/EnhancedTimelineTab';
import { EnhancedShipmentTab } from '@/components/orders/EnhancedShipmentTab';
import { EnhancedOrderDetailHeader } from '@/components/orders/EnhancedOrderDetailHeader';
import { ActionableStageModal } from '@/components/orders/ActionableStageModal';
import { OrderNotifications } from '@/components/orders/OrderNotifications';
import StatusActionPanel from '@/components/orders/StatusActionPanel';
import { FloatingHelpButton, HeaderHelpButton } from '@/components/help/HelpButton';
import { useHelpSystem } from '@/components/help/HelpSystemProvider';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCurrentContext } = useHelpSystem();
  
  // Set help context for this page
  React.useEffect(() => {
    setCurrentContext('order-detail');
  }, [setCurrentContext]);
  
  // State for stage detail modal
  const [selectedStage, setSelectedStage] = useState<BusinessStage | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  
  // Mock user permissions for status management (replace with real permissions)
  const userPermissions = ['update_order_status', 'admin', 'update_payment_status', 'cancel_order', 'process_refund'];
  
  // Use useOrder hook for single order
  const { data: currentOrder, isLoading, error, refetch: refetchOrder } = useOrder(id || '');
  
  // Use separate hooks for additional data
  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = useOrderPayments(id || '');
  const { data: shipments = [], isLoading: loadingShipments, refetch: refetchShipments } = useOrderShipments(id || '');
  const { data: timeline = [], isLoading: loadingTimeline, refetch: refetchTimeline } = useOrderHistory(id || '');
  
  // Use mutation hook for state transitions
  const transitionMutation = useTransitionOrderState();

  const handleStageClick = (stage: BusinessStage) => {
    // Show detailed stage information in a modal
    setSelectedStage(stage);
    setIsStageModalOpen(true);
    
    // Also show a toast for immediate feedback
    const stageInfo = OrderProgressCalculator.getStageInfo(stage);
    toast.info(`Stage: ${stageInfo.indonesianLabel}`, {
      description: stageInfo.indonesianDescription,
      duration: 3000,
    });
    
    console.log('Stage clicked:', stage, stageInfo);
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
          <HeaderHelpButton context="order-detail" className="ml-auto" />
        </div>

        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Order</h2>
          <p className="text-muted-foreground mb-6">
            {error?.message || error?.toString() || 'Order not found or could not be loaded'}
          </p>
          <Button onClick={() => navigate('/admin/orders')}>Back to Orders</Button>
        </Card>
      </div>
    );
  }

  // Debug: Log the order data structure to understand the actual format
  console.log('🔍 [OrderDetail] Current order data:', {
    order: currentOrder,
    items: currentOrder?.items,
    itemsType: typeof currentOrder?.items,
    itemsIsArray: Array.isArray(currentOrder?.items),
    firstItem: currentOrder?.items?.[0],
    timeline: timeline,
    payments: payments,
    shipments: shipments
  });

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <EnhancedOrderDetailHeader 
        order={currentOrder}
        isLoading={isLoading}
        onBack={() => navigate(-1)}
      />

      {/* Order Progress */}
      <Card className="p-6" data-section="progress">
        <h3 className="text-lg font-semibold mb-4">Order Progress</h3>
        <EnhancedOrderStepper 
          currentStatus={currentOrder.status as OrderStatus}
          showLabels={true}
          showDescription={true}
          useIndonesian={true}
          compact={false}
          timeline={timeline}
          isLoading={loadingTimeline}
          onStageClick={handleStageClick}
          onQuickAction={async (targetStage: BusinessStage, _actionType: 'advance' | 'complete', note: string) => {
            try {
              // Use the transition mutation for quick actions
              await transitionMutation.mutateAsync({
                id: id || '',
                data: {
                  action: `advance_to_${targetStage}`,
                  notes: note,
                }
              });
              
              // Show success feedback
              const stageInfo = OrderProgressCalculator.getStageInfo(targetStage);
              toast.success(`Order advanced to ${stageInfo.indonesianLabel}`, {
                description: note,
                duration: 4000,
              });
            } catch (error) {
              console.error('Quick action failed:', error);
              toast.error('Failed to advance order. Please try again.');
            }
          }}
        />
      </Card>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h3>

            <div className="space-y-4">
              {currentOrder.items && Array.isArray(currentOrder.items) ? currentOrder.items.map((item: any, index) => {
                // Handle JSON structure from backend - items could be stored as JSON with different field names
                const price = item.price || item.unit_price || item.pricing?.unit_price || 0;
                const quantity = item.quantity || 1;
                const productName = item.productName || item.product_name || item.name || 'Unknown Product';
                const customization = item.customization || item.specifications || {};
                const subtotal = item.subtotal || (price * quantity);
                
                return (
                  <div key={index} className="flex justify-between items-start border-b pb-4 last:border-0">
                    <div className="flex-1">
                      <p className="font-semibold">{productName}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {quantity}</p>
                      {customization && Object.keys(customization).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          <p className="font-medium">Specifications:</p>
                          {Object.entries(customization).map(([key, value]) => (
                            <p key={key} className="ml-2">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {String(value)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</p>
                      <p className="text-xs text-muted-foreground">
                        @ Rp {price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-muted-foreground">
                  No items found for this order
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="space-y-2">
                {/* Calculate subtotal from items - handle different JSON structures */}
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    Rp {currentOrder.items.reduce((sum: number, item: any) => {
                      const price = item.price || item.unit_price || item.pricing?.unit_price || 0;
                      const quantity = item.quantity || 1;
                      const subtotal = item.subtotal || (price * quantity);
                      return sum + subtotal;
                    }, 0).toLocaleString('id-ID')}
                  </span>
                </div>
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
                  <p className="text-lg font-semibold">{currentOrder.customerName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-muted-foreground break-all">{currentOrder.customerEmail || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-muted-foreground">{currentOrder.customerPhone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Customer ID</Label>
                  <p className="text-sm text-muted-foreground">{currentOrder.customerId || 'N/A'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h3>

              <div className="space-y-4">
                <p className="text-muted-foreground whitespace-pre-wrap">{currentOrder.shippingAddress || 'No shipping address provided'}</p>

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

          <StatusActionPanel
            currentStatus={currentOrder.status as OrderStatus}
            timeline={timeline}
            userPermissions={userPermissions}
            orderId={id || ''}
            isLoading={loadingTimeline}
            onAddNote={async (note: string) => {
              // Add note functionality - could be implemented with a separate API
              toast.success('Note added successfully');
              console.log('Adding note:', note);
            }}
            onViewTimeline={() => {
              // Navigate to timeline tab
              const timelineTab = document.querySelector('[value="timeline"]') as HTMLElement;
              if (timelineTab) {
                timelineTab.click();
              }
            }}
          />
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
          <EnhancedShipmentTab
            shipments={shipments}
            orderStatus={currentOrder.status as OrderStatus}
            isLoading={loadingShipments}
            onRefresh={async () => {
              // Refresh shipment data using React Query refetch
              await refetchShipments();
            }}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <EnhancedTimelineTab
            orderEvents={timeline}
            currentStatus={currentOrder.status as OrderStatus}
            isLoading={loadingTimeline}
            onRefresh={async () => {
              // Refresh timeline data using React Query refetch
              await Promise.all([
                refetchTimeline(),
                refetchOrder(), // Also refresh order data for consistency
              ]);
            }}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <OrderNotifications 
            orderUuid={currentOrder.uuid || id || ''}
            className="w-full"
          />
        </TabsContent>
      </Tabs>

      {/* Actionable Stage Modal */}
      <ActionableStageModal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        stage={selectedStage}
        currentStatus={currentOrder.status as OrderStatus}
        timeline={timeline}
        userPermissions={userPermissions}
        orderId={id || ''}
        order={currentOrder} // Add order prop for vendor negotiation actions
        isLoading={loadingTimeline}
        onAddNote={async (stage: BusinessStage, note: string) => {
          // Add note functionality - could be implemented with a separate API
          toast.success('Note added successfully');
          console.log('Adding note for stage:', stage, note);
        }}
        onViewHistory={(stage: BusinessStage) => {
          // Navigate to timeline tab and highlight the stage
          const timelineTab = document.querySelector('[value="timeline"]') as HTMLElement;
          if (timelineTab) {
            timelineTab.click();
          }
          toast.info(`Viewing timeline for ${OrderProgressCalculator.getStageInfo(stage).indonesianLabel}`);
        }}
      />

      {/* Floating Help Button */}
      <FloatingHelpButton context="order-detail" />
    </div>
  );
}