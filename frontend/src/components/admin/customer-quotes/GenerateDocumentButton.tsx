import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerQuoteApi } from '@/services/api/customerQuoteApi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, ChevronDown } from 'lucide-react';

interface GenerateDocumentButtonProps {
  quoteUuid: string;
  quoteStatus: string;
}

export function GenerateDocumentButton({ quoteUuid, quoteStatus }: GenerateDocumentButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (type: string) => {
      setGenerating(type);
      switch (type) {
        case 'quotation':
          return await customerQuoteApi.generateQuotation(quoteUuid);
        case 'proforma_invoice':
          return await customerQuoteApi.generateProformaInvoice(quoteUuid);
        case 'tax_invoice':
          return await customerQuoteApi.generateTaxInvoice(quoteUuid);
        case 'purchase_order':
          return await customerQuoteApi.generatePurchaseOrder(quoteUuid);
        default:
          throw new Error('Invalid document type');
      }
    },
    onSuccess: (_, type) => {
      toast({
        title: 'Success',
        description: `${getDocumentLabel(type)} generated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['quote-documents', quoteUuid] });
    },
    onError: (_, type) => {
      toast({
        title: 'Error',
        description: `Failed to generate ${getDocumentLabel(type)}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setGenerating(null);
    },
  });

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      quotation: 'Quotation',
      proforma_invoice: 'Proforma Invoice',
      tax_invoice: 'Tax Invoice',
      purchase_order: 'Purchase Order',
    };
    return labels[type] || type;
  };

  const canGenerateQuotation = ['draft', 'sent', 'viewed'].includes(quoteStatus);
  const canGenerateProforma = ['accepted'].includes(quoteStatus);
  const canGenerateTaxInvoice = ['accepted'].includes(quoteStatus);
  const canGeneratePO = ['accepted'].includes(quoteStatus);

  const hasAnyOption = canGenerateQuotation || canGenerateProforma || canGenerateTaxInvoice || canGeneratePO;

  if (!hasAnyOption) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!!generating}>
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Generate Document
              <ChevronDown className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canGenerateQuotation && (
          <DropdownMenuItem
            onClick={() => generateMutation.mutate('quotation')}
            disabled={!!generating}
          >
            <FileText className="w-4 h-4 mr-2" />
            Quotation
          </DropdownMenuItem>
        )}
        {canGenerateProforma && (
          <DropdownMenuItem
            onClick={() => generateMutation.mutate('proforma_invoice')}
            disabled={!!generating}
          >
            <FileText className="w-4 h-4 mr-2" />
            Proforma Invoice
          </DropdownMenuItem>
        )}
        {canGenerateTaxInvoice && (
          <DropdownMenuItem
            onClick={() => generateMutation.mutate('tax_invoice')}
            disabled={!!generating}
          >
            <FileText className="w-4 h-4 mr-2" />
            Tax Invoice
          </DropdownMenuItem>
        )}
        {canGeneratePO && (
          <DropdownMenuItem
            onClick={() => generateMutation.mutate('purchase_order')}
            disabled={!!generating}
          >
            <FileText className="w-4 h-4 mr-2" />
            Purchase Order
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
