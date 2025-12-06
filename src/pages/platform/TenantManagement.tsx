import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Building2,
  Users,
  Database,
  Activity,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Pause,
  Play,
  ExternalLink,
  Calendar,
  BarChart3,
  CreditCard,
  Globe,
  Server,
  HardDrive,
  Wifi,
  AlertCircle,
  UserCheck,
  FileText,
  Zap,
  Target
} from 'lucide-react';
import { TenantAccount } from '@/services/platform/tenantService';
import { toast } from 'sonner';

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  provisioning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  migrating: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  deactivated: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

const healthColors = {
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

const planColors = {
  trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  starter: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  professional: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  custom: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
};

// Mock data for demo - will be replaced with real API calls
const mockTenants: TenantAccount[] = [
  {
    id: '1',
    tenant_uuid: 'tenant-uuid-1',
    name: 'Acme Etching Co',
    slug: 'acme-etching',
    display_name: 'Acme Etching Company',
    description: 'Premium metal etching and engraving services',
    primary_contact_name: 'John Smith',
    primary_contact_email: 'john@acme-etching.com',
    primary_contact_phone: '+1-555-0123',
    subdomain: 'acme',
    custom_domain: 'acme-etching.com',
    subscription_plan: 'professional',
    subscription_status: 'active',
    subscription_starts_at: '2024-01-01T00:00:00Z',
    subscription_ends_at: '2024-12-31T23:59:59Z',
    user_limit: 50,
    storage_limit_gb: 100,
    bandwidth_limit_gb: 500,
    api_call_limit: 10000,
    custom_domain_enabled: true,
    white_label_enabled: false,
    current_users: 12,
    current_storage_gb: 45.2,
    current_bandwidth_gb: 156.8,
    current_api_calls: 3420,
    enabled_features: ['quotes', 'invoices', 'payments', 'production', 'shipping', 'analytics'],
    status: 'active',
    health_status: 'healthy',
    last_activity_at: '2024-12-02T08:30:00Z',
    last_health_check_at: '2024-12-02T09:00:00Z',
    database_name: 'tenant_acme_etching',
    database_schema: 'acme_etching',
    database_size_mb: 2340.5,
    backup_enabled: true,
    backup_frequency: 'daily',
    last_backup_at: '2024-12-02T02:00:00Z',
    total_orders: 1245,
    total_revenue: 125430.50,
    monthly_active_users: 8,
    daily_active_users: 3,
    page_views_last_30_days: 15420,
    data_retention_days: 365,
    gdpr_compliance_enabled: true,
    security_level: 'enhanced',
    two_factor_enforced: false,
    onboarding_completed: true,
    onboarding_completed_at: '2024-01-15T10:30:00Z',
    tags: ['premium', 'manufacturing', 'b2b'],
    created_by: 'platform-admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-12-02T09:15:00Z'
  },
  {
    id: '2',
    tenant_uuid: 'tenant-uuid-2',
    name: 'Precision Glass Works',
    slug: 'precision-glass',
    display_name: 'Precision Glass Works Ltd',
    description: 'Custom glass etching and design solutions',
    primary_contact_name: 'Sarah Johnson',
    primary_contact_email: 'sarah@precisionglass.com',
    primary_contact_phone: '+1-555-0456',
    subdomain: 'precision',
    subscription_plan: 'starter',
    subscription_status: 'active',
    trial_ends_at: undefined,
    subscription_starts_at: '2024-06-01T00:00:00Z',
    subscription_ends_at: '2025-05-31T23:59:59Z',
    user_limit: 10,
    storage_limit_gb: 25,
    bandwidth_limit_gb: 100,
    api_call_limit: 2500,
    custom_domain_enabled: false,
    white_label_enabled: false,
    current_users: 3,
    current_storage_gb: 8.7,
    current_bandwidth_gb: 23.4,
    current_api_calls: 890,
    enabled_features: ['quotes', 'invoices', 'payments'],
    status: 'active',
    health_status: 'healthy',
    last_activity_at: '2024-12-02T07:45:00Z',
    last_health_check_at: '2024-12-02T09:00:00Z',
    database_name: 'tenant_precision_glass',
    database_schema: 'precision_glass',
    database_size_mb: 456.2,
    backup_enabled: true,
    backup_frequency: 'weekly',
    last_backup_at: '2024-11-30T02:00:00Z',
    total_orders: 287,
    total_revenue: 34560.75,
    monthly_active_users: 3,
    daily_active_users: 1,
    page_views_last_30_days: 4230,
    data_retention_days: 180,
    gdpr_compliance_enabled: false,
    security_level: 'standard',
    two_factor_enforced: false,
    onboarding_completed: true,
    onboarding_completed_at: '2024-06-15T14:20:00Z',
    tags: ['small-business', 'glass', 'b2c'],
    created_by: 'platform-admin',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-12-01T16:30:00Z'
  },
  {
    id: '3',
    tenant_uuid: 'tenant-uuid-3',
    name: 'Enterprise Engraving',
    slug: 'enterprise-engraving',
    display_name: 'Enterprise Engraving Solutions',
    description: 'Large-scale industrial engraving operations',
    primary_contact_name: 'Michael Chen',
    primary_contact_email: 'michael@enterprise-engraving.com',
    primary_contact_phone: '+1-555-0789',
    subdomain: 'enterprise',
    custom_domain: 'enterprise-engraving.com',
    subscription_plan: 'enterprise',
    subscription_status: 'active',
    subscription_starts_at: '2023-09-01T00:00:00Z',
    subscription_ends_at: '2025-08-31T23:59:59Z',
    user_limit: 200,
    storage_limit_gb: 1000,
    bandwidth_limit_gb: 2000,
    api_call_limit: 50000,
    custom_domain_enabled: true,
    white_label_enabled: true,
    current_users: 85,
    current_storage_gb: 423.8,
    current_bandwidth_gb: 1205.3,
    current_api_calls: 28450,
    enabled_features: ['quotes', 'invoices', 'payments', 'production', 'quality', 'shipping', 'analytics', 'advanced-reporting', 'api-access'],
    status: 'active',
    health_status: 'healthy',
    last_activity_at: '2024-12-02T09:15:00Z',
    last_health_check_at: '2024-12-02T09:00:00Z',
    database_name: 'tenant_enterprise_engraving',
    database_schema: 'enterprise_engraving',
    database_size_mb: 15670.3,
    backup_enabled: true,
    backup_frequency: 'daily',
    last_backup_at: '2024-12-02T02:00:00Z',
    total_orders: 5678,
    total_revenue: 987650.25,
    monthly_active_users: 62,
    daily_active_users: 28,
    page_views_last_30_days: 89250,
    data_retention_days: 2555,
    gdpr_compliance_enabled: true,
    security_level: 'enterprise',
    two_factor_enforced: true,
    onboarding_completed: true,
    onboarding_completed_at: '2023-09-30T11:45:00Z',
    tags: ['enterprise', 'high-volume', 'manufacturing', 'b2b'],
    created_by: 'platform-admin',
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2024-12-02T09:20:00Z'
  }
];

export default function TenantManagement() {
  const [tenants, setTenants] = useState<TenantAccount[]>(mockTenants);
  const [selectedTenant, setSelectedTenant] = useState<TenantAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.primary_contact_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    const matchesPlan = planFilter === 'all' || tenant.subscription_plan === planFilter;
    const matchesHealth = healthFilter === 'all' || tenant.health_status === healthFilter;
    
    return matchesSearch && matchesStatus && matchesPlan && matchesHealth;
  });

  // Calculate summary statistics
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
    pending: tenants.filter(t => t.status === 'pending').length,
    healthy: tenants.filter(t => t.health_status === 'healthy').length,
    warning: tenants.filter(t => t.health_status === 'warning').length,
    critical: tenants.filter(t => t.health_status === 'critical').length,
    totalRevenue: tenants.reduce((sum, t) => sum + t.total_revenue, 0),
    totalUsers: tenants.reduce((sum, t) => sum + t.current_users, 0),
    totalOrders: tenants.reduce((sum, t) => sum + t.total_orders, 0)
  };

  const handleTenantAction = async (tenant: TenantAccount, action: string) => {
    try {
      setLoading(true);
      // TODO: Implement actual API calls
      switch (action) {
        case 'suspend':
          toast.success(`Tenant ${tenant.name} suspended successfully`);
          break;
        case 'activate':
          toast.success(`Tenant ${tenant.name} activated successfully`);
          break;
        case 'deactivate':
          toast.success(`Tenant ${tenant.name} deactivated successfully`);
          break;
        case 'health-check':
          toast.success(`Health check completed for ${tenant.name}`);
          break;
        default:
          toast.info(`Action ${action} performed on ${tenant.name}`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} tenant: ${tenant.name}`);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground">Manage and monitor all tenant accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Tenant
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenant Directory</TabsTrigger>
          <TabsTrigger value="health">Health Monitor</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.active} active, {stats.pending} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all tenants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active platform users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.healthy}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.warning} warnings, {stats.critical} critical
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Health Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Status Distribution</CardTitle>
                <CardDescription>Current status of all tenant accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <p>Stats: {JSON.stringify(stats)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Status Overview</CardTitle>
                <CardDescription>System health across all tenants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <p>Health Stats: {JSON.stringify(stats)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tenants..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPlanFilter('all');
                  setHealthFilter('all');
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Directory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tenant Directory ({filteredTenants.length})</CardTitle>
              <CardDescription>Complete list of tenant accounts and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{tenant.name}</span>
                          <span className="text-xs text-muted-foreground">{tenant.primary_contact_email}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {tenant.custom_domain && (
                              <Badge variant="outline" className="text-xs">
                                <Globe className="w-3 h-3 mr-1" />
                                Custom Domain
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={planColors[tenant.subscription_plan]}>
                          {tenant.subscription_plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[tenant.status]}>
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={healthColors[tenant.health_status]}>
                          {tenant.health_status === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {tenant.health_status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {tenant.health_status === 'critical' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {tenant.health_status === 'unknown' && <Clock className="w-3 h-3 mr-1" />}
                          {tenant.health_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {tenant.current_users} / {tenant.user_limit}
                          <Progress 
                            value={getUsagePercentage(tenant.current_users, tenant.user_limit)} 
                            className="w-16 h-1 mt-1"
                          />
                        </div>
                      </TableCell>
                      <TableCell>${tenant.total_revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {tenant.last_activity_at ? new Date(tenant.last_activity_at).toLocaleDateString() : 'Never'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedTenant(tenant);
                              setShowDetailsDialog(true);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`https://${tenant.subdomain}.canvastencil.com`, '_blank')}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Visit Site
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {tenant.status === 'active' ? (
                              <DropdownMenuItem onClick={() => handleTenantAction(tenant, 'suspend')}>
                                <Pause className="w-4 h-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleTenantAction(tenant, 'activate')}>
                                <Play className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleTenantAction(tenant, 'health-check')}>
                              <Activity className="w-4 h-4 mr-2" />
                              Health Check
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Settings className="w-4 h-4 mr-2" />
                              Settings
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

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTenants.map((tenant) => (
              <Card key={tenant.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <Badge className={healthColors[tenant.health_status]}>
                      {tenant.health_status}
                    </Badge>
                  </div>
                  <CardDescription>{tenant.display_name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Resource Usage */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Users
                      </span>
                      <span>{tenant.current_users} / {tenant.user_limit}</span>
                    </div>
                    <Progress value={getUsagePercentage(tenant.current_users, tenant.user_limit)} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Storage
                      </span>
                      <span>{tenant.current_storage_gb.toFixed(1)} / {tenant.storage_limit_gb} GB</span>
                    </div>
                    <Progress value={getUsagePercentage(tenant.current_storage_gb, tenant.storage_limit_gb)} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        Bandwidth
                      </span>
                      <span>{tenant.current_bandwidth_gb.toFixed(1)} / {tenant.bandwidth_limit_gb} GB</span>
                    </div>
                    <Progress value={getUsagePercentage(tenant.current_bandwidth_gb, tenant.bandwidth_limit_gb)} className="h-2" />
                  </div>

                  <Separator />

                  {/* System Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">DB Size</span>
                      <div className="font-medium">{tenant.database_size_mb.toFixed(1)} MB</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Backup</span>
                      <div className="font-medium text-xs">
                        {tenant.last_backup_at ? new Date(tenant.last_backup_at).toLocaleDateString() : 'None'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Security</span>
                      <div className="font-medium capitalize">{tenant.security_level}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">2FA</span>
                      <div className="font-medium">{tenant.two_factor_enforced ? 'Enforced' : 'Optional'}</div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleTenantAction(tenant, 'health-check')}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Run Health Check
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Platform-wide performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Response Time</span>
                    <span className="text-sm font-medium">245ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-sm font-medium text-green-600">99.98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="text-sm font-medium">0.02%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Sessions</span>
                    <span className="text-sm font-medium">1,247</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>Resource consumption trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total API Calls</span>
                    <span className="text-sm font-medium">32,760</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Storage Used</span>
                    <span className="text-sm font-medium">477.7 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bandwidth Used</span>
                    <span className="text-sm font-medium">1.4 TB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Database Queries</span>
                    <span className="text-sm font-medium">156,890</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>Business growth indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">New Tenants (30d)</span>
                    <span className="text-sm font-medium text-green-600">+3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Churn Rate</span>
                    <span className="text-sm font-medium">2.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Revenue/Tenant</span>
                    <span className="text-sm font-medium">$4,165</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">LTV:CAC Ratio</span>
                    <span className="text-sm font-medium">4.2:1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tenant Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tenant Details: {selectedTenant?.name}</DialogTitle>
            <DialogDescription>
              Comprehensive information about {selectedTenant?.display_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTenant && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Basic Info</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tenant Name</label>
                    <div className="text-sm">{selectedTenant.name}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <div className="text-sm">{selectedTenant.display_name}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Contact</label>
                    <div className="text-sm">{selectedTenant.primary_contact_name}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="text-sm">{selectedTenant.primary_contact_email}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <div className="text-sm">{selectedTenant.primary_contact_phone || 'Not provided'}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subdomain</label>
                    <div className="text-sm">{selectedTenant.subdomain}.canvastencil.com</div>
                  </div>
                  {selectedTenant.custom_domain && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Custom Domain</label>
                      <div className="text-sm">{selectedTenant.custom_domain}</div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Created</label>
                    <div className="text-sm">{new Date(selectedTenant.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="resources" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">User Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Current Users</span>
                          <span>{selectedTenant.current_users}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>User Limit</span>
                          <span>{selectedTenant.user_limit}</span>
                        </div>
                        <Progress value={getUsagePercentage(selectedTenant.current_users, selectedTenant.user_limit)} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Storage Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Current Storage</span>
                          <span>{selectedTenant.current_storage_gb.toFixed(1)} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Storage Limit</span>
                          <span>{selectedTenant.storage_limit_gb} GB</span>
                        </div>
                        <Progress value={getUsagePercentage(selectedTenant.current_storage_gb, selectedTenant.storage_limit_gb)} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Bandwidth Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Current Bandwidth</span>
                          <span>{selectedTenant.current_bandwidth_gb.toFixed(1)} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bandwidth Limit</span>
                          <span>{selectedTenant.bandwidth_limit_gb} GB</span>
                        </div>
                        <Progress value={getUsagePercentage(selectedTenant.current_bandwidth_gb, selectedTenant.bandwidth_limit_gb)} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">API Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Current API Calls</span>
                          <span>{selectedTenant.current_api_calls.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>API Call Limit</span>
                          <span>{selectedTenant.api_call_limit.toLocaleString()}</span>
                        </div>
                        <Progress value={getUsagePercentage(selectedTenant.current_api_calls, selectedTenant.api_call_limit)} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Business Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Orders</span>
                          <span className="text-sm font-medium">{selectedTenant.total_orders.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Revenue</span>
                          <span className="text-sm font-medium">${selectedTenant.total_revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg Order Value</span>
                          <span className="text-sm font-medium">${(selectedTenant.total_revenue / selectedTenant.total_orders).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">User Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Monthly Active Users</span>
                          <span className="text-sm font-medium">{selectedTenant.monthly_active_users}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Daily Active Users</span>
                          <span className="text-sm font-medium">{selectedTenant.daily_active_users}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Page Views (30d)</span>
                          <span className="text-sm font-medium">{selectedTenant.page_views_last_30_days.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Database Size</span>
                          <span className="text-sm font-medium">{selectedTenant.database_size_mb.toFixed(1)} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Backup</span>
                          <span className="text-sm font-medium">
                            {selectedTenant.last_backup_at ? new Date(selectedTenant.last_backup_at).toLocaleDateString() : 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Activity</span>
                          <span className="text-sm font-medium">
                            {selectedTenant.last_activity_at ? new Date(selectedTenant.last_activity_at).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Subscription</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Plan</span>
                          <Badge className={planColors[selectedTenant.subscription_plan]}>
                            {selectedTenant.subscription_plan}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge className={statusColors[selectedTenant.status]}>
                            {selectedTenant.subscription_status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Starts</span>
                          <span className="text-sm font-medium">
                            {selectedTenant.subscription_starts_at ? new Date(selectedTenant.subscription_starts_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Ends</span>
                          <span className="text-sm font-medium">
                            {selectedTenant.subscription_ends_at ? new Date(selectedTenant.subscription_ends_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {selectedTenant.enabled_features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Security Level</span>
                          <Badge variant="outline">{selectedTenant.security_level}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">2FA Enforced</span>
                          <Badge variant={selectedTenant.two_factor_enforced ? "default" : "secondary"}>
                            {selectedTenant.two_factor_enforced ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">GDPR Compliance</span>
                          <Badge variant={selectedTenant.gdpr_compliance_enabled ? "default" : "secondary"}>
                            {selectedTenant.gdpr_compliance_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {selectedTenant.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}