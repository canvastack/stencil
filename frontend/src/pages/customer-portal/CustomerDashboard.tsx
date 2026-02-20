/**
 * Customer Dashboard Page
 * 
 * Main dashboard for customer portal showing:
 * - Welcome message with customer name
 * - Statistics cards (pending, accepted, total quotes, reviews)
 * - Performance metrics
 * - Recent quotes list with tabs
 * - Auto-refresh every 30 seconds
 * - Dark mode support
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '@/services/api/customerPortalApi';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { QuoteStatusBadge } from '@/components/customer-portal/QuoteStatusBadge';
import { NotificationBell } from '@/components/customer-portal/NotificationBell';
import { formatCurrency } from '@/utils/currency';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Loader2, 
  Eye, 
  FileText, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Auto-refresh interval (30 seconds)
const AUTO_REFRESH_INTERVAL = 30000;

export function CustomerDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, customer } = useCustomerAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch customer quotes with refetch function
  const { 
    data: quotes, 
    isLoading: quotesLoading,
    error: quotesError,
    refetch 
  } = useQuery({
    queryKey: ['my-quotes'],
    queryFn: async () => {
      const response = await customerPortalApi.getMyQuotes();
      setLastRefresh(new Date());
      return response.data;
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  /**
   * Manual refresh handler
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  /**
   * Auto-refresh every 30 seconds
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refetch();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, refetch]);

  /**
   * Render loading state with skeleton
   */
  if (quotesLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Welcome skeleton */}
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Statistics cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance metrics skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent quotes skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (quotesError) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Error Loading Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {quotesError instanceof Error ? quotesError.message : 'Failed to load dashboard data'}
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
      </div>
    );
  }

  const quotesList = quotes?.data || [];
  
  // Categorize quotes
  const pendingQuotes = quotesList.filter((q: any) => 
    ['sent', 'viewed', 'countered', 'pending_approval'].includes(q.status)
  );
  const acceptedQuotes = quotesList.filter((q: any) => q.status === 'accepted');
  const rejectedQuotes = quotesList.filter((q: any) => q.status === 'rejected');
  
  // Calculate statistics
  const totalQuotes = quotesList.length;
  const acceptanceRate = totalQuotes > 0 
    ? ((acceptedQuotes.length / totalQuotes) * 100).toFixed(1)
    : '0.0';
  const rejectionRate = totalQuotes > 0
    ? ((rejectedQuotes.length / totalQuotes) * 100).toFixed(1)
    : '0.0';
  
  // Get quotes this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const quotesThisMonth = quotesList.filter((q: any) => {
    const quoteDate = new Date(q.created_at);
    return quoteDate.getMonth() === currentMonth && quoteDate.getFullYear() === currentYear;
  }).length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {customer?.name || 'Customer'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your quotes, orders, and profile from your dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Quotes */}
          <Card className="hover:shadow-md transition-shadow border-orange-200 dark:border-orange-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Pending Quotes
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {pendingQuotes.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting your response
              </p>
            </CardContent>
          </Card>

          {/* Accepted Quotes */}
          <Card className="hover:shadow-md transition-shadow border-green-200 dark:border-green-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                Accepted
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {acceptedQuotes.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {acceptanceRate}% acceptance rate
              </p>
            </CardContent>
          </Card>

          {/* Total Quotes */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Quotes
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuotes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time quotes
              </p>
            </CardContent>
          </Card>

          {/* My Reviews */}
          <Link to="/customer/reviews">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-yellow-200 dark:border-yellow-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  My Reviews
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">View</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage product reviews
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Quote Statistics
            </CardTitle>
            <CardDescription>
              Overview of your quote activity and response rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {acceptanceRate}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Rejection Rate</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {rejectionRate}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quotes This Month</p>
                <p className="text-2xl font-bold">
                  {quotesThisMonth}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Recent Quotes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Quotes</CardTitle>
              <CardDescription>
                Your most recent quote requests
              </CardDescription>
            </div>
            <Link to="/customer/quotes">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending ({pendingQuotes.length})
                </TabsTrigger>
                <TabsTrigger value="accepted">
                  Accepted ({acceptedQuotes.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All ({quotesList.length})
                </TabsTrigger>
              </TabsList>

              {/* Pending Quotes Tab */}
              <TabsContent value="pending" className="space-y-4">
                {pendingQuotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending quotes</p>
                    <p className="text-sm mt-1">New quotes will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingQuotes.slice(0, 5).map((quote: any) => (
                      <QuoteCard key={quote.uuid} quote={quote} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Accepted Quotes Tab */}
              <TabsContent value="accepted" className="space-y-4">
                {acceptedQuotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No accepted quotes</p>
                    <p className="text-sm mt-1">Accepted quotes will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {acceptedQuotes.slice(0, 5).map((quote: any) => (
                      <QuoteCard key={quote.uuid} quote={quote} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* All Quotes Tab */}
              <TabsContent value="all" className="space-y-4">
                {quotesList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No quotes yet</p>
                    <p className="text-sm mt-1">New quotes will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotesList.slice(0, 5).map((quote: any) => (
                      <QuoteCard key={quote.uuid} quote={quote} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Last Refresh Info */}
        <div className="text-center text-xs text-muted-foreground">
          Last updated: {formatDistanceToNow(lastRefresh, { addSuffix: true })} • 
          Auto-refreshes every 30 seconds
        </div>
      </div>
  );
}

// Quote Card Component
function QuoteCard({ quote }: { quote: any }) {
  const navigate = useNavigate();
  
  /**
   * Get status badge variant
   */
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'expired':
        return 'destructive';
      case 'sent':
      case 'viewed':
      case 'pending_approval':
        return 'secondary';
      case 'countered':
        return 'outline';
      default:
        return 'outline';
    }
  };

  /**
   * Format status label
   */
  const formatStatus = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Check if quote is expired
   */
  const isExpired = quote.terms?.valid_until && new Date(quote.terms.valid_until) < new Date();

  return (
    <div
      onClick={() => navigate(`/customer/quotes/${quote.uuid}`)}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{quote.quote_number}</p>
          <Badge variant={getStatusBadgeVariant(quote.status)}>
            {formatStatus(quote.status)}
          </Badge>
          {isExpired && (
            <Badge variant="destructive">Expired</Badge>
          )}
        </div>
        {quote.title && (
          <p className="text-sm text-muted-foreground">{quote.title}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {quote.pricing?.grand_total && (
            <span className="font-medium text-foreground">
              {formatCurrency(quote.pricing.grand_total, quote.pricing.currency || 'IDR')}
            </span>
          )}
          {quote.sent_at && (
            <span>
              Sent: {formatDistanceToNow(new Date(quote.sent_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
      <div className="text-right space-y-1">
        {quote.terms?.valid_until && (
          <p className="text-sm text-muted-foreground">
            {isExpired ? 'Expired' : 'Expires'}: {formatDistanceToNow(new Date(quote.terms.valid_until), { addSuffix: true })}
          </p>
        )}
        <Button size="sm" variant="ghost">
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </div>
  );
}

// Default export for lazy loading
export default CustomerDashboard;
