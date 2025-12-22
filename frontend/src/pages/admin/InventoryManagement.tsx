import { useState, useEffect, Suspense } from 'react';
import {
  Package,
  MapPin,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Archive,
  Warehouse
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { InventoryStock, InventoryLocations, InventoryAlerts, InventoryReports } from './inventory';
import { getInventoryItems } from '@/services/api/inventory';

export default function InventoryManagement() {
  const [loading, setLoading] = useState(true);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
  });

  useEffect(() => {
    const fetchInventoryStats = async () => {
      try {
        setLoading(true);
        const response = await getInventoryItems();
        const items = response || [];
        
        const lowStockItems = items.filter(item => 
          item.current_stock <= (item.min_stock || 0)
        ).length;
        
        const outOfStockItems = items.filter(item => 
          item.current_stock === 0
        ).length;
        
        const totalValue = items.reduce((sum, item) => 
          sum + ((item.current_stock || 0) * (item.unit_cost || 0)), 0
        );
        
        setInventoryStats({
          totalItems: items.length,
          lowStockItems,
          outOfStockItems,
          totalValue,
        });
      } catch (err) {
        console.error('Failed to fetch inventory stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryStats();
  }, []);

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management Hub</h1>
          <p className="text-gray-600">Comprehensive inventory control and analytics</p>
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
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{inventoryStats.totalItems}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold">{inventoryStats.lowStockItems}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <Archive className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">{inventoryStats.outOfStockItems}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(inventoryStats.totalValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Inventory Management Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock Management
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <Warehouse className="w-4 h-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="stock" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <InventoryStock />
              </Suspense>
            </TabsContent>

            <TabsContent value="locations" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <InventoryLocations />
              </Suspense>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <InventoryAlerts />
              </Suspense>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <InventoryReports />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}