import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  Trash2,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Quote, QuoteListParams } from '@/services/tenant/quoteService';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { quoteService } from '@/services/tenant/quoteService';
import { useQueryClient } from '@tanstack/react-query';

interface QuoteTableProps {
  quotes: Quote[];
  loading: boolean;
  onSort: (sortBy: QuoteListParams['sort_by']) => void;
  currentSort: {
    sortBy?: QuoteListParams['sort_by'];
    sortOrder?: 'asc' | 'desc';
  };
  compactView?: boolean;
}

const statusConfig = {
  draft: { 
    label: 'Draft', 
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', 
    icon: FileText 
  },
  open: { 
    label: 'Open', 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', 
    icon: FileText 
  },
  sent: { 
    label: 'Sent', 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', 
    icon: Send 
  },
  countered: { 
    label: 'Countered', 
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', 
    icon: RefreshCw 
  },
  accepted: { 
    label: 'Accepted', 
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', 
    icon: CheckCircle 
  },
  rejected: { 
    label: 'Rejected', 
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', 
    icon: XCircle 
  },
  cancelled: { 
    label: 'Cancelled', 
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', 
    icon: XCircle 
  },
  expired: { 
    label: 'Expired', 
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', 
    icon: Clock 
  },
};

export const QuoteTable = ({ 
  quotes, 
  loading, 
  onSort, 
  currentSort,
  compactView = false 
}: QuoteTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const [sendingQuoteId, setSendingQuoteId] = useState<string | null>(null);

  const getSortIcon = (column: QuoteListParams['sort_by']) => {
    if (currentSort.sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    }
    return currentSort.sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 inline" />
      : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  const getStatusBadge = (status: Quote['status']) => {
    const config = statusConfig[status] || {
      label: status || 'Unknown',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      icon: FileText
    };
    const Icon = config.icon;
    
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleSendQuote = async (quoteId: string) => {
    setSendingQuoteId(quoteId);
    try {
      await quoteService.sendQuote(quoteId);
      toast({
        title: 'Success',
        description: 'Quote sent successfully',
      });
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send quote',
        variant: 'destructive',
      });
    } finally {
      setSendingQuoteId(null);
    }
  };

  const handleDeleteQuote = async () => {
    if (!deleteQuoteId) return;
    
    try {
      await quoteService.deleteQuote(deleteQuoteId);
      toast({
        title: 'Success',
        description: 'Quote deleted successfully',
      });
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete quote',
        variant: 'destructive',
      });
    } finally {
      setDeleteQuoteId(null);
    }
  };

  const handleDownloadPDF = async (quoteId: string) => {
    try {
      const blob = await quoteService.generatePDF(quoteId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'Quote PDF downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <div className="animate-pulse h-4 bg-muted rounded"></div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No quotes found</p>
            <p className="text-sm mb-4">Try adjusting your filters or create a new quote</p>
            <Button asChild variant="outline">
              <Link to="/admin/quotes/new">Create your first quote</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort('quote_number')}
                  >
                    Quote # {getSortIcon('quote_number')}
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort('total_amount')}
                  >
                    Total {getSortIcon('total_amount')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort('valid_until')}
                  >
                    Valid Until {getSortIcon('valid_until')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort('created_at')}
                  >
                    Created {getSortIcon('created_at')}
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
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
                        {format(new Date(quote.valid_until), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(quote.created_at), 'MMM dd, yyyy')}
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
                            <DropdownMenuItem 
                              onClick={() => handleSendQuote(quote.id)}
                              disabled={sendingQuoteId === quote.id}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {sendingQuoteId === quote.id ? 'Sending...' : 'Send Quote'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDownloadPDF(quote.id)}>
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
                ))}
              </TableBody>
            </Table>
          </div>
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
            <AlertDialogAction 
              onClick={handleDeleteQuote} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
