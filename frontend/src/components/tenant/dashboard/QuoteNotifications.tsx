import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuoteStore } from '@/stores/quoteStore';
import { formatCurrency } from '@/lib/utils';
import { QuoteStatusBadge } from '../quotes/QuoteStatusBadge';

export const QuoteNotifications = () => {
  const { quotes, quotesLoading, fetchQuotes } = useQuoteStore();

  useEffect(() => {
    // Fetch pending quotes on mount
    fetchQuotes({
      status: ['open', 'countered'],
      per_page: 5,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  }, [fetchQuotes]);

  if (quotesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pending Quotes
          </CardTitle>
          <CardDescription>Quotes awaiting your action</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const pendingQuotes = quotes.filter(
    (quote) => quote.status === 'open' || quote.status === 'countered'
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pending Quotes
              {pendingQuotes.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingQuotes.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Quotes awaiting your action</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/quotes" className="flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pendingQuotes.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No pending quotes</p>
            <p className="text-xs text-muted-foreground mt-1">
              All quotes have been reviewed
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingQuotes.slice(0, 5).map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 transition-colors rounded-md px-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {quote.quote_number}
                    </p>
                    <QuoteStatusBadge status={quote.status} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {quote.vendor.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs font-semibold text-primary">
                      {formatCurrency(quote.grand_total, quote.currency)}
                    </p>
                    {quote.valid_until && (
                      <p className="text-xs text-muted-foreground">
                        Valid until:{' '}
                        {new Date(quote.valid_until).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/admin/quotes/${quote.id}`}>Review</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
