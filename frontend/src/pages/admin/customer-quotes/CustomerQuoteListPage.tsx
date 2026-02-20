import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerQuoteApi } from '@/services/api/customerQuoteApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CustomerQuoteListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-quotes', page, statusFilter, searchTerm],
    queryFn: () => customerQuoteApi.list({
      page,
      per_page: 15,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchTerm || undefined,
    }),
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      sent: 'default',
      viewed: 'default',
      pending_approval: 'outline',
      accepted: 'default',
      rejected: 'destructive',
      expired: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Quotes</h1>
          <p className="text-muted-foreground">Manage customer quotations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by quote number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
                />
                <Button onClick={() => setPage(1)}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading quotes: {(error as Error).message}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid gap-4">
            {data.data.map((quote) => (
              <Card key={quote.uuid} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/admin/customer-quotes/${quote.uuid}`)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{quote.quote_number}</h3>
                        {getStatusBadge(quote.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{quote.title}</p>
                      <p className="text-xs text-muted-foreground">Valid until: {new Date(quote.valid_until).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">Rp {(quote.grand_total / 100).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-muted-foreground">{new Date(quote.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.meta.last_page > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {data.meta.last_page}
              </span>
              <Button
                variant="outline"
                disabled={page === data.meta.last_page}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
