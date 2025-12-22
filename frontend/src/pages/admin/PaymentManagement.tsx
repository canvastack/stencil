import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentsService, PaymentFilters } from '@/services/api/payments';
import type { Payment, PaymentRefund, PaymentSummary } from '@/types/payment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CreditCard,
  DollarSign,
  Plus,
  Search,
  Filter,
  X,
  MoreHorizontal,
  Eye,
  Edit,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';

const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'order_number',
    header: 'Order',
    cell: ({ row }) => (
      <Link 
        to={`/admin/orders/${row.original.order_id}`}
        className="font-mono text-blue-600 hover:text-blue-800"
      >
        {row.getValue('order_number') || 'N/A'}
      </Link>
    ),
  },
  {
    accessorKey: 'customer_name',
    header: 'Customer',
    cell: ({ row }) => {
      const name = row.getValue('customer_name') as string;
      return <span className="font-medium">{name || 'Unknown'}</span>;
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = row.getValue('amount') as number;
      return <span className="font-semibold">{formatCurrency(amount)}</span>;
    },
  },
  {
    accessorKey: 'payment_method',
    header: 'Method',
    cell: ({ row }) => {
      const method = row.getValue('payment_method') as string;
      const methodLabels = {
        credit_card: 'Credit Card',
        bank_transfer: 'Bank Transfer',
        cash: 'Cash',
        ewallet: 'E-Wallet',
        other: 'Other',
      };
      return (
        <Badge variant="outline">
          {methodLabels[method as keyof typeof methodLabels] || method}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variants = {
        pending: 'secondary',
        completed: 'default',
        failed: 'destructive',
        refunded: 'outline',
        cancelled: 'destructive',
      };
      
      return (
        <Badge variant={variants[status as keyof typeof variants] as any}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at') as string);
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
];

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<PaymentRefund[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: '',
    payment_method: '',
    date_from: '',
    date_to: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const [newPaymentData, setNewPaymentData] = useState({
    order_id: '',
    amount: 0,
    payment_method: '',
    transaction_id: '',
    reference_number: '',
    notes: '',
  });

  const [refundData, setRefundData] = useState({
    amount: 0,
    reason: '',
    refund_method: 'original',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchSummary();
    fetchRefunds();
  }, []);

  const fetchPayments = async (customFilters?: PaymentFilters) => {
    try {
      setLoading(true);
      const filtersToUse = customFilters || filters;
      
      // Use mock data for now - replace with real API when backend is ready
      const response = await paymentsService.getMockPayments({
        ...filtersToUse,
        per_page: 50,
      });
      
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      // Mock summary data - replace with real API
      const mockSummary: PaymentSummary = {
        total_payments: 45,
        total_amount: 12500000,
        pending_amount: 1800000,
        completed_amount: 10200000,
        refunded_amount: 500000,
        today_payments: 8,
        today_amount: 2100000,
      };
      setSummary(mockSummary);
    } catch (error) {
      console.error('Failed to fetch payment summary:', error);
    }
  };

  const fetchRefunds = async () => {
    try {
      // Mock refund data - replace with real API
      setRefunds([]);
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    }
  };

  const handleApplyFilters = () => {
    fetchPayments(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      payment_method: '',
      date_from: '',
      date_to: '',
    };
    setFilters(clearedFilters);
    fetchPayments(clearedFilters);
  };

  const handleCreatePayment = async () => {
    if (!newPaymentData.order_id || !newPaymentData.amount || !newPaymentData.payment_method) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      // Mock creation - replace with real API
      toast.success('Payment recorded successfully');
      setIsCreateDialogOpen(false);
      setNewPaymentData({
        order_id: '',
        amount: 0,
        payment_method: '',
        transaction_id: '',
        reference_number: '',
        notes: '',
      });
      fetchPayments();
    } catch (error) {
      console.error('Failed to create payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefundPayment = async () => {
    if (!selectedPayment || !refundData.amount || !refundData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      // Mock refund - replace with real API
      toast.success('Refund request created successfully');
      setIsRefundDialogOpen(false);
      setSelectedPayment(null);
      setRefundData({
        amount: 0,
        reason: '',
        refund_method: 'original',
        notes: '',
      });
      fetchPayments();
      fetchRefunds();
    } catch (error) {
      console.error('Failed to create refund:', error);
      toast.error('Failed to create refund request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;

    try {
      setIsSaving(true);
      // Mock deletion - replace with real API
      setPayments(payments.filter(p => p.id !== paymentToDelete));
      toast.success('Payment deleted successfully');
      setIsDeleteDialogOpen(false);
      setPaymentToDelete(null);
    } catch (error) {
      console.error('Failed to delete payment:', error);
      toast.error('Failed to delete payment');
    } finally {
      setIsSaving(false);
    }
  };

  const actionColumns: ColumnDef<Payment>[] = [
    ...paymentColumns,
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/admin/payments/${payment.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/payments/${payment.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {payment.status === 'completed' && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedPayment(payment);
                    setRefundData({ ...refundData, amount: payment.amount });
                    setIsRefundDialogOpen(true);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Refund
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeletePayment(payment.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">
            Manage payments, refunds and transaction records
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{summary.total_payments}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(summary.total_amount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.completed_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(summary.pending_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{summary.today_payments}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(summary.today_amount)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments Table */}
      <Card className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search by order, customer, or reference..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="max-w-sm"
            />
          </div>
          <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.payment_method || 'all'} onValueChange={(value) => setFilters({ ...filters, payment_method: value === 'all' ? '' : value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="ewallet">E-Wallet</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleApplyFilters} disabled={loading}>
            Apply
          </Button>
          {(filters.search || filters.status || filters.payment_method) && (
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading payments...</span>
          </div>
        ) : (
          <DataTable
            columns={actionColumns}
            data={payments}
            searchPlaceholder="Search payments..."
            searchKey="order_number"
          />
        )}
      </Card>

      {/* Create Payment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
            <DialogDescription>
              Record a payment received for an order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order ID *</Label>
              <Input
                value={newPaymentData.order_id}
                onChange={(e) => setNewPaymentData({ ...newPaymentData, order_id: e.target.value })}
                placeholder="Enter order ID"
              />
            </div>
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                value={newPaymentData.amount}
                onChange={(e) => setNewPaymentData({ ...newPaymentData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Payment Method *</Label>
              <Select value={newPaymentData.payment_method} onValueChange={(value) => setNewPaymentData({ ...newPaymentData, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transaction ID</Label>
              <Input
                value={newPaymentData.transaction_id}
                onChange={(e) => setNewPaymentData({ ...newPaymentData, transaction_id: e.target.value })}
                placeholder="Optional transaction ID"
              />
            </div>
            <div>
              <Label>Reference Number</Label>
              <Input
                value={newPaymentData.reference_number}
                onChange={(e) => setNewPaymentData({ ...newPaymentData, reference_number: e.target.value })}
                placeholder="Optional reference"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newPaymentData.notes}
                onChange={(e) => setNewPaymentData({ ...newPaymentData, notes: e.target.value })}
                placeholder="Optional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayment} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Refund</DialogTitle>
            <DialogDescription>
              Process a refund for payment {selectedPayment?.reference_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Refund Amount *</Label>
              <Input
                type="number"
                value={refundData.amount}
                onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) || 0 })}
                max={selectedPayment?.amount}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Max: {selectedPayment ? formatCurrency(selectedPayment.amount) : ''}
              </p>
            </div>
            <div>
              <Label>Reason *</Label>
              <Input
                value={refundData.reason}
                onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                placeholder="Reason for refund"
              />
            </div>
            <div>
              <Label>Refund Method</Label>
              <Select value={refundData.refund_method} onValueChange={(value) => setRefundData({ ...refundData, refund_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original Payment Method</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="store_credit">Store Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={refundData.notes}
                onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
                placeholder="Optional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleRefundPayment} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Payment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this payment record? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}