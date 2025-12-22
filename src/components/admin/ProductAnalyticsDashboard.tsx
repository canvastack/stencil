import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Archive,
  FileText,
} from 'lucide-react';
import { StatCard } from './StatCard';
import { analyticsService } from '@/services/api/analytics';
import { formatPrice } from '@/lib/utils/formatters';

export const ProductAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['product-analytics', 'overview'],
    queryFn: () => analyticsService.getCatalogOverview(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: performance, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['product-analytics', 'performance'],
    queryFn: () => analyticsService.getProductPerformance(),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'performance',
  });

  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['product-analytics', 'inventory'],
    queryFn: () => analyticsService.getInventoryHealth(),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'inventory',
  });

  const { data: categoryRevenue, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['product-analytics', 'revenue-by-category'],
    queryFn: () => analyticsService.getRevenueByCategory(),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'revenue',
  });

  if (isLoadingOverview) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={overview?.totalProducts.toLocaleString() || '0'}
          subtitle={`${overview?.publishedProducts || 0} published`}
          icon={Package}
          iconClassName="text-primary"
        />

        <StatCard
          title="Catalog Value"
          value={formatPrice(overview?.totalValue || 0, 'IDR')}
          subtitle={`Avg: ${formatPrice(overview?.averagePrice || 0, 'IDR')}`}
          icon={DollarSign}
          iconClassName="text-green-600"
        />

        <StatCard
          title="Stock Alerts"
          value={overview?.outOfStock || 0}
          subtitle={`${overview?.lowStock || 0} low stock`}
          icon={AlertTriangle}
          iconClassName="text-destructive"
          trend={
            (overview?.outOfStock || 0) > 10
              ? 'up'
              : (overview?.outOfStock || 0) === 0
              ? 'neutral'
              : 'down'
          }
        />

        <StatCard
          title="Draft Products"
          value={overview?.draftProducts || 0}
          subtitle="Awaiting publish"
          icon={FileText}
          iconClassName="text-muted-foreground"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Catalog Status Breakdown</CardTitle>
              <CardDescription>Distribution of products by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Published</Badge>
                    <span className="text-sm text-muted-foreground">Active products</span>
                  </div>
                  <span className="font-semibold">
                    {overview?.publishedProducts || 0}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Draft</Badge>
                    <span className="text-sm text-muted-foreground">Not published</span>
                  </div>
                  <span className="font-semibold">{overview?.draftProducts || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Archived</Badge>
                    <span className="text-sm text-muted-foreground">Inactive products</span>
                  </div>
                  <span className="font-semibold">
                    {overview?.archivedProducts || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stock Health</CardTitle>
                <CardDescription>Current inventory status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Out of Stock</span>
                  <Badge variant="destructive">{overview?.outOfStock || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Stock</span>
                  <Badge variant="secondary">{overview?.lowStock || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Price</span>
                  <span className="font-semibold text-sm">
                    {formatPrice(overview?.averagePrice || 0, 'IDR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Catalog Value</span>
                  <span className="font-semibold text-sm">
                    {formatPrice(overview?.totalValue || 0, 'IDR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-4">
          {isLoadingPerformance ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Best performers in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {performance?.topSelling && performance.topSelling.length > 0 ? (
                    <div className="space-y-3">
                      {performance.topSelling.slice(0, 10).map((product, index) => (
                        <div
                          key={product.uuid}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">
                              #{index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.sales} sales • {product.views} views
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatPrice(product.revenue, 'IDR')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.conversionRate.toFixed(1)}% conversion
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No performance data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trending Products</CardTitle>
                  <CardDescription>Products gaining traction</CardDescription>
                </CardHeader>
                <CardContent>
                  {performance?.trending && performance.trending.length > 0 ? (
                    <div className="space-y-3">
                      {performance.trending.slice(0, 5).map((product) => (
                        <div
                          key={product.uuid}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.views} views
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{product.sales} sales</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No trending products
                    </div>
                  )}
                </CardContent>
              </Card>

              {performance?.slowMoving && performance.slowMoving.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Slow-Moving Inventory</CardTitle>
                    <CardDescription>Products with low sales velocity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {performance.slowMoving.slice(0, 5).map((product) => (
                        <div
                          key={product.uuid}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.daysSinceLastSale
                                  ? `${product.daysSinceLastSale} days since last sale`
                                  : 'No sales recorded'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{product.stockQuantity} in stock</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          {isLoadingInventory ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard
                  title="Stock Turnover Rate"
                  value={`${inventory?.stockTurnoverRate.toFixed(1) || '0'}x`}
                  subtitle="Average inventory turnover"
                  icon={TrendingUp}
                  iconClassName="text-green-600"
                />
                <StatCard
                  title="Average Stock Age"
                  value={`${inventory?.averageStockAge || 0} days`}
                  subtitle="Time in inventory"
                  icon={Clock}
                  iconClassName="text-muted-foreground"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Out of Stock</CardTitle>
                  <CardDescription>Products requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {inventory?.outOfStock && inventory.outOfStock.length > 0 ? (
                    <div className="space-y-3">
                      {inventory.outOfStock.map((item) => (
                        <div
                          key={item.uuid}
                          className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/5"
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Stock: {item.stockQuantity}
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      All products in stock
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Alerts</CardTitle>
                  <CardDescription>Products below threshold</CardDescription>
                </CardHeader>
                <CardContent>
                  {inventory?.lowStock && inventory.lowStock.length > 0 ? (
                    <div className="space-y-3">
                      {inventory.lowStock.map((item) => (
                        <div
                          key={item.uuid}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Current: {item.stockQuantity} • Threshold:{' '}
                              {item.lowStockThreshold}
                            </p>
                            {item.daysUntilStockout && (
                              <p className="text-xs text-destructive mt-1">
                                ~{item.daysUntilStockout} days until stockout
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">Low Stock</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No low stock alerts
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4 mt-4">
          {isLoadingRevenue ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Performance breakdown by product category</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryRevenue && categoryRevenue.length > 0 ? (
                  <div className="space-y-3">
                    {categoryRevenue.map((cat) => (
                      <div
                        key={cat.categorySlug}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{cat.category}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {cat.productCount} products
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {cat.totalSales} sales
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg: {formatPrice(cat.averagePrice, 'IDR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPrice(cat.revenue, 'IDR')}
                          </p>
                          {cat.growthPercentage !== undefined && (
                            <div className="flex items-center gap-1 mt-1">
                              {cat.growthPercentage >= 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-destructive" />
                              )}
                              <span
                                className={`text-xs ${
                                  cat.growthPercentage >= 0
                                    ? 'text-green-600'
                                    : 'text-destructive'
                                }`}
                              >
                                {cat.growthPercentage >= 0 ? '+' : ''}
                                {cat.growthPercentage.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
