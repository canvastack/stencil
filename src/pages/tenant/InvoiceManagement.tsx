import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { InvoiceList } from '@/components/tenant/invoices/InvoiceList';
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
  AlertTriangle,
  CreditCard,
  Calendar,
  Users,
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  className = ""
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}) => (
  <Card className={className}>
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

const OverdueCard = ({ count, amount }: { count: number; amount: number }) => (
  <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
        Overdue Invoices
      </CardTitle>
      <AlertTriangle className="h-4 w-4 text-red-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-red-800 dark:text-red-200">{count}</div>
      <p className="text-xs text-red-600 dark:text-red-400">
        {formatCurrency(amount)} outstanding
      </p>
    </CardContent>
  </Card>
);

export const InvoiceManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    invoices,
    invoicesLoading: loading,
    error,
    stats,
    overdueInvoices,
    fetchInvoices,
    fetchInvoiceStats,
    fetchOverdueInvoices,
    setError: clearError,
  } = useInvoiceStore();
  
  const [activeTab, setActiveTab] = useState('overview');

  // Load data on mount
  useEffect(() => {
    fetchInvoices();
    fetchInvoiceStats();
    fetchOverdueInvoices();
  }, [fetchInvoices, fetchInvoiceStats, fetchOverdueInvoices]);

  const handleCreateInvoice = () => {
    navigate('/admin/invoices/new');
  };

  const handleCreateFromQuote = () => {
    navigate('/admin/quotes');
    toast({
      title: 'Select Quote',
      description: 'Choose a quote to convert to invoice',
    });
  };

  const handleExportInvoices = () => {
    // TODO: Implement export functionality
    toast({
      title: 'Export Started',
      description: 'Your invoice export will be ready shortly',
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Invoices</h3>
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
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">
            Create, send, and track your invoices and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportInvoices}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleCreateFromQuote}>
            <FileText className="w-4 h-4 mr-2" />
            From Quote
          </Button>
          <Button onClick={handleCreateInvoice}>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Invoices"
              value={stats?.total_invoices || 0}
              subtitle="All time invoices"
              icon={FileText}
              trend="up"
              trendValue="+12%"
            />
            
            <StatCard
              title="Total Revenue"
              value={stats ? formatCurrency(stats.total_amount) : '-'}
              subtitle="Total billed amount"
              icon={DollarSign}
              trend="up"
              trendValue="+8.2%"
            />
            
            <StatCard
              title="Outstanding"
              value={stats ? formatCurrency(stats.outstanding_amount) : '-'}
              subtitle="Awaiting payment"
              icon={Clock}
              trend="down"
              trendValue="-5.1%"
            />
            
            <StatCard
              title="Collection Rate"
              value={stats ? `${stats.collection_rate.toFixed(1)}%` : '-'}
              subtitle="Payment success rate"
              icon={TrendingUp}
              trend="up"
              trendValue="+2.3%"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Paid Invoices"
              value={stats?.paid_invoices || 0}
              subtitle="Successfully collected"
              icon={CheckCircle}
              className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
            />
            
            {stats && stats.overdue_amount > 0 && (
              <OverdueCard
                count={stats.overdue_invoices}
                amount={stats.overdue_amount}
              />
            )}
            
            <StatCard
              title="Average Days to Pay"
              value={stats ? `${stats.average_payment_time.toFixed(0)} days` : '-'}
              subtitle="Payment turnaround"
              icon={Calendar}
              trend={stats && stats.average_payment_time > 30 ? 'down' : 'up'}
              trendValue={stats ? `${stats.average_payment_time > 30 ? '+' : '-'}2 days` : ''}
            />
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Invoices
                </CardTitle>
                <CardDescription>Latest invoices created</CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceList
                  showHeader={false}
                  showFilters={false}
                  compactView={true}
                />
              </CardContent>
            </Card>

            {/* Overdue Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Overdue Invoices
                  {overdueInvoices.length > 0 && (
                    <Badge variant="destructive">{overdueInvoices.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>Invoices requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {overdueInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-sm text-muted-foreground">No overdue invoices!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {overdueInvoices.slice(0, 5).map((invoice) => (
                      <div 
                        key={invoice.id}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <div>
                          <p className="font-medium text-sm">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">{invoice.customer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-red-600">
                            {formatCurrency(invoice.balance_due, invoice.currency)}
                          </p>
                          <p className="text-xs text-red-500">
                            Due {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {overdueInvoices.length > 5 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('overdue')}
                        className="w-full"
                      >
                        View All {overdueInvoices.length} Overdue Invoices
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Invoices Tab */}
        <TabsContent value="invoices">
          <InvoiceList />
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-red-600">Overdue Invoices</h2>
              <p className="text-muted-foreground">
                {overdueInvoices.length} invoices require immediate attention
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportInvoices}>
                <Download className="w-4 h-4 mr-2" />
                Export Overdue
              </Button>
            </div>
          </div>

          {overdueInvoices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Overdue Invoices</h3>
                <p className="text-muted-foreground">
                  All invoices are up to date. Great job!
                </p>
              </CardContent>
            </Card>
          ) : (
            <InvoiceList 
              showHeader={false}
              showFilters={true}
            />
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Monthly Revenue"
                value={stats ? formatCurrency(stats.paid_amount) : '-'}
                subtitle="This month's collections"
                icon={DollarSign}
                trend="up"
                trendValue="+15.3%"
              />
              
              <StatCard
                title="Invoice Volume"
                value={stats?.total_invoices || 0}
                subtitle="Total invoices sent"
                icon={FileText}
                trend="up"
                trendValue="+8.7%"
              />
              
              <StatCard
                title="Active Customers"
                value="47" // This would come from customer analytics
                subtitle="Invoiced this month"
                icon={Users}
                trend="up"
                trendValue="+12%"
              />
              
              <StatCard
                title="Average Invoice"
                value={stats && stats.total_invoices > 0 
                  ? formatCurrency(stats.total_amount / stats.total_invoices) 
                  : '-'}
                subtitle="Per invoice value"
                icon={BarChart3}
                trend="neutral"
                trendValue="0%"
              />
            </div>

            {/* Analytics Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Invoice Analytics
                </CardTitle>
                <CardDescription>
                  Detailed analytics and insights about your invoicing performance
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-center">
                <div>
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Comprehensive charts and insights will be available in the next update
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};