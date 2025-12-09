import React, { useState } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  DataTable,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/lazy-components';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  useInsuranceFundBalance, 
  useInsuranceFundTransactions, 
  useInsuranceFundAnalytics 
} from '@/hooks/useRefunds';
import { 
  InsuranceFundTransaction, 
  FundTransactionType 
} from '@/types/refund';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
} from 'recharts';

export default function InsuranceFundDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Queries
  const balanceQuery = useInsuranceFundBalance();
  const transactionsQuery = useInsuranceFundTransactions();
  const analyticsQuery = useInsuranceFundAnalytics();

  const balance = balanceQuery.data || 0;
  const transactions = transactionsQuery.data?.data || [];
  const analytics = analyticsQuery.data;
  const isLoading = balanceQuery.isLoading || transactionsQuery.isLoading || analyticsQuery.isLoading;

  // Export functionality
  const handleExportReport = () => {
    try {
      // Prepare data for export
      const exportData = {
        report_date: new Date().toISOString(),
        fund_balance: balance,
        analytics: analytics || {},
        transactions: transactions.map(t => ({
          id: t.id,
          date: t.createdAt,
          type: transactionTypeLabels[t.transactionType],
          amount: t.amount,
          balance_after: t.balanceAfter,
          description: t.description,
          order_id: t.orderId,
          refund_request_id: t.refundRequestId,
        })),
        summary: {
          total_transactions: transactions.length,
          total_contributions: transactions.filter(t => t.transactionType === FundTransactionType.Contribution).length,
          total_withdrawals: transactions.filter(t => t.transactionType === FundTransactionType.Withdrawal).length,
          contribution_amount: transactions
            .filter(t => t.transactionType === FundTransactionType.Contribution)
            .reduce((sum, t) => sum + t.amount, 0),
          withdrawal_amount: transactions
            .filter(t => t.transactionType === FundTransactionType.Withdrawal)
            .reduce((sum, t) => sum + t.amount, 0),
        }
      };

      // Create and download JSON file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `insurance-fund-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    }
  };



  // Transaction type colors
  const transactionTypeColors = {
    [FundTransactionType.Contribution]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [FundTransactionType.Withdrawal]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  const transactionTypeLabels = {
    [FundTransactionType.Contribution]: 'Kontribusi',
    [FundTransactionType.Withdrawal]: 'Penarikan',
  };

  // Chart colors
  const chartColors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  // Table columns for transactions
  const toggleRowExpansion = (rowId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  const transactionColumns: ColumnDef<InsuranceFundTransaction>[] = [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Tanggal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm', { locale: id })}
        </div>
      ),
    },
    {
      accessorKey: 'transactionType',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Tipe
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className={transactionTypeColors[row.original.transactionType]}>
          {transactionTypeLabels[row.original.transactionType]}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.description}>
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Jumlah
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className={`text-right font-medium ${
          row.original.transactionType === FundTransactionType.Contribution 
            ? 'text-green-600' 
            : 'text-red-600'
        }`}>
          {row.original.transactionType === FundTransactionType.Contribution ? '+' : '-'}
          Rp {row.original.amount.toLocaleString('id-ID')}
        </div>
      ),
    },
    {
      accessorKey: 'balanceAfter',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Saldo Setelah
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          Rp {row.original.balanceAfter.toLocaleString('id-ID')}
        </div>
      ),
    },
    {
      accessorKey: 'orderId',
      header: 'Order ID',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.orderId ? `Order-${String(row.original.orderId).slice(-6)}` : '-'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const transaction = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Transaction Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Transaction ID</Label>
                        <p className="text-sm text-muted-foreground">{transaction.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date</Label>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: id })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Type</Label>
                        <Badge variant="outline" className={transactionTypeColors[transaction.transactionType]}>
                          {transactionTypeLabels[transaction.transactionType]}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Amount</Label>
                        <p className={`text-sm font-medium ${
                          transaction.transactionType === FundTransactionType.Contribution 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.transactionType === FundTransactionType.Contribution ? '+' : '-'}
                          Rp {transaction.amount.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Balance Before</Label>
                        <p className="text-sm text-muted-foreground">
                          Rp {transaction.balanceBefore.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Balance After</Label>
                        <p className="text-sm text-muted-foreground">
                          Rp {transaction.balanceAfter.toLocaleString('id-ID')}
                        </p>
                      </div>
                      {transaction.orderId && (
                        <div>
                          <Label className="text-sm font-medium">Order ID</Label>
                          <p className="text-sm text-muted-foreground">
                            Order-{String(transaction.orderId).slice(-6)}
                          </p>
                        </div>
                      )}
                      {transaction.refundRequestId && (
                        <div>
                          <Label className="text-sm font-medium">Refund Request ID</Label>
                          <p className="text-sm text-muted-foreground">{transaction.refundRequestId}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
                    </div>
                    
                    {transaction.refundRequest && (
                      <div className="pt-4 border-t">
                        <Label className="text-sm font-medium">Related Refund Request</Label>
                        <div className="mt-2 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Request Number:</span>
                            <span>{transaction.refundRequest.requestNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline">{transaction.refundRequest.status}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reason:</span>
                            <span>{transaction.refundRequest.refundReason}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span>Rp {transaction.refundRequest.customerRequestAmount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Remove old filtering logic - DataTable handles this now

  // Calculate fund health status
  const getFundHealthStatus = () => {
    if (!analytics) return { status: 'unknown', color: 'gray', message: 'Loading...' };
    
    const utilizationRate = analytics.utilizationRate;
    if (utilizationRate < 30) {
      return { status: 'excellent', color: 'green', message: 'Dana sangat sehat' };
    } else if (utilizationRate < 50) {
      return { status: 'good', color: 'blue', message: 'Dana sehat' };
    } else if (utilizationRate < 70) {
      return { status: 'warning', color: 'yellow', message: 'Perlu perhatian' };
    } else {
      return { status: 'critical', color: 'red', message: 'Dana hampir habis' };
    }
  };

  const fundHealth = getFundHealthStatus();

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insurance Fund Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Monitor dan kelola insurance fund untuk refund protection</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                balanceQuery.refetch();
                transactionsQuery.refetch();
                analyticsQuery.refetch();
                toast.success('Data refreshed successfully');
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportReport}
              disabled={isLoading || transactions.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold">
                    Rp {balance.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Contributions</p>
                  <p className="text-2xl font-bold">
                    Rp {analytics?.totalContributions.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Withdrawals</p>
                  <p className="text-2xl font-bold">
                    Rp {analytics?.totalWithdrawals.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                {fundHealth.status === 'excellent' ? <CheckCircle2 className="h-8 w-8 text-green-600" /> :
                 fundHealth.status === 'good' ? <CheckCircle2 className="h-8 w-8 text-blue-600" /> :
                 fundHealth.status === 'warning' ? <AlertTriangle className="h-8 w-8 text-yellow-600" /> :
                 <AlertTriangle className="h-8 w-8 text-red-600" />}
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Fund Health</p>
                  <p className="text-2xl font-bold">{analytics?.utilizationRate || 0}%</p>
                  <p className={`text-xs text-${fundHealth.color}-600`}>{fundHealth.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Fund Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value + '-01');
                          return format(date, 'MMM yyyy', { locale: id });
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                        labelFormatter={(label) => {
                          const date = new Date(label + '-01');
                          return format(date, 'MMMM yyyy', { locale: id });
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="contributions" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Contributions"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="withdrawals" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Withdrawals"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Balance"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fund Utilization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Fund Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Utilization Rate</span>
                      <span className="text-2xl font-bold">{analytics?.utilizationRate || 0}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          (analytics?.utilizationRate || 0) < 30 ? 'bg-green-600' :
                          (analytics?.utilizationRate || 0) < 50 ? 'bg-blue-600' :
                          (analytics?.utilizationRate || 0) < 70 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${analytics?.utilizationRate || 0}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Available</p>
                        <p className="font-medium text-green-600">
                          Rp {(balance || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Used (Total Withdrawals)</p>
                        <p className="font-medium text-red-600">
                          Rp {(analytics?.totalWithdrawals || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Withdrawal</span>
                      <span className="font-medium">
                        Rp {(analytics?.averageWithdrawalAmount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Transactions</span>
                      <span className="font-medium">{transactions.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Activity</span>
                      <span className="font-medium text-sm">
                        {transactions[0] 
                          ? format(new Date(transactions[0].createdAt), 'dd/MM/yyyy', { locale: id })
                          : 'No activity'
                        }
                      </span>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fund Status</span>
                        <Badge 
                          variant="outline" 
                          className={`bg-${fundHealth.color}-100 text-${fundHealth.color}-800`}
                        >
                          {fundHealth.message}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">

            {/* Transaction Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <ArrowUpRight className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Contributions</p>
                      <p className="text-xl font-bold text-green-600">
                        {transactions.filter(t => t.transactionType === FundTransactionType.Contribution).length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rp {transactions
                          .filter(t => t.transactionType === FundTransactionType.Contribution)
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('id-ID')
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <ArrowDownRight className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Withdrawals</p>
                      <p className="text-xl font-bold text-red-600">
                        {transactions.filter(t => t.transactionType === FundTransactionType.Withdrawal).length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rp {transactions
                          .filter(t => t.transactionType === FundTransactionType.Withdrawal)
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('id-ID')
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Net Change</p>
                      <p className={`text-xl font-bold ${
                        (transactions
                          .filter(t => t.transactionType === FundTransactionType.Contribution)
                          .reduce((sum, t) => sum + t.amount, 0) - 
                        transactions
                          .filter(t => t.transactionType === FundTransactionType.Withdrawal)
                          .reduce((sum, t) => sum + t.amount, 0)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Rp {(
                          transactions
                            .filter(t => t.transactionType === FundTransactionType.Contribution)
                            .reduce((sum, t) => sum + t.amount, 0) - 
                          transactions
                            .filter(t => t.transactionType === FundTransactionType.Withdrawal)
                            .reduce((sum, t) => sum + t.amount, 0)
                        ).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardContent className="p-6">
                <DataTable
                  columns={transactionColumns}
                  data={transactions}
                  searchKey="description"
                  searchPlaceholder="Search transactions..."
                  loading={transactionsQuery.isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Monthly Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Contributions vs Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value + '-01');
                          return format(date, 'MMM yyyy', { locale: id });
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                        labelFormatter={(label) => {
                          const date = new Date(label + '-01');
                          return format(date, 'MMMM yyyy', { locale: id });
                        }}
                      />
                      <Bar dataKey="contributions" fill="#10b981" name="Contributions" />
                      <Bar dataKey="withdrawals" fill="#ef4444" name="Withdrawals" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fund Performance Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Contribution Rate</span>
                        <span className="text-sm text-green-600 font-medium">
                          {analytics ? (analytics.totalContributions / (analytics.totalContributions + analytics.totalWithdrawals) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ 
                            width: `${analytics ? (analytics.totalContributions / (analytics.totalContributions + analytics.totalWithdrawals) * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Withdrawal Rate</span>
                        <span className="text-sm text-red-600 font-medium">
                          {analytics ? (analytics.totalWithdrawals / (analytics.totalContributions + analytics.totalWithdrawals) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full"
                          style={{ 
                            width: `${analytics ? (analytics.totalWithdrawals / (analytics.totalContributions + analytics.totalWithdrawals) * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics && analytics.utilizationRate > 70 && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg dark:bg-red-900/20">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            High Utilization Alert
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Consider increasing contribution rate or reducing refund approvals
                          </p>
                        </div>
                      </div>
                    )}

                    {analytics && analytics.utilizationRate < 30 && (
                      <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">
                            Healthy Fund Status
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Fund is well-maintained with low utilization
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Regular Review
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Review fund performance monthly to maintain optimal balance
                        </p>
                      </div>
                    </div>
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