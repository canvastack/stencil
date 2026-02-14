/**
 * VendorQuoteList Page
 * 
 * Displays paginated list of quotes with filtering and search.
 * Modern design matching admin OrderManagement page.
 * 
 * Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import vendorApi from '@/services/api/vendorApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  DataTable,
  Input,
} from '@/components/ui/lazy-components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  RefreshCw,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Download,
  FileSpreadsheet,
  FileJson,
  ArrowUpDown,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import type { VendorQuote, VendorQuoteFilters, QuoteStatus } from '@/types/vendor/portal';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending_response', label: 'Pending Response' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'countered', label: 'Countered' },
  { value: 'expired', label: 'Expired' },
  { value: 'draft', label: 'Draft' },
];

// Status badge styling helper
const getStatusVariant = (status: QuoteStatus): string => {
  const variants: Record<QuoteStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    pending_response: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    countered: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };
  return variants[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: QuoteStatus): string => {
  const labels: Record<QuoteStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    pending_response: 'Pending Response',
    accepted: 'Accepted',
    rejected: 'Rejected',
    countered: 'Countered',
    expired: 'Expired',
  };
  return labels[status] || status;
};

export default function VendorQuoteList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  
  // Pagination state
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [statistics, setStatistics] = useState({
    total_quotes: 0,
    pending_quotes: 0,
    accepted_quotes: 0,
    rejected_quotes: 0,
  });

  /**
   * Fetch quotes with current filters
   */
  const fetchQuotes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Build filters
      const filters: VendorQuoteFilters = {
        page,
        per_page: perPage,
        sort: 'created_at',
        order: 'desc',
      };

      if (status !== 'all') {
        filters.status = status as QuoteStatus;
      }

      if (search.trim()) {
        filters.search = search.trim();
      }

      const response = await vendorApi.getQuotes(filters);

      if (response.success) {
        setQuotes(response.data.quotes);
        setTotalQuotes(response.data.pagination.total);
        setTotalPages(response.data.pagination.last_page);
        
        // Update statistics if available
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch quotes:', err);
      setError(err.message || 'Failed to load quotes');
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, perPage, status, search]);

  /**
   * Update URL params when filters change
   */
  useEffect(() => {
    const params: Record<string, string> = {};
    
    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    if (page !== 1) params.page = page.toString();
    
    setSearchParams(params);
  }, [search, status, page, setSearchParams]);

  /**
   * Fetch quotes when filters change
   */
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    fetchQuotes(true);
    toast.success('Quotes refreshed');
  };

  /**
   * Handle export
   */
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    toast.info(`Exporting quotes as ${format.toUpperCase()}...`);
    // TODO: Implement export functionality
  };

  /**
   * Table columns definition
   */
  const columns: ColumnDef<VendorQuote>[] = useMemo(() => [
    {
      accessorKey: 'quote_number',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Quote Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
            onClick={() => navigate(`/vendor/quotes/${quote.uuid}`)}
          >
            {quote.quote_number}
          </Button>
        );
      },
    },
    {
      accessorKey: 'order',
      header: 'Order Number',
      cell: ({ row }) => {
        const quote = row.original;
        return quote.order?.order_number || '-';
      },
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <div>
            <div className="font-medium">{quote.order?.customer_name || '-'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as QuoteStatus;
        return (
          <Badge className={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue('created_at') as string;
        return (
          <div className="text-sm">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </div>
        );
      },
    },
    {
      accessorKey: 'expires_at',
      header: 'Expires',
      cell: ({ row }) => {
        const expiresAt = row.getValue('expires_at') as string | null;
        if (!expiresAt) return '-';
        
        const isExpired = new Date(expiresAt) < new Date();
        return (
          <div className={cn("text-sm", isExpired && "text-red-600")}>
            {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
          </div>
        );
      },
    },
    {
      accessorKey: 'unread_message_count',
      header: 'Messages',
      cell: ({ row }) => {
        const count = row.getValue('unread_message_count') as number;
        if (count === 0) return '-';
        
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <MessageSquare className="w-3 h-3 mr-1" />
            {count}
          </Badge>
        );
      },
    },
  ], [navigate]);

  /**
   * Calculate stats from quotes
   */
  const stats = useMemo(() => {
    return {
      total: statistics.total_quotes || quotes.length,
      pending: statistics.pending_quotes || quotes.filter(q => q.status === 'pending_response').length,
      accepted: statistics.accepted_quotes || quotes.filter(q => q.status === 'accepted').length,
      rejected: statistics.rejected_quotes || quotes.filter(q => q.status === 'rejected').length,
    };
  }, [quotes, statistics]);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Quotes</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage and respond to quote requests
          </p>
        </div>
      </div>

      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh} 
            disabled={loading || refreshing}
          >
            <RefreshCw className={cn("w-4 h-4 md:mr-2", (loading || refreshing) && "animate-spin")} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          
          {/* Live Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="hidden md:inline text-xs text-gray-600 dark:text-gray-400">Live</span>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                disabled={loading || quotes.length === 0}
              >
                <Download className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards - 4 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn(refreshing && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quotes
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground mt-2">
              All quotes assigned
            </p>
          </CardContent>
        </Card>

        <Card className={cn(refreshing && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Response
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Awaiting your response
            </p>
          </CardContent>
        </Card>

        <Card className={cn(refreshing && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.accepted}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Quotes accepted
            </p>
          </CardContent>
        </Card>

        <Card className={cn(refreshing && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.rejected}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Quotes declined
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by quote number, order number, or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error Loading Quotes</h3>
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchQuotes()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {!error && (
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={columns}
              data={quotes}
              loading={loading}
              pagination={{
                pageIndex: page - 1,
                pageSize: perPage,
              }}
              pageCount={totalPages}
              onPaginationChange={(updater) => {
                if (typeof updater === 'function') {
                  const newState = updater({ pageIndex: page - 1, pageSize: perPage });
                  setPage(newState.pageIndex + 1);
                }
              }}
              manualPagination
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && quotes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'New quotes will appear here when they are assigned to you'}
            </p>
            {(search || status !== 'all') && (
              <Button
                onClick={() => {
                  setSearch('');
                  setStatus('all');
                  setPage(1);
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
