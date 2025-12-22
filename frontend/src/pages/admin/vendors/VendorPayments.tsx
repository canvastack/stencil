import { useState, useEffect } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Building,
  Calendar,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Send,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast-config';
import { ColumnDef } from '@tanstack/react-table';
import { useVendorPayments } from '@/hooks/useVendors';

export default function VendorPayments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);


  const {
    payments,
    paymentStats,
    isLoading,
    error,
    fetchPayments,
    processPayment,
  } = useVendorPayments();

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'scheduled': return 'outline';
      case 'processing': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'processing': return <CreditCard className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setIsDetailModalOpen(true);
  };

  const handleProcessPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsPayModalOpen(true);
  };

  const handleMarkAsPaid = (paymentId: string) => {
    setPayments(prevPayments => 
      prevPayments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'paid', paidDate: new Date().toISOString() }
          : payment
      )
    );
    toast.success('Payment marked as paid');
    setIsPayModalOpen(false);
  };

  const handleRefresh = () => {
    fetchPayments();
    toast.success('Data pembayaran berhasil disegarkan');
  };

  const handleDownloadInvoice = (payment: any) => {
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${payment.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .header h1 { margin: 0; color: #333; }
    .invoice-info { margin-bottom: 30px; }
    .invoice-info table { width: 100%; border-collapse: collapse; }
    .invoice-info td { padding: 8px; border-bottom: 1px solid #eee; }
    .invoice-info td:first-child { font-weight: bold; width: 200px; }
    .amount-section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .amount-section .total { font-size: 24px; font-weight: bold; color: #2563eb; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
    .status.paid { background: #22c55e; color: white; }
    .status.pending { background: #f59e0b; color: white; }
    .status.overdue { background: #ef4444; color: white; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Invoice Number: ${payment.invoiceNumber}</p>
  </div>
  
  <div class="invoice-info">
    <table>
      <tr><td>Order ID:</td><td>${payment.orderId || 'N/A'}</td></tr>
      <tr><td>Vendor:</td><td>${payment.vendorName}</td></tr>
      <tr><td>Invoice Date:</td><td>${new Date().toLocaleDateString('id-ID')}</td></tr>
      <tr><td>Due Date:</td><td>${new Date(payment.dueDate).toLocaleDateString('id-ID')}</td></tr>
      <tr><td>Status:</td><td><span class="status ${payment.status}">${payment.status.toUpperCase()}</span></td></tr>
      <tr><td>Payment Method:</td><td>${payment.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}</td></tr>
    </table>
  </div>
  
  <div class="amount-section">
    <table style="width: 100%;">
      <tr><td>Subtotal:</td><td style="text-align: right;">${formatCurrency(payment.amount || 0)}</td></tr>
      <tr><td>Tax:</td><td style="text-align: right;">${formatCurrency(payment.taxAmount || 0)}</td></tr>
      <tr><td colspan="2" style="border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;"></td></tr>
      <tr><td class="total">TOTAL:</td><td class="total" style="text-align: right;">${formatCurrency(payment.totalAmount || payment.amount || 0)}</td></tr>
    </table>
  </div>
  
  ${payment.description ? `<div><strong>Description:</strong><br>${payment.description}</div>` : ''}
  
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Generated on ${new Date().toLocaleString('id-ID')}</p>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `.trim();

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      toast.success(`Invoice ${payment.invoiceNumber} opened for download`);
    } else {
      toast.error('Please allow popups to download invoice');
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false;
    if (vendorFilter !== 'all' && payment.vendorId !== vendorFilter) return false;
    if (searchTerm && !(
      payment.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase())
    )) return false;
    return true;
  });

  // Use stats from hook instead of calculating locally
  const { totalPending, totalPaid, totalOverdue } = paymentStats;
  const totalScheduled = filteredPayments.filter(p => p.status === 'scheduled').reduce((sum, p) => sum + (p.totalAmount || p.amount || 0), 0);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.invoiceNumber}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.orderId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="font-medium">{row.original.vendorName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{formatCurrency(row.original.totalAmount)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Base: {formatCurrency(row.original.amount)} + Tax: {formatCurrency(row.original.taxAmount)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = new Date(row.original.dueDate);
        const isOverdue = row.original.status === 'overdue';
        return (
          <div className={cn(
            "text-sm",
            isOverdue && "text-red-600 font-medium"
          )}>
            {dueDate.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)} className="flex items-center gap-1 w-fit">
          {getStatusIcon(row.original.status)}
          {row.original.status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {row.original.status !== 'paid' && (
              <DropdownMenuItem onClick={() => handleProcessPayment(row.original)}>
                <Send className="w-4 h-4 mr-2" />
                Process Payment
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleDownloadInvoice(row.original)}>
              <Receipt className="w-4 h-4 mr-2" />
              Download Invoice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const uniqueVendors = Array.from(
    new Map(payments.map(p => [p.vendorId, { id: p.vendorId, name: p.vendorName }])).values()
  );

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vendor Payments</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage vendor payment obligations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload Receipts
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalPending)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredPayments.filter(p => p.status === 'pending').length} invoices
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Payments</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredPayments.filter(p => p.status === 'overdue').length} invoices
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid This Month</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredPayments.filter(p => p.status === 'paid').length} payments
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalScheduled)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredPayments.filter(p => p.status === 'scheduled').length} payments
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card hover={false}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {uniqueVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setVendorFilter('all');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Track all vendor payments and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredPayments}
              searchPlaceholder="Search payments..."
              enableSorting
              enableFiltering
            />
          </CardContent>
        </Card>

        {/* Payment Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Complete information for payment invoice
              </DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Invoice Number</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPayment.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPayment.orderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPayment.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Vendor</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPayment.vendorName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Bank Account</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPayment.bankAccount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{selectedPayment.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Payment Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Base Amount</span>
                      <span className="text-gray-900 dark:text-gray-100">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                      <span className="text-gray-900 dark:text-gray-100">{formatCurrency(selectedPayment.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span className="text-gray-900 dark:text-gray-100">Total Amount</span>
                      <span className="text-gray-900 dark:text-gray-100">{formatCurrency(selectedPayment.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Payment Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created Date</span>
                      <span className="text-gray-900 dark:text-gray-100">{new Date(selectedPayment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Due Date</span>
                      <span className="text-gray-900 dark:text-gray-100">{new Date(selectedPayment.dueDate).toLocaleDateString()}</span>
                    </div>
                    {selectedPayment.paidDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Paid Date</span>
                        <span className="text-green-600 font-medium">
                          {new Date(selectedPayment.paidDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPayment.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              {selectedPayment?.status !== 'paid' && (
                <Button onClick={() => {
                  setIsDetailModalOpen(false);
                  handleProcessPayment(selectedPayment);
                }}>
                  <Send className="w-4 h-4 mr-2" />
                  Process Payment
                </Button>
              )}
              <Button variant="outline" onClick={() => selectedPayment && handleDownloadInvoice(selectedPayment)}>
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Process Payment Modal */}
        <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
              <DialogDescription>
                Confirm payment processing for {selectedPayment?.vendorName}
              </DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Payment Amount</span>
                    <span className="text-2xl font-bold">{formatCurrency(selectedPayment.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>To: {selectedPayment.vendorName}</span>
                    <span>Account: {selectedPayment.bankAccount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Invoice</p>
                    <p className="font-medium">{selectedPayment.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{selectedPayment.description}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleMarkAsPaid(selectedPayment?.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LazyWrapper>
  );
}