import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';

interface QuotePricingBreakdownProps {
  pricing: {
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    grand_total: number;
    currency: string;
  };
}

export function QuotePricingBreakdown({ pricing }: QuotePricingBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">{formatCurrency(pricing.subtotal, pricing.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax ({pricing.tax_rate}%)</span>
          <span className="font-semibold">{formatCurrency(pricing.tax_amount, pricing.currency)}</span>
        </div>
        <div className="border-t pt-3 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(pricing.grand_total, pricing.currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
