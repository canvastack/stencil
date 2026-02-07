import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Package
} from 'lucide-react';
import { VendorQuoteDetail } from './VendorQuoteDetail';
import { quoteApi } from '@/lib/api/quote';
import type { Quote } from '@/types/quote';

interface VendorQuoteDashboardProps {
  vendorId?: string;
}

export function VendorQuoteDashboard({ vendorId }: VendorQuoteDashboardProps) {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch quotes assigned to vendor
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vendor-quotes', vendorId, statusFilter],
    queryFn: () => quoteApi.listVendorQuotes({
      vendor_id: vendorId,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const quotes = data?.data || [];

  // Filter quotes by search term
  const filteredQuotes = quotes.filter((quote: Quote) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      quote.quote_number?.toLowerCase().includes(searchLower) ||
      quote.order?.order_number?.toLowerCase().includes(searchLower) ||
      quote.order?.customer?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Get status counts
  const statusCounts = {
    all: quotes.length,
    sent: quotes.filter((q: Quote) => q.status?.value === 'sent').length,
    pending_response: quotes.filter((q: Quote) => q.status?.value === 'pending_response').length,
    countered: quotes.filter((q: Quote) => q.status?.value === 'countered').length,
    accepted: quotes.filter((q: Quote) => q.status?.value === 'accepted').length,
    rejected: quotes.filter((q: Quote) => q.status?.value === 'rejected').length
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'pending_response':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'countered':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleQuoteResponse = async () => {
    // Refetch quotes after response
    await refetch();
    setSelectedQuote(null);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load quotes. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Quote Requests</h1>
        <p className="text-muted-foreground mt-2">
          Manage quote requests from customers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.sent + statusCounts.pending_response}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Countered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statusCounts.countered}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.accepted}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quote Requests</CardTitle>
            <CardDescription>
              {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''}
            </CardDescription>
            
            {/* Search and Filter */}
            <div className="space-y-3 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({statusCounts.all})
                </Button>
                <Button
                  variant={statusFilter === 'sent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('sent')}
                >
                  Pending ({statusCounts.sent + statusCounts.pending_response})
                </Button>
                <Button
                  variant={statusFilter === 'countered' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('countered')}
                >
                  Countered ({statusCounts.countered})
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quotes found</p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredQuotes.map((quote: Quote) => (
                  <button
                    key={quote.uuid}
                    onClick={() => setSelectedQuote(quote)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                      selectedQuote?.uuid === quote.uuid ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {quote.quote_number}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            Order: {quote.order?.order_number}
                          </p>
                        </div>
                        <Badge 
                          variant="outline"
                          className="shrink-0"
                          style={{
                            borderColor: `var(--${quote.status?.color || 'gray'}-500)`,
                            color: `var(--${quote.status?.color || 'gray'}-700)`
                          }}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(quote.status?.value || '')}
                            {quote.status?.label}
                          </span>
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground">
                          Customer: {quote.order?.customer?.name || 'N/A'}
                        </p>
                        {quote.quote_details?.product_name && (
                          <p className="text-muted-foreground truncate">
                            Product: {quote.quote_details.product_name}
                          </p>
                        )}
                        {quote.quote_details?.quantity && (
                          <p className="text-muted-foreground">
                            Quantity: {quote.quote_details.quantity}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(quote.created_at).toLocaleDateString()}
                        </span>
                        {quote.is_expired && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Detail */}
        <div className="lg:col-span-2">
          {selectedQuote ? (
            <VendorQuoteDetail
              quote={selectedQuote}
              onRespond={handleQuoteResponse}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a quote to view details</p>
                <p className="text-sm mt-2">
                  Choose a quote from the list to view specifications and respond
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
