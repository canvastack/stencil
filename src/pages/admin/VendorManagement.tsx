import { useState, useEffect, lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Database, 
  TrendingUp, 
  Search as SearchIcon, 
  CreditCard,
  Users,
  Package,
  DollarSign,
  Loader2
} from 'lucide-react';
import { vendorsService } from '@/services/api/vendors';
import { formatCurrency } from '@/utils/currency';
import { VendorStatsSkeleton } from '@/components/vendor/VendorStatsSkeleton';

const VendorDatabase = lazy(() => import('./vendors/VendorDatabase'));
const VendorPerformance = lazy(() => import('./vendors/VendorPerformance'));
const VendorSourcing = lazy(() => import('./vendors/VendorSourcing'));
const VendorPayments = lazy(() => import('./vendors/VendorPayments'));

export default function VendorManagement() {
  const [loading, setLoading] = useState(true);
  const [vendorStats, setVendorStats] = useState({
    totalVendors: 0,
    activeVendors: 0,
    totalOrders: 0,
    totalValue: 0,
  });

  useEffect(() => {
    const fetchVendorStats = async () => {
      try {
        setLoading(true);
        const response = await vendorsService.getVendors({ per_page: 20 });
        const vendors = response.data || [];
        
        setVendorStats({
          totalVendors: response.total || vendors.length,
          activeVendors: vendors.filter(v => v.status === 'active').length,
          totalOrders: vendors.reduce((sum, v) => sum + (v.total_orders || 0), 0),
          totalValue: vendors.reduce((sum, v) => sum + (v.total_value || 0), 0),
        });
      } catch (err) {
        console.error('Failed to fetch vendor stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorStats();
  }, []);

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vendor Management Hub</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive vendor operations and analytics</p>
        </div>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <VendorStatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vendorStats.totalVendors}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Vendors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vendorStats.activeVendors}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vendorStats.totalOrders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(vendorStats.totalValue)}</p>
            </div>
          </div>
        </Card>
        </div>
      )}

      {/* Main Vendor Management Tabs */}
      <Card hover={false} className="p-6">
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Vendor Database
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="sourcing" className="flex items-center gap-2">
              <SearchIcon className="w-4 h-4" />
              Sourcing
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="database" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <VendorDatabase />
              </Suspense>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <VendorPerformance />
              </Suspense>
            </TabsContent>

            <TabsContent value="sourcing" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <VendorSourcing />
              </Suspense>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Suspense fallback={<LoadingFallback />}>
                <VendorPayments />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
