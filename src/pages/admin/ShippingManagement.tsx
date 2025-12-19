import { useState, useEffect, Suspense } from 'react';
import {
  Truck,
  Package,
  MapPin,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { ShippingMethods, ShippingCarriers, ShippingTracking, ShippingReports } from './shipping';
import { shippingService } from '@/services/api/shipping';

export default function ShippingManagement() {
  const [loading, setLoading] = useState(true);
  const [shippingStats, setShippingStats] = useState({
    totalShipments: 0,
    pendingShipments: 0,
    deliveredShipments: 0,
    avgDeliveryTime: 0,
  });

  useEffect(() => {
    const fetchShippingStats = async () => {
      try {
        setLoading(true);
        // Mock data - replace with real API calls
        const mockStats = {
          totalShipments: 1247,
          pendingShipments: 89,
          deliveredShipments: 1098,
          avgDeliveryTime: 3.2,
        };
        
        setShippingStats(mockStats);
      } catch (err) {
        console.error('Failed to fetch shipping stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShippingStats();
  }, []);

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipping Management Hub</h1>
          <p className="text-gray-600">Comprehensive shipping operations and logistics</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Shipments</p>
              <p className="text-2xl font-bold">{shippingStats.totalShipments.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Shipments</p>
              <p className="text-2xl font-bold">{shippingStats.pendingShipments}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold">{shippingStats.deliveredShipments.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Truck className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Delivery Time</p>
              <p className="text-2xl font-bold">{shippingStats.avgDeliveryTime} days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Shipping Management Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="methods" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="methods" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Shipping Methods
            </TabsTrigger>
            <TabsTrigger value="carriers" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Carriers
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Tracking
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="methods" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <ShippingMethods />
              </Suspense>
            </TabsContent>

            <TabsContent value="carriers" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <ShippingCarriers />
              </Suspense>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <ShippingTracking />
              </Suspense>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <ShippingReports />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}