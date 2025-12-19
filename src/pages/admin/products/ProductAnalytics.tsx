import React, { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Eye,
  ShoppingCart,
  DollarSign,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductMetrics {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  outOfStockProducts: number;
  totalRevenue: number;
  avgPrice: number;
  topPerformingCategory: string;
  monthlyGrowth: number;
}

interface CategoryAnalytics {
  category: string;
  productCount: number;
  revenue: number;
  avgPrice: number;
  orderCount: number;
  growthRate: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  views: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  status: 'trending' | 'stable' | 'declining';
}

export default function ProductAnalytics() {
  const { products, isLoading, fetchProducts } = useProducts();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  
  // Calculate metrics from real product data
  const [metrics, setMetrics] = useState<ProductMetrics>({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    outOfStockProducts: 0,
    totalRevenue: 0,
    avgPrice: 0,
    topPerformingCategory: '',
    monthlyGrowth: 0
  });

  // Load products and calculate metrics
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (products && products.length > 0) {
      const publishedCount = products.filter(p => p.status === 'published').length;
      const draftCount = products.filter(p => p.status === 'draft').length;
      const outOfStockCount = products.filter(p => !p.inStock).length;
      const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0);
      const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
      
      setMetrics({
        totalProducts: products.length,
        publishedProducts: publishedCount,
        draftProducts: draftCount,
        outOfStockProducts: outOfStockCount,
        totalRevenue,
        avgPrice,
        topPerformingCategory: products[0]?.category?.name || 'N/A',
        monthlyGrowth: 0 // This would come from time-series data
      });
    }
  }, [products]);

  const [categoryData] = useState<CategoryAnalytics[]>([
    {
      category: 'Custom Etching',
      productCount: 85,
      revenue: 18500000,
      avgPrice: 218000,
      orderCount: 145,
      growthRate: 15.2
    },
    {
      category: 'Awards & Trophies',
      productCount: 62,
      revenue: 12750000,
      avgPrice: 205000,
      orderCount: 98,
      growthRate: 8.7
    },
    {
      category: 'Glass Engraving',
      productCount: 45,
      revenue: 9200000,
      avgPrice: 170000,
      orderCount: 76,
      growthRate: 22.1
    },
    {
      category: 'Metal Works',
      productCount: 38,
      revenue: 4800000,
      avgPrice: 126000,
      orderCount: 52,
      growthRate: -3.2
    },
    {
      category: 'Acrylic Products',
      productCount: 18,
      revenue: 500000,
      avgPrice: 85000,
      orderCount: 18,
      growthRate: 45.8
    }
  ]);

  const [topProducts] = useState<ProductPerformance[]>([
    {
      id: '1',
      name: 'Premium Glass Trophy with Custom Etching',
      category: 'Awards & Trophies',
      views: 2350,
      orders: 48,
      revenue: 9600000,
      conversionRate: 2.04,
      status: 'trending'
    },
    {
      id: '2',
      name: 'Corporate Award Plaque - Metal',
      category: 'Custom Etching',
      views: 1890,
      orders: 35,
      revenue: 7000000,
      conversionRate: 1.85,
      status: 'stable'
    },
    {
      id: '3',
      name: 'Personalized Crystal Award',
      category: 'Glass Engraving',
      views: 1650,
      orders: 42,
      revenue: 8400000,
      conversionRate: 2.55,
      status: 'trending'
    },
    {
      id: '4',
      name: 'Stainless Steel Name Plate',
      category: 'Metal Works',
      views: 890,
      orders: 12,
      revenue: 1800000,
      conversionRate: 1.35,
      status: 'declining'
    },
    {
      id: '5',
      name: 'Acrylic Sign Board - Custom',
      category: 'Acrylic Products',
      views: 650,
      orders: 18,
      revenue: 1800000,
      conversionRate: 2.77,
      status: 'trending'
    }
  ]);

  const [revenueData] = useState([
    { month: 'Jan', revenue: 3200000, orders: 45 },
    { month: 'Feb', revenue: 3800000, orders: 52 },
    { month: 'Mar', revenue: 4100000, orders: 58 },
    { month: 'Apr', revenue: 3900000, orders: 54 },
    { month: 'May', revenue: 4500000, orders: 65 },
    { month: 'Jun', revenue: 4200000, orders: 61 },
    { month: 'Jul', revenue: 4800000, orders: 72 },
    { month: 'Aug', revenue: 5100000, orders: 78 },
    { month: 'Sep', revenue: 4900000, orders: 75 },
    { month: 'Oct', revenue: 5300000, orders: 82 },
    { month: 'Nov', revenue: 4700000, orders: 69 },
    { month: 'Dec', revenue: 5200000, orders: 85 }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getStatusIcon = (status: ProductPerformance['status']) => {
    switch (status) {
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: ProductPerformance['status']) => {
    switch (status) {
      case 'trending':
        return <Badge className="bg-green-100 text-green-800">Trending</Badge>;
      case 'declining':
        return <Badge variant="destructive">Declining</Badge>;
      default:
        return <Badge variant="secondary">Stable</Badge>;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Analytics data refreshed');
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Insights and performance metrics for your product catalog
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalProducts)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.publishedProducts} published, {metrics.draftProducts} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{metrics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.avgPrice)}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.outOfStockProducts}</div>
            <p className="text-xs text-red-600">
              Products out of stock
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Revenue and order count over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : formatNumber(value as number),
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Distribution of revenue across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="revenue"
                      nameKey="category"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Best selling products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-gray-500">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {typeof product.category === 'object' && product.category !== null
                            ? product.category.name
                            : product.category || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold">{formatNumber(product.views)}</div>
                        <div className="text-gray-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{formatNumber(product.orders)}</div>
                        <div className="text-gray-500">Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{formatCurrency(product.revenue)}</div>
                        <div className="text-gray-500">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{product.conversionRate}%</div>
                        <div className="text-gray-500">Conversion</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(product.status)}
                        {getStatusBadge(product.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance Analysis</CardTitle>
              <CardDescription>Detailed breakdown of performance by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="productCount" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="font-medium">{category.category}</div>
                        <div className="text-sm text-gray-500">
                          {category.productCount} products • {category.orderCount} orders
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold">{formatCurrency(category.revenue)}</div>
                        <div className="text-gray-500">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{formatCurrency(category.avgPrice)}</div>
                        <div className="text-gray-500">Avg Price</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${category.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {category.growthRate > 0 ? '+' : ''}{category.growthRate}%
                        </div>
                        <div className="text-gray-500">Growth</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
                <CardDescription>Product view to order conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="conversionRate" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Views vs Orders</CardTitle>
                <CardDescription>Comparison of product visibility and sales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#8884d8" />
                    <Bar dataKey="orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
              <CardDescription>Comprehensive view of product performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Views</th>
                      <th className="text-right py-2">Orders</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Conversion</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-gray-500">
                              {typeof product.category === 'object' && product.category !== null
                                ? product.category.name
                                : product.category || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3">{formatNumber(product.views)}</td>
                        <td className="text-right py-3">{formatNumber(product.orders)}</td>
                        <td className="text-right py-3">{formatCurrency(product.revenue)}</td>
                        <td className="text-right py-3">{product.conversionRate}%</td>
                        <td className="text-center py-3">{getStatusBadge(product.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Trends & Forecasting</CardTitle>
              <CardDescription>Historical trends and future projections</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    yAxisId="left"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trend Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Insights</CardTitle>
                <CardDescription>Key growth indicators and patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Monthly Growth Rate</span>
                  <span className="font-bold text-green-600">+{metrics.monthlyGrowth}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Top Growing Category</span>
                  <span className="font-bold">Acrylic Products (+45.8%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Best Performing Month</span>
                  <span className="font-bold">October</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Peak Season</span>
                  <span className="font-bold">Q4 (Oct-Dec)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Data-driven suggestions for improvement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-blue-800">Focus on Acrylic Products</div>
                  <div className="text-sm text-blue-600">45.8% growth - consider expanding this category</div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-800">Improve Metal Works</div>
                  <div className="text-sm text-yellow-600">-3.2% decline - review pricing and marketing</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800">Stock Alert</div>
                  <div className="text-sm text-green-600">Restock 15 out-of-stock products</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}