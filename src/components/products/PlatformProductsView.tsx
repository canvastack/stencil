import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Package, 
  Search, 
  Filter,
  BarChart3,
  Eye,
  Settings,
  Activity
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

interface TenantProductSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  totalProducts: number;
  activeProducts: number;
  totalRevenue: number;
  averageRating: number;
  topCategories: string[];
}

export const PlatformProductsView: React.FC = () => {
  const { products, loading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');

  // Mock data untuk demo - nanti akan diganti dengan real API calls
  const tenantSummaries: TenantProductSummary[] = [
    {
      tenantId: '1',
      tenantName: 'Demo Etching Company',
      tenantSlug: 'etchinx',
      totalProducts: 45,
      activeProducts: 42,
      totalRevenue: 125000000,
      averageRating: 4.8,
      topCategories: ['Metal Etching', 'Glass Etching', 'Nameplate']
    },
    {
      tenantId: '2', 
      tenantName: 'Premium Laser Solutions',
      tenantSlug: 'premium-laser',
      totalProducts: 38,
      activeProducts: 35,
      totalRevenue: 98000000,
      averageRating: 4.6,
      topCategories: ['Laser Cutting', 'Industrial Marking', 'Precision Etching']
    },
    {
      tenantId: '3',
      tenantName: 'Creative Engraving Hub',
      tenantSlug: 'creative-hub',
      totalProducts: 52,
      activeProducts: 48,
      totalRevenue: 156000000,
      averageRating: 4.9,
      topCategories: ['Custom Awards', 'Decorative Panels', 'Artistic Etching']
    }
  ];

  const platformStats = {
    totalTenants: tenantSummaries.length,
    totalProducts: tenantSummaries.reduce((acc, t) => acc + t.totalProducts, 0),
    totalActiveProducts: tenantSummaries.reduce((acc, t) => acc + t.activeProducts, 0),
    totalRevenue: tenantSummaries.reduce((acc, t) => acc + t.totalRevenue, 0),
    averageRating: tenantSummaries.reduce((acc, t) => acc + t.averageRating, 0) / tenantSummaries.length
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Platform Overview Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Platform Products Overview</h1>
            <p className="text-blue-100">Comprehensive view of all tenant products and analytics</p>
          </div>
          <Building2 className="w-16 h-16 text-blue-200" />
        </div>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
              <p className="text-2xl font-bold text-blue-600">{platformStats.totalTenants}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold text-green-600">{platformStats.totalProducts}</p>
              <p className="text-xs text-muted-foreground">{platformStats.totalActiveProducts} active</p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(platformStats.totalRevenue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-yellow-600">{platformStats.averageRating.toFixed(1)}</p>
            </div>
            <Activity className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tenants or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Tenant Products Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tenantSummaries.map((tenant) => (
          <Card key={tenant.tenantId} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{tenant.tenantName}</h3>
                <p className="text-sm text-muted-foreground">@{tenant.tenantSlug}</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Active
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Products</span>
                <span className="font-medium">{tenant.activeProducts}/{tenant.totalProducts}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-medium text-green-600">{formatCurrency(tenant.totalRevenue)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{tenant.averageRating}</span>
                  <span className="text-yellow-500">★</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Top Categories:</p>
                <div className="flex flex-wrap gap-1">
                  {tenant.topCategories.slice(0, 2).map((category, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {tenant.topCategories.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{tenant.topCategories.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button size="sm" variant="outline" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Platform Actions */}
      <Card className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Platform Management Actions</h3>
          <p className="text-muted-foreground mb-4">Perform platform-level operations on tenant products</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Reports
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Button>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Tenant Management
            </Button>
            <Button>
              <TrendingUp className="w-4 h-4 mr-2" />
              Platform Analytics
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PlatformProductsView;