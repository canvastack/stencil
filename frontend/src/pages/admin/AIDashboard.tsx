import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  Target,
  Lightbulb,
  BarChart3,
  Zap,
  RefreshCw,
  Eye,
  CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { intelligenceApi } from '@/services/api/intelligence';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';

interface AIDashboardData {
  market_outlook: string;
  market_confidence: number;
  inventory_savings: number;
  service_level: number;
  high_risk_customers: number;
  average_churn_rate: number;
  recent_recommendations: number;
  ai_features_active: {
    recommendations: boolean;
    market_trends: boolean;
    inventory_optimization: boolean;
    churn_prediction: boolean;
    demand_forecasting: boolean;
  };
  last_updated: string;
}

export function AIDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-dashboard'],
    queryFn: intelligenceApi.getAIDashboard,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: marketTrends } = useQuery({
    queryKey: ['market-trends'],
    queryFn: () => intelligenceApi.getMarketTrends({ months: 6 }),
    enabled: activeTab === 'trends',
  });

  const { data: inventoryOptimization } = useQuery({
    queryKey: ['inventory-optimization'],
    queryFn: () => intelligenceApi.getInventoryOptimization({ forecast_months: 3 }),
    enabled: activeTab === 'inventory',
  });

  const { data: churnPredictions } = useQuery({
    queryKey: ['customer-churn'],
    queryFn: intelligenceApi.getCustomerChurnPredictions,
    enabled: activeTab === 'customers',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load AI Dashboard</h3>
          <p className="text-gray-600 mb-4">There was an error loading the AI insights.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const data = dashboardData as AIDashboardData;

  const getOutlookColor = (outlook: string) => {
    switch (outlook) {
      case 'very_positive': return 'bg-green-500';
      case 'positive': return 'bg-green-400';
      case 'stable': return 'bg-blue-400';
      case 'challenging': return 'bg-yellow-500';
      case 'difficult': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getOutlookText = (outlook: string) => {
    switch (outlook) {
      case 'very_positive': return 'Very Positive';
      case 'positive': return 'Positive';
      case 'stable': return 'Stable';
      case 'challenging': return 'Challenging';
      case 'difficult': return 'Difficult';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Intelligence Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered insights and predictions for your business
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Zap className="h-3 w-3 mr-1" />
            AI Active
          </Badge>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Outlook</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getOutlookColor(data.market_outlook)}`} />
              <div className="text-2xl font-bold">{getOutlookText(data.market_outlook)}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(data.market_confidence * 100)}% confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Savings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.inventory_savings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Projected annual savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Level</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.service_level * 100)}%
            </div>
            <Progress value={data.service_level * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.high_risk_customers}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(data.average_churn_rate * 100)}% avg churn rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Features Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            AI Features Status
          </CardTitle>
          <CardDescription>
            Overview of active AI-powered features and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(data.ai_features_active).map(([feature, active]) => (
              <div key={feature} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm capitalize">
                  {feature.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Insights Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Recent AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Market Analysis Complete</p>
                    <p className="text-xs text-muted-foreground">
                      Generated {data.recent_recommendations} new product recommendations
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Inventory Optimization</p>
                    <p className="text-xs text-muted-foreground">
                      Identified {formatCurrency(data.inventory_savings)} in potential savings
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Customer Risk Assessment</p>
                    <p className="text-xs text-muted-foreground">
                      {data.high_risk_customers} customers require retention attention
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  AI Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Prediction Accuracy</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Model Confidence</span>
                    <span>{Math.round(data.market_confidence * 100)}%</span>
                  </div>
                  <Progress value={data.market_confidence * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Data Quality</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {marketTrends ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Outlook</CardTitle>
                  <CardDescription>6-month market trend prediction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overall Outlook</span>
                      <Badge className={getOutlookColor(marketTrends.market_outlook)}>
                        {getOutlookText(marketTrends.market_outlook)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Opportunities</h4>
                      {marketTrends.key_opportunities?.map((opportunity: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Strategic Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketTrends.strategic_recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          {inventoryOptimization ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Projected Savings</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(inventoryOptimization.cost_savings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service Level</p>
                      <p className="text-2xl font-bold">
                        {Math.round(inventoryOptimization.service_level * 100)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Forecast Accuracy</p>
                    <Progress value={inventoryOptimization.forecast_accuracy * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>High Priority Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inventoryOptimization.high_priority_products?.slice(0, 5).map((product: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{product.product_id}</span>
                        <Badge variant="outline">
                          {product.recommended_stock} units
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {churnPredictions ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Churn Risk Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">High Risk Customers</p>
                      <p className="text-2xl font-bold text-red-600">
                        {churnPredictions.churn_statistics?.high_risk || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Churn Rate</p>
                      <p className="text-2xl font-bold">
                        {Math.round(churnPredictions.average_churn_rate * 100)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Model Accuracy</p>
                    <Progress value={churnPredictions.model_accuracy * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(churnPredictions.customers_by_risk_level || {}).map(([level, customers]: [string, any]) => (
                      <div key={level} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{level.replace('_', ' ')}</span>
                        <Badge variant="outline">
                          {Array.isArray(customers) ? customers.length : 0} customers
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(data.last_updated).toLocaleString()}
      </div>
    </div>
  );
}