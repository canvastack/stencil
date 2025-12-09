import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShipping } from '@/hooks/useShipping';
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
  Truck,
  Clock,
  Target,
  Settings,
  MapPin,
  Users,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface ShippingMetrics {
  totalShipments: number;
  deliveredShipments: number;
  inTransitShipments: number;
  exceptionShipments: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  totalShippingCost: number;
  averageShippingCost: number;
}

interface CarrierPerformance {
  carrierId: string;
  carrierName: string;
  totalShipments: number;
  deliveredShipments: number;
  onTimeDeliveryRate: number;
  averageDeliveryTime: number;
  totalCost: number;
  averageCost: number;
  customerRating: number;
  exceptionRate: number;
}

interface DeliveryData {
  date: string;
  delivered: number;
  inTransit: number;
  exceptions: number;
  total: number;
  onTimeRate: number;
}

interface RegionData {
  region: string;
  shipments: number;
  deliveryTime: number;
  cost: number;
  onTimeRate: number;
  percentage: number;
}

interface ServiceData {
  service: string;
  shipments: number;
  revenue: number;
  averageTime: number;
  onTimeRate: number;
  color: string;
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function ShippingReports() {
  const [metrics, setMetrics] = useState<ShippingMetrics | null>(null);
  const [carrierPerformance, setCarrierPerformance] = useState<CarrierPerformance[]>([]);
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedCarrier, setSelectedCarrier] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data generation
  useEffect(() => {
    setIsLoading(true);
    
    // Mock shipping metrics
    const mockMetrics: ShippingMetrics = {
      totalShipments: 2847,
      deliveredShipments: 2658,
      inTransitShipments: 156,
      exceptionShipments: 33,
      averageDeliveryTime: 2.3,
      onTimeDeliveryRate: 94.2,
      totalShippingCost: 45750000,
      averageShippingCost: 16078,
    };

    // Mock carrier performance data
    const mockCarrierPerformance: CarrierPerformance[] = [
      {
        carrierId: 'carrier-001',
        carrierName: 'JNE Express',
        totalShipments: 1420,
        deliveredShipments: 1342,
        onTimeDeliveryRate: 94.5,
        averageDeliveryTime: 2.3,
        totalCost: 22875000,
        averageCost: 16100,
        customerRating: 4.6,
        exceptionRate: 1.8,
      },
      {
        carrierId: 'carrier-002',
        carrierName: 'SiCepat Express',
        totalShipments: 893,
        deliveredShipments: 851,
        onTimeDeliveryRate: 92.8,
        averageDeliveryTime: 1.8,
        totalCost: 14294000,
        averageCost: 16010,
        customerRating: 4.4,
        exceptionRate: 2.1,
      },
      {
        carrierId: 'carrier-003',
        carrierName: 'Pos Indonesia',
        totalShipments: 534,
        deliveredShipments: 465,
        onTimeDeliveryRate: 89.2,
        averageDeliveryTime: 3.5,
        totalCost: 8581000,
        averageCost: 16068,
        customerRating: 4.1,
        exceptionRate: 3.2,
      },
    ];

    // Mock delivery trend data
    const mockDeliveryData: DeliveryData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const total = Math.floor(Math.random() * 150) + 50;
      const delivered = Math.floor(total * (0.85 + Math.random() * 0.1));
      const inTransit = Math.floor((total - delivered) * (0.7 + Math.random() * 0.2));
      const exceptions = total - delivered - inTransit;
      
      mockDeliveryData.push({
        date: format(date, 'MMM dd'),
        delivered,
        inTransit,
        exceptions,
        total,
        onTimeRate: 88 + Math.random() * 10,
      });
    }

    // Mock regional data
    const mockRegionData: RegionData[] = [
      {
        region: 'Jakarta',
        shipments: 1142,
        deliveryTime: 1.8,
        cost: 18342000,
        onTimeRate: 96.2,
        percentage: 40.1,
      },
      {
        region: 'Jawa Barat',
        shipments: 684,
        deliveryTime: 2.1,
        cost: 11003000,
        onTimeRate: 94.8,
        percentage: 24.0,
      },
      {
        region: 'Jawa Timur',
        shipments: 521,
        deliveryTime: 2.8,
        cost: 8369000,
        onTimeRate: 91.5,
        percentage: 18.3,
      },
      {
        region: 'Banten',
        shipments: 312,
        deliveryTime: 1.9,
        cost: 5011000,
        onTimeRate: 95.1,
        percentage: 11.0,
      },
      {
        region: 'Others',
        shipments: 188,
        deliveryTime: 4.2,
        cost: 3025000,
        onTimeRate: 87.3,
        percentage: 6.6,
      },
    ];

    // Mock service data
    const mockServiceData: ServiceData[] = [
      {
        service: 'Regular',
        shipments: 1623,
        revenue: 26011000,
        averageTime: 2.8,
        onTimeRate: 92.4,
        color: '#3B82F6',
      },
      {
        service: 'Express',
        shipments: 891,
        revenue: 14256000,
        averageTime: 1.5,
        onTimeRate: 96.8,
        color: '#EF4444',
      },
      {
        service: 'Same Day',
        shipments: 234,
        revenue: 3744000,
        averageTime: 0.3,
        onTimeRate: 98.1,
        color: '#10B981',
      },
      {
        service: 'Economy',
        shipments: 99,
        revenue: 1739000,
        averageTime: 4.2,
        onTimeRate: 88.9,
        color: '#F59E0B',
      },
    ];

    // Mock cost breakdown
    const mockCostBreakdown: CostBreakdown[] = [
      {
        category: 'Base Shipping',
        amount: 22875000,
        percentage: 50.0,
        color: '#3B82F6',
      },
      {
        category: 'Fuel Surcharge',
        amount: 9150000,
        percentage: 20.0,
        color: '#EF4444',
      },
      {
        category: 'Insurance',
        amount: 6862500,
        percentage: 15.0,
        color: '#10B981',
      },
      {
        category: 'COD Fees',
        amount: 4575000,
        percentage: 10.0,
        color: '#F59E0B',
      },
      {
        category: 'Additional Services',
        amount: 2287500,
        percentage: 5.0,
        color: '#8B5CF6',
      },
    ];

    setTimeout(() => {
      setMetrics(mockMetrics);
      setCarrierPerformance(mockCarrierPerformance);
      setDeliveryData(mockDeliveryData);
      setRegionData(mockRegionData);
      setServiceData(mockServiceData);
      setCostBreakdown(mockCostBreakdown);
      setIsLoading(false);
    }, 1000);
  }, [dateRange, selectedCarrier, selectedRegion]);

  const handleExportReport = (format: 'pdf' | 'excel') => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
  };

  const handleRefreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Data refreshed successfully');
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading shipping reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and performance insights for shipping operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportReport('excel')}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportReport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Label>Date Range:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
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
                      if (range?.from) {
                        setDateRange({ from: range.from, to: range.to || range.from });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
              <SelectTrigger className="w-[200px]">
                <Truck className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="carrier-001">JNE Express</SelectItem>
                <SelectItem value="carrier-002">SiCepat Express</SelectItem>
                <SelectItem value="carrier-003">Pos Indonesia</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[200px]">
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="jakarta">Jakarta</SelectItem>
                <SelectItem value="jawa-barat">Jawa Barat</SelectItem>
                <SelectItem value="jawa-timur">Jawa Timur</SelectItem>
                <SelectItem value="banten">Banten</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalShipments.toLocaleString()}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {metrics.deliveredShipments} delivered
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {((metrics.deliveredShipments / metrics.totalShipments) * 100).toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.onTimeDeliveryRate}%</div>
              <Progress value={metrics.onTimeDeliveryRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Industry average: 92%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageDeliveryTime} days</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">0.3 days faster</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipping Costs</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {(metrics.totalShippingCost / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: Rp {metrics.averageShippingCost.toLocaleString()} per shipment
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">5.2% increase</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Reports */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="regional">Regional</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Carrier Performance Comparison</CardTitle>
                <CardDescription>
                  Compare delivery performance across different carriers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {carrierPerformance.map((carrier, index) => (
                    <div key={carrier.carrierId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{carrier.carrierName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{carrier.onTimeDeliveryRate}%</span>
                          <Badge variant="outline">
                            {carrier.totalShipments} shipments
                          </Badge>
                        </div>
                      </div>
                      <Progress value={carrier.onTimeDeliveryRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Avg: {carrier.averageDeliveryTime} days</span>
                        <span>Rating: {carrier.customerRating}/5</span>
                        <span>Exception: {carrier.exceptionRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of shipments by service type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ service, percentage }) => `${service} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="shipments"
                      >
                        {serviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${value} shipments`, 
                          name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Carrier Metrics</CardTitle>
              <CardDescription>
                Comprehensive performance metrics for each carrier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Carrier</th>
                      <th className="text-center p-2">Shipments</th>
                      <th className="text-center p-2">Delivered</th>
                      <th className="text-center p-2">On-Time Rate</th>
                      <th className="text-center p-2">Avg Time</th>
                      <th className="text-center p-2">Total Cost</th>
                      <th className="text-center p-2">Avg Cost</th>
                      <th className="text-center p-2">Rating</th>
                      <th className="text-center p-2">Exception Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierPerformance.map((carrier) => (
                      <tr key={carrier.carrierId} className="border-b">
                        <td className="p-2 font-medium">{carrier.carrierName}</td>
                        <td className="p-2 text-center">{carrier.totalShipments.toLocaleString()}</td>
                        <td className="p-2 text-center">{carrier.deliveredShipments.toLocaleString()}</td>
                        <td className="p-2 text-center">
                          <Badge variant={carrier.onTimeDeliveryRate > 95 ? 'default' : carrier.onTimeDeliveryRate > 90 ? 'secondary' : 'destructive'}>
                            {carrier.onTimeDeliveryRate}%
                          </Badge>
                        </td>
                        <td className="p-2 text-center">{carrier.averageDeliveryTime} days</td>
                        <td className="p-2 text-center">Rp {(carrier.totalCost / 1000000).toFixed(1)}M</td>
                        <td className="p-2 text-center">Rp {carrier.averageCost.toLocaleString()}</td>
                        <td className="p-2 text-center">{carrier.customerRating}/5</td>
                        <td className="p-2 text-center">
                          <Badge variant={carrier.exceptionRate < 2 ? 'default' : carrier.exceptionRate < 5 ? 'secondary' : 'destructive'}>
                            {carrier.exceptionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Trends (30 Days)</CardTitle>
              <CardDescription>
                Daily delivery performance and volume trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={deliveryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="delivered"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      name="Delivered"
                    />
                    <Area
                      type="monotone"
                      dataKey="inTransit"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      name="In Transit"
                    />
                    <Area
                      type="monotone"
                      dataKey="exceptions"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF4444"
                      name="Exceptions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>On-Time Delivery Rate Trend</CardTitle>
              <CardDescription>
                Daily on-time delivery performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deliveryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'On-Time Rate']} />
                    <Line
                      type="monotone"
                      dataKey="onTimeRate"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                      name="On-Time Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional Performance</CardTitle>
                <CardDescription>
                  Shipping performance by region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionData.map((region, index) => (
                    <div key={region.region} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{region.region}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{region.onTimeRate}%</span>
                          <Badge variant="outline">
                            {region.shipments} shipments
                          </Badge>
                        </div>
                      </div>
                      <Progress value={region.onTimeRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Avg: {region.deliveryTime} days</span>
                        <span>Cost: Rp {(region.cost / 1000000).toFixed(1)}M</span>
                        <span>Share: {region.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>
                  Shipment volume by region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ region, percentage }) => `${region} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="shipments"
                      >
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${value} shipments`, 
                          name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Regional Analysis</CardTitle>
              <CardDescription>
                Detailed metrics by region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="shipments" fill="#3B82F6" name="Shipments" />
                    <Bar yAxisId="right" dataKey="onTimeRate" fill="#10B981" name="On-Time Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>
                  Distribution of shipping costs by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {costBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `Rp ${(value / 1000000).toFixed(1)}M`, 
                          name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>
                  Detailed cost breakdown and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costBreakdown.map((cost, index) => (
                    <div key={cost.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cost.color }}
                          />
                          <span className="font-medium">{cost.category}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Rp {(cost.amount / 1000000).toFixed(1)}M</span>
                          <Badge variant="outline">
                            {cost.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={cost.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Average per shipment: Rp {Math.round(cost.amount / (metrics?.totalShipments || 1)).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Efficiency Analysis</CardTitle>
              <CardDescription>
                Compare cost efficiency across services and carriers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Service Cost Efficiency</h4>
                  <div className="space-y-3">
                    {serviceData.map((service, index) => {
                      const costPerShipment = service.revenue / service.shipments;
                      return (
                        <div key={service.service} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: service.color }}
                            />
                            <span className="font-medium">{service.service}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">Rp {Math.round(costPerShipment).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">per shipment</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Carrier Cost Efficiency</h4>
                  <div className="space-y-3">
                    {carrierPerformance.map((carrier, index) => (
                      <div key={carrier.carrierId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{carrier.carrierName}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Rp {carrier.averageCost.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">per shipment</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}