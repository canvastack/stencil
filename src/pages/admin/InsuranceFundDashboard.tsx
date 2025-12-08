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
  const [transactionFilters, setTransactionFilters] = useState({
    search: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Queries
  const balanceQuery = useInsuranceFundBalance();
  const transactionsQuery = useInsuranceFundTransactions();
  const analyticsQuery = useInsuranceFundAnalytics();

  const balance = balanceQuery.data || 0;
  const transactions = transactionsQuery.data?.data || [];
  const analytics = analyticsQuery.data;
  const isLoading = balanceQuery.isLoading || transactionsQuery.isLoading || analyticsQuery.isLoading;

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
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleRowExpansion(row.original.id)}
          className="h-8 w-8 p-0"
        >
          {expandedRows.has(row.original.id) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
      size: 40,
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal',
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm', { locale: id })}
        </div>
      ),
    },
    {
      accessorKey: 'transactionType',
      header: 'Tipe',
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
      header: 'Jumlah',
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
      header: 'Saldo Setelah',
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
  ];

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !transactionFilters.search || 
      transaction.description.toLowerCase().includes(transactionFilters.search.toLowerCase());
    const matchesType = transactionFilters.type === 'all' || transaction.transactionType === transactionFilters.type;
    // Add date filtering if needed
    return matchesSearch && matchesType;
  });

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
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
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
            {/* Transaction Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search transactions..."
                      value={transactionFilters.search}
                      onChange={(e) => setTransactionFilters({ ...transactionFilters, search: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select
                      value={transactionFilters.type}
                      onValueChange={(value) => setTransactionFilters({ ...transactionFilters, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value={FundTransactionType.Contribution}>Contribution</SelectItem>
                        <SelectItem value={FundTransactionType.Withdrawal}>Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">Date From</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={transactionFilters.dateFrom}
                      onChange={(e) => setTransactionFilters({ ...transactionFilters, dateFrom: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateTo">Date To</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={transactionFilters.dateTo}
                      onChange={(e) => setTransactionFilters({ ...transactionFilters, dateTo: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <ArrowUpRight className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Contributions</p>
                      <p className="text-xl font-bold text-green-600">
                        {filteredTransactions.filter(t => t.transactionType === FundTransactionType.Contribution).length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rp {filteredTransactions
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
                        {filteredTransactions.filter(t => t.transactionType === FundTransactionType.Withdrawal).length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rp {filteredTransactions
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
                        (filteredTransactions
                          .filter(t => t.transactionType === FundTransactionType.Contribution)
                          .reduce((sum, t) => sum + t.amount, 0) - 
                        filteredTransactions
                          .filter(t => t.transactionType === FundTransactionType.Withdrawal)
                          .reduce((sum, t) => sum + t.amount, 0)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Rp {(
                          filteredTransactions
                            .filter(t => t.transactionType === FundTransactionType.Contribution)
                            .reduce((sum, t) => sum + t.amount, 0) - 
                          filteredTransactions
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
              <CardContent className="p-0">
                <div className="space-y-0">
                  {filteredTransactions.map((transaction, index) => (
                    <div key={transaction.id} className={`border-b ${index === filteredTransactions.length - 1 ? 'border-b-0' : ''}`}>
                      {/* Main row */}
                      <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="flex items-center gap-4 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(transaction.id)}
                            className="h-8 w-8 p-0"
                          >
                            {expandedRows.has(transaction.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <div className="min-w-[120px]">
                            <div className="text-sm">
                              {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: id })}
                            </div>
                          </div>
                          
                          <div className="min-w-[100px]">
                            <Badge variant="outline" className={transactionTypeColors[transaction.transactionType]}>
                              {transactionTypeLabels[transaction.transactionType]}
                            </Badge>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="max-w-xs truncate" title={transaction.description}>
                              {transaction.description}
                            </div>
                          </div>
                          
                          <div className="min-w-[140px] text-right">
                            <div className={`font-medium ${
                              transaction.transactionType === FundTransactionType.Contribution 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.transactionType === FundTransactionType.Contribution ? '+' : '-'}
                              Rp {transaction.amount.toLocaleString('id-ID')}
                            </div>
                          </div>
                          
                          <div className="min-w-[140px] text-right">
                            <div className="font-medium">
                              Rp {transaction.balanceAfter.toLocaleString('id-ID')}
                            </div>
                          </div>
                          
                          <div className="min-w-[100px] text-right">
                            <div className="text-sm text-muted-foreground">
                              {transaction.orderId ? `Order-${String(transaction.orderId).slice(-6)}` : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded details */}
                      {expandedRows.has(transaction.id) && (
                        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Transaction Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Transaction ID:</span>
                                  <span className="font-mono">{transaction.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Tenant ID:</span>
                                  <span className="font-mono">{transaction.tenantId}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Balance Before:</span>
                                  <span>Rp {transaction.balanceBefore.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Balance After:</span>
                                  <span>Rp {transaction.balanceAfter.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            </div>
                            
                            {transaction.orderId && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Related Order</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Order ID:</span>
                                    <span className="font-mono">{transaction.orderId}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {transaction.refundRequestId && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Related Refund</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Refund Request ID:</span>
                                    <span className="font-mono">{transaction.refundRequestId}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="md:col-span-2 lg:col-span-3">
                              <h4 className="font-medium text-sm mb-2">Full Description</h4>
                              <p className="text-sm text-muted-foreground">{transaction.description}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {filteredTransactions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No transactions found matching your criteria.
                    </div>
                  )}
                </div>
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