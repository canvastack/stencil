import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RefreshCw,
  Download,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Activity,
  Server,
  Database,
  Globe,
  Zap,
  Shield,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Eye,
  Target,
  Layers,
  HardDrive,
  Wifi,
  CreditCard,
  UserCheck,
  Settings,
  Bell,
  FileText,
  MapPin,
  Star
} from 'lucide-react';
import { PlatformAnalytics, TenantAnalytics, AnalyticsDashboard } from '@/services/platform/analyticsService';
import { toast } from 'sonner';

// Mock data for demo - will be replaced with real API calls
const mockDashboard: AnalyticsDashboard = {
  overview: {
    id: '1',
    total_tenants: 239,
    active_tenants: 216,
    trial_tenants: 47,
    paid_tenants: 169,
    suspended_tenants: 23,
    
    total_users: 2847,
    active_users_30d: 2103,
    new_users_30d: 284,
    daily_active_users: 892,
    monthly_active_users: 2103,
    
    total_revenue: 487650.25,
    monthly_recurring_revenue: 67420.50,
    annual_recurring_revenue: 809046.00,
    average_revenue_per_user: 171.32,
    churn_rate: 3.2,
    
    total_storage_gb: 15420.8,
    total_bandwidth_gb: 89250.2,
    total_api_calls: 15678340,
    total_database_size_gb: 2340.6,
    
    platform_uptime: 99.97,
    average_response_time_ms: 187,
    error_rate: 0.02,
    
    tenant_growth_rate: 12.5,
    user_growth_rate: 8.7,
    revenue_growth_rate: 15.2,
    
    healthy_tenants: 189,
    tenants_with_warnings: 27,
    tenants_with_critical_issues: 0,
    
    date: '2024-12-02',
    generated_at: '2024-12-02T09:00:00Z'
  },
  top_tenants: [
    {
      tenant_id: '1',
      tenant_name: 'Enterprise Engraving Solutions',
      tenant_slug: 'enterprise-engraving',
      subscription_plan: 'enterprise',
      subscription_status: 'active',
      created_at: '2023-09-01T00:00:00Z',
      total_users: 85,
      active_users_30d: 62,
      storage_used_gb: 423.8,
      bandwidth_used_gb: 1205.3,
      api_calls_30d: 28450,
      total_orders: 5678,
      total_revenue: 987650.25,
      monthly_revenue: 2999.99,
      orders_30d: 234,
      revenue_30d: 45670.80,
      uptime_30d: 99.98,
      avg_response_time_ms: 156,
      error_rate_30d: 0.01,
      page_views_30d: 89250,
      sessions_30d: 12340,
      bounce_rate: 23.5,
      avg_session_duration_min: 8.4,
      health_status: 'healthy',
      last_activity: '2024-12-02T09:15:00Z',
      last_health_check: '2024-12-02T09:00:00Z',
      user_growth_rate: 15.2,
      revenue_growth_rate: 22.8,
      usage_growth_rate: 18.9
    },
    {
      tenant_id: '2',
      tenant_name: 'Acme Etching Company',
      tenant_slug: 'acme-etching',
      subscription_plan: 'professional',
      subscription_status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      total_users: 12,
      active_users_30d: 8,
      storage_used_gb: 45.2,
      bandwidth_used_gb: 156.8,
      api_calls_30d: 3420,
      total_orders: 1245,
      total_revenue: 125430.50,
      monthly_revenue: 149.99,
      orders_30d: 89,
      revenue_30d: 12450.25,
      uptime_30d: 99.95,
      avg_response_time_ms: 203,
      error_rate_30d: 0.03,
      page_views_30d: 15420,
      sessions_30d: 2340,
      bounce_rate: 31.2,
      avg_session_duration_min: 5.8,
      health_status: 'healthy',
      last_activity: '2024-12-02T08:30:00Z',
      last_health_check: '2024-12-02T09:00:00Z',
      user_growth_rate: 8.5,
      revenue_growth_rate: 12.3,
      usage_growth_rate: 9.7
    },
    {
      tenant_id: '3',
      tenant_name: 'Precision Glass Works',
      tenant_slug: 'precision-glass',
      subscription_plan: 'starter',
      subscription_status: 'active',
      created_at: '2024-06-01T00:00:00Z',
      total_users: 3,
      active_users_30d: 3,
      storage_used_gb: 8.7,
      bandwidth_used_gb: 23.4,
      api_calls_30d: 890,
      total_orders: 287,
      total_revenue: 34560.75,
      monthly_revenue: 49.99,
      orders_30d: 23,
      revenue_30d: 2340.50,
      uptime_30d: 99.92,
      avg_response_time_ms: 245,
      error_rate_30d: 0.02,
      page_views_30d: 4230,
      sessions_30d: 567,
      bounce_rate: 28.9,
      avg_session_duration_min: 6.2,
      health_status: 'healthy',
      last_activity: '2024-12-02T07:45:00Z',
      last_health_check: '2024-12-02T09:00:00Z',
      user_growth_rate: 25.0,
      revenue_growth_rate: 18.7,
      usage_growth_rate: 32.1
    }
  ],
  recent_activity: [
    {
      type: 'tenant_created',
      tenant_name: 'Artisan Metal Works',
      description: 'New tenant signed up with Professional plan',
      timestamp: '2024-12-02T08:45:00Z',
      metadata: { plan: 'professional', trial_days: 14 }
    },
    {
      type: 'plan_upgraded',
      tenant_name: 'Custom Designs LLC',
      description: 'Upgraded from Starter to Professional plan',
      timestamp: '2024-12-02T07:30:00Z',
      metadata: { from: 'starter', to: 'professional' }
    },
    {
      type: 'subscription_started',
      tenant_name: 'Modern Etching Co',
      description: 'Trial converted to paid subscription',
      timestamp: '2024-12-02T06:15:00Z',
      metadata: { plan: 'starter', trial_duration: 14 }
    },
    {
      type: 'plan_downgraded',
      tenant_name: 'Small Business Etching',
      description: 'Downgraded from Professional to Starter plan',
      timestamp: '2024-12-01T22:30:00Z',
      metadata: { from: 'professional', to: 'starter', reason: 'cost_optimization' }
    },
    {
      type: 'subscription_cancelled',
      tenant_name: 'Temporary Solutions Inc',
      description: 'Subscription cancelled - reason: business closure',
      timestamp: '2024-12-01T18:45:00Z',
      metadata: { plan: 'starter', reason: 'business_closure' }
    }
  ],
  alerts: [
    {
      type: 'warning',
      title: 'High API Usage',
      description: 'Enterprise Engraving Solutions is approaching API limit (95% used)',
      timestamp: '2024-12-02T08:30:00Z',
      tenant_id: '1',
      tenant_name: 'Enterprise Engraving Solutions'
    },
    {
      type: 'info',
      title: 'Trial Expiring Soon',
      description: '12 tenants have trials expiring in the next 7 days',
      timestamp: '2024-12-02T08:00:00Z'
    },
    {
      type: 'warning',
      title: 'Storage Usage Alert',
      description: '3 tenants are above 90% storage capacity',
      timestamp: '2024-12-02T07:45:00Z'
    }
  ],
  usage_trends: [],
  revenue_trends: [],
  performance_metrics: []
};

const realTimeMetrics = {
  active_users: 1247,
  requests_per_minute: 3450,
  response_time_ms: 187,
  error_rate: 0.02,
  system_load: 67,
  database_connections: 234,
  cache_hit_rate: 94.5,
  bandwidth_usage_mbps: 145.8
};

const healthStatusColors = {
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const planColors = {
  starter: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  professional: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  custom: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
};

const activityIcons = {
  tenant_created: Building2,
  subscription_started: CheckCircle,
  plan_upgraded: TrendingUp,
  plan_downgraded: TrendingDown,
  subscription_cancelled: AlertCircle
};

const alertIcons = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: CheckCircle
};

const alertColors = {
  critical: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600'
};

export default function PlatformAnalytics() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard>(mockDashboard);
  const [realTime, setRealTime] = useState(realTimeMetrics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatPercentage = (value: number, decimals: number = 1) => {
    return `${value.toFixed(decimals)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat().format(value);
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const exportData = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setLoading(true);
      // TODO: Implement actual export
      toast.success(`Analytics data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Analytics data refreshed');
    } catch (error) {
      toast.error('Failed to refresh analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into platform performance and usage</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportData('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData('excel')}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={refreshData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(dashboard.overview.total_tenants)}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getChangeIcon(dashboard.overview.tenant_growth_rate)}
                  <span className={getChangeColor(dashboard.overview.tenant_growth_rate)}>
                    {formatPercentage(dashboard.overview.tenant_growth_rate)} growth
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(dashboard.overview.total_users)}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getChangeIcon(dashboard.overview.user_growth_rate)}
                  <span className={getChangeColor(dashboard.overview.user_growth_rate)}>
                    {formatPercentage(dashboard.overview.user_growth_rate)} growth
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboard.overview.total_revenue)}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getChangeIcon(dashboard.overview.revenue_growth_rate)}
                  <span className={getChangeColor(dashboard.overview.revenue_growth_rate)}>
                    {formatPercentage(dashboard.overview.revenue_growth_rate)} growth
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(dashboard.overview.platform_uptime, 2)}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboard.overview.average_response_time_ms}ms avg response
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscription Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Tenants</span>
                  <span className="text-sm font-medium">{formatNumber(dashboard.overview.active_tenants)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Trial Tenants</span>
                  <span className="text-sm font-medium">{formatNumber(dashboard.overview.trial_tenants)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paid Tenants</span>
                  <span className="text-sm font-medium">{formatNumber(dashboard.overview.paid_tenants)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Suspended Tenants</span>
                  <span className="text-sm font-medium">{formatNumber(dashboard.overview.suspended_tenants)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">MRR</span>
                  <span className="text-sm font-medium">{formatCurrency(dashboard.overview.monthly_recurring_revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ARR</span>
                  <span className="text-sm font-medium">{formatCurrency(dashboard.overview.annual_recurring_revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ARPU</span>
                  <span className="text-sm font-medium">{formatCurrency(dashboard.overview.average_revenue_per_user)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Churn Rate</span>
                  <span className="text-sm font-medium">{formatPercentage(dashboard.overview.churn_rate)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Health Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Healthy</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{formatNumber(dashboard.overview.healthy_tenants)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Warnings</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{formatNumber(dashboard.overview.tenants_with_warnings)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Critical</span>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">{formatNumber(dashboard.overview.tenants_with_critical_issues)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Alerts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest tenant and subscription changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.recent_activity.map((activity, index) => {
                    const Icon = activityIcons[activity.type];
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <Icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.tenant_name}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Important notifications and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.alerts.map((alert, index) => {
                    const Icon = alertIcons[alert.type];
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${alertColors[alert.type]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Tenants</CardTitle>
              <CardDescription>Tenants with highest revenue and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Revenue (30d)</TableHead>
                    <TableHead>Orders (30d)</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.top_tenants.map((tenant) => (
                    <TableRow key={tenant.tenant_id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{tenant.tenant_name}</span>
                          <span className="text-xs text-muted-foreground">{tenant.tenant_slug}</span>
                          <span className="text-xs text-muted-foreground">
                            Created: {new Date(tenant.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={planColors[tenant.subscription_plan as keyof typeof planColors]}>
                          {tenant.subscription_plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tenant.active_users_30d} / {tenant.total_users}</div>
                          <div className="text-xs text-muted-foreground">active / total</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(tenant.revenue_30d)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(tenant.monthly_revenue)} monthly
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tenant.orders_30d}</div>
                          <div className="text-xs text-muted-foreground">
                            {tenant.total_orders} total
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={healthStatusColors[tenant.health_status]}>
                            {tenant.health_status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatPercentage(tenant.uptime_30d, 2)} uptime
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className={getChangeColor(tenant.revenue_growth_rate)}>
                            {formatPercentage(tenant.revenue_growth_rate)} revenue
                          </div>
                          <div className={getChangeColor(tenant.user_growth_rate)}>
                            {formatPercentage(tenant.user_growth_rate)} users
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="w-4 h-4 mr-2" />
                              Manage
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboard.overview.monthly_recurring_revenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly Recurring Revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ARR</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboard.overview.annual_recurring_revenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Annual Recurring Revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ARPU</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboard.overview.average_revenue_per_user)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average Revenue Per User
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(dashboard.overview.churn_rate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly churn rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed breakdown of revenue streams and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Revenue Charts Coming Soon</h3>
                <p className="text-muted-foreground">
                  Interactive charts showing revenue trends, plan distribution, and growth metrics will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(dashboard.overview.platform_uptime, 2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform availability
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard.overview.average_response_time_ms}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(dashboard.overview.error_rate, 3)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform error rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboard.overview.total_api_calls)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total API requests
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Platform resource consumption metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Usage</span>
                    <span>{formatNumber(dashboard.overview.total_storage_gb)} GB</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bandwidth Usage</span>
                    <span>{formatNumber(dashboard.overview.total_bandwidth_gb)} GB</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Database Size</span>
                    <span>{formatNumber(dashboard.overview.total_database_size_gb)} GB</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Historical performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Performance Charts Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Time-series charts showing performance trends will be displayed here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(realTime.active_users)}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requests/Min</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(realTime.requests_per_minute)}</div>
                <p className="text-xs text-muted-foreground">API requests per minute</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Load</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realTime.system_load}%</div>
                <p className="text-xs text-muted-foreground">CPU utilization</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(realTime.cache_hit_rate)}</div>
                <p className="text-xs text-muted-foreground">Cache efficiency</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Real-time system performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <span>{realTime.response_time_ms}ms</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span>{formatPercentage(realTime.error_rate, 2)}</span>
                  </div>
                  <Progress value={2} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Database Connections</span>
                    <span>{realTime.database_connections}</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bandwidth Usage</span>
                    <span>{realTime.bandwidth_usage_mbps} Mbps</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live Activity Feed</CardTitle>
                <CardDescription>Real-time platform activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Live Activity Feed</h3>
                  <p className="text-muted-foreground">
                    Real-time activity stream will be displayed here showing user actions, system events, and alerts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}