import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, Download, CheckCircle, XCircle, Clock, MoreHorizontal, RotateCcw, Ban, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';
import PaymentVerificationModal from '@/components/admin/PaymentVerificationModal';

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

interface Stats {
  total_verified: number;
  total_rejected: number;
  total_amount_verified: number;
  total_amount_rejected: number;
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPaymentUuid, setSelectedPaymentUuid] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refund dialog state
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundPaymentUuid, setRefundPaymentUuid] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
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
        setPayments(response.data);
        setTotalPages(response.meta?.last_page || 1);
        setTotalRecords(response.meta?.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to load payment history:', error);
      toast.error(error.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await tenantApiClient.get('/admin/payment-history/stats') as any;

      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load stats:', error);
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
    setShowRefundDialog(true);
  };

  const handleRefundSubmit = async () => {
    if (!refundPaymentUuid || !refundReason) {
      toast.error('Please provide refund reason');
      return;
    }

    try {
      setRefundProcessing(true);
      const response = await tenantApiClient.post(
        `/admin/payment-verification/${refundPaymentUuid}/refund`,
        {
          amount: parseFloat(refundAmount) * 100, // Convert to cents
          reason: refundReason,
          refund_method: 'original',
        }
      ) as any;

      if (response && response.success) {
        toast.success('Payment refunded successfully');
        setShowRefundDialog(false);
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">View all payment verification history</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Verified</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.total_verified}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(stats.total_amount_verified, 'IDR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Rejected</CardDescription>
              <CardTitle className="text-2xl text-red-600">{stats.total_rejected}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(stats.total_amount_rejected, 'IDR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
              <CardTitle className="text-2xl">
                {stats.total_verified + stats.total_rejected > 0
                  ? Math.round((stats.total_verified / (stats.total_verified + stats.total_rejected)) * 100)
                  : 0}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Verification success rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Records</CardDescription>
              <CardTitle className="text-2xl">{totalRecords}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">All payment records</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, customer name, or quote number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Verified</SelectItem>
                <SelectItem value="failed">Rejected</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            Showing {payments.length} of {totalRecords} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading payment history...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payment records found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Verified By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.uuid}>
                      <TableCell className="font-medium">{payment.reference}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.customer.name}</p>
                          {payment.customer.email && (
                            <p className="text-xs text-muted-foreground">{payment.customer.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{payment.quote_number || '-'}</TableCell>
                      <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-sm">{formatDate(payment.submitted_at)}</TableCell>
                      <TableCell className="text-sm">
                        {payment.verified_at ? formatDate(payment.verified_at) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{payment.verified_by_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(payment.uuid)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {payment.status === 'completed' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleRefund(payment)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Refund Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendReceipt(payment)}>
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Send Receipt
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Modal */}
      {selectedPaymentUuid && (
        <PaymentVerificationModal
          paymentUuid={selectedPaymentUuid}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPaymentUuid(null);
          }}
          onVerificationComplete={() => {
            setIsModalOpen(false);
            setSelectedPaymentUuid(null);
            loadPayments();
            loadStats();
          }}
        />
      )}

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
            <DialogDescription>
              Process a refund for this payment. Enter the amount and reason for the refund.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to refund full amount
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Refund Reason</Label>
              <Textarea
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter reason for refund..."
                rows={4}
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
            <Button
              onClick={handleRefundSubmit}
              disabled={refundProcessing || !refundReason}
            >
              {refundProcessing ? 'Processing...' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Receipt</DialogTitle>
            <DialogDescription>
              Send a payment receipt to the customer via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="receipt-email">Email Address</Label>
              <Input
                id="receipt-email"
                type="email"
                value={receiptEmail}
                onChange={(e) => setReceiptEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-proof"
                checked={includeProof}
                onChange={(e) => setIncludeProof(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="include-proof" className="cursor-pointer">
                Include payment proof attachment
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReceiptDialog(false)}
              disabled={receiptProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReceiptSubmit}
              disabled={receiptProcessing || !receiptEmail}
            >
              {receiptProcessing ? 'Sending...' : 'Send Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
