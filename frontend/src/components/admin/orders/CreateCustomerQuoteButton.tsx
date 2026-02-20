import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2 } from 'lucide-react';

interface CreateCustomerQuoteButtonProps {
  orderUuid: string;
  vendorQuoteId?: number;
  orderStatus: string;
}

export function CreateCustomerQuoteButton({
  orderUuid,
  vendorQuoteId,
  orderStatus,
}: CreateCustomerQuoteButtonProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Only show button if order is in customer_quote status and has vendor quote
  const canCreateQuote = orderStatus === 'customer_quote' && vendorQuoteId;

  const createMutation = useMutation({
    mutationFn: async () => {
      // This would typically fetch vendor quote data and create customer quote
      // For now, navigate to create form
      navigate(`/admin/customer-quotes/create?order=${orderUuid}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create customer quote',
        variant: 'destructive',
      });
    },
  });

  if (!canCreateQuote) {
    return null;
  }

  return (
    <Button
      onClick={() => createMutation.mutate()}
      disabled={createMutation.isPending}
      size="lg"
    >
      {createMutation.isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 mr-2" />
          Create Customer Quote
        </>
      )}
    </Button>
  );
}
