import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInvoiceStore } from '@/stores/invoiceStore';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Copy,
  Mail,
  FileX,
} from 'lucide-react';
import { Invoice } from '@/services/tenant/invoiceService';
import { formatCurrency } from '@/utils/currency';
import { format, isAfter } from 'date-fns';

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: FileText },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Send },
  partial_paid: { label: 'Partial Paid', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: CreditCard },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
  refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: RefreshCw },
};

interface InvoiceListProps {
  showHeader?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
  compactView?: boolean;
}

export const InvoiceList = ({ 
  showHeader = true, 
  showFilters = true, 
  showActions = true,
  compactView = false 
}: InvoiceListProps) => {
  const { toast } = useToast();
  
  const {
    invoices,
    invoicesLoading: loading,
    error,
    filters,
    currentPage,
    totalPages,
    totalCount,
    perPage,
    selectedInvoiceIds: selectedIds,
    fetchInvoices,
    setFilters,
    selectInvoice,
    selectAllInvoices,
    clearSelection,
    deleteInvoice,
    sendInvoice,
    markAsPaid,
    cancelInvoice,
    duplicateInvoice,
    sendReminder,
    bulkUpdateInvoices,
    bulkSendInvoices,
    setError: clearError,
  } = useInvoiceStore();
  
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState<Invoice['status'] | 'all'>(filters.status || 'all');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [reminderInvoiceId, setReminderInvoiceId] = useState<string | null>(null);
  const [reminderType, setReminderType] = useState<'gentle' | 'firm' | 'final'>('gentle');

  const pagination = {
    currentPage,
    totalPages,
    totalCount,
    perPage,
  };

  // Load invoices on component mount and filter changes
  useEffect(() => {
    fetchInvoices(filters);
  }, [fetchInvoices, filters]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ ...filters, search: searchTerm, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, setFilters]);

  const handleStatusFilter = (status: Invoice['status'] | 'all') => {
    setSelectedStatus(status);
    setFilters({ 
      ...filters, 
      status: status === 'all' ? undefined : status, 
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

  const handlePerPageChange = (perPageValue: number) => {
    setFilters({ ...filters, per_page: perPageValue, page: 1 });
  };

  const handleSelectInvoice = (invoiceId: string) => {
    selectInvoice(invoiceId);
  };

  const handleSelectAll = () => {
    selectAllInvoices();
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await sendInvoice(invoiceId);
      toast({
        title: 'Success',
        description: 'Invoice sent successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invoice',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await markAsPaid(invoiceId);
      toast({
        title: 'Success',
        description: 'Invoice marked as paid',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark invoice as paid',
        variant: 'destructive',
      });
    }
  };

  const handleCancelInvoice = async (invoiceId: string, reason?: string) => {
    try {
      await cancelInvoice(invoiceId, reason);
      toast({
        title: 'Success',
        description: 'Invoice cancelled successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel invoice',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateInvoice = async (invoiceId: string) => {
    try {
      await duplicateInvoice(invoiceId);
      toast({
        title: 'Success',
        description: 'Invoice duplicated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate invoice',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;
    
    try {
      await deleteInvoice(deleteInvoiceId);
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    } finally {
      setDeleteInvoiceId(null);
    }
  };

  const handleSendReminder = async () => {
    if (!reminderInvoiceId) return;
    
    try {
      await sendReminder(reminderInvoiceId, reminderType);
      toast({
        title: 'Success',
        description: 'Reminder sent successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reminder',
        variant: 'destructive',
      });
    } finally {
      setReminderInvoiceId(null);
    }
  };

  const handleBulkAction = async (action: 'send' | 'mark_paid' | 'cancel') => {
    if (selectedIds.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select invoices to perform bulk action',
        variant: 'destructive',
      });
      return;
    }

    try {
      switch (action) {
        case 'send':
          await bulkSendInvoices(selectedIds);
          toast({
            title: 'Success',
            description: `${selectedIds.length} invoice(s) sent successfully`,
          });
          break;
        case 'mark_paid':
          await bulkUpdateInvoices(selectedIds, { status: 'paid' });
          toast({
            title: 'Success',
            description: `${selectedIds.length} invoice(s) marked as paid`,
          });
          break;
        case 'cancel':
          await bulkUpdateInvoices(selectedIds, { status: 'cancelled' });
          toast({
            title: 'Success',
            description: `${selectedIds.length} invoice(s) cancelled`,
          });
          break;
      }
      clearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to perform bulk action`,
        variant: 'destructive',
      });
    }
  };

  const getInvoiceStatus = (invoice: Invoice): keyof typeof statusConfig => {
    // Check if invoice is overdue
    if (invoice.status === 'sent' && invoice.balance_due > 0) {
      const dueDate = new Date(invoice.due_date);
      const today = new Date();
      if (isAfter(today, dueDate)) {
        return 'overdue';
      }
    }
    
    return invoice.status;
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status !== 'sent') return false;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    return isAfter(today, dueDate) && invoice.balance_due > 0;
  };

  const renderInvoiceActions = (invoice: Invoice) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to={`/admin/invoices/${invoice.id}`} className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        {invoice.status === 'draft' && (
          <DropdownMenuItem asChild>
            <Link to={`/admin/invoices/${invoice.id}/edit`} className="flex items-center">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        {(invoice.status === 'draft' || invoice.status === 'sent') && (
          <DropdownMenuItem onClick={() => handleSendInvoice(invoice.id)}>
            <Send className="w-4 h-4 mr-2" />
            {invoice.status === 'draft' ? 'Send Invoice' : 'Resend Invoice'}
          </DropdownMenuItem>
        )}
        {(invoice.status === 'sent' || invoice.status === 'partial_paid') && (
          <>
            <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Paid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setReminderInvoiceId(invoice.id);
              setReminderType(isOverdue(invoice) ? 'firm' : 'gentle');
            }}>
              <Mail className="w-4 h-4 mr-2" />
              Send Reminder
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={() => handleDuplicateInvoice(invoice.id)}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {(invoice.status === 'draft' || invoice.status === 'sent') && (
          <DropdownMenuItem 
            onClick={() => handleCancelInvoice(invoice.id)}
            className="text-orange-600 dark:text-orange-400"
          >
            <FileX className="w-4 h-4 mr-2" />
            Cancel Invoice
          </DropdownMenuItem>
        )}
        {invoice.status === 'draft' && (
          <DropdownMenuItem 
            onClick={() => setDeleteInvoiceId(invoice.id)}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderFilters = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Select value={selectedStatus} onValueChange={handleStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.entries(statusConfig).map(([status, config]) => (
            <SelectItem key={status} value={status}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        variant="outline" 
        onClick={() => setShowFiltersPanel(!showFiltersPanel)}
        className="flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        More Filters
      </Button>
    </div>
  );

  const renderBulkActions = () => (
    selectedIds.length > 0 && (
      <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
        <span className="text-sm font-medium">
          {selectedIds.length} invoice(s) selected
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkAction('send')}
        >
          <Send className="w-4 h-4 mr-1" />
          Send
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkAction('mark_paid')}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Mark Paid
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkAction('cancel')}
        >
          <FileX className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClearSelection}
        >
          Clear Selection
        </Button>
      </div>
    )
  );

  const renderTable = () => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === invoices.length && invoices.length > 0}
                onCheckedChange={selectedIds.length === invoices.length ? handleClearSelection : handleSelectAll}
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => handleSort('invoice_number')}
            >
              Invoice #
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => handleSort('invoice_date')}
            >
              Date
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => handleSort('due_date')}
            >
              Due Date
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary text-right"
              onClick={() => handleSort('total_amount')}
            >
              Amount
            </TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="w-12">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const StatusIcon = statusConfig[getInvoiceStatus(invoice)].icon;
            return (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(invoice.id)}
                    onCheckedChange={() => handleSelectInvoice(invoice.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link 
                    to={`/admin/invoices/${invoice.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {invoice.invoice_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{invoice.customer_name}</div>
                    {invoice.customer_company && (
                      <div className="text-sm text-muted-foreground">{invoice.customer_company}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <div className={`${isOverdue(invoice) ? 'text-red-600 font-medium' : ''}`}>
                    {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    {isOverdue(invoice) && (
                      <AlertTriangle className="w-4 h-4 inline ml-1" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(invoice.total_amount, invoice.currency)}
                </TableCell>
                <TableCell className="text-right">
                  <div className={`font-medium ${invoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(invoice.balance_due, invoice.currency)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={statusConfig[getInvoiceStatus(invoice)].className}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[getInvoiceStatus(invoice)].label}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell>
                    {renderInvoiceActions(invoice)}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * perPage + 1, totalCount)} to{' '}
          {Math.min(currentPage * perPage, totalCount)} of {totalCount} entries
        </p>
        <Select
          value={perPage.toString()}
          onValueChange={(value) => handlePerPageChange(parseInt(value))}
        >
          <SelectTrigger className="h-8 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">per page</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
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
  );

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError(null);
  }, [clearError]);

  if (loading && invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Invoices...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">
              Manage and track your invoices and payments
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/invoices/new">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {showFilters && renderFilters()}
      {renderBulkActions()}
      
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices found</h3>
            <p className="text-muted-foreground mb-4">
              {filters.search || filters.status
                ? 'Try adjusting your filters to see more invoices'
                : 'Start by creating your first invoice'}
            </p>
            <Button asChild>
              <Link to="/admin/invoices/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {renderTable()}
          {renderPagination()}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Reminder Dialog */}
      <AlertDialog open={!!reminderInvoiceId} onOpenChange={() => setReminderInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Payment Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the type of reminder to send to the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={reminderType} onValueChange={(value: 'gentle' | 'firm' | 'final') => setReminderType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle">Gentle Reminder</SelectItem>
                <SelectItem value="firm">Firm Reminder</SelectItem>
                <SelectItem value="final">Final Notice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendReminder}>
              Send Reminder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};