/**
 * Vendor Dashboard Page
 * 
 * Main dashboard for vendor portal showing:
 * - Welcome message with vendor name
 * - Statistics cards (total, pending, accepted, rejected quotes)
 * - Recent quotes list
 * - Auto-refresh every 30 seconds
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.10
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorAuth } from '@/contexts/VendorAuthContext';
import vendorApi from '@/services/api/vendorApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import type { VendorQuote, QuoteStatistics } from '@/types/vendor/portal';
import { formatDistanceToNow } from 'date-fns';

// Auto-refresh interval (30 seconds)
const AUTO_REFRESH_INTERVAL = 30000;

export default function VendorDashboard() {
  const { vendor } = useVendorAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<QuoteStatistics | null>(null);
  const [recentQuotes, setRecentQuotes] = useState<VendorQuote[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  /**
   * Fetch dashboard data
   */
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch quotes with statistics
      const response = await vendorApi.getQuotes({
        page: 1,
        per_page: 5, // Only get 5 most recent quotes for dashboard
        sort: 'created_at',
        order: 'desc'
      });

      if (response.success) {
        setStatistics(response.data.statistics);
        setRecentQuotes(response.data.quotes);
        setLastRefresh(new Date());
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Initial data load
   */
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /**
   * Auto-refresh every 30 seconds
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  /**
   * Manual refresh handler
   */
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  /**
   * Navigate to quote detail
   */
  const handleQuoteClick = (quoteUuid: string) => {
    navigate(`/vendor/quotes/${quoteUuid}`);
  };

  /**
   * Navigate to all quotes
   */
  const handleViewAllQuotes = () => {
    navigate('/vendor/quotes');
  };

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
      case 'pending_response':
      case 'sent':
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
   * Render loading state
   */
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Welcome skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent quotes skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
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
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchDashboardData()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {vendor?.company_name || 'Vendor'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your quotes and performance
          </p>
        </div>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quotes */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quotes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total_quotes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time quotes
            </p>
          </CardContent>
        </Card>

        {/* Pending Quotes */}
        <Card className="hover:shadow-md transition-shadow border-orange-200 dark:border-orange-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Pending Response
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {statistics?.pending_quotes || 0}
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
              {statistics?.accepted_quotes || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics?.acceptance_rate ? `${statistics.acceptance_rate.toFixed(1)}% acceptance rate` : 'No data'}
            </p>
          </CardContent>
        </Card>

        {/* Rejected Quotes */}
        <Card className="hover:shadow-md transition-shadow border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              Rejected
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {statistics?.rejected_quotes || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics?.rejection_rate ? `${statistics.rejection_rate.toFixed(1)}% rejection rate` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Your response time and acceptance statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Average Response Time</p>
                <p className="text-2xl font-bold">
                  {statistics.average_response_time_hours 
                    ? `${statistics.average_response_time_hours.toFixed(1)}h`
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statistics.acceptance_rate ? `${statistics.acceptance_rate.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quotes This Month</p>
                <p className="text-2xl font-bold">
                  {statistics.quotes_this_month || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Quotes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Quotes</CardTitle>
            <CardDescription>
              Your most recent quote requests
            </CardDescription>
          </div>
          <Button onClick={handleViewAllQuotes} variant="outline" size="sm">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quotes yet</p>
              <p className="text-sm mt-1">New quotes will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentQuotes.map((quote) => (
                <div
                  key={quote.uuid}
                  onClick={() => handleQuoteClick(quote.uuid)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{quote.quote_number}</p>
                      <Badge variant={getStatusBadgeVariant(quote.status)}>
                        {formatStatus(quote.status)}
                      </Badge>
                      {quote.expires_at && new Date(quote.expires_at) < new Date() && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {quote.order?.order_number && (
                        <span>Order: {quote.order.order_number}</span>
                      )}
                      {quote.order?.customer_name && (
                        <span>Customer: {quote.order.customer_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                    </p>
                    {quote.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {formatDistanceToNow(new Date(quote.expires_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
