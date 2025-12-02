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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Package,
  Key,
  Users,
  CreditCard,
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
  Shield,
  Zap,
  Target,
  BarChart3,
  DollarSign,
  Calendar,
  Globe,
  Star,
  Award,
  Layers,
  Database,
  Code,
  Wifi,
  AlertCircle,
  Copy,
  ExternalLink,
  FileText,
  Toggle
} from 'lucide-react';
import { LicensePackage, FeatureToggle, LicenseAssignment } from '@/services/platform/licenseService';
import { toast } from 'sonner';

const packageTypeColors = {
  starter: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  professional: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  custom: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  addon: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  deprecated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  beta: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
};

const featureCategoryColors = {
  core: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  experimental: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  deprecated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

// Mock data for demo - will be replaced with real API calls
const mockLicensePackages: LicensePackage[] = [
  {
    id: '1',
    license_uuid: 'pkg-starter-001',
    name: 'starter',
    display_name: 'Starter Plan',
    description: 'Perfect for small businesses getting started with etching services',
    version: '1.2.0',
    package_type: 'starter',
    billing_model: 'monthly',
    price: 49.99,
    currency: 'USD',
    included_features: ['quotes', 'invoices', 'customers', 'basic-analytics'],
    feature_limits: {
      users: 5,
      storage_gb: 25,
      bandwidth_gb: 100,
      api_calls_per_month: 2500,
      custom_domains: 0,
      email_accounts: 5,
      database_size_gb: 5,
      backup_retention_days: 30
    },
    advanced_features: {
      white_label: false,
      custom_branding: false,
      api_access: false,
      webhook_support: false,
      custom_integrations: false,
      advanced_analytics: false,
      priority_support: false,
      sla_guarantee: false
    },
    status: 'active',
    is_featured: false,
    is_popular: true,
    availability: 'public',
    tags: ['small-business', 'basic', 'affordable'],
    category: 'subscription',
    target_audience: 'small_business',
    active_subscriptions: 127,
    total_subscribers: 245,
    monthly_revenue: 6348.73,
    created_by: 'platform-admin',
    updated_by: 'platform-admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-12-01T10:30:00Z'
  },
  {
    id: '2',
    license_uuid: 'pkg-professional-002',
    name: 'professional',
    display_name: 'Professional Plan',
    description: 'Advanced features for growing businesses with complex etching needs',
    version: '2.1.0',
    package_type: 'professional',
    billing_model: 'monthly',
    price: 149.99,
    currency: 'USD',
    included_features: ['quotes', 'invoices', 'customers', 'production', 'quality', 'advanced-analytics', 'reporting'],
    feature_limits: {
      users: 25,
      storage_gb: 100,
      bandwidth_gb: 500,
      api_calls_per_month: 10000,
      custom_domains: 1,
      email_accounts: 25,
      database_size_gb: 25,
      backup_retention_days: 90
    },
    advanced_features: {
      white_label: false,
      custom_branding: true,
      api_access: true,
      webhook_support: true,
      custom_integrations: false,
      advanced_analytics: true,
      priority_support: true,
      sla_guarantee: false
    },
    status: 'active',
    is_featured: true,
    is_popular: false,
    availability: 'public',
    tags: ['professional', 'advanced', 'recommended'],
    category: 'subscription',
    target_audience: 'medium_business',
    active_subscriptions: 89,
    total_subscribers: 156,
    monthly_revenue: 13349.11,
    created_by: 'platform-admin',
    updated_by: 'platform-admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-12-01T10:30:00Z'
  },
  {
    id: '3',
    license_uuid: 'pkg-enterprise-003',
    name: 'enterprise',
    display_name: 'Enterprise Plan',
    description: 'Complete solution for large-scale operations with custom requirements',
    version: '3.0.0',
    package_type: 'enterprise',
    billing_model: 'yearly',
    price: 2999.99,
    currency: 'USD',
    included_features: ['all-features', 'custom-development', 'dedicated-support', 'sla-guarantee'],
    feature_limits: {
      users: 500,
      storage_gb: 1000,
      bandwidth_gb: 5000,
      api_calls_per_month: 100000,
      custom_domains: 10,
      email_accounts: 500,
      database_size_gb: 500,
      backup_retention_days: 365
    },
    advanced_features: {
      white_label: true,
      custom_branding: true,
      api_access: true,
      webhook_support: true,
      custom_integrations: true,
      advanced_analytics: true,
      priority_support: true,
      sla_guarantee: true
    },
    status: 'active',
    is_featured: true,
    is_popular: false,
    availability: 'public',
    tags: ['enterprise', 'premium', 'unlimited'],
    category: 'subscription',
    target_audience: 'enterprise',
    active_subscriptions: 23,
    total_subscribers: 34,
    monthly_revenue: 5749.98,
    created_by: 'platform-admin',
    updated_by: 'platform-admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-12-01T10:30:00Z'
  }
];

const mockFeatureToggles: FeatureToggle[] = [
  {
    id: '1',
    feature_key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Comprehensive business intelligence and reporting features',
    category: 'premium',
    default_enabled: false,
    is_beta: false,
    requires_license: true,
    required_plan_level: 'professional',
    rollout_strategy: 'all',
    usage_stats: {
      enabled_tenants: 89,
      total_usage_count: 15420,
      error_rate: 0.02,
      avg_response_time_ms: 245
    },
    created_by: 'platform-admin',
    updated_by: 'platform-admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-11-15T14:20:00Z'
  },
  {
    id: '2',
    feature_key: 'api_access',
    name: 'API Access',
    description: 'RESTful API endpoints for system integration',
    category: 'enterprise',
    default_enabled: false,
    is_beta: false,
    requires_license: true,
    required_plan_level: 'professional',
    rollout_strategy: 'all',
    usage_stats: {
      enabled_tenants: 67,
      total_usage_count: 89340,
      error_rate: 0.01,
      avg_response_time_ms: 125
    },
    created_by: 'platform-admin',
    updated_by: 'platform-admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-11-20T09:15:00Z'
  },
  {
    id: '3',
    feature_key: 'white_label',
    name: 'White Label',
    description: 'Complete branding customization and white-label capabilities',
    category: 'enterprise',
    default_enabled: false,
    is_beta: false,
    requires_license: true,
    required_plan_level: 'enterprise',
    rollout_strategy: 'all',
    usage_stats: {
      enabled_tenants: 23,
      total_usage_count: 2340,
      error_rate: 0.00,
      avg_response_time_ms: 180
    },
    created_by: 'platform-admin',
    updated_by: 'platform-admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-11-25T16:45:00Z'
  },
  {
    id: '4',
    feature_key: 'experimental_ai',
    name: 'AI-Powered Insights',
    description: 'Experimental AI features for predictive analytics and automation',
    category: 'experimental',
    default_enabled: false,
    is_beta: true,
    requires_license: true,
    required_plan_level: 'enterprise',
    rollout_strategy: 'percentage',
    rollout_percentage: 25,
    usage_stats: {
      enabled_tenants: 6,
      total_usage_count: 890,
      error_rate: 0.05,
      avg_response_time_ms: 1200
    },
    created_by: 'platform-admin',
    updated_by: 'platform-admin',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-12-01T12:00:00Z'
  }
];

export default function LicenseManagement() {
  const [licensePackages, setLicensePackages] = useState<LicensePackage[]>(mockLicensePackages);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>(mockFeatureToggles);
  const [selectedPackage, setSelectedPackage] = useState<LicensePackage | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureToggle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [packageTypeFilter, setPackageTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreatePackageDialog, setShowCreatePackageDialog] = useState(false);
  const [showCreateFeatureDialog, setShowCreateFeatureDialog] = useState(false);
  const [showPackageDetailsDialog, setShowPackageDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('packages');

  // Filter license packages
  const filteredPackages = licensePackages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pkg.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = packageTypeFilter === 'all' || pkg.package_type === packageTypeFilter;
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filter feature toggles
  const filteredFeatures = featureToggles.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.feature_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || feature.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate summary statistics
  const stats = {
    totalPackages: licensePackages.length,
    activePackages: licensePackages.filter(p => p.status === 'active').length,
    totalSubscriptions: licensePackages.reduce((sum, p) => sum + p.active_subscriptions, 0),
    monthlyRevenue: licensePackages.reduce((sum, p) => sum + p.monthly_revenue, 0),
    totalFeatures: featureToggles.length,
    enabledFeatures: featureToggles.filter(f => f.default_enabled).length,
    betaFeatures: featureToggles.filter(f => f.is_beta).length,
    totalUsage: featureToggles.reduce((sum, f) => sum + f.usage_stats.total_usage_count, 0)
  };

  const handlePackageAction = async (packageItem: LicensePackage, action: string) => {
    try {
      setLoading(true);
      // TODO: Implement actual API calls
      switch (action) {
        case 'activate':
          toast.success(`Package ${packageItem.display_name} activated successfully`);
          break;
        case 'deactivate':
          toast.success(`Package ${packageItem.display_name} deactivated successfully`);
          break;
        case 'deprecate':
          toast.success(`Package ${packageItem.display_name} deprecated successfully`);
          break;
        default:
          toast.info(`Action ${action} performed on ${packageItem.display_name}`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} package: ${packageItem.display_name}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async (feature: FeatureToggle, enabled: boolean) => {
    try {
      setLoading(true);
      // TODO: Implement actual API call
      setFeatureToggles(prev => 
        prev.map(f => 
          f.id === feature.id 
            ? { ...f, default_enabled: enabled }
            : f
        )
      );
      toast.success(`Feature ${feature.name} ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error(`Failed to toggle feature: ${feature.name}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">License & Feature Management</h1>
          <p className="text-muted-foreground">Manage license packages and feature toggles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreatePackageDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Package
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
          <TabsTrigger value="packages">License Packages</TabsTrigger>
          <TabsTrigger value="features">Feature Toggles</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          {/* Package Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPackages}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activePackages} active packages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  Across all packages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  From license subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Package Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.monthlyRevenue / stats.totalSubscriptions)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per subscription
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Package Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search packages..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="addon">Add-on</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setPackageTypeFilter('all');
                  setStatusFilter('all');
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Package Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <Card key={pkg.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={packageTypeColors[pkg.package_type]}>
                        {pkg.package_type}
                      </Badge>
                      {pkg.is_featured && <Star className="w-4 h-4 text-yellow-500" />}
                      {pkg.is_popular && <Award className="w-4 h-4 text-orange-500" />}
                    </div>
                    <Badge className={statusColors[pkg.status]}>
                      {pkg.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{pkg.display_name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {formatCurrency(pkg.price, pkg.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {pkg.billing_model === 'monthly' ? 'month' : pkg.billing_model === 'yearly' ? 'year' : 'license'}
                    </div>
                  </div>

                  <Separator />

                  {/* Key Features */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key Limits:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {pkg.feature_limits.users} users
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {pkg.feature_limits.storage_gb}GB storage
                      </div>
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        {pkg.feature_limits.bandwidth_gb}GB bandwidth
                      </div>
                      <div className="flex items-center gap-1">
                        <Code className="w-3 h-3" />
                        {pkg.feature_limits.api_calls_per_month.toLocaleString()} API calls
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Subscription Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Subscriptions</span>
                      <span className="font-medium">{pkg.active_subscriptions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Monthly Revenue</span>
                      <span className="font-medium">{formatCurrency(pkg.monthly_revenue)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setShowPackageDetailsDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {pkg.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handlePackageAction(pkg, 'deactivate')}>
                            <PowerOff className="w-4 h-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handlePackageAction(pkg, 'activate')}>
                            <Power className="w-4 h-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handlePackageAction(pkg, 'deprecate')}>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Deprecate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Feature Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Features</CardTitle>
                <Toggle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFeatures}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.enabledFeatures} enabled by default
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Beta Features</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.betaFeatures}</div>
                <p className="text-xs text-muted-foreground">
                  In testing phase
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Feature interactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    featureToggles.reduce((sum, f) => sum + f.usage_stats.avg_response_time_ms, 0) / featureToggles.length
                  )}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average feature response
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Feature Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search features..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="experimental">Experimental</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateFeatureDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles ({filteredFeatures.length})</CardTitle>
              <CardDescription>Manage feature flags and rollout strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rollout</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeatures.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{feature.name}</span>
                          <span className="text-xs text-muted-foreground">{feature.feature_key}</span>
                          <span className="text-xs text-muted-foreground mt-1">{feature.description}</span>
                          {feature.is_beta && (
                            <Badge variant="outline" className="w-fit mt-1">
                              <Zap className="w-3 h-3 mr-1" />
                              Beta
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={featureCategoryColors[feature.category]}>
                          {feature.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={feature.default_enabled}
                            onCheckedChange={(enabled) => handleFeatureToggle(feature, enabled)}
                            disabled={loading}
                          />
                          <span className="text-sm">
                            {feature.default_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="capitalize">{feature.rollout_strategy}</div>
                          {feature.rollout_percentage && (
                            <div className="text-xs text-muted-foreground">
                              {feature.rollout_percentage}% rollout
                            </div>
                          )}
                          {feature.requires_license && (
                            <Badge variant="outline" className="text-xs mt-1">
                              <Shield className="w-3 h-3 mr-1" />
                              {feature.required_plan_level}+
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{feature.usage_stats.enabled_tenants} tenants</div>
                          <div className="text-xs text-muted-foreground">
                            {feature.usage_stats.total_usage_count.toLocaleString()} uses
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{feature.usage_stats.avg_response_time_ms}ms avg</div>
                          <div className={`text-xs ${
                            feature.usage_stats.error_rate > 0.05 
                              ? 'text-red-600' 
                              : feature.usage_stats.error_rate > 0.02 
                                ? 'text-yellow-600' 
                                : 'text-green-600'
                          }`}>
                            {(feature.usage_stats.error_rate * 100).toFixed(2)}% errors
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
                            <DropdownMenuItem onClick={() => setSelectedFeature(feature)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Usage Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="w-4 h-4 mr-2" />
                              Rollout Settings
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

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>License Assignments</CardTitle>
              <CardDescription>Manage tenant license assignments and subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">License Assignments</h3>
                <p className="text-muted-foreground mb-4">
                  This section will show all license assignments to tenants with renewal dates, usage metrics, and management options.
                </p>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Assign License
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>License Revenue Analytics</CardTitle>
                <CardDescription>Revenue trends and subscription metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLicensePackages.map((pkg) => (
                    <div key={pkg.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{pkg.display_name}</div>
                        <div className="text-sm text-muted-foreground">{pkg.active_subscriptions} subscriptions</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(pkg.monthly_revenue)}</div>
                        <div className="text-sm text-muted-foreground">monthly</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Usage Analytics</CardTitle>
                <CardDescription>Most used features across all tenants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFeatureToggles.map((feature) => (
                    <div key={feature.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{feature.name}</span>
                        <span className="text-sm text-muted-foreground">{feature.usage_stats.enabled_tenants} tenants</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Usage</span>
                          <span>{feature.usage_stats.total_usage_count.toLocaleString()} calls</span>
                        </div>
                        <Progress 
                          value={(feature.usage_stats.total_usage_count / Math.max(...mockFeatureToggles.map(f => f.usage_stats.total_usage_count))) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Package Details Dialog */}
      <Dialog open={showPackageDetailsDialog} onOpenChange={setShowPackageDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Package Details: {selectedPackage?.display_name}</DialogTitle>
            <DialogDescription>
              Comprehensive information about {selectedPackage?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Package Type</span>
                        <div className="font-medium capitalize">{selectedPackage.package_type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Billing Model</span>
                        <div className="font-medium capitalize">{selectedPackage.billing_model}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price</span>
                        <div className="font-medium">{formatCurrency(selectedPackage.price, selectedPackage.currency)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target Audience</span>
                        <div className="font-medium capitalize">{selectedPackage.target_audience.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Version</span>
                        <div className="font-medium">{selectedPackage.version}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category</span>
                        <div className="font-medium capitalize">{selectedPackage.category}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Usage Limits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Users</span>
                        <div className="font-medium">{selectedPackage.feature_limits.users}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Storage</span>
                        <div className="font-medium">{selectedPackage.feature_limits.storage_gb}GB</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bandwidth</span>
                        <div className="font-medium">{selectedPackage.feature_limits.bandwidth_gb}GB</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">API Calls</span>
                        <div className="font-medium">{selectedPackage.feature_limits.api_calls_per_month.toLocaleString()}/mo</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Custom Domains</span>
                        <div className="font-medium">{selectedPackage.feature_limits.custom_domains}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Database Size</span>
                        <div className="font-medium">{selectedPackage.feature_limits.database_size_gb}GB</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Advanced Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedPackage.advanced_features).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          {value ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Subscription Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Active Subscriptions</span>
                        <div className="font-medium">{selectedPackage.active_subscriptions}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Subscribers</span>
                        <div className="font-medium">{selectedPackage.total_subscribers}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Monthly Revenue</span>
                        <div className="font-medium">{formatCurrency(selectedPackage.monthly_revenue)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Retention Rate</span>
                        <div className="font-medium">
                          {((selectedPackage.active_subscriptions / selectedPackage.total_subscribers) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Included Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.included_features.map((feature) => (
                      <Badge key={feature} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}