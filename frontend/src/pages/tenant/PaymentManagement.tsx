import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Download, RefreshCw, CheckCircle, XCircle, Clock, CreditCard,
  AlertTriangle, TrendingUp, DollarSign, ArrowUp, ArrowDown, Loader2,
  Receipt, Ban, RotateCcw, Home, ListChecks, History, BarChart3,
  ShieldAlert, XOctagon, Search, MoreHorizontal, Eye
} from 'lucide-react';
import PaymentVerificationModal from '@/components/admin/PaymentVerificationModal';
import type { ColumnDef } from '@tanstack/react-table';

interface Payment {
  uuid: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  customer: {
    name: string;
    email: string | null;
  };
  quote_number: string | null;
  submitted_at: string;
  verified_at: string | null;
  verified_by_name: string | null;
}

interface PaymentStats {
  pending_count: number;
  verified_today: number;
  rejected_today: number;
  revenue_today: number;
  pending_amount: number;
  total_payments: number;
  total_amount: number;
  success_rate: number;
  average_payment_amount?: number;
}

const formatCurrency = (amount: number, currency: string = 'IDR') => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, className = "", onClick }: any) => (
  <Card className={`${className} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`} onClick={onClick}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trend && trendValue && (
          <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
            {trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : trend === 'down' ? <ArrowDown className="w-3 h-3 mr-1" /> : null}
            {trendValue}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export const PaymentManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Payment filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal state
  const [selectedPaymentUuid, setSelectedPaymentUuid] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Refund dialog state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundPaymentUuid, setRefundPaymentUuid] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isPartialRefund, setIsPartialRefund] = useState(false);
  const [refundProcessing, setRefundProcessing] = useState(false);

  // Send receipt dialog state
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptPaymentUuid, setReceiptPaymentUuid] = useState<string | null>(null);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [includeProof, setIncludeProof] = useState(true);
  const [receiptProcessing, setReceiptProcessing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'payments') {
      loadPayments();
    }
  }, [activeTab, currentPage, statusFilter]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tenantApiClient.get('/admin/payment-verification/statistics') as any;
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load payment stats:', err);
      setError(err.message || 'Failed to load payment statistics');
      toast.error(err.message || 'Failed to load payment statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      setPaymentsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        status: statusFilter === 'all' ? '' : statusFilter,
        search: searchTerm,
      });

      const response = await tenantApiClient.get(`/admin/payment-history?${params}`) as any;

      if (response && response.success) {
        setPayments(response.data);
        setTotalPages(response.meta?.last_page || 1);
        setTotalRecords(response.meta?.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      toast.error(error.message || 'Failed to load payments');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadPayments();
  };

  const handleViewDetails = (uuid: string) => {
    setSelectedPaymentUuid(uuid);
    setIsModalOpen(true);
  };

  const handleRefund = (payment: Payment) => {
    setRefundPaymentUuid(payment.uuid);
    setRefundAmount((payment.amount).toString());
    setRefundReason('');
    setIsPartialRefund(false);
    setRefundDialogOpen(true);
  };

  const handleRefundSubmit = async () => {
    if (!refundPaymentUuid || !refundReason) {
      toast.error('Please provide refund reason');
      return;
    }

    try {
      setRefundProcessing(true);
      const payload: any = { reason: refundReason };
      if (isPartialRefund && refundAmount) {
        payload.amount = parseFloat(refundAmount) * 100; // Convert to cents
      }

      const response = await tenantApiClient.post(`/admin/payment-verification/${refundPaymentUuid}/refund`, payload) as any;
      
      if (response && response.success) {
        toast.success('Payment refunded successfully');
        setRefundDialogOpen(false);
        setRefundPaymentUuid(null);
        setRefundAmount('');
        setRefundReason('');
        setIsPartialRefund(false);
        loadPayments();
        loadStats();
      }
    } catch (err: any) {
      console.error('Failed to process refund:', err);
      toast.error(err.message || 'Failed to process refund');
    } finally {
      setRefundProcessing(false);
    }
  };

  const handleSendReceipt = (payment: Payment) => {
    setReceiptPaymentUuid(payment.uuid);
    setReceiptEmail(payment.customer.email || '');
    setIncludeProof(true);
    setShowReceiptDialog(true);
  };

  const handleSendReceiptSubmit = async () => {
    if (!receiptPaymentUuid || !receiptEmail) {
      toast.error('Please provide email address');
      return;
    }

    try {
      setReceiptProcessing(true);
      const response = await tenantApiClient.post(
        `/admin/payment-verification/${receiptPaymentUuid}/send-receipt`,
        {
          email: receiptEmail,
          include_proof: includeProof,
        }
      ) as any;

      if (response && response.success) {
        toast.success('Payment receipt sent successfully');
        setShowReceiptDialog(false);
      }
    } catch (error: any) {
      console.error('Failed to send receipt:', error);
      toast.error(error.message || 'Failed to send receipt');
    } finally {
      setReceiptProcessing(false);
    }
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Payment>[]>(() => [
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.reference}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customer.name}</p>
          {row.original.customer.email && (
            <p className="text-sm text-muted-foreground">
              {row.original.customer.email}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'quote_number',
      header: 'Quote',
      cell: ({ row }) => row.original.quote_number || '-',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'submitted_at',
      header: 'Submitted',
      cell: ({ row }) => formatDate(row.original.submitted_at),
    },
    {
      accessorKey: 'verified_by_name',
      header: 'Verified By',
      cell: ({ row }) => row.original.verified_by_name || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(row.original.uuid)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSendReceipt(row.original)}>
              <Receipt className="w-4 h-4 mr-2" />
              Send Receipt
            </DropdownMenuItem>
            {row.original.status === 'completed' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRefund(row.original)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refund
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <RotateCcw className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Ban className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Payments</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => { setError(null); loadStats(); }}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Payment Management</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Process and manage customer payments and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Export</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Home className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            All Payments
          </TabsTrigger>
          <TabsTrigger value="verification">
            <ListChecks className="w-4 h-4 mr-2" />
            Verification Queue
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="w-4 h-4 mr-2" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading statistics...</span>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Payments"
                  value={stats?.total_payments || 0}
                  subtitle="All payment records"
                  icon={CreditCard}
                  trend="up"
                  trendValue="+12%"
                />
                <StatCard
                  title="Total Amount"
                  value={formatCurrency(stats?.total_amount || 0)}
                  subtitle="Gross payment amount"
                  icon={DollarSign}
                  trend="up"
                  trendValue="+8%"
                />
                <StatCard
                  title="Success Rate"
                  value={`${((stats?.success_rate || 0) * 100).toFixed(1)}%`}
                  subtitle="Payment success rate"
                  icon={TrendingUp}
                  trend="up"
                  trendValue="+2%"
                />
                <StatCard
                  title="Pending Verification"
                  value={stats?.pending_count || 0}
                  subtitle="Awaiting verification"
                  icon={AlertTriangle}
                  className={stats?.pending_count ? "border-yellow-200 bg-yellow-50" : ""}
                  onClick={() => setActiveTab('verification')}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/payments/verification')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Verification Queue</CardTitle>
                    <ListChecks className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.pending_count || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Pending verification</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/payments/history')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment History</CardTitle>
                    <History className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_payments || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">All transactions</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/payments/refunds')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Refund Management</CardTitle>
                    <RotateCcw className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Coming Soon</div>
                    <p className="text-xs text-muted-foreground mt-1">Process refunds</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.revenue_today || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Revenue today</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
                    <XOctagon className="h-5 w-5 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Receipts</CardTitle>
                    <Receipt className="h-5 w-5 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.verified_today || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Sent today</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cancelled Payments</CardTitle>
                    <Ban className="h-5 w-5 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fraud Detection</CardTitle>
                    <ShieldAlert className="h-5 w-5 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground mt-1">Flagged transactions</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card hover={false} className="p-6" role="region" aria-label="Payment transactions table">
            <CardHeader className="px-0 pt-0">
              <CardTitle>All Payments</CardTitle>
              <CardDescription>View and manage all payment transactions</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by reference, customer, quote..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Verified</SelectItem>
                    <SelectItem value="failed">Rejected</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} size="sm">
                  <Search className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Search</span>
                </Button>
              </div>

              {/* DataTable */}
              <DataTable
                columns={columns}
                data={payments}
                searchKey="reference"
                searchPlaceholder="Search payments..."
                loading={paymentsLoading}
                datasetId="payment-transactions"
                showPagination={false}
                getRowId={(payment) => payment.uuid}
                onRowClick={(payment) => handleViewDetails(payment.uuid)}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalRecords)} of {totalRecords} payments
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Queue</CardTitle>
              <CardDescription>Review and verify pending payment submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ListChecks className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Payment Verification</h3>
                <p className="text-muted-foreground mb-4">
                  {stats?.pending_count || 0} payment(s) awaiting verification
                </p>
                <Button onClick={() => navigate('/admin/payments/verification')}>
                  Go to Verification Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Track all payment-related activities and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Audit trail functionality will be available in the next update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Payments</span>
                    <span className="font-medium">{stats?.total_payments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate</span>
                    <span className="font-medium">{((stats?.success_rate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Amount</span>
                    <span className="font-medium">{formatCurrency(stats?.average_payment_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Amount</span>
                    <span className="font-medium">{formatCurrency(stats?.pending_amount || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Verified Today</span>
                    <span className="font-medium text-green-600">{stats?.verified_today || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejected Today</span>
                    <span className="font-medium text-red-600">{stats?.rejected_today || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue Today</span>
                    <span className="font-medium">{formatCurrency(stats?.revenue_today || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Verification</span>
                    <span className="font-medium text-yellow-600">{stats?.pending_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a full or partial refund for this payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="partial-refund"
                checked={isPartialRefund}
                onChange={(e) => setIsPartialRefund(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="partial-refund">Partial Refund</Label>
            </div>
            {isPartialRefund && (
              <div>
                <Label htmlFor="refund-amount">Refund Amount</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="refund-reason">Refund Reason</Label>
              <Textarea
                id="refund-reason"
                placeholder="Enter reason for refund"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)} disabled={refundProcessing}>
              Cancel
            </Button>
            <Button onClick={handleRefundSubmit} disabled={refundProcessing}>
              {refundProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Refund'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Receipt</DialogTitle>
            <DialogDescription>
              Send payment receipt to customer via email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="receipt-email">Email Address</Label>
              <Input
                id="receipt-email"
                type="email"
                placeholder="customer@example.com"
                value={receiptEmail}
                onChange={(e) => setReceiptEmail(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-proof"
                checked={includeProof}
                onChange={(e) => setIncludeProof(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="include-proof">Include payment proof attachment</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)} disabled={receiptProcessing}>
              Cancel
            </Button>
            <Button onClick={handleSendReceiptSubmit} disabled={receiptProcessing}>
              {receiptProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Send Receipt
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedPaymentUuid && (
        <PaymentVerificationModal
          paymentUuid={selectedPaymentUuid}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPaymentUuid(null);
          }}
          onVerificationComplete={() => {
            loadPayments();
            loadStats();
          }}
        />
      )}
    </div>
  );
};

export default PaymentManagement;
