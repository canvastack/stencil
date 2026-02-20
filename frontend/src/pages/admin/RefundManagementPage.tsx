import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw, ArrowLeft, Search, CheckCircle, Clock, Loader2, DollarSign, TrendingDown, Download, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';
import type { ColumnDef } from '@tanstack/react-table';

interface RefundPayment {
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
  refunded_at: string | null;
  refund_amount: number | null;
  refund_reason: string | null;
}

interface RefundStats {
  total_refunded: number;
  total_refund_amount: number;
  pending_refunds: number;
  refund_rate: number;
}

export default function RefundManagementPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<RefundPayment[]>([]);
  const [stats, setStats] = useState<RefundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('refunded');
  
  // Refund dialog
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RefundPayment | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isPartialRefund, setIsPartialRefund] = useState(false);
  const [refundProcessing, setRefundProcessing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [currentPage, statusFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        status: statusFilter === 'all' ? '' : statusFilter,
        search: searchTerm,
      });

      const response = await tenantApiClient.get(`/admin/payment-history?${params}`) as any;

      if (response && response.success) {
        // Filter only refunded or completed payments
        const refundablePayments = response.data.filter((p: RefundPayment) => 
          p.status === 'refunded' || p.status === 'completed' || p.status === 'partial_refunded'
        );
        setPayments(refundablePayments);
        setTotalPages(response.meta?.last_page || 1);
        setTotalRecords(response.meta?.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      toast.error(error.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await tenantApiClient.get('/admin/payment-history/stats') as any;

      if (response && response.success) {
        // Calculate refund stats from the data
        const refundStats: RefundStats = {
          total_refunded: response.data.total_rejected || 0, // Using rejected as placeholder
          total_refund_amount: response.data.total_amount_rejected || 0,
          pending_refunds: 0,
          refund_rate: 0,
        };
        setStats(refundStats);
      }
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadPayments();
  };

  const handleRefund = (payment: RefundPayment) => {
    setSelectedPayment(payment);
    setRefundAmount((payment.amount).toString());
    setRefundReason('');
    setIsPartialRefund(false);
    setShowRefundDialog(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedPayment || !refundReason) {
      toast.error('Please provide refund reason');
      return;
    }

    try {
      setRefundProcessing(true);
      const payload: any = { reason: refundReason };
      if (isPartialRefund && refundAmount) {
        payload.amount = parseFloat(refundAmount) * 100; // Convert to cents
      }

      const response = await tenantApiClient.post(
        `/admin/payment-verification/${selectedPayment.uuid}/refund`,
        payload
      ) as any;

      if (response && response.success) {
        toast.success('Payment refunded successfully');
        setShowRefundDialog(false);
        setSelectedPayment(null);
        setRefundAmount('');
        setRefundReason('');
        setIsPartialRefund(false);
        loadPayments();
        loadStats();
      }
    } catch (error: any) {
      console.error('Failed to refund payment:', error);
      toast.error(error.message || 'Failed to refund payment');
    } finally {
      setRefundProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'refunded':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <RotateCcw className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        );
      case 'partial_refunded':
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            <RotateCcw className="h-3 w-3 mr-1" />
            Partial Refund
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const columns = useMemo<ColumnDef<RefundPayment>[]>(() => [
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
      accessorKey: 'amount',
      header: 'Original Amount',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'refund_amount',
      header: 'Refund Amount',
      cell: ({ row }) => (
        <span className="font-medium text-purple-600">
          {row.original.refund_amount 
            ? formatCurrency(row.original.refund_amount, row.original.currency)
            : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'refunded_at',
      header: 'Refunded At',
      cell: ({ row }) => row.original.refunded_at ? formatDate(row.original.refunded_at) : '-',
    },
    {
      accessorKey: 'refund_reason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.refund_reason || '-'}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        row.original.status === 'completed' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRefund(row.original)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refund
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
  ], []);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Refund Management
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Process and manage payment refunds
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
            onClick={() => {
              loadPayments();
              loadStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={payments.length === 0}
          >
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearch}
          >
            <Search className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Search</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Refunded
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <RotateCcw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_refunded || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Refund transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Refund Amount
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(stats?.total_refund_amount || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total refunded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Refunds
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pending_refunds || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Refund Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats?.refund_rate || 0).toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              Of total payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Refund Table */}
      <Card hover={false} className="p-6" role="region" aria-label="Refund transactions table">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Refund Transactions</CardTitle>
          <CardDescription>View and process payment refunds</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by reference, customer..."
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
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="partial_refunded">Partial Refund</SelectItem>
                <SelectItem value="completed">Completed (Refundable)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={payments}
            searchKey="reference"
            searchPlaceholder="Search refunds..."
            loading={loading}
            datasetId="refund-transactions"
            showPagination={false}
            getRowId={(payment) => payment.uuid}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalRecords)} of {totalRecords} transactions
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

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a full or partial refund for this payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Payment: {selectedPayment.reference}</p>
                <p className="text-sm text-muted-foreground">
                  Amount: {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </p>
              </div>
            )}
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
              <Label htmlFor="refund-reason">Refund Reason *</Label>
              <Textarea
                id="refund-reason"
                placeholder="Enter reason for refund"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={refundProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleRefundSubmit} disabled={refundProcessing}>
              {refundProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Process Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
