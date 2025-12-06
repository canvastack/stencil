import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, Package, MapPin, Clock, CheckCircle } from 'lucide-react';

export default function OrderTracking() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingData, setTrackingData] = useState(null);

  const handleTrackOrder = () => {
    // Simulate tracking API call
    console.log('Tracking order:', trackingNumber);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order Tracking</h1>
        <p className="text-muted-foreground">Track your order status and delivery progress</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Track Your Order</CardTitle>
          <CardDescription>
            Enter your order number or tracking number to get real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter order number or tracking ID"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTrackOrder} disabled={!trackingNumber}>
              <Package className="w-4 h-4 mr-2" />
              Track Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo Tracking Result */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Order #ORD-2024-001
            </CardTitle>
            <CardDescription>Etching Service - Custom Metal Plates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Status Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                
                {[
                  { status: 'Order Received', time: '2 hours ago', completed: true, icon: CheckCircle },
                  { status: 'In Production', time: '1 hour ago', completed: true, icon: Package },
                  { status: 'Quality Check', time: '30 mins ago', completed: true, icon: CheckCircle },
                  { status: 'Out for Delivery', time: 'Now', completed: false, current: true, icon: Truck },
                  { status: 'Delivered', time: 'Pending', completed: false, icon: MapPin },
                ].map((step, index) => (
                  <div key={index} className="relative flex items-center gap-4 pb-6">
                    <div className={`
                      relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2
                      ${step.completed ? 'bg-green-100 border-green-500 text-green-700' : 
                        step.current ? 'bg-blue-100 border-blue-500 text-blue-700' : 
                        'bg-gray-100 border-gray-300 text-gray-400'}
                    `}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{step.status}</h4>
                        <Badge variant={step.completed ? 'default' : step.current ? 'secondary' : 'outline'}>
                          {step.time}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Info */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-medium text-sm text-muted-foreground">Estimated Delivery</h5>
                    <p className="font-medium">Today, 2:00 PM - 4:00 PM</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-muted-foreground">Carrier</h5>
                    <p className="font-medium">Express Delivery Service</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-muted-foreground">Tracking ID</h5>
                    <p className="font-medium">TRK-789456123</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}