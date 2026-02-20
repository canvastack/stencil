import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerQuoteApi } from '@/services/api/customerQuoteApi';
import { CustomerQuoteDetail } from '@/components/admin/customer-quotes/CustomerQuoteDetail';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Trash2, FileText } from 'lucide-react';

export default function CustomerQuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['customer-quote', id],
    queryFn: async () => {
      const response = await customerQuoteApi.getQuoteById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const sendMutation = useMutation({
    mutationFn: () => customerQuoteApi.sendQuote(id!),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Quote sent to customer' });
      queryClient.invalidateQueries({ queryKey: ['customer-quote', id] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to send quote', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => customerQuoteApi.deleteQuote(id!),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Quote deleted' });
      navigate('/admin/customer-quotes');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete quote', variant: 'destructive' });
    },
  });

  const handleSend = () => {
    if (confirm('Send this quote to customer?')) {
      sendMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this quote? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-red-500">Failed to load quote</p>
          <Button onClick={() => navigate('/admin/customer-quotes')} className="mt-4">
            Back to Quotes
          </Button>
        </Card>
      </div>
    );
  }

  const canSend = quote.status === 'draft';
  const canDelete = quote.status === 'draft';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/customer-quotes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Quote Details</h1>
            <p className="text-muted-foreground">{quote.quote_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <Button onClick={handleSend} disabled={sendMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />
              Send to Customer
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <CustomerQuoteDetail quote={quote} />
    </div>
  );
}
