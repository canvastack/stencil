import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  Clock,
  Server,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  RefreshCw,
} from 'lucide-react';
import { performanceService } from '@/services/api/performance';
import { queryKeys } from '@/lib/react-query';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PerformanceMonitoring() {
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('page_load_time');

  // Fetch performance stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: queryKeys.dashboard.metrics(selectedPeriod),
    queryFn: () => performanceService.getStats({
      dateFrom: new Date(Date.now() - getPeriodMs(selectedPeriod)).toISOString(),
    }),
  });

  // Fetch real-time metrics
  const { data: realTimeMetrics, isLoading: realTimeLoading } = useQuery({
    queryKey: ['performance', 'realtime'],
    queryFn: () => performanceService.getRealTimeMetrics(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch performance trends
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['performance', 'trends', selectedMetric, selectedPeriod],
    queryFn: () => performanceService.getTrends(selectedMetric, selectedPeriod),
  });

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['performance', 'alerts'],
    queryFn: () => performanceService.getAlerts(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetchStats();
  };

  function getPeriodMs(period: string): number {
    switch (period) {
      case '1h': return 3600000;
      case '24h': return 86400000;
      case '7d': return 604800000;
      case '30d': return 2592000000;
      default: return 86400000;
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-muted-foreground">Current Load</p>
                <p className="text-2xl font-bold">
                  {realTimeMetrics ? `${realTimeMetrics.currentLoad.toFixed(1)}%` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center">
              <Server className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-muted-foreground">Active Connections</p>
                <p className="text-2xl font-bold">
                  {realTimeMetrics ? realTimeMetrics.activeConnections.toLocaleString() : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-muted-foreground">Memory Usage</p>
                <p className="text-2xl font-bold">
                  {realTimeMetrics ? `${realTimeMetrics.memoryUsage.toFixed(1)}%` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">
                  {realTimeMetrics ? `${realTimeMetrics.responseTime.toFixed(0)}ms` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">
                  {realTimeMetrics ? `${realTimeMetrics.errorRate.toFixed(2)}%` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <Badge
                      variant={alert.type === 'critical' ? 'destructive' : 'secondary'}
                      className="mr-3"
                    >
                      {alert.type.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.metric}: {alert.value} (threshold: {alert.threshold})
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Page Load Time</span>
                    <span className="font-medium">
                      {stats ? formatDuration(stats.avgPageLoadTime) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">API Response Time</span>
                    <span className="font-medium">
                      {stats ? formatDuration(stats.avgApiResponseTime) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Memory Usage</span>
                    <span className="font-medium">
                      {stats ? formatBytes(stats.avgMemoryUsage) : '--'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Error Rates by Endpoint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.errorRates.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground truncate">
                        {item.endpoint}
                      </span>
                      <span className={`text-sm font-medium ${
                        item.errorRate > 0.05 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {(item.errorRate * 100).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Memory Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats?.memoryTrends || []}>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis hide />
                    <Line 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Track performance metrics over time</CardDescription>
              </div>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page_load_time">Page Load Time</SelectItem>
                  <SelectItem value="api_response_time">API Response Time</SelectItem>
                  <SelectItem value="memory_usage">Memory Usage</SelectItem>
                  <SelectItem value="error_rate">Error Rate</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trends ? trends.labels.map((label, index) => ({
                  time: label,
                  value: trends.values[index]
                })) : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slowest Pages</CardTitle>
              <CardDescription>Pages with highest average load times</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats?.slowestPages || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="page" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgTime" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slowest API Endpoints</CardTitle>
              <CardDescription>API endpoints with highest average response times</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats?.slowestApis || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="endpoint" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgTime" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Over Time</CardTitle>
              <CardDescription>Track memory consumption patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats?.memoryTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis tickFormatter={formatBytes} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: number) => [formatBytes(value), 'Memory Usage']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#ff7c7c" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}