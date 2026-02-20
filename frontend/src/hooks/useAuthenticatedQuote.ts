import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '@/services/api/customerPortalApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useAuthenticatedQuote(quoteId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch quote details
  const {
    data: quoteData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['authenticated-quote', quoteId],
    queryFn: async () => {
      const response = await customerPortalApi.getMyQuoteById(quoteId);
      return response.data;
    },
    enabled: !!quoteId,
  });

  const quote = quoteData?.data;
  const isExpired = quote?.is_expired || false;
  const canAccept = quote?.can_accept || false;
  const canCounter = quote?.can_counter || false;

  // Accept quote mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await customerPortalApi.acceptQuoteAuthenticated(quoteId);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Quote accepted successfully!');
      queryClient.invalidateQueries({ queryKey: ['authenticated-quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
      
      // Show approval status message
      if (data.data?.approval_method === 'auto') {
        toast.success('Your order has been auto-approved! Payment instructions sent to your email.');
      } else {
        toast.info('Your acceptance is being reviewed. You will receive payment instructions within 24 hours.');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to accept quote';
      toast.error(message);
    },
  });

  // Reject quote mutation
  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await customerPortalApi.rejectQuoteAuthenticated(quoteId, reason);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Quote rejected');
      queryClient.invalidateQueries({ queryKey: ['authenticated-quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
      navigate('/customer/quotes');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reject quote';
      toast.error(message);
    },
  });

  // Counter offer mutation
  const counterMutation = useMutation({
    mutationFn: async ({ amount, notes }: { amount: number; notes: string }) => {
      const response = await customerPortalApi.counterOfferAuthenticated(quoteId, amount, notes);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Counter offer submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['authenticated-quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit counter offer';
      toast.error(message);
    },
  });

  return {
    quote,
    isExpired,
    canAccept,
    canCounter,
    isLoading,
    error,
    acceptQuote: () => acceptMutation.mutate(),
    rejectQuote: (reason: string) => rejectMutation.mutate(reason),
    counterOffer: (amount: number, notes: string) => counterMutation.mutate({ amount, notes }),
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isCountering: counterMutation.isPending,
  };
}
