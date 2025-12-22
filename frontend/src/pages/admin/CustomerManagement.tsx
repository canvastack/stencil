import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import {
  UserCircle,
  Database,
  Users,
  CreditCard,
  Settings,
  ShoppingBag,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { CustomerDatabase, CustomerSegments, CustomerPortal, CustomerCredit } from './customers';
import { customersService } from '@/services/api/customers';

export default function CustomerManagement() {
  const [loading, setLoading] = useState(true);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchCustomerStats = async () => {
      try {
        setLoading(true);
        const response = await customersService.getCustomers({ per_page: 100 });
        const customers = response.data || [];
        
        setCustomerStats({
          totalCustomers: customers.length,
          activeCustomers: customers.filter(c => c.status === 'active').length,
          totalOrders: customers.reduce((sum, c) => sum + (c.total_orders || 0), 0),
          totalRevenue: customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0),
        });
      } catch (err) {
        console.error('Failed to fetch customer stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerStats();
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
          <h1 className="text-3xl font-bold text-gray-900">Customer Management Hub</h1>
          <p className="text-gray-600">Comprehensive customer relationship management</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{customerStats.totalCustomers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-2xl font-bold">{customerStats.activeCustomers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{customerStats.totalOrders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(customerStats.totalRevenue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Customer Management Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Customer Database
            </TabsTrigger>
            <TabsTrigger value="segments" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Segments
            </TabsTrigger>
            <TabsTrigger value="portal" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Portal Access
            </TabsTrigger>
            <TabsTrigger value="credit" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Credit Management
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="database" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <CustomerDatabase />
              </Suspense>
            </TabsContent>

            <TabsContent value="segments" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <CustomerSegments />
              </Suspense>
            </TabsContent>

            <TabsContent value="portal" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <CustomerPortal />
              </Suspense>
            </TabsContent>

            <TabsContent value="credit" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <CustomerCredit />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}