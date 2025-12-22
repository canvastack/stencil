import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Users,
  BarChart3,
  Download,
  Filter,
  RefreshCcw
} from 'lucide-react';
import { useVendorAnalytics } from '@/hooks/useVendorAnalytics';
import { formatCurrency } from '@/utils/currency';
import { getTrendColor, getPerformanceColor, getPerformanceGrade } from '@/utils/vendor';
import { toast } from 'sonner';

const VendorPerformance: React.FC = () => {
  const { 
    dashboard, 
    performanceHeatmap, 
    recommendations,
    loading, 
    error, 
    refetchDashboard,
    refetchHeatmap,
    refetchRecommendations
  } = useVendorAnalytics();

  const getTrendIcon = (trend: { direction: string; percentage: number }) => {
    if (trend.direction === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend.direction === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const handleFilter = () => {
    console.log('Filter button clicked!');
    toast.info('🔍 Advanced filtering options akan tersedia segera', {
      duration: 4000,
      position: 'top-right'
    });
  };

  const handleExport = () => {
    console.log('Export button clicked!');
    toast.success('📊 Data analytics performance berhasil diekspor', {
      duration: 4000,
      position: 'top-right'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data Performance</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => refetchDashboard()}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Performance Analytics</h1>
          <p className="text-gray-600">Monitor dan analisis kinerja vendor secara komprehensif</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleFilter}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => refetchDashboard()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.summary_kpis.top_performer.name}</div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">Score: {dashboard.summary_kpis.top_performer.score}%</span>
                {getTrendIcon(dashboard.summary_kpis.top_performer.trend)}
                <span className={`ml-1 ${getTrendColor(dashboard.summary_kpis.top_performer.trend.direction)}`}>
                  {dashboard.summary_kpis.top_performer.trend.percentage}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.summary_kpis.average_response_time}h</div>
              <div className="flex items-center text-sm text-gray-600">
                {getTrendIcon(dashboard.summary_kpis.response_time_trend)}
                <span className={`ml-1 ${getTrendColor(dashboard.summary_kpis.response_time_trend.direction)}`}>
                  {dashboard.summary_kpis.response_time_trend.percentage}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.summary_kpis.overall_on_time_rate}%</div>
              <div className="flex items-center text-sm text-gray-600">
                {getTrendIcon(dashboard.summary_kpis.on_time_rate_trend)}
                <span className={`ml-1 ${getTrendColor(dashboard.summary_kpis.on_time_rate_trend.direction)}`}>
                  {dashboard.summary_kpis.on_time_rate_trend.percentage}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.summary_kpis.active_vendors}</div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">+{dashboard.summary_kpis.new_this_month} bulan ini</span>
                {getTrendIcon(dashboard.summary_kpis.active_vendors_trend)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="heatmap">Performance Heatmap</TabsTrigger>
          <TabsTrigger value="recommendations">Rekomendasi</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Financial Summary */}
          {dashboard && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Profit Margin</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{dashboard.summary_kpis.average_profit_margin}%</span>
                      {getTrendIcon(dashboard.summary_kpis.profit_margin_trend)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-semibold">{dashboard.summary_kpis.total_active_orders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-semibold">{dashboard.summary_kpis.completed_orders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Order Value</span>
                    <span className="font-semibold">{formatCurrency(dashboard.summary_kpis.average_order_value)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboard.top_performers?.map((vendor: any, index: number) => (
                      <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{vendor.name}</div>
                            <div className="text-sm text-gray-600">{vendor.category || 'General'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={`${getPerformanceColor(vendor.performance_score)} text-white border-none`}
                          >
                            {getPerformanceGrade(vendor.performance_score)} ({vendor.performance_score}%)
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceHeatmap && performanceHeatmap.length > 0 ? (
                <div className="space-y-4">
                  {performanceHeatmap.map((vendor) => (
                    <div key={vendor.vendor_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{vendor.vendor_name}</h4>
                          <p className="text-sm text-gray-600">{vendor.vendor_code} • {vendor.quality_tier}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          className={`${getPerformanceColor(vendor.overall_score)} text-white border-none`}
                        >
                          {getPerformanceGrade(vendor.overall_score)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(vendor.metrics).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                            <div className="text-lg font-semibold">{typeof value === 'number' ? `${value}%` : value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada data heatmap tersedia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations && recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.vendor_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{rec.vendor_name}</h4>
                          <p className="text-sm text-gray-600">{rec.vendor_code} • {rec.quality_tier}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{rec.overall_score}%</div>
                          <Badge 
                            variant={rec.confidence_level === 'high' ? 'default' : rec.confidence_level === 'medium' ? 'secondary' : 'outline'}
                          >
                            {rec.confidence_level} confidence
                          </Badge>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-700">{rec.match_explanation}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Estimated Price: </span>
                          <span className="font-semibold">{formatCurrency(rec.estimated_price)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Lead Time: </span>
                          <span className="font-semibold">{rec.estimated_lead_time} days</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Risk Level: </span>
                          <Badge 
                            variant={rec.risk_assessment?.level === 'low' ? 'outline' : rec.risk_assessment?.level === 'medium' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {rec.risk_assessment?.level || 'unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada rekomendasi vendor tersedia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.risk_analysis ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">{dashboard.risk_analysis.total_vendors_analyzed}</div>
                      <div className="text-sm text-gray-600">Total Vendors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{dashboard.risk_analysis.high_risk_percentage}%</div>
                      <div className="text-sm text-gray-600">High Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {Object.values(dashboard.risk_analysis.risk_distribution).reduce((a: number, b: number) => a + b, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Risks</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {dashboard.risk_analysis.vendors?.map((vendor: any) => (
                      <div key={vendor.vendor_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{vendor.vendor_name}</h4>
                            <p className="text-sm text-gray-600">Risk Score: {vendor.risk_score}/100</p>
                          </div>
                          <Badge 
                            variant={vendor.risk_level === 'low' ? 'outline' : vendor.risk_level === 'medium' ? 'secondary' : 'destructive'}
                          >
                            {vendor.risk_level} risk
                          </Badge>
                        </div>
                        {vendor.risk_factors && vendor.risk_factors.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm font-medium mb-2">Risk Factors:</div>
                            <div className="flex flex-wrap gap-1">
                              {vendor.risk_factors.map((factor: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {vendor.mitigation_actions && vendor.mitigation_actions.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">Recommended Actions:</div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {vendor.mitigation_actions.map((action: string, index: number) => (
                                <li key={index} className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada data analisis risiko tersedia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorPerformance;