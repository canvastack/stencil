import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Calendar, 
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  History,
  TrendingUp,
  User,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';

interface HistoryRecord {
  uuid: string;
  rate: number;
  provider: {
    uuid: string;
    name: string;
  } | null;
  source: 'manual' | 'api' | 'cached';
  event_type: 'rate_change' | 'provider_switch' | 'api_request' | 'manual_update';
  metadata: any;
  created_at: string;
}

interface HistoryResponse {
  data: HistoryRecord[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

interface Provider {
  uuid: string;
  name: string;
}

export function ExchangeRateHistory() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    provider: 'all',
    source: 'all',
    event_type: 'all',
    page: 1,
    per_page: 20
  });
  const { toast } = useToast();

  // Ensure providers is always an array
  const safeProviders = Array.isArray(providers) ? providers : [];

  useEffect(() => {
    loadProviders();
    loadHistory();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [filters.page]);

  const loadProviders = async () => {
    try {
      const response = await tenantApiClient.get('/settings/exchange-rate-providers');
      // Ensure we always set an array, even if response is malformed
      const providersData = response.data?.data || [];
      setProviders(Array.isArray(providersData) ? providersData : []);
    } catch (error) {
      console.error('Failed to load providers:', error);
      // Set empty array on error to prevent undefined state
      setProviders([]);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      // Clean up empty filter values and "all" placeholders
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined && value !== 'all') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const response = await tenantApiClient.get('/settings/exchange-rate-history', {
        params: cleanFilters
      });
      
      setHistory(response.data);
    } catch (error: any) {
      console.error('Failed to load history:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleSearch = () => {
    loadHistory();
  };

  const handleClearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      provider: 'all',
      source: 'all',
      event_type: 'all',
      page: 1,
      per_page: 20
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'rate_change':
        return TrendingUp;
      case 'provider_switch':
        return RefreshCw;
      case 'api_request':
        return History;
      case 'manual_update':
        return User;
      default:
        return Settings;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'rate_change':
        return 'bg-blue-100 text-blue-800';
      case 'provider_switch':
        return 'bg-orange-100 text-orange-800';
      case 'api_request':
        return 'bg-green-100 text-green-800';
      case 'manual_update':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'manual':
        return 'bg-purple-100 text-purple-800';
      case 'api':
        return 'bg-green-100 text-green-800';
      case 'cached':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Exchange Rate History</h2>
        <p className="text-muted-foreground">
          View and filter exchange rate changes and events
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter history records by date range, provider, source, or event type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={filters.provider} onValueChange={(value) => handleFilterChange('provider', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All providers</SelectItem>
                  {safeProviders.map((provider) => (
                    <SelectItem key={provider.uuid} value={provider.uuid}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={filters.source} onValueChange={(value) => handleFilterChange('source', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="cached">Cached</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={filters.event_type} onValueChange={(value) => handleFilterChange('event_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  <SelectItem value="rate_change">Rate Change</SelectItem>
                  <SelectItem value="provider_switch">Provider Switch</SelectItem>
                  <SelectItem value="api_request">API Request</SelectItem>
                  <SelectItem value="manual_update">Manual Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Per Page</Label>
              <Select 
                value={filters.per_page.toString()} 
                onValueChange={(value) => handleFilterChange('per_page', value)}
              >
                <SelectTrigger>
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
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button variant="outline" onClick={loadHistory} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>History Records</CardTitle>
          {history?.meta && (
            <CardDescription>
              Showing {history.meta.from}-{history.meta.to} of {history.meta.total} records
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading history...
            </div>
          ) : history && history.data && history.data.length > 0 ? (
            <div className="space-y-4">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date & Time</th>
                      <th className="text-left py-2">Rate</th>
                      <th className="text-left py-2">Provider</th>
                      <th className="text-left py-2">Source</th>
                      <th className="text-left py-2">Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.map((record) => {
                      const EventIcon = getEventTypeIcon(record.event_type);
                      
                      return (
                        <tr key={record.uuid} className="border-b hover:bg-muted/50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {new Date(record.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(record.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-3">
                            <div className="font-mono font-medium">
                              IDR {record.rate.toLocaleString()}
                            </div>
                          </td>
                          
                          <td className="py-3">
                            {record.provider ? (
                              <Badge variant="outline">
                                {record.provider.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          <td className="py-3">
                            <Badge className={getSourceColor(record.source)}>
                              {record.source.charAt(0).toUpperCase() + record.source.slice(1)}
                            </Badge>
                          </td>
                          
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <EventIcon className="h-4 w-4" />
                              <Badge className={getEventTypeColor(record.event_type)}>
                                {formatEventType(record.event_type)}
                              </Badge>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {history.meta && history.meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {history.meta.current_page} of {history.meta.last_page}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(history.meta.current_page - 1)}
                      disabled={!history.links?.prev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(history.meta.current_page + 1)}
                      disabled={!history.links?.next}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No history records found. Try adjusting your filters or check back later.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}