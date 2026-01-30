/**
 * Vendor Negotiation Actions Component
 * 
 * Provides stage-specific actions for orders in the vendor_negotiation stage.
 * Integrates with the existing quotes management system to enable seamless
 * vendor negotiation workflow.
 * 
 * ## Features
 * - Navigate to QuoteManagement with order context
 * - Display active quote count
 * - Show accepted quote information (price, quotation amount, markup)
 * - Enable stage advancement when quote is accepted
 * 
 * ## Requirements
 * - Requirements 1.1: Display "Manage Vendor Quotes" button
 * - Requirements 1.5: Show active quote count
 * - Requirements 3.5: Display "Proceed to Customer Quote" button when accepted quote exists
 * - Requirements 4.3, 4.4, 4.5: Display vendor pricing information
 * 
 * @version 1.0.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { FileText, ArrowRight, Info } from 'lucide-react';
import { Order } from '@/types/order';
import { cn } from '@/lib/utils';

interface VendorNegotiationActionsProps {
  order: Order;
  onAdvanceStage: (targetStage: string) => Promise<void>;
  isAdvancing?: boolean;
}

/**
 * Format currency value for display
 */
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Calculate markup percentage
 */
const calculateMarkupPercentage = (vendorPrice: number | undefined, quotationAmount: number | undefined): string => {
  if (!vendorPrice || !quotationAmount || vendorPrice === 0) {
    return '0%';
  }
  const markup = ((quotationAmount - vendorPrice) / vendorPrice) * 100;
  return `${markup.toFixed(0)}%`;
};

export const VendorNegotiationActions: React.FC<VendorNegotiationActionsProps> = ({
  order,
  onAdvanceStage,
  isAdvancing = false,
}) => {
  const navigate = useNavigate();
  
  const hasActiveQuotes = (order.activeQuotes ?? 0) > 0;
  const hasAcceptedQuote = !!order.acceptedQuote;
  
  const handleManageQuotes = () => {
    // Navigate to QuoteManagement with order_id parameter
    navigate(`/admin/quotes?order_id=${order.uuid}`);
  };
  
  const handleProceedToCustomerQuote = async () => {
    // Advance to customer_quote stage
    await onAdvanceStage('customer_quote');
  };
  
  return (
    <div className="space-y-4">
      {/* Guidance Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Vendor Negotiation Required</AlertTitle>
        <AlertDescription>
          {hasAcceptedQuote 
            ? "You have accepted a vendor quote. You can now proceed to customer quote stage."
            : "Create and accept a vendor quote before proceeding to customer quote stage."
          }
        </AlertDescription>
      </Alert>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleManageQuotes}
          className="flex-1"
          disabled={isAdvancing}
        >
          <FileText className="w-4 h-4 mr-2" />
          {hasActiveQuotes ? `Manage Quotes (${order.activeQuotes})` : 'Create Quote'}
        </Button>
        
        {hasAcceptedQuote && (
          <Button
            onClick={handleProceedToCustomerQuote}
            className="flex-1"
            disabled={isAdvancing}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Proceed to Customer Quote
          </Button>
        )}
      </div>
      
      {/* Accepted Quote Information */}
      {hasAcceptedQuote && order.vendorQuotedPrice && order.quotationAmount && (
        <Card className="p-4">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor Price:</span>
              <span className="font-medium">{formatCurrency(order.vendorQuotedPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Quote:</span>
              <span className="font-medium">{formatCurrency(order.quotationAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Markup:</span>
              <span className={cn("font-medium", "text-green-600")}>
                {calculateMarkupPercentage(order.vendorQuotedPrice, order.quotationAmount)}
              </span>
            </div>
            {order.acceptedQuote && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground text-xs">Accepted Quote ID:</span>
                <span className="font-mono text-xs">{order.acceptedQuote.substring(0, 8)}...</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default VendorNegotiationActions;
