import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import {
  MetricsOverview,
  ProductionTimelineChart,
  VendorPerformanceTable,
  DeliveryStatusChart,
  RecentActivityFeed,
  ExportDialog,
} from '@/components/analytics';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AnalyticsExportData } from '@/services/export/analyticsExportService';

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const {
    metrics,
    timeline,
    vendors,
    vendorsPagination,
    deliveryStatus,
    activities,
    isLoading,
  } = useAnalyticsDashboard(timeRange);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    toast.success('Dashboard refreshed');
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  // Prepare export data
  const exportData: AnalyticsExportData = {
    metrics: metrics ? {
      activeOrders: metrics.active_orders || 0,
      activeOrdersChange: metrics.active_orders_change || 0,
      onTimeDeliveryRate: metrics.on_time_delivery_rate || 0,
      onTimeDeliveryRateChange: metrics.on_time_delivery_rate_change || 0,
      avgProductionTime: metrics.avg_production_time || 0,
      avgProductionTimeChange: metrics.avg_production_time_change || 0,
      quoteAcceptanceRate: metrics.quote_acceptance_rate || 0,
      quoteAcceptanceRateChange: metrics.quote_acceptance_rate_change || 0,
    } : undefined,
    timeline: timeline || [],
    vendors: vendors?.map(v => ({
      id: v.id,
      name: v.name,
      totalOrders: v.total_orders || 0,
      onTimeDeliveryRate: v.on_time_delivery_rate || 0,
      avgProductionTime: v.avg_production_time || 0,
      qualityScore: v.quality_score || 0,
      status: v.status || 'active',
    })) || [],
    deliveryStatus: deliveryStatus || [],
    activities: activities || [],
  };

  const handleVendorClick = (vendorId: string) => {
    navigate(`/admin/vendors/${vendorId}`);
  };

  const handleStatusClick = (status: string) => {
    navigate(`/admin/orders?status=${status}`);
  };

  const handleActivityClick = (activityId: string) => {
    // Navigate to the related order or entity
    const activity = activities.find((a) => a.id === activityId);
    if (activity?.order_id) {
      navigate(`/admin/orders/${activity.order_id}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor production efficiency, vendor performance, and delivery metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <MetricsOverview metrics={metrics} loading={isLoading} />
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Production Timeline */}
        <div className="md:col-span-2 lg:col-span-1">
          <ProductionTimelineChart
            data={timeline}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            loading={isLoading}
          />
        </div>

        {/* Vendor Performance */}
        <div className="md:col-span-2 lg:col-span-1">
          <VendorPerformanceTable
            vendors={vendors}
            onVendorClick={handleVendorClick}
            loading={isLoading}
            pagination={vendorsPagination ? {
              currentPage: vendorsPagination.current_page,
              perPage: vendorsPagination.per_page,
              total: vendorsPagination.total,
              lastPage: vendorsPagination.last_page,
            } : undefined}
          />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Delivery Status */}
        <div>
          <DeliveryStatusChart
            data={deliveryStatus}
            onStatusClick={handleStatusClick}
            loading={isLoading}
          />
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivityFeed
            activities={activities}
            onActivityClick={handleActivityClick}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleString()}
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={exportData}
        timeRange={timeRange}
      />
    </div>
  );
}
