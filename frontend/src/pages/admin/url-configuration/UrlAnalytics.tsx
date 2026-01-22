import { useState } from 'react';
import {
  useUrlAnalyticsOverview,
  useAccessTrends,
  useGeographicDistribution,
  usePerformanceDistribution,
  useTopReferrers,
  useDeviceBreakdown,
} from '@/hooks/useTenantUrl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Users, Clock, Globe, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import AccessTrendsChart from '@/components/tenant-url/AccessTrendsChart';
import UrlPatternChart from '@/components/tenant-url/UrlPatternChart';
import PerformanceChart from '@/components/tenant-url/PerformanceChart';
import GeographicTable from '@/components/tenant-url/GeographicTable';
import ReferrersList from '@/components/tenant-url/ReferrersList';
import DeviceChart from '@/components/tenant-url/DeviceChart';

/**
 * UrlAnalytics Page Component
 * 
 * Comprehensive analytics dashboard untuk monitoring URL access patterns dan performance metrics.
 * Menampilkan 7 section analytics:
 * 
 * 1. **Overview Metrics Cards**:
 *    - Total Accesses (dengan growth percentage)
 *    - Unique Visitors
 *    - Average Response Time
 *    - Custom Domain Usage %
 * 
 * 2. **Access Trends Chart**: Line chart time series data untuk accesses dan unique visitors
 * 3. **URL Pattern Distribution**: Pie chart breakdown penggunaan subdomain/path/custom domain
 * 4. **Geographic Distribution**: Table dengan country flags, access counts, dan progress bars
 * 5. **Performance Metrics**: Bar chart distribution response time dalam buckets
 * 6. **Top Referrers**: List top 10 traffic sources dengan percentages
 * 7. **Device Breakdown**: Donut chart distribusi Desktop/Mobile/Tablet/Bot
 * 
 * User dapat filter data berdasarkan period: Today, 7 days, 30 days, 90 days, 1 year.
 * Semua data fetching menggunakan React Query dengan automatic refetching per period change.
 * 
 * Privacy-conscious: IP addresses hashed, no PII stored.
 * 
 * @page
 * @route /admin/url-analytics
 * @access Tenant Admin only
 * 
 * @returns {JSX.Element} Analytics dashboard dengan charts dan metrics
 */
export default function UrlAnalytics() {
  const [period, setPeriod] = useState('30d');

  const { data: overview, isLoading: overviewLoading, isError: overviewError } = useUrlAnalyticsOverview(period);
  const { data: trends, isLoading: trendsLoading } = useAccessTrends(period);
  const { data: geographic, isLoading: geographicLoading } = useGeographicDistribution(period);
  const { data: performance, isLoading: performanceLoading } = usePerformanceDistribution(period);
  const { data: referrers, isLoading: referrersLoading } = useTopReferrers(period, 10);
  const { data: devices, isLoading: devicesLoading } = useDeviceBreakdown(period);

  const isLoading =
    overviewLoading ||
    trendsLoading ||
    geographicLoading ||
    performanceLoading ||
    referrersLoading ||
    devicesLoading;

  if (overviewError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">URL Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your URL access patterns and performance metrics
          </p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Today</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Accesses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {overview?.total_accesses.toLocaleString() || 0}
                </div>
                {overview && overview.growth_percentage !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span
                      className={cn(
                        overview.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {overview.growth_percentage >= 0 ? '+' : ''}
                      {overview.growth_percentage.toFixed(1)}%
                    </span>{' '}
                    from previous period
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {overview?.unique_visitors.toLocaleString() || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview?.avg_response_time_ms || 0}ms</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview && overview.avg_response_time_ms < 100
                    ? 'Excellent'
                    : overview && overview.avg_response_time_ms < 300
                    ? 'Good'
                    : 'Needs improvement'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Custom Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {overview?.by_url_pattern.custom_domain.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">accesses via custom domains</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Access Trends</CardTitle>
          <CardDescription>URL access patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <AccessTrendsChart data={trends} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Access by URL Pattern</CardTitle>
            <CardDescription>Distribution across access methods</CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <UrlPatternChart data={overview?.by_url_pattern} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>Response time breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <PerformanceChart data={performance} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution</CardTitle>
          <CardDescription>Accesses by country</CardDescription>
        </CardHeader>
        <CardContent>
          {geographicLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <GeographicTable data={geographic} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Traffic sources</CardDescription>
          </CardHeader>
          <CardContent>
            {referrersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <ReferrersList data={referrers} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Access by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {devicesLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <DeviceChart data={devices} />
            )}
          </CardContent>
        </Card>
      </div>

      {!isLoading && overview?.total_accesses === 0 && (
        <Alert>
          <AlertDescription>
            No analytics data available for the selected period. Data will appear once your URLs
            are accessed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
