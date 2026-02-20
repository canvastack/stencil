import { useState, useEffect } from 'react';
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
import {
  ArrowLeft,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  BarChart3,
  FileText,
  FileSpreadsheet,
  FileJson,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PaymentStats {
  total_payments: number;
  total_amount: number;
  verified_count: number;
  verified_amount: number;
  pending_count: number;
  pending_amount: number;
  rejected_count: number;
  rejected_amount: number;
  refunded_count: number;
  refunded_amount: number;
  success_rate: number;
  average_payment_amount: number;
  revenue_today: number;
  revenue_this_week: number;
  revenue_this_month: number;
  revenue_this_year: number;
}

interface MonthlyData {
  month: string;
  total_payments: number;
  total_amount: number;
  verified_count: number;
  rejected_count: number;
}

export default function PaymentReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [dateRange, setDateRange] = useState('this_month');
  const [reportType, setReportType] = useState('summary');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Load statistics from payment history
      const statsResponse = await tenantApiClient.get('/admin/payment-history/stats') as any;
      if (statsResponse && statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Load payment history to calculate additional metrics
      const historyResponse = await tenantApiClient.get('/admin/payment-history?per_page=1000') as any;
      if (historyResponse && historyResponse.success) {
        const payments = historyResponse.data;
        
        // Calculate revenue by period
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisYearStart = new Date(now.getFullYear(), 0, 1);

        let revenue_today = 0;
        let revenue_this_week = 0;
        let revenue_this_month = 0;
        let revenue_this_year = 0;
        let verified_amount = 0;
        let pending_amount = 0;
        let rejected_amount = 0;
        let refunded_amount = 0;
        let verified_count = 0;
        let pending_count = 0;
        let rejected_count = 0;
        let refunded_count = 0;

        payments.forEach((payment: any) => {
          const paymentDate = new Date(payment.submitted_at);
          const amount = payment.amount || 0;

          // Calculate by period
          if (paymentDate >= today) revenue_today += amount;
          if (paymentDate >= thisWeekStart) revenue_this_week += amount;
          if (paymentDate >= thisMonthStart) revenue_this_month += amount;
          if (paymentDate >= thisYearStart) revenue_this_year += amount;

          // Calculate by status
          if (payment.status === 'completed') {
            verified_amount += amount;
            verified_count++;
          } else if (payment.status === 'pending') {
            pending_amount += amount;
            pending_count++;
          } else if (payment.status === 'failed') {
            rejected_amount += amount;
            rejected_count++;
          } else if (payment.status === 'refunded') {
            refunded_amount += amount;
            refunded_count++;
          }
        });

        // Update stats with calculated values
        setStats({
          ...statsResponse.data,
          revenue_today,
          revenue_this_week,
          revenue_this_month,
          revenue_this_year,
          verified_amount,
          pending_amount,
          rejected_amount,
          refunded_amount,
          verified_count,
          pending_count,
          rejected_count,
          refunded_count,
          total_payments: payments.length,
          total_amount: revenue_this_year,
          success_rate: payments.length > 0 ? verified_count / payments.length : 0,
          average_payment_amount: payments.length > 0 ? revenue_this_year / payments.length : 0,
        });
      }

      // Load monthly data (simulated for now)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const mockMonthlyData: MonthlyData[] = months.map((month) => ({
        month,
        total_payments: Math.floor(Math.random() * 100) + 50,
        total_amount: Math.floor(Math.random() * 10000000) + 5000000,
        verified_count: Math.floor(Math.random() * 80) + 40,
        rejected_count: Math.floor(Math.random() * 20) + 5,
      }));
      setMonthlyData(mockMonthlyData);

    } catch (error: any) {
      console.error('Failed to load report data:', error);
      toast.error(error.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'json' | 'pdf') => {
    toast.info(`Exporting report as ${format.toUpperCase()}...`);
    // TODO: Implement actual export functionality
  };

  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Payment Reports
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Comprehensive payment analytics and reporting
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/payments')}
        >
          <ArrowLeft className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Back to Payments</span>
        </Button>
      </div>

      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReportData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[140px]">
              <BarChart3 className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
              <SelectItem value="comparison">Comparison</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                <Download className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading report data...</span>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(stats?.total_amount || 0)}
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-muted-foreground ml-2">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Transactions
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.total_payments || 0}</div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">+8.2%</span>
                  <span className="text-muted-foreground ml-2">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {((stats?.success_rate || 0) * 100).toFixed(1)}%
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">+2.1%</span>
                  <span className="text-muted-foreground ml-2">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Transaction
                </CardTitle>
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(stats?.average_payment_amount || 0)}
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  <span className="text-red-600">-3.2%</span>
                  <span className="text-muted-foreground ml-2">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Period</CardTitle>
                <CardDescription>Revenue breakdown across different time periods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Today</p>
                    <p className="text-xs text-muted-foreground">Current day revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(stats?.revenue_today || 0)}</p>
                    <Badge variant="outline" className="mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +5.2%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">This Week</p>
                    <p className="text-xs text-muted-foreground">Last 7 days revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(stats?.revenue_this_week || 0)}</p>
                    <Badge variant="outline" className="mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12.8%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">This Month</p>
                    <p className="text-xs text-muted-foreground">Current month revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(stats?.revenue_this_month || 0)}</p>
                    <Badge variant="outline" className="mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +18.5%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">This Year</p>
                    <p className="text-xs text-muted-foreground">Year-to-date revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(stats?.revenue_this_year || 0)}</p>
                    <Badge variant="outline" className="mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +24.3%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status Distribution</CardTitle>
                <CardDescription>Breakdown of payments by status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <div>
                      <p className="text-sm font-medium">Verified</p>
                      <p className="text-xs text-muted-foreground">{stats?.verified_count || 0} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(stats?.verified_amount || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.total_amount ? ((stats.verified_amount / stats.total_amount) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                    <div>
                      <p className="text-sm font-medium">Pending</p>
                      <p className="text-xs text-muted-foreground">{stats?.pending_count || 0} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(stats?.pending_amount || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.total_amount ? ((stats.pending_amount / stats.total_amount) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <div>
                      <p className="text-sm font-medium">Rejected</p>
                      <p className="text-xs text-muted-foreground">{stats?.rejected_count || 0} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(stats?.rejected_amount || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.total_amount ? ((stats.rejected_amount / stats.total_amount) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    <div>
                      <p className="text-sm font-medium">Refunded</p>
                      <p className="text-xs text-muted-foreground">{stats?.refunded_count || 0} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(stats?.refunded_amount || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.total_amount ? ((stats.refunded_amount / stats.total_amount) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Payment Trends</CardTitle>
              <CardDescription>Payment volume and revenue trends over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((month) => (
                  <div key={month.month} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium">{month.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          {month.total_payments} payments
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(month.total_amount)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(month.total_payments / 150) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                        {month.verified_count} ✓
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20">
                        {month.rejected_count} ✗
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
