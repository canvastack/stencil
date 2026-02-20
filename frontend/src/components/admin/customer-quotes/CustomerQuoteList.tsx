import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { Eye, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface CustomerQuote {
  uuid: string;
  quote_number: string;
  title: string;
  status: string;
  grand_total: number;
  valid_until: string;
  created_at: string;
  order?: { order_number: string };
}

interface CustomerQuoteListProps {
  quotes: CustomerQuote[];
  loading?: boolean;
}

export function CustomerQuoteList({ quotes, loading }: CustomerQuoteListProps) {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: any }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800', icon: Clock },
      sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800', icon: Send },
      viewed: { label: 'Viewed', className: 'bg-purple-100 text-purple-800', icon: Eye },
      pending_approval: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600', icon: Clock },
    };
    const { label, className, icon: Icon } = config[status] || config.draft;
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No customer quotes found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <Card key={quote.uuid} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{quote.quote_number}</h3>
                {getStatusBadge(quote.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{quote.title}</p>
              {quote.order && (
                <p className="text-sm text-muted-foreground">
                  Order: {quote.order.order_number}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(quote.grand_total)}</p>
              <p className="text-sm text-muted-foreground">
                Valid until: {format(new Date(quote.valid_until), 'MMM dd, yyyy')}
              </p>
              <Link to={`/admin/customer-quotes/${quote.uuid}`}>
                <Button size="sm" className="mt-2">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
