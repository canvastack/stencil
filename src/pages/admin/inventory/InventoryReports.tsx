import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
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
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Calendar as CalendarIcon,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Eye,
  FileText,
  PieChart as PieChartIcon,
  Activity,
  Warehouse,
  ShoppingCart,
  Clock,
  Target,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface InventoryMetrics {
  totalValue: number;
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockedItems: number;
  turnoverRate: number;
  accuracy: number;
  utilizationRate: number;
}

interface TurnoverData {
  product: string;
  turnoverRate: number;
  daysOnHand: number;
  category: string;
  value: number;
}

interface MovementData {
  date: string;
  stockIn: number;
  stockOut: number;
  adjustments: number;
  net: number;
}

interface CategoryData {
  name: string;
  value: number;
  itemCount: number;
  percentage: number;
  color: string;
}

interface LocationData {
  location: string;
  capacity: number;
  used: number;
  utilization: number;
  value: number;
  itemCount: number;
}

interface ForecastData {
  product: string;
  currentStock: number;
  avgConsumption: number;
  daysRemaining: number;
  reorderDate: string;
  reorderQuantity: number;
}

export default function InventoryReports() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedLocation, setSelectedLocation] = useState<'all' | string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data untuk demonstrasi
  const metrics: InventoryMetrics = {
    totalValue: 28500000000,
    totalItems: 2345,
    lowStockItems: 45,
    outOfStockItems: 12,
    overstockedItems: 8,
    turnoverRate: 4.2,
    accuracy: 98.7,
    utilizationRate: 76.3
  };

  const movementData: MovementData[] = [
    { date: '2024-12-01', stockIn: 150, stockOut: 180, adjustments: -5, net: -35 },
    { date: '2024-12-02', stockIn: 200, stockOut: 165, adjustments: 10, net: 45 },
    { date: '2024-12-03', stockIn: 180, stockOut: 190, adjustments: -2, net: -12 },
    { date: '2024-12-04', stockIn: 220, stockOut: 175, adjustments: 5, net: 50 },
    { date: '2024-12-05', stockIn: 160, stockOut: 195, adjustments: -8, net: -43 },
    { date: '2024-12-06', stockIn: 240, stockOut: 160, adjustments: 3, net: 83 },
    { date: '2024-12-07', stockIn: 190, stockOut: 185, adjustments: 0, net: 5 },
    { date: '2024-12-08', stockIn: 210, stockOut: 200, adjustments: -15, net: -5 }
  ];

  const categoryData: CategoryData[] = [
    { name: 'Raw Materials', value: 15750000000, itemCount: 1234, percentage: 55.2, color: '#3B82F6' },
    { name: 'Finished Goods', value: 8950000000, itemCount: 678, percentage: 31.4, color: '#10B981' },
    { name: 'Components', value: 2850000000, itemCount: 289, percentage: 10.0, color: '#F59E0B' },
    { name: 'Packaging', value: 950000000, itemCount: 144, percentage: 3.4, color: '#EF4444' }
  ];

  const locationData: LocationData[] = [
    {
      location: 'Warehouse A',
      capacity: 5000,
      used: 3750,
      utilization: 75.0,
      value: 15750000000,
      itemCount: 1250
    },
    {
      location: 'Warehouse B',
      capacity: 2000,
      used: 1600,
      utilization: 80.0,
      value: 8950000000,
      itemCount: 890
    },
    {
      location: 'Warehouse C',
      capacity: 1500,
      used: 1050,
      utilization: 70.0,
      value: 3800000000,
      itemCount: 450
    }
  ];

  const turnoverData: TurnoverData[] = [
    { product: 'Aluminum Sheet 3mm', turnoverRate: 8.5, daysOnHand: 43, category: 'Raw Materials', value: 6750000 },
    { product: 'Stainless Steel Plate', turnoverRate: 6.2, daysOnHand: 59, category: 'Raw Materials', value: 4375000 },
    { product: 'Brass Engraving Plate', turnoverRate: 12.1, daysOnHand: 30, category: 'Finished Goods', value: 2850000 },
    { product: 'Acrylic Sheet Clear', turnoverRate: 4.8, daysOnHand: 76, category: 'Raw Materials', value: 15750000 },
    { product: 'Wooden Sign Base', turnoverRate: 7.3, daysOnHand: 50, category: 'Finished Goods', value: 8075000 }
  ];

  const forecastData: ForecastData[] = [
    {
      product: 'Aluminum Sheet 3mm',
      currentStock: 150,
      avgConsumption: 25,
      daysRemaining: 6,
      reorderDate: '2024-12-15',
      reorderQuantity: 100
    },
    {
      product: 'Stainless Steel Plate',
      currentStock: 35,
      avgConsumption: 8,
      daysRemaining: 4,
      reorderDate: '2024-12-13',
      reorderQuantity: 80
    },
    {
      product: 'Brass Engraving Plate',
      currentStock: 0,
      avgConsumption: 12,
      daysRemaining: 0,
      reorderDate: '2024-12-09',
      reorderQuantity: 50
    }
  ];

  const handleExportReport = () => {
    toast.success('Report exported successfully!');
  };

  const handleScheduleReport = () => {
    toast.info('Report scheduling feature coming soon!');
  };

  const handleRefreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Data refreshed successfully!');
    }, 1500);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold">
                  Rp {(metrics.totalValue / 1000000000).toFixed(1)}B
                </p>
                <p className="text-xs text-muted-foreground">+12.3% from last month</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{metrics.totalItems.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Across all locations</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inventory Turnover</p>
                <p className="text-2xl font-bold">{metrics.turnoverRate}x</p>
                <p className="text-xs text-muted-foreground">Annual rate</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{metrics.accuracy}%</p>
                <p className="text-xs text-muted-foreground">Inventory count accuracy</p>
              </div>
              <Target className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.lowStockItems}</p>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{metrics.outOfStockItems}</p>
                <p className="text-xs text-muted-foreground">Critical status</p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overstocked</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.overstockedItems}</p>
                <p className="text-xs text-muted-foreground">Excess inventory</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                <p className="text-2xl font-bold text-indigo-600">{metrics.utilizationRate}%</p>
                <p className="text-xs text-muted-foreground">Storage capacity used</p>
              </div>
              <Warehouse className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stock Movement Trends (Last 30 Days)
          </CardTitle>
          <CardDescription>Daily stock in/out movements and adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
              />
              <Legend />
              <Line type="monotone" dataKey="stockIn" stroke="#10B981" name="Stock In" strokeWidth={2} />
              <Line type="monotone" dataKey="stockOut" stroke="#EF4444" name="Stock Out" strokeWidth={2} />
              <Line type="monotone" dataKey="net" stroke="#3B82F6" name="Net Change" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Inventory by Category
            </CardTitle>
            <CardDescription>Distribution of inventory value across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percentage}) => `${name} ${percentage}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rp ${(value / 1000000000).toFixed(2)}B`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Location Utilization
            </CardTitle>
            <CardDescription>Storage capacity utilization by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationData.map((location, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{location.location}</span>
                    <span className="text-sm text-muted-foreground">
                      {location.utilization}% ({location.used.toLocaleString()} / {location.capacity.toLocaleString()} m³)
                    </span>
                  </div>
                  <Progress value={location.utilization} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{location.itemCount.toLocaleString()} items</span>
                    <span>Rp {(location.value / 1000000000).toFixed(1)}B</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Turnover Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Inventory Turnover Analysis
          </CardTitle>
          <CardDescription>Product turnover rates and days on hand</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={turnoverData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="product" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="turnoverRate" fill="#3B82F6" name="Turnover Rate" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderForecastTab = () => (
    <div className="space-y-6">
      {/* Reorder Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reorder Forecast
          </CardTitle>
          <CardDescription>Predicted reorder requirements based on consumption patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product</th>
                  <th className="text-right p-3">Current Stock</th>
                  <th className="text-right p-3">Avg Daily Consumption</th>
                  <th className="text-right p-3">Days Remaining</th>
                  <th className="text-right p-3">Suggested Reorder Date</th>
                  <th className="text-right p-3">Reorder Quantity</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium">{item.product}</td>
                    <td className="p-3 text-right">
                      <span className={item.currentStock === 0 ? 'text-red-600 font-bold' : ''}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="p-3 text-right">{item.avgConsumption}</td>
                    <td className="p-3 text-right">
                      <Badge 
                        variant={item.daysRemaining <= 3 ? 'destructive' : item.daysRemaining <= 7 ? 'warning' : 'secondary'}
                      >
                        {item.daysRemaining} days
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {format(new Date(item.reorderDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-3 text-right font-medium">{item.reorderQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Consumption Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Consumption Trends
          </CardTitle>
          <CardDescription>Historical consumption patterns and predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Consumption trend analysis would be displayed here</p>
            <p className="text-sm">Based on historical usage data and seasonal patterns</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Custom Reports
          </CardTitle>
          <CardDescription>Create detailed inventory reports with custom parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={(value: 'summary' | 'detailed') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="loc-001">Warehouse A</SelectItem>
                  <SelectItem value="loc-002">Warehouse B</SelectItem>
                  <SelectItem value="loc-003">Warehouse C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="raw_materials">Raw Materials</SelectItem>
                  <SelectItem value="finished_goods">Finished Goods</SelectItem>
                  <SelectItem value="components">Components</SelectItem>
                  <SelectItem value="packaging">Packaging</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportReport} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Generate & Export Report
            </Button>
            <Button variant="outline" onClick={handleScheduleReport}>
              <Clock className="w-4 h-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Report Templates</CardTitle>
          <CardDescription>Pre-configured report templates for common use cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Stock Valuation Report',
                description: 'Complete inventory valuation with cost analysis',
                icon: DollarSign,
                color: 'text-green-600'
              },
              {
                title: 'Movement Analysis',
                description: 'Stock movement patterns and trends',
                icon: Activity,
                color: 'text-blue-600'
              },
              {
                title: 'Turnover Report',
                description: 'Inventory turnover rates by product and category',
                icon: TrendingUp,
                color: 'text-purple-600'
              },
              {
                title: 'ABC Analysis',
                description: 'Product categorization by value and volume',
                icon: BarChart3,
                color: 'text-orange-600'
              },
              {
                title: 'Dead Stock Report',
                description: 'Slow-moving and obsolete inventory identification',
                icon: AlertTriangle,
                color: 'text-red-600'
              },
              {
                title: 'Location Analysis',
                description: 'Storage utilization and efficiency metrics',
                icon: Warehouse,
                color: 'text-indigo-600'
              }
            ].map((report, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <report.icon className={`h-8 w-8 ${report.color}`} />
                    <div className="flex-1">
                      <h4 className="font-medium">{report.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.description}
                      </p>
                      <Button variant="outline" size="sm" className="mt-3">
                        <Eye className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive inventory reporting and business intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Report Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Location Filter</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="loc-001">Warehouse A</SelectItem>
                  <SelectItem value="loc-002">Warehouse B</SelectItem>
                  <SelectItem value="loc-003">Warehouse C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category Filter</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="raw_materials">Raw Materials</SelectItem>
                  <SelectItem value="finished_goods">Finished Goods</SelectItem>
                  <SelectItem value="components">Components</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Last 30 days
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
              <Button size="sm" onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="analytics">
          {renderAnalyticsTab()}
        </TabsContent>

        <TabsContent value="forecast">
          {renderForecastTab()}
        </TabsContent>

        <TabsContent value="reports">
          {renderReportsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}