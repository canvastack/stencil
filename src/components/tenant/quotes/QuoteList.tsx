import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuoteStore } from '@/stores/quoteStore';
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
} from 'lucide-react';
import { Quote } from '@/services/tenant/quoteService';
import { formatCurrency } from '@/utils/currency';

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: FileText },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Send },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
  revised: { label: 'Revised', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: RefreshCw },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
};

interface QuoteListProps {
  showHeader?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
  compactView?: boolean;
}

export const QuoteList = ({ 
  showHeader = true, 
  showFilters = true, 
  showActions = true,
  compactView = false 
}: QuoteListProps) => {
  const { toast } = useToast();
  
  const {
    quotes,
    quotesLoading: loading,
    error,
    filters,
    currentPage,
    totalPages,
    totalCount,
    perPage,
    selectedQuoteIds: selectedIds,
    fetchQuotes,
    setFilters,
    selectQuote,
    selectAllQuotes,
    clearSelection,
    deleteQuote,
    sendQuote,
    bulkUpdateQuotes,
    setError: clearError,
  } = useQuoteStore();
  
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState<Quote['status'] | 'all'>(filters.status || 'all');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);

  const pagination = {
    currentPage,
    totalPages,
    totalCount,
    perPage,
  };

  // Load quotes on component mount and filter changes
  useEffect(() => {
    fetchQuotes(filters);
  }, [fetchQuotes, filters]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ ...filters, search: searchTerm, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, setFilters]);

  const handleStatusFilter = (status: Quote['status'] | 'all') => {
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

  const handleSelectQuote = (quoteId: string) => {
    selectQuote(quoteId);
  };

  const handleSelectAll = () => {
    selectAllQuotes();
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  const handleSendQuote = async (quoteId: string) => {
    try {
      await sendQuote(quoteId);
      toast({
        title: 'Success',
        description: 'Quote sent successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send quote',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteQuote = async () => {
    if (!deleteQuoteId) return;
    
    try {
      await deleteQuote(deleteQuoteId);
      toast({
        title: 'Success',
        description: 'Quote deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete quote',
        variant: 'destructive',
      });
    } finally {
      setDeleteQuoteId(null);
    }
  };

  const handleBulkStatusUpdate = async (status: Quote['status']) => {
    try {
      await bulkUpdateQuotes(selectedIds, { status });
      toast({
        title: 'Success',
        description: `${selectedIds.length} quotes updated successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quotes',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: Quote['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const isAllSelected = selectedIds.length > 0 && selectedIds.length === quotes.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < quotes.length;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => clearError(null)} variant="outline">
              Try Again
            </Button>
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
            <h2 className="text-2xl font-bold">Quote Management</h2>
            <p className="text-muted-foreground">
              Manage vendor quotes and pricing negotiations
            </p>
          </div>
          {showActions && (
            <Button asChild>
              <Link to="/admin/quotes/new">
                <Plus className="w-4 h-4 mr-2" />
                New Quote
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedStatus} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} quotes selected
              </span>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Update Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('sent')}>
                      Mark as Sent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('accepted')}>
                      Mark as Accepted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('rejected')}>
                      Mark as Rejected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={handleClearSelection}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isPartiallySelected}
                      onCheckedChange={isAllSelected ? handleClearSelection : handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('quote_number')}
                  >
                    Quote #
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('grand_total')}
                  >
                    Total
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('valid_until')}
                  >
                    Valid Until
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    Created
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={10}>
                        <div className="animate-pulse h-4 bg-muted rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : quotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No quotes found</p>
                        {showActions && (
                          <Button asChild className="mt-4" variant="outline">
                            <Link to="/admin/quotes/new">Create your first quote</Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(quote.id)}
                          onCheckedChange={() => handleSelectQuote(quote.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link 
                          to={`/admin/quotes/${quote.id}`}
                          className="text-primary hover:underline"
                        >
                          {quote.quote_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quote.customer.name}</p>
                          {quote.customer.company && (
                            <p className="text-sm text-muted-foreground">{quote.customer.company}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quote.vendor.name}</p>
                          <p className="text-sm text-muted-foreground">{quote.vendor.company}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate" title={quote.title}>
                          {quote.title}
                        </p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(quote.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          {formatCurrency(quote.grand_total, quote.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(quote.valid_until).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/quotes/${quote.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/quotes/${quote.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {quote.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleSendQuote(quote.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Quote
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteQuoteId(quote.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.perPage, pagination.totalCount)} of{' '}
                  {pagination.totalCount} quotes
                </span>
                <Select 
                  value={pagination.perPage.toString()} 
                  onValueChange={(value) => handlePerPageChange(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || loading}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = Math.max(1, pagination.currentPage - 2) + i;
                    if (page > pagination.totalPages) return null;
                    
                    return (
                      <Button
                        key={page}
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuoteId} onOpenChange={() => setDeleteQuoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};