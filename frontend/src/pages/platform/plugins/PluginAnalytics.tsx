import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { pluginApprovalService } from '@/services/platform/pluginApprovalService';
import { format } from 'date-fns';

export default function PluginAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await pluginApprovalService.getAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      toast.error('Failed to load analytics', {
        description: error.message || 'Unable to fetch plugin analytics',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No analytics data available</h3>
            <Button onClick={fetchAnalytics} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Plugin Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of plugin usage and installation statistics
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Installations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plugins</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {getPercentage(analytics.summary.active, analytics.summary.total)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Plugin installations by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Active</span>
                </div>
                <span className="font-medium">{analytics.summary.active}</span>
              </div>
              <Progress value={getPercentage(analytics.summary.active, analytics.summary.total)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span>Pending</span>
                </div>
                <span className="font-medium">{analytics.summary.pending}</span>
              </div>
              <Progress value={getPercentage(analytics.summary.pending, analytics.summary.total)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Rejected</span>
                </div>
                <span className="font-medium">{analytics.summary.rejected}</span>
              </div>
              <Progress value={getPercentage(analytics.summary.rejected, analytics.summary.total)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>Suspended</span>
                </div>
                <span className="font-medium">{analytics.summary.suspended}</span>
              </div>
              <Progress value={getPercentage(analytics.summary.suspended, analytics.summary.total)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span>Expired</span>
                </div>
                <span className="font-medium">{analytics.summary.expired}</span>
              </div>
              <Progress value={getPercentage(analytics.summary.expired, analytics.summary.total)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Plugins</CardTitle>
            <CardDescription>Most installed plugins</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.by_plugin.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No plugin installations yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plugin</TableHead>
                    <TableHead className="text-right">Installations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.by_plugin.map((plugin: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plugin.display_name}</div>
                          <div className="text-xs text-muted-foreground">{plugin.plugin_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {plugin.installations}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Latest plugin installation requests</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recent_requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent requests
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plugin</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recent_requests.map((request: any) => (
                  <TableRow key={request.uuid}>
                    <TableCell className="font-medium">{request.plugin_name}</TableCell>
                    <TableCell>{request.tenant}</TableCell>
                    <TableCell>{request.requested_by}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(request.requested_at), 'PP')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
