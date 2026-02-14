/**
 * VendorQuoteCard Component
 * 
 * Displays vendor quote information on Order Detail page.
 * Shows quote status, vendor details, agreed terms, and production progress.
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All data from real order records
 * - ✅ RESPONSIVE: Mobile-first design with touch-friendly interactions
 * - ✅ ACCESSIBLE: WCAG 2.1 compliant with proper ARIA labels
 * - ✅ NULL SAFE: Gracefully handles missing vendor quote data
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';
import { ProductionCountdown } from '@/components/quotes/ProductionCountdown';

interface VendorQuoteCardProps {
  order: {
    vendor_quote_uuid?: string;
    vendor_quote_status?: string;
    vendor_quote_status_label?: string;
    vendor_quote_accepted_at?: string;
    vendor_agreed_price?: number;
    vendor_estimated_delivery_days?: number;
    vendor_name?: string;
  };
}

export function VendorQuoteCard({ order }: VendorQuoteCardProps) {
  const navigate = useNavigate();
  
  // Don't render if no vendor quote exists
  if (!order.vendor_quote_uuid) {
    return null;
  }
  
  /**
   * Get badge variant based on quote status
   */
  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'countered':
        return 'warning';
      case 'rejected':
        return 'destructive';
      case 'sent':
      case 'open':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  /**
   * Navigate to quote detail page
   */
  const handleViewQuote = () => {
    navigate(`/admin/quotes/${order.vendor_quote_uuid}`);
  };
  
  return (
    <Card hover={false} role="region" aria-labelledby="vendor-quote-card-title">
      <CardHeader>
        <CardTitle id="vendor-quote-card-title" className="flex items-center gap-2">
          <FileText className="w-5 h-5" aria-hidden="true" />
          Vendor Quote Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quote Status */}
        <div className="flex items-center justify-between" role="group" aria-label="Quote status information">
          <span className="text-sm text-muted-foreground">Quote Status:</span>
          <Badge 
            variant={getStatusVariant(order.vendor_quote_status)}
            aria-label={`Quote status: ${order.vendor_quote_status_label || 'Unknown'}`}
          >
            {order.vendor_quote_status_label || 'Unknown'}
          </Badge>
        </div>

        {/* Vendor Info */}
        {order.vendor_name && (
          <div className="flex items-center justify-between" role="group" aria-label="Vendor information">
            <span className="text-sm text-muted-foreground">Vendor:</span>
            <span className="font-semibold">{order.vendor_name}</span>
          </div>
        )}

        {/* Agreed Terms (if accepted) */}
        {order.vendor_quote_status === 'accepted' && (
          <>
            {/* Agreed Price */}
            {order.vendor_agreed_price !== undefined && order.vendor_agreed_price !== null && (
              <div className="flex items-center justify-between" role="group" aria-label="Agreed price">
                <span className="text-sm text-muted-foreground">Agreed Price:</span>
                <span 
                  className="font-semibold text-green-600 dark:text-green-400"
                  aria-label={`Agreed price: ${formatCurrency(order.vendor_agreed_price, 'IDR')}`}
                >
                  {formatCurrency(order.vendor_agreed_price, 'IDR')}
                </span>
              </div>
            )}
            
            {/* Estimated Delivery */}
            {order.vendor_estimated_delivery_days !== undefined && order.vendor_estimated_delivery_days !== null && (
              <div className="flex items-center justify-between" role="group" aria-label="Estimated delivery">
                <span className="text-sm text-muted-foreground">Estimated Delivery:</span>
                <span 
                  className="font-semibold"
                  aria-label={`Estimated delivery: ${order.vendor_estimated_delivery_days} days`}
                >
                  {order.vendor_estimated_delivery_days} days
                </span>
              </div>
            )}

            {/* Production Progress */}
            {order.vendor_quote_accepted_at && order.vendor_estimated_delivery_days && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Production Progress:</p>
                <ProductionCountdown 
                  acceptedDate={order.vendor_quote_accepted_at}
                  estimatedDays={order.vendor_estimated_delivery_days}
                />
              </div>
            )}
          </>
        )}

        {/* View Quote Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleViewQuote}
          aria-label="View quote details"
        >
          <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
          View Quote Details
        </Button>
      </CardContent>
    </Card>
  );
}

export default VendorQuoteCard;
