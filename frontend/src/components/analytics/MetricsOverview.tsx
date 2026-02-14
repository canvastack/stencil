import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Package, Clock, CheckCircle, FileText } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: {
    activeOrders: number;
    activeOrdersChange: number;
    onTimeDeliveryRate: number;
    onTimeDeliveryRateChange: number;
    avgProductionTime: number;
    avgProductionTimeChange: number;
    quoteAcceptanceRate: number;
    quoteAcceptanceRateChange: number;
  };
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  suffix?: string;
  loading?: boolean;
}

function MetricCard({ title, value, change, icon, suffix = '', loading }: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = change > 0;
  const isNegative = change < 0;
  const changeColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}{suffix}
        </div>
        <div className={`flex items-center text-xs ${changeColor} mt-1`}>
          <TrendIcon className="w-3 h-3 mr-1" />
          <span>
            {Math.abs(change).toFixed(1)}% from last period
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsOverview({ metrics, loading }: MetricsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Active Orders"
        value={metrics.activeOrders}
        change={metrics.activeOrdersChange}
        icon={<Package className="h-4 w-4" />}
        loading={loading}
      />
      <MetricCard
        title="On-Time Delivery"
        value={metrics.onTimeDeliveryRate.toFixed(1)}
        change={metrics.onTimeDeliveryRateChange}
        icon={<CheckCircle className="h-4 w-4" />}
        suffix="%"
        loading={loading}
      />
      <MetricCard
        title="Avg Production Time"
        value={metrics.avgProductionTime.toFixed(1)}
        change={metrics.avgProductionTimeChange}
        icon={<Clock className="h-4 w-4" />}
        suffix=" days"
        loading={loading}
      />
      <MetricCard
        title="Quote Acceptance"
        value={metrics.quoteAcceptanceRate.toFixed(1)}
        change={metrics.quoteAcceptanceRateChange}
        icon={<FileText className="h-4 w-4" />}
        suffix="%"
        loading={loading}
      />
    </div>
  );
}
