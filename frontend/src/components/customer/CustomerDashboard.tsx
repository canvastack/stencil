import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/api/orders';
import { Order } from '@/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Search, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { OrderTimeline } from './OrderTimeline';

interface CustomerDashboardProps {
  customerId?: string;
}

export function CustomerDashboard({ customerId }: CustomerDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch customer's orders
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['customer-orders', customerId, searchTerm],
    queryFn: async () => {
      const filters: any = {
        per_page: 50,
      };
      
      if (customerId) {
        filters.customer_id = customerId;
      }
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      return ordersService.getOrders(filters);
    },
  });

  const orders = ordersData?.data || [];

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      vendor_sourcing: 'bg-purple-100 text-purple-800',
      vendor_negotiation: 'bg-indigo-100 text-indigo-800',
      customer_quote: 'bg-cyan-100 text-cyan-800',
      awaiting_payment: 'bg-orange-100 text-orange-800',
      partial_payment: 'bg-lime-100 text-lime-800',
      full_payment: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      in_production: 'bg-blue-100 text-blue-800',
      quality_control: 'bg-teal-100 text-teal-800',
      shipping: 'bg-sky-100 text-sky-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Failed to load orders. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
          <CardDescription>
            Track your orders and view their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No orders found matching your search.' : 'You have no orders yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card
                  key={order.uuid}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedOrder?.uuid === order.uuid ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            Order #{order.orderNumber}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            {formatStatus(order.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span>
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">
                              ${(order.totalAmount / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {order.items && order.items.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              {order.items[0].productName}
                              {order.items.length > 1 && ` +${order.items.length - 1} more`}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Order Details with Timeline */}
      {selectedOrder && (
        <div className="space-y-6">
          <OrderTimeline order={selectedOrder} />
          
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>
                Order #{selectedOrder.orderNumber}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {formatStatus(selectedOrder.status)}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.productName} x {item.quantity}
                        </span>
                        <span className="font-semibold">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${(selectedOrder.totalAmount / 100).toFixed(2)}</span>
                  </div>
                </div>

                {selectedOrder.estimatedDelivery && (
                  <div>
                    <h4 className="font-semibold mb-2">Estimated Delivery</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedOrder.estimatedDelivery), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
