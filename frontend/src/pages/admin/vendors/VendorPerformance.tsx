import { useState, useEffect } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Package, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast-config';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useVendorPerformance, useVendors } from '@/hooks/useVendors';

export default function VendorPerformance() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const debouncedVendorSearchTerm = useDebounce(vendorSearchTerm, 300);
  
  const {
    performanceData,
    vendorRankings,
    deliveryMetrics,
    qualityMetrics,
    isLoading,
    error,
    fetchPerformanceData,
  } = useVendorPerformance();

  const {
    vendors,
    fetchVendors,
  } = useVendors();

  useEffect(() => {
    fetchVendors();
    fetchPerformanceData({ period: selectedPeriod, vendor: selectedVendor });
  }, [selectedPeriod, selectedVendor, fetchPerformanceData, fetchVendors]);

  const handleRefresh = async () => {
    try {
      await fetchPerformanceData({ period: selectedPeriod, vendor: selectedVendor });
      toast.success('Data performance berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui data performance');
    }
  };

  const handleNewRequest = () => {
    try {
      // Navigate to create new performance review/request
      toast.success('Membuka form request baru');
      // This could open a modal or navigate to a new page
    } catch (error) {
      toast.error('Gagal membuka form request baru');
    }
  };

  const handleExportReport = () => {
    try {
      // Generate export data based on current filters
      const exportData = {
        period: selectedPeriod,
        vendor: selectedVendor,
        performanceData,
        vendorRankings,
        generatedAt: new Date().toISOString()
      };
      
      // Convert to JSON for now (could be CSV/Excel in real implementation)
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendor-performance-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report berhasil diexport');
    } catch (error) {
      toast.error('Gagal export report');
    }
  };

  // Filter vendors based on debounced search term
  const filteredVendors = (vendors || []).filter(vendor =>
    vendor.name?.toLowerCase().includes(debouncedVendorSearchTerm.toLowerCase()) ||
    vendor.company?.toLowerCase().includes(debouncedVendorSearchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vendor Performance</h1>
            <p className="text-gray-600 dark:text-gray-400">Monitor vendor KPIs and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={handleNewRequest}>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-full md:w-64">
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger>
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={vendorSearchTerm}
                    onChange={(e) => setVendorSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <SelectItem value="all">All Vendors</SelectItem>
                {filteredVendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name} - {vendor.company || 'No Company'}
                  </SelectItem>
                ))}
                {filteredVendors.length === 0 && vendorSearchTerm && (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No vendors found matching "{vendorSearchTerm}"
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">4.7</p>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "w-4 h-4",
                            i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">+0.3</span>
                    <span className="text-gray-500 dark:text-gray-400">vs last month</span>
                  </div>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On-Time Delivery</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">94.8%</p>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">+2.1%</span>
                    <span className="text-gray-500 dark:text-gray-400">vs last month</span>
                  </div>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">240</p>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">+15</span>
                    <span className="text-gray-500 dark:text-gray-400">vs last month</span>
                  </div>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">4.2B</p>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">-5.2%</span>
                    <span className="text-gray-500 dark:text-gray-400">vs last month</span>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-80 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-60 w-full" />
                  <Skeleton className="h-60 w-full" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Trends */}
                <Card hover={false}>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                    <CardDescription>Monthly performance metrics over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="onTime" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            name="On-Time %" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="quality" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            name="Quality Rating"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Volume */}
                <Card hover={false}>
                  <CardHeader>
                    <CardTitle>Order Volume</CardTitle>
                    <CardDescription>Monthly order count by vendor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="orders" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rankings" className="space-y-6">
            <Card hover={false}>
              <CardHeader>
                <CardTitle>Vendor Rankings</CardTitle>
                <CardDescription>Top performing vendors based on overall score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendorRankings.map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{vendor.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Performance Score: {vendor.score}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex items-center gap-1 text-sm",
                          vendor.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {vendor.trend === 'up' ? 
                            <TrendingUp className="w-4 h-4" /> : 
                            <TrendingDown className="w-4 h-4" />
                          }
                          <span>{Math.abs(vendor.change)}%</span>
                        </div>
                        <Badge variant={index < 3 ? 'default' : 'secondary'}>
                          {index < 3 ? 'Top Performer' : 'Standard'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card hover={false}>
                <CardHeader>
                  <CardTitle>Quality Distribution</CardTitle>
                  <CardDescription>Rating distribution across all vendors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {qualityMetrics.length > 0 ? (
                      qualityMetrics.map((metric, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{metric.category}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{metric.count} orders</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${metric.percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-right text-xs text-gray-500 dark:text-gray-400">{metric.percentage}%</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {isLoading ? 'Loading quality metrics...' : 'No quality metrics available'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card hover={false}>
                <CardHeader>
                  <CardTitle>Quality Issues</CardTitle>
                  <CardDescription>Recent quality alerts and resolutions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Quality Issue</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Acrylic Pro Solutions - Surface defects</p>
                      </div>
                      <Badge variant="destructive">Open</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Under Review</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Crystal Glass Studio - Dimension variance</p>
                      </div>
                      <Badge variant="secondary">Review</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Resolved</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Premium Metal Works - Finish quality</p>
                      </div>
                      <Badge variant="default">Closed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card hover={false}>
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                  <CardDescription>On-time delivery breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {deliveryMetrics.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deliveryMetrics}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {deliveryMetrics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        {isLoading ? 'Loading delivery metrics...' : 'No delivery metrics available'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card hover={false}>
                <CardHeader>
                  <CardTitle>Lead Time Trends</CardTitle>
                  <CardDescription>Average delivery time by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="onTime"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LazyWrapper>
  );
}