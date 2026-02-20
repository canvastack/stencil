import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalApi } from '@/services/api/approvalApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currency';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';

export default function PendingApprovalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await approvalApi.getPendingApprovals();
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const approveMutation = useMutation({
    mutationFn: ({ uuid, notes }: { uuid: string; notes?: string }) =>
      approvalApi.approveQuote(uuid, notes),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Quote approved' });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      setSelectedQuote(null);
      setNotes('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to approve quote', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ uuid, reason }: { uuid: string; reason: string }) =>
      approvalApi.rejectQuote(uuid, reason),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Quote rejected' });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      setSelectedQuote(null);
      setReason('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to reject quote', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  const quotes = approvals?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground">Review and approve customer quote acceptances</p>
      </div>

      {quotes.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">All caught up!</p>
          <p className="text-muted-foreground">No pending approvals at the moment</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote: any) => (
            <Card key={quote.uuid}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{quote.quote_number}</CardTitle>
                    <p className="text-sm text-muted-foreground">{quote.title}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Approval
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(quote.pricing.grand_total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{quote.order?.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Accepted At</p>
                    <p className="font-medium">{new Date(quote.responded_at).toLocaleString()}</p>
                  </div>
                </div>

                {quote.approval?.reason && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Reason for Manual Review:</p>
                    <p className="text-sm">{quote.approval.reason}</p>
                  </div>
                )}

                {selectedQuote === quote.uuid ? (
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <label className="text-sm font-medium">Notes (optional)</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add approval notes..."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveMutation.mutate({ uuid: quote.uuid, notes })}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirm Approval
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedQuote(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setSelectedQuote(quote.uuid)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const r = prompt('Rejection reason (required):');
                        if (r && r.trim().length >= 20) {
                          rejectMutation.mutate({ uuid: quote.uuid, reason: r });
                        } else {
                          toast({
                            title: 'Validation Error',
                            description: 'Rejection reason must be at least 20 characters',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
