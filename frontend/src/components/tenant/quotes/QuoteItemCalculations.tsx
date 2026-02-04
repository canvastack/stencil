import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

/**
 * Props for the QuoteItemCalculations component
 */
interface QuoteItemCalculationsProps {
  /** Number of items in the quote */
  quantity: number;
  /** Price per unit in IDR */
  unitPrice: number;
  /** Vendor cost per unit in IDR */
  vendorCost: number;
  /** Total price for all units (unitPrice × quantity) */
  totalUnitPrice: number;
  /** Total vendor cost for all units (vendorCost × quantity) */
  totalVendorCost: number;
  /** Profit per single piece (unitPrice - vendorCost) */
  profitPerPiece: number;
  /** Profit percentage per piece */
  profitPerPiecePercent: number;
  /** Total profit for all pieces (totalUnitPrice - totalVendorCost) */
  profitTotal: number;
  /** Total profit percentage */
  profitTotalPercent: number;
}

/**
 * Displays pricing breakdown and profit calculations for quote items.
 * 
 * This component shows both per-piece and total pricing calculations, including:
 * - Vendor costs and unit prices
 * - Profit margins (both amount and percentage)
 * - Total calculations when quantity > 1
 * 
 * All calculations follow the formula:
 * - Total = Per-Piece × Quantity
 * - Profit = Unit Price - Vendor Cost
 * - Profit % = (Profit / Vendor Cost) × 100
 * 
 * @component
 * @example
 * ```tsx
 * <QuoteItemCalculations
 *   quantity={2}
 *   unitPrice={3114510}
 *   vendorCost={250000}
 *   totalUnitPrice={6229020}
 *   totalVendorCost={500000}
 *   profitPerPiece={2864510}
 *   profitPerPiecePercent={1145.8}
 *   profitTotal={5729020}
 *   profitTotalPercent={1145.8}
 * />
 * ```
 */
export const QuoteItemCalculations = ({
  quantity,
  unitPrice,
  vendorCost,
  totalUnitPrice,
  totalVendorCost,
  profitPerPiece,
  profitPerPiecePercent,
  profitTotal,
  profitTotalPercent,
}: QuoteItemCalculationsProps) => {
  const showTotals = quantity > 1;
  
  return (
    <Card 
      className="mt-4 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
      role="region"
      aria-label="Pricing breakdown and profit calculations"
    >
      <CardHeader className="py-4 px-4 min-h-[44px]">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" aria-hidden="true" />
          <span>Pricing Breakdown</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 pb-4 px-4">
        {/* Per-Piece Section */}
        <div className="space-y-3" role="group" aria-labelledby="per-piece-heading">
          <h4 id="per-piece-heading" className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Per Piece</Badge>
          </h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Vendor Cost:</dt>
            <dd 
              className="font-semibold sm:text-right break-words"
              aria-label={`Vendor cost per piece: ${formatCurrency(vendorCost, 'IDR')}`}
            >
              {formatCurrency(vendorCost, 'IDR')}
            </dd>
            
            <dt className="text-muted-foreground">Unit Price:</dt>
            <dd 
              className="font-semibold sm:text-right break-words"
              aria-label={`Unit price per piece: ${formatCurrency(unitPrice, 'IDR')}`}
            >
              {formatCurrency(unitPrice, 'IDR')}
            </dd>
            
            <dt className="text-muted-foreground">Profit Margin:</dt>
            <dd 
              className="font-semibold sm:text-right text-green-600 dark:text-green-400 flex items-center sm:justify-end gap-1 flex-wrap"
              aria-label={`Profit margin per piece: ${formatCurrency(profitPerPiece, 'IDR')}, ${profitPerPiecePercent.toFixed(1)} percent`}
            >
              <TrendingUp className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              <span className="break-words">{formatCurrency(profitPerPiece, 'IDR')}</span>
              <span className="text-xs whitespace-nowrap">({profitPerPiecePercent.toFixed(1)}%)</span>
            </dd>
          </dl>
        </div>
        
        {/* Total Section (only if quantity > 1) */}
        {showTotals && (
          <div className="pt-4 border-t border-blue-200 dark:border-blue-800 space-y-3" role="group" aria-labelledby="total-heading">
            <h4 id="total-heading" className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Total (Qty: {quantity})</Badge>
            </h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Total Vendor Cost:</dt>
              <dd 
                className="font-semibold sm:text-right break-words"
                aria-label={`Total vendor cost for ${quantity} items: ${formatCurrency(totalVendorCost, 'IDR')}`}
              >
                {formatCurrency(totalVendorCost, 'IDR')}
              </dd>
              
              <dt className="text-muted-foreground">Total Unit Price:</dt>
              <dd 
                className="font-semibold sm:text-right break-words"
                aria-label={`Total unit price for ${quantity} items: ${formatCurrency(totalUnitPrice, 'IDR')}`}
              >
                {formatCurrency(totalUnitPrice, 'IDR')}
              </dd>
              
              <dt className="text-muted-foreground">Total Profit:</dt>
              <dd 
                className="font-semibold sm:text-right text-green-600 dark:text-green-400 flex items-center sm:justify-end gap-1 flex-wrap"
                aria-label={`Total profit for ${quantity} items: ${formatCurrency(profitTotal, 'IDR')}, ${profitTotalPercent.toFixed(1)} percent`}
              >
                <TrendingUp className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span className="break-words">{formatCurrency(profitTotal, 'IDR')}</span>
                <span className="text-xs whitespace-nowrap">({profitTotalPercent.toFixed(1)}%)</span>
              </dd>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
