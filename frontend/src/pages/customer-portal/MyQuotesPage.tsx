import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '@/services/api/customerPortalApi';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
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
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '@/utils/currency';
import type { ColumnDef } from '@tanstack/react-table';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'countered', label: 'Countered' },
  { value: 'expired', label: 'Expired' },
];

// Status badge styling helper
const getStatusVariant = (status: string): string => {
  const variants: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    viewed: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    countered: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return variants[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    accepted: 'Accepted',
    rejected: 'Rejected',
    countered: 'Countered',
    expired: 'Expired',
    pending_approval: 'Pending Approval',
  };
  return labels[status] || status;
};

export default function MyQuotesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, customer } = useCustomerAuth();
  
  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: quotes, isLoading, error, refetch } = useQuery({
    queryKey: ['my-quotes'],
    queryFn: async () => {
      const response = await customerPortalApi.getMyQuotes();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    refetch();
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
   * Filter quotes based on search and status
   */
  const filteredQuotes = useMemo(() => {
    if (!quotes?.data) return [];
    
    let filtered = quotes.data;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((q: any) => q.status === statusFilter);
    }
    
    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((q: any) => 
        q.quote_number?.toLowerCase().includes(searchLower) ||
        q.title?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [quotes, statusFilter, search]);

  /**
   * Calculate stats from quotes
   */
  const stats = useMemo(() => {
    if (!quotes?.data) return { total: 0, pending: 0, accepted: 0, rejected: 0 };
    
    return {
      total: quotes.data.length,
      pending: quotes.data.filter((q: any) => q.status === 'sent' || q.status === 'viewed').length,
      accepted: quotes.data.filter((q: any) => q.status === 'accepted').length,
      rejected: quotes.data.filter((q: any) => q.status === 'rejected').length,
    };
  }, [quotes]);

  /**
   * Table columns definition
   */
  const columns: ColumnDef<any>[] = useMemo(() => [
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
            onClick={() => navigate(`/customer/quotes/${quote.uuid}`)}
          >
            {quote.quote_number}
          </Button>
        );
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <div>
            <div className="font-medium">{quote.title || '-'}</div>
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
        const status = row.getValue('status') as string;
        return (
          <Badge className={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'pricing.grand_total',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const quote = row.original;
        const grandTotal = quote.pricing?.grand_total || 0;
        const currency = quote.pricing?.currency || 'IDR';
        return (
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(grandTotal, currency)}
          </div>
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
      accessorKey: 'valid_until',
      header: 'Expires',
      cell: ({ row }) => {
        const validUntil = row.getValue('valid_until') as string | null;
        if (!validUntil) return '-';
        
        const isExpired = new Date(validUntil) < new Date();
        return (
          <div className={cn("text-sm flex items-center gap-1", isExpired && "text-red-600")}>
            <Clock className="w-4 h-4" />
            {formatDistanceToNow(new Date(validUntil), { addSuffix: true })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/customer/quotes/${quote.uuid}`)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        );
      },
    },
  ], [navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-12 text-center">
          <p className="text-lg mb-4">Please login to view your quotes</p>
          <Button onClick={() => navigate('/customer/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">My Quotes</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Welcome back, {customer?.name}
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
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 md:mr-2", isLoading && "animate-spin")} />
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
                disabled={isLoading || filteredQuotes.length === 0}
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
        <Card className={cn(isLoading && "animate-pulse")}>
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
              All your quotes
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isLoading && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
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

        <Card className={cn(isLoading && "animate-pulse")}>
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

        <Card className={cn(isLoading && "animate-pulse")}>
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
                placeholder="Search by quote number or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
            <p className="text-muted-foreground mb-4">{(error as any).message}</p>
            <Button onClick={() => refetch()} variant="outline">
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
              data={filteredQuotes}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredQuotes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'New quotes will appear here when they are sent to you'}
            </p>
            {(search || statusFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
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
