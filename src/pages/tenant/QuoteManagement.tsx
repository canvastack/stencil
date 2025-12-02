import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuoteStore } from '@/stores/quoteStore';
import { QuoteList } from '@/components/tenant/quotes/QuoteList';
import { QuoteForm } from '@/components/tenant/quotes/QuoteForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  BarChart3,
  Plus,
  Download,
  Filter,
} from 'lucide-react';
import { CreateQuoteRequest, UpdateQuoteRequest } from '@/services/tenant/quoteService';
import { formatCurrency } from '@/utils/currency';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue 
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trend && trendValue && (
          <div className={`flex items-center text-xs ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? (
              <ArrowUp className="w-3 h-3 mr-1" />
            ) : trend === 'down' ? (
              <ArrowDown className="w-3 h-3 mr-1" />
            ) : null}
            {trendValue}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export const QuoteManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    quotes,
    quotesLoading: loading,
    error,
    stats,
    fetchQuotes,
    fetchQuoteStats,
    createQuote,
    setError: clearError,
  } = useQuoteStore();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formLoading, setFormLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    fetchQuotes();
    fetchQuoteStats();
  }, [fetchQuotes, fetchQuoteStats]);

  const handleCreateQuote = async (data: CreateQuoteRequest) => {
    try {
      setFormLoading(true);
      await createQuote(data);
      
      toast({
        title: 'Success',
        description: 'Quote created successfully',
      });
      
      setShowCreateDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create quote',
        variant: 'destructive',
      });
      throw error; // Re-throw to prevent dialog from closing
    } finally {
      setFormLoading(false);
    }
  };

  const handleExportQuotes = () => {
    // TODO: Implement export functionality
    toast({
      title: 'Export Started',
      description: 'Your quote export will be ready shortly',
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Quotes</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => clearError(null)}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quote Management</h1>
          <p className="text-muted-foreground">
            Manage vendor quotes and pricing negotiations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportQuotes}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
                <DialogDescription>
                  Create a new quote request for vendor pricing
                </DialogDescription>
              </DialogHeader>
              <QuoteForm
                onSubmit={handleCreateQuote}
                onCancel={() => setShowCreateDialog(false)}
                loading={formLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quotes">All Quotes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Quotes"
                value={stats.total_quotes}
                subtitle="All time"
                icon={FileText}
                trend="up"
                trendValue="+12%"
              />
              <StatCard
                title="Accepted Quotes"
                value={stats.accepted_quotes}
                subtitle={`${((stats.accepted_quotes / stats.total_quotes) * 100).toFixed(1)}% acceptance rate`}
                icon={CheckCircle}
                trend="up"
                trendValue="+5%"
              />
              <StatCard
                title="Total Value"
                value={formatCurrency(stats.total_value, 'USD')}
                subtitle="All quotes combined"
                icon={DollarSign}
                trend="up"
                trendValue="+23%"
              />
              <StatCard
                title="Avg Response Time"
                value={`${Math.round(stats.average_response_time / 24)} days`}
                subtitle="Vendor response time"
                icon={Clock}
                trend="down"
                trendValue="-2 days"
              />
            </div>
          )}

          {/* Recent Quotes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Quotes</CardTitle>
                  <CardDescription>
                    Latest quote requests and their status
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('quotes')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <QuoteList 
                showHeader={false}
                showFilters={false}
                compactView
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Quotes Tab */}
        <TabsContent value="quotes">
          <QuoteList />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Quote Analytics
              </CardTitle>
              <CardDescription>
                Detailed insights into your quote performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {((stats.accepted_quotes / stats.total_quotes) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Acceptance Rate</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(stats.accepted_value, 'USD')}
                      </div>
                      <div className="text-sm text-muted-foreground">Accepted Value</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.pending_quotes}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending Quotes</div>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Quote Status Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                          <span className="text-sm">{stats.accepted_quotes} quotes</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(stats.accepted_value, 'USD')}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                          <span className="text-sm">{stats.rejected_quotes} quotes</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {((stats.rejected_quotes / stats.total_quotes) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          <span className="text-sm">{stats.pending_quotes} quotes</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Awaiting response
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Insights */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Performance Insights</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Conversion Rate</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {(stats.conversion_rate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Quotes converted to orders
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Avg Response Time</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {Math.round(stats.average_response_time / 24)} days
                        </div>
                        <div className="text-sm text-muted-foreground">
                          From send to response
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};