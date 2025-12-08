import React, { useState, useEffect } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Progress,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/lazy-components';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  AlertTriangle,
  Shield,
  Users,
  Building2,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Settings,
  Filter,
  Search,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Percent,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

// Mock data for Business Intelligence Dashboard
const mockAnalytics = {
  overview: {
    totalRefunds: { current: 156, previous: 142, change: 9.86 },
    refundRate: { current: 3.2, previous: 3.8, change: -0.6 },
    totalRefundAmount: { current: 89500000, previous: 78200000, change: 14.45 },
    avgProcessingTime: { current: 2.1, trend: 'improving', target: 2.0 },
    successRate: { current: 94.2, trend: 'stable' }
  },
  predictions: {
    customerPropensity: {
      high_risk_customers: [
        { customer: 'customer@example.com', propensity_score: 85.2, risk_level: 'high', refund_count: 5, success_rate: 80 },
        { customer: 'buyer@company.com', propensity_score: 72.4, risk_level: 'high', refund_count: 3, success_rate: 67 },
        { customer: 'user@domain.com', propensity_score: 68.1, risk_level: 'medium', refund_count: 4, success_rate: 75 },
      ]
    },
    vendorReliability: {
      vendor_scores: [
        { vendor_id: 'vendor-001', reliability_score: 92.5, risk_level: 'low', recommendation: 'Excellent partner' },
        { vendor_id: 'vendor-002', reliability_score: 78.2, risk_level: 'medium', recommendation: 'Monitor performance' },
        { vendor_id: 'vendor-003', reliability_score: 65.1, risk_level: 'high', recommendation: 'Review contract' },
      ]
    },
    fundOptimization: {
      current_fund: 33188387,
      optimal_fund: 42000000,
      recommendation: 'Increase contribution rate by 0.8%',
      risk_coverage: 87.5
    }
  },
  riskAssessment: {
    overall_score: 24.8,
    risk_level: 'low',
    factors: {
      high_value_refunds: { score: 15, trend: 'stable' },
      frequent_customers: { score: 35, trend: 'increasing' },
      vendor_concentration: { score: 18, trend: 'stable' },
      seasonal_spikes: { score: 22, trend: 'stable' },
      processing_delays: { score: 12, trend: 'improving' }
    }
  },
  fraudDetection: {
    patterns: {
      suspicious_timing: { pattern_score: 8, alert_level: 'low' },
      amount_anomalies: { pattern_score: 12, alert_level: 'low' },
      repeat_offenders: { pattern_score: 25, alert_level: 'medium' },
      geographic_anomalies: { pattern_score: 5, alert_level: 'low' },
      behavioral_patterns: { pattern_score: 18, alert_level: 'low' }
    },
    ml_score: 13.6,
    alerts: { active_alerts: 2, monitoring_required: 5 }
  },
  trends: {
    historical: [
      { month: '2024-06', total_refunds: 125, total_amount: 67500000, avg_amount: 540000 },
      { month: '2024-07', total_refunds: 138, total_amount: 74100000, avg_amount: 536956 },
      { month: '2024-08', total_refunds: 142, total_amount: 78200000, avg_amount: 550704 },
      { month: '2024-09', total_refunds: 156, total_amount: 89500000, avg_amount: 573717 },
      { month: '2024-10', total_refunds: 148, total_amount: 85600000, avg_amount: 578378 },
      { month: '2024-11', total_refunds: 162, total_amount: 95800000, avg_amount: 591358 },
    ],
    forecast: [168, 175, 172], // Next 3 months
    trendDirection: 'increasing',
    growthRate: 12.5
  }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function BusinessIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('3months');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('refunds');

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
    toast.success('Dashboard data refreshed successfully');
  };

  const RiskGauge = ({ score, title }: { score: number; title: string }) => {
    const getColor = (score: number) => {
      if (score <= 30) return '#10b981';
      if (score <= 60) return '#f59e0b';
      return '#ef4444';
    };

    return (
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-2">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-200"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              stroke={getColor(score)}
              strokeWidth="3"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={`${score}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold" style={{ color: getColor(score) }}>
              {score.toFixed(1)}
            </span>
          </div>
        </div>
        <p className="font-medium text-sm">{title}</p>
      </div>
    );
  };

  const MetricCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center mt-1">
                {change > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(change)}%
                </span>
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-6 h-6" />
              Business Intelligence Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced analytics, predictions, and business insights
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">1 Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Refunds"
            value={mockAnalytics.overview.totalRefunds.current.toLocaleString()}
            change={mockAnalytics.overview.totalRefunds.change}
            icon={BarChart3}
          />
          <MetricCard
            title="Refund Rate"
            value={`${mockAnalytics.overview.refundRate.current}%`}
            change={mockAnalytics.overview.refundRate.change}
            icon={Percent}
          />
          <MetricCard
            title="Total Amount"
            value={`Rp ${(mockAnalytics.overview.totalRefundAmount.current / 1000000).toFixed(1)}M`}
            change={mockAnalytics.overview.totalRefundAmount.change}
            icon={DollarSign}
          />
          <MetricCard
            title="Avg Processing"
            value={`${mockAnalytics.overview.avgProcessingTime.current} days`}
            trend={mockAnalytics.overview.avgProcessingTime.trend}
            icon={Clock}
          />
          <MetricCard
            title="Success Rate"
            value={`${mockAnalytics.overview.successRate.current}%`}
            trend={mockAnalytics.overview.successRate.trend}
            icon={CheckCircle2}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Analytics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Trend Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Refund Trends & Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockAnalytics.trends.historical}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month"
                          tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yyyy')}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => format(new Date(value + '-01'), 'MMMM yyyy')}
                          formatter={(value: number, name: string) => [
                            name === 'total_refunds' ? value : `Rp ${(value / 1000000).toFixed(1)}M`,
                            name === 'total_refunds' ? 'Refunds' : 'Amount'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="total_refunds" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          name="Refunds"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total_amount" 
                          stroke="#82ca9d" 
                          strokeWidth={2}
                          yAxisId="right"
                          name="Amount"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      📈 <strong>Forecast:</strong> Expected {mockAnalytics.trends.forecast[0]} refunds next month 
                      ({mockAnalytics.trends.growthRate > 0 ? '+' : ''}{mockAnalytics.trends.growthRate}% trend)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <RiskGauge score={mockAnalytics.riskAssessment.overall_score} title="Overall Risk Score" />
                      <Badge 
                        variant="outline" 
                        className={
                          mockAnalytics.riskAssessment.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                          mockAnalytics.riskAssessment.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {mockAnalytics.riskAssessment.risk_level.toUpperCase()} RISK
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(mockAnalytics.riskAssessment.factors).map(([key, factor]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={factor.score} className="w-16 h-2" />
                            <span className="text-xs text-gray-500 w-8">{factor.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Refund Reasons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Quality Issue', value: 45, fill: '#0088FE' },
                            { name: 'Customer Request', value: 30, fill: '#00C49F' },
                            { name: 'Timeline Delay', value: 15, fill: '#FFBB28' },
                            { name: 'Other', value: 10, fill: '#FF8042' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            { name: 'Quality Issue', value: 45, fill: '#0088FE' },
                            { name: 'Customer Request', value: 30, fill: '#00C49F' },
                            { name: 'Timeline Delay', value: 15, fill: '#FFBB28' },
                            { name: 'Other', value: 10, fill: '#FF8042' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { range: '0-1 days', count: 35 },
                        { range: '1-2 days', count: 58 },
                        { range: '2-3 days', count: 42 },
                        { range: '3-5 days', count: 18 },
                        { range: '5+ days', count: 3 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-semibold">94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Processing</span>
                      <span className="font-semibold">2.1 days</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Customer Satisfaction</span>
                      <span className="font-semibold">4.2/5.0</span>
                    </div>
                    <Progress value={84} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Propensity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    High-Risk Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockAnalytics.predictions.customerPropensity.high_risk_customers.map((customer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{customer.customer}</p>
                          <p className="text-xs text-gray-600">{customer.refund_count} refunds • {customer.success_rate}% success</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline"
                            className={customer.risk_level === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {customer.propensity_score.toFixed(1)}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{customer.risk_level} risk</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Reliability */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Vendor Reliability Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockAnalytics.predictions.vendorReliability.vendor_scores.map((vendor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-sm font-mono">{vendor.vendor_id}</p>
                          <p className="text-xs text-gray-600">{vendor.recommendation}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Progress value={vendor.reliability_score} className="w-16 h-2" />
                            <span className="text-sm font-medium">{vendor.reliability_score.toFixed(1)}</span>
                          </div>
                          <Badge 
                            variant="outline"
                            className={
                              vendor.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                              vendor.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {vendor.risk_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fund Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Insurance Fund Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Current Fund</p>
                    <p className="text-2xl font-bold text-blue-600">
                      Rp {(mockAnalytics.predictions.fundOptimization.current_fund / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Optimal Fund</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rp {(mockAnalytics.predictions.fundOptimization.optimal_fund / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Risk Coverage</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {mockAnalytics.predictions.fundOptimization.risk_coverage}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    💡 <strong>Recommendation:</strong> {mockAnalytics.predictions.fundOptimization.recommendation}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fraud" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fraud Detection Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Fraud Detection Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">ML Fraud Score</span>
                      <Badge 
                        variant="outline"
                        className="bg-green-100 text-green-800"
                      >
                        {mockAnalytics.fraudDetection.ml_score} / 100
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(mockAnalytics.fraudDetection.patterns).map(([pattern, data]: [string, any]) => (
                        <div key={pattern} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{pattern.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={data.pattern_score} className="w-20 h-2" />
                            <Badge 
                              variant="outline"
                              className={
                                data.alert_level === 'low' ? 'bg-green-100 text-green-800' :
                                data.alert_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {data.alert_level}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Active Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {mockAnalytics.fraudDetection.alerts.active_alerts}
                        </p>
                        <p className="text-sm text-gray-600">Active Alerts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                          {mockAnalytics.fraudDetection.alerts.monitoring_required}
                        </p>
                        <p className="text-sm text-gray-600">Monitoring Required</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">Medium Priority</span>
                        </div>
                        <p className="text-xs text-gray-600">Customer with 3+ refunds in 30 days detected</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Monitoring</span>
                        </div>
                        <p className="text-xs text-gray-600">Unusual refund timing pattern identified</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fraud Prevention Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Prevention Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Enhanced Verification</h4>
                    <p className="text-sm text-gray-600">Implement phone verification for customers with multiple refund requests</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Pattern Monitoring</h4>
                    <p className="text-sm text-gray-600">Set automated alerts for suspicious refund timing patterns</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Behavioral Analysis</h4>
                    <p className="text-sm text-gray-600">Monitor customer behavior changes and flag anomalies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
          <TabsContent value="risk">
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Risk Analysis Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Detailed risk analysis features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors">
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Vendor Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive vendor performance analytics coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  AI-Powered Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced AI insights and recommendations coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LazyWrapper>
  );
}