import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentStore } from '@/stores/paymentStore';
import { PaymentForm } from '@/components/tenant/payments/PaymentForm';
import { PaymentVerificationQueue } from '@/components/tenant/payments/PaymentVerificationQueue';
import { PaymentAuditTrail } from '@/components/tenant/payments/PaymentAuditTrail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  ArrowUp,
  ArrowDown,
  Loader2,
  Receipt,
  Send,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { Payment } from '@/services/tenant/paymentService';
import { formatCurrency } from '@/utils/currency';
import { format, isAfter } from 'date-fns';

const statusConfig = {
  pending: { 
    label: 'Pending', 
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', 
    icon: Clock 
  },
  processing: { 
    label: 'Processing', 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', 
    icon: RefreshCw 
  },
  completed: { 
    label: 'Completed', 
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', 
    icon: CheckCircle 
  },
  failed: { 
    label: 'Failed', 
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', 
    icon: XCircle 
  },
  cancelled: { 
    label: 'Cancelled', 
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', 
    icon: Ban 
  },
  refunded: { 
    label: 'Refunded', 
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', 
    icon: RotateCcw 
  },
  partial_refunded: { 
    label: 'Partial Refund', 
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', 
    icon: RotateCcw 
  },
};

const verificationStatusConfig = {
  pending: { 
    label: 'Pending Verification', 
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
  },
  verified: { 
    label: 'Verified', 
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
  },
  rejected: { 
    label: 'Rejected', 
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
  },
  fraud_detected: { 
    label: 'Fraud Detected', 
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
  },
};

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

export const PaymentManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    payments,
    paymentsLoading: loading,
    error,
    stats,
    verificationQueue,
    filters,
    currentPage,
    totalPages,
    totalCount,
    perPage,
    selectedPaymentIds: selectedIds,
    fetchPayments,
    fetchPaymentStats,
    fetchVerificationQueue,
    setFilters,
    selectPayment,
    selectAllPayments,
    clearSelection,
    processPayment,
    verifyPayment,
    failPayment,
    cancelPayment,
    refundPayment,
    bulkProcessPayments,
    bulkVerifyPayments,
    sendPaymentReceipt,
    setError: clearError,
  } = usePaymentStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState<Payment['status'] | 'all'>(filters.status || 'all');
  const [selectedMethod, setSelectedMethod] = useState<string>(filters.payment_method || 'all');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const pagination = {
    currentPage,
    totalPages,
    totalCount,
    perPage,
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    fetchPayments(filters);
    fetchPaymentStats();
    fetchVerificationQueue();
  }, [fetchPayments, fetchPaymentStats, fetchVerificationQueue, filters]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ ...filters, search: searchTerm, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, setFilters]);

  const handleStatusFilter = (status: Payment['status'] | 'all') => {
    setSelectedStatus(status);
    setFilters({ 
      ...filters, 
      status: status === 'all' ? undefined : status, 
      page: 1 
    });
  };

  const handleMethodFilter = (method: string) => {
    setSelectedMethod(method);
    setFilters({ 
      ...filters, 
      payment_method: method === 'all' ? undefined : method as Payment['payment_method'], 
      page: 1 
    });
  };

  const handleSort = (sortBy: string) => {
    const sortOrder = filters.sort_by === sortBy && filters.sort_order === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sort_by: sortBy, sort_order: sortOrder, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleSelectPayment = (paymentId: string) => {
    selectPayment(paymentId);
  };

  const handleSelectAll = () => {
    selectAllPayments();
  };

  const handleProcessPayment = async (paymentId: string) => {
    try {
      await processPayment(paymentId, {
        auto_verify: true
      });
      toast({
        title: 'Success',
        description: 'Payment processed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
    }
  };

  const handleVerifyPayment = async (paymentId: string, status: Payment['verification_status']) => {
    try {
      await verifyPayment(paymentId, {
        verification_status: status,
        auto_process: status === 'verified'
      });
      toast({
        title: 'Success',
        description: `Payment ${status} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify payment',
        variant: 'destructive',
      });
    }
  };

  const handleFailPayment = async (paymentId: string) => {
    try {
      await failPayment(paymentId, {
        reason: 'Manual failure',
        notes: 'Marked as failed by admin'
      });
      toast({
        title: 'Success',
        description: 'Payment marked as failed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark payment as failed',
        variant: 'destructive',
      });
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    try {
      await cancelPayment(paymentId, 'Cancelled by admin');
      toast({
        title: 'Success',
        description: 'Payment cancelled successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel payment',
        variant: 'destructive',
      });
    }
  };

  const handleRefundPayment = async (paymentId: string, amount?: number) => {
    try {
      await refundPayment(paymentId, {
        amount,
        reason: 'Refund requested',
        refund_method: 'original'
      });
      toast({
        title: 'Success',
        description: 'Payment refunded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refund payment',
        variant: 'destructive',
      });
    }
  };

  const handleSendReceipt = async (paymentId: string) => {
    try {
      await sendPaymentReceipt(paymentId, {
        include_proof: true
      });
      toast({
        title: 'Success',
        description: 'Payment receipt sent',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send receipt',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: 'process' | 'verify' | 'cancel') => {
    if (selectedIds.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select payments to perform bulk action',
        variant: 'destructive',
      });
      return;
    }

    try {
      switch (action) {
        case 'process':
          await bulkProcessPayments(selectedIds, { auto_verify: true });
          toast({
            title: 'Success',
            description: `${selectedIds.length} payments processed successfully`,
          });
          break;
        case 'verify':
          await bulkVerifyPayments(selectedIds, { 
            verification_status: 'verified',
            auto_process: true 
          });
          toast({
            title: 'Success',
            description: `${selectedIds.length} payments verified successfully`,
          });
          break;
      }
      clearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} payments`,
        variant: 'destructive',
      });
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
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">
            Process and manage customer payments and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFiltersPanel(!showFiltersPanel)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowPaymentForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">All Payments</TabsTrigger>
          <TabsTrigger value="verification">Verification Queue</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
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
              value={verificationQueue.length}
              subtitle="Awaiting verification"
              icon={AlertTriangle}
              className={verificationQueue.length > 0 ? "border-yellow-200 bg-yellow-50" : ""}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.slice(0, 5).map((payment) => {
                    const statusInfo = statusConfig[payment.status];
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={payment.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <StatusIcon className="w-4 h-4" />
                          <div>
                            <p className="text-sm font-medium">{payment.customer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.payment_reference}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                          <Badge className={statusInfo.className} variant="secondary">
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Payment method distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.payment_methods?.slice(0, 5).map((methodStat) => (
                    <div key={methodStat.method} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {methodStat.method.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {methodStat.count} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(methodStat.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {methodStat.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedStatus} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedMethod} onValueChange={handleMethodFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                      <SelectItem value="gopay">GoPay</SelectItem>
                      <SelectItem value="ovo">OVO</SelectItem>
                      <SelectItem value="dana">DANA</SelectItem>
                      <SelectItem value="shopeepay">ShopeePay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedIds.length} payment(s) selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('verify')}
                    >
                      Bulk Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('process')}
                    >
                      Bulk Process
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearSelection}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Loading payments...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === payments.length && payments.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('payment_reference')}
                      >
                        Reference
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('customer_name')}
                      >
                        Customer
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('amount')}
                      >
                        Amount
                      </TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('created_at')}
                      >
                        Date
                      </TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => {
                      const statusInfo = statusConfig[payment.status];
                      const verificationInfo = verificationStatusConfig[payment.verification_status];
                      
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(payment.id)}
                              onCheckedChange={() => handleSelectPayment(payment.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.payment_reference}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{payment.customer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {payment.payment_method.replace('_', ' ')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.className} variant="secondary">
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={verificationInfo.className} variant="secondary">
                              {verificationInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/admin/payments/${payment.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {payment.status === 'pending' && (
                                  <DropdownMenuItem onClick={() => handleProcessPayment(payment.id)}>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Process
                                  </DropdownMenuItem>
                                )}
                                {payment.verification_status === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleVerifyPayment(payment.id, 'verified')}>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Verify
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleVerifyPayment(payment.id, 'rejected')}>
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => handleSendReceipt(payment.id)}>
                                  <Receipt className="w-4 h-4 mr-2" />
                                  Send Receipt
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {payment.status === 'completed' && (
                                  <DropdownMenuItem onClick={() => handleRefundPayment(payment.id)}>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Refund
                                  </DropdownMenuItem>
                                )}
                                {(payment.status === 'pending' || payment.status === 'processing') && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleFailPayment(payment.id)}>
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Mark as Failed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCancelPayment(payment.id)}>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} payments
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Verification Queue Tab */}
        <TabsContent value="verification" className="space-y-4">
          <PaymentVerificationQueue />
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <PaymentAuditTrail />
        </TabsContent>

        {/* Analytics Tab */}
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
                    <span>Failure Rate</span>
                    <span className="font-medium">{((stats?.failure_rate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Rate</span>
                    <span className="font-medium">{((stats?.refund_rate || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gateway Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.gateway_stats?.map((gateway) => (
                    <div key={gateway.gateway} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{gateway.gateway}</span>
                        <span className="text-sm text-muted-foreground">
                          {gateway.success_rate.toFixed(1)}% success
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{gateway.count} payments</span>
                        <span>{gateway.average_processing_time.toFixed(1)}s avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Form Dialog */}
      <PaymentForm
        open={showPaymentForm}
        onOpenChange={setShowPaymentForm}
        onSuccess={() => {
          fetchPayments();
          setShowPaymentForm(false);
        }}
        onCancel={() => setShowPaymentForm(false)}
      />
    </div>
  );
};