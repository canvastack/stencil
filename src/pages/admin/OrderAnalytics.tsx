import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Users, 
  Clock, Target, Award, AlertTriangle 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const mockData = {
  revenue: [
    { month: 'Jan', revenue: 45000, orders: 120, profit: 12000 },
    { month: 'Feb', revenue: 52000, orders: 135, profit: 14000 },
    { month: 'Mar', revenue: 48000, orders: 125, profit: 13200 },
    { month: 'Apr', revenue: 61000, orders: 155, profit: 16800 },
    { month: 'May', revenue: 58000, orders: 145, profit: 15600 },
    { month: 'Jun', revenue: 67000, orders: 170, profit: 18900 }
  ],
  orderStatus: [
    { name: 'Completed', value: 45, count: 145 },
    { name: 'In Production', value: 25, count: 80 },
    { name: 'Pending Payment', value: 15, count: 48 },
    { name: 'Vendor Sourcing', value: 10, count: 32 },
    { name: 'Cancelled', value: 5, count: 16 }
  ],
  topCustomers: [
    { name: 'PT Manufaktur Jaya', orders: 23, revenue: 125000, trend: 'up' },
    { name: 'CV Teknik Presisi', orders: 18, revenue: 95000, trend: 'up' },
    { name: 'PT Indo Etching', orders: 15, revenue: 78000, trend: 'down' },
    { name: 'Berkah Metal Works', orders: 12, revenue: 65000, trend: 'up' },
    { name: 'Precision Tools Co', orders: 10, revenue: 55000, trend: 'stable' }
  ],
  performance: [
    { metric: 'Average Order Value', value: 'Rp 3,250,000', change: '+12%', trend: 'up' },
    { metric: 'Order Completion Rate', value: '94.2%', change: '+3%', trend: 'up' },
    { metric: 'Average Production Time', value: '7.5 days', change: '-8%', trend: 'down' },
    { metric: 'Customer Satisfaction', value: '4.8/5', change: '+0.2', trend: 'up' },
    { metric: 'Vendor Response Time', value: '2.3 hours', change: '-15%', trend: 'down' },
    { metric: 'Profit Margin', value: '28.5%', change: '+4%', trend: 'up' }
  ]
};

export default function OrderAnalytics() {
  const [timeRange, setTimeRange] = useState('6months');
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Order Analytics</h1>
          <p className="text-muted-foreground">Comprehensive analysis of order performance and trends</p>
        </div>
        <div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Total Revenue', value: 'Rp 331M', change: '+15.2%', icon: DollarSign, color: 'text-green-600' },
              { title: 'Total Orders', value: '750', change: '+8.5%', icon: Package, color: 'text-blue-600' },
              { title: 'Active Customers', value: '184', change: '+12.3%', icon: Users, color: 'text-purple-600' },
              { title: 'Avg. Order Value', value: 'Rp 3.25M', change: '+12%', icon: Target, color: 'text-orange-600' }
            ].map((kpi, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                    </div>
                    <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600 font-medium">{kpi.change}</span>
                    <span className="text-sm text-muted-foreground ml-1">from last period</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Orders Trend</CardTitle>
                <CardDescription>Monthly performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockData.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? `Rp ${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]} />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="orders" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Current breakdown of all orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockData.orderStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockData.orderStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Analysis Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={mockData.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString()}`, 'Revenue']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Profit Margin Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Profit</CardTitle>
                <CardDescription>Comparison between revenue and profit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={mockData.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString()}`, '']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Breakdown by Month</CardTitle>
                <CardDescription>Detailed monthly performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.revenue.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{month.month} 2024</span>
                          <Badge variant="outline">{month.orders} orders</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Revenue: Rp {month.revenue.toLocaleString()} • Profit: Rp {month.profit.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {((month.profit / month.revenue) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Margin</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>6-month overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {mockData.revenue.reduce((sum, month) => sum + month.revenue, 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className="text-2xl font-bold text-blue-600">
                    Rp {mockData.revenue.reduce((sum, month) => sum + month.profit, 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Margin</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(mockData.revenue.reduce((sum, month) => sum + (month.profit / month.revenue), 0) / mockData.revenue.length * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {mockData.revenue.reduce((sum, month) => sum + month.orders, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockData.performance.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{metric.metric}</p>
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : metric.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {metric.change}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">from last period</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
              <CardDescription>Your most valuable customers and their contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{customer.name}</span>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {customer.orders} orders • Rp {customer.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {customer.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : customer.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <div className="w-4 h-4 bg-gray-300 rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}