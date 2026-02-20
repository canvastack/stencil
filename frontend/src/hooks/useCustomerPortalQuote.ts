import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '@/services/api/customerPortalApi';
import { useToast } from '@/hooks/use-toast';

export function useCustomerPortalQuote(token: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['customer-portal-quote', token],
    queryFn: async () => {
      const response = await customerPortalApi.viewQuoteByToken(token);
      return response.data;
    },
    enabled: !!token,
    retry: 1,
  });

  const acceptMutation = useMutation({
    mutationFn: () => customerPortalApi.acceptQuote(token),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Quote accepted successfully' });
      queryClient.invalidateQueries({ queryKey: ['customer-portal-quote', token] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to accept quote',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => customerPortalApi.rejectQuote(token, reason),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Quote rejected' });
      queryClient.invalidateQueries({ queryKey: ['customer-portal-quote', token] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject quote',
        variant: 'destructive',
      });
    },
  });

  const counterOfferMutation = useMutation({
    mutationFn: ({ amount, notes }: { amount: number; notes: string }) =>
      customerPortalApi.counterOffer(token, amount, notes),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Counter offer submitted' });
      queryClient.invalidateQueries({ queryKey: ['customer-portal-quote', token] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit counter offer',
        variant: 'destructive',
      });
    },
  });

  return {
    quote,
    isLoading,
    error,
    acceptQuote: acceptMutation.mutate,
    rejectQuote: rejectMutation.mutate,
    counterOffer: counterOfferMutation.mutate,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isCountering: counterOfferMutation.isPending,
  };
}
