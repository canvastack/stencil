import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Package,
  BarChart3,
  Calendar,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ProductionPlan {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: 'planning' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  startDate: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  milestones: ProductionMilestone[];
  resources: ResourceAllocation;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ProductionMilestone {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate: string;
  completedAt?: string;
  progress: number;
}

interface ResourceAllocation {
  materials: number;
  equipment: number;
  labor: number;
  utilization: number;
}

interface ProductionAnalytics {
  activeProductions: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  resourceUtilization: number;
  productionTrend: Array<{ month: string; orders: number; efficiency: number }>;
  deliveryTrend: Array<{ week: string; onTime: number; delayed: number }>;
  qualityTrend: Array<{ week: string; score: number }>;
  utilizationTrend: Array<{ week: string; utilization: number }>;
}

const ProductionDashboard: React.FC = () => {
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
  const [analytics, setAnalytics] = useState<ProductionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      
      // Fetch production plans
      const plansResponse = await fetch('/api/admin/production/plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setProductionPlans(plansData.data || []);
      }

      // Fetch production analytics
      const analyticsResponse = await fetch('/api/admin/analytics/production', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data || null);
      }

    } catch (error) {
      console.error('Error fetching production data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      case 'overdue': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time production monitoring and management</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchProductionData}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Productions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeProductions || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.onTimeDeliveryRate ? `${(analytics.onTimeDeliveryRate * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.qualityScore ? `${(analytics.qualityScore * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              +0.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.resourceUtilization ? `${(analytics.resourceUtilization * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              -1.2% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Production Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Production Timeline</CardTitle>
                <CardDescription>Current production schedule and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productionPlans.slice(0, 5).map((plan) => (
                    <div key={plan.id} className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(plan.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {plan.orderNumber} - {plan.customerName}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Progress value={plan.progress} className="flex-1" />
                          <span className="text-xs text-gray-500">{plan.progress}%</span>
                        </div>
                      </div>
                      <Badge className={getRiskColor(plan.riskLevel)}>
                        {plan.riskLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resource Allocation */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Allocation</CardTitle>
                <CardDescription>Current resource utilization across productions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Materials</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Equipment</span>
                      <span>72%</span>
                    </div>
                    <Progress value={72} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Labor</span>
                      <span>91%</span>
                    </div>
                    <Progress value={91} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Overall Utilization</span>
                      <span>83%</span>
                    </div>
                    <Progress value={83} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Production efficiency and delivery performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.productionTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Orders"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Efficiency %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Production Plans</CardTitle>
              <CardDescription>Detailed view of all current production plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productionPlans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.orderNumber}</h3>
                        <p className="text-gray-600">{plan.customerName}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(plan.status)}>
                          {plan.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          Risk: <span className={getRiskColor(plan.riskLevel)}>{plan.riskLevel}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Progress</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Progress value={plan.progress} className="flex-1" />
                          <span className="text-sm">{plan.progress}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Start Date</p>
                        <p className="text-sm text-gray-600">{new Date(plan.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Est. Completion</p>
                        <p className="text-sm text-gray-600">{new Date(plan.estimatedCompletion).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Milestones</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        {plan.milestones.map((milestone) => (
                          <div key={milestone.id} className="text-xs">
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(milestone.status)}`} />
                              <span className="truncate">{milestone.name}</span>
                            </div>
                            <div className="ml-3 text-gray-500">
                              {milestone.status === 'completed' && milestone.completedAt
                                ? new Date(milestone.completedAt).toLocaleDateString()
                                : new Date(milestone.dueDate).toLocaleDateString()
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
                <CardDescription>On-time vs delayed deliveries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.deliveryTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="onTime" fill="#10b981" name="On Time" />
                      <Bar dataKey="delayed" fill="#ef4444" name="Delayed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
                <CardDescription>Quality score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.qualityTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Quality Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization Trends</CardTitle>
              <CardDescription>Resource utilization efficiency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.utilizationTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="utilization" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Utilization %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Material Inventory</CardTitle>
                <CardDescription>Current material stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Stainless Steel</span>
                    <Badge variant="outline">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aluminum</span>
                    <Badge variant="outline">72%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Brass</span>
                    <Badge variant="destructive">15%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Titanium</span>
                    <Badge variant="outline">45%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipment Status</CardTitle>
                <CardDescription>Production equipment availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Laser Etcher #1</span>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Laser Etcher #2</span>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CNC Machine #1</span>
                    <Badge variant="secondary">Maintenance</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quality Scanner</span>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Labor Allocation</CardTitle>
                <CardDescription>Current workforce distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Production Team</span>
                      <span>8/10</span>
                    </div>
                    <Progress value={80} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Quality Control</span>
                      <span>3/4</span>
                    </div>
                    <Progress value={75} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Packaging</span>
                      <span>2/3</span>
                    </div>
                    <Progress value={67} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionDashboard;