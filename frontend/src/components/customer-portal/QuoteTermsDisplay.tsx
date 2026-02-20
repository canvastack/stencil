import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar, CreditCard, Truck } from 'lucide-react';

interface QuoteTermsDisplayProps {
  terms: {
    valid_until: string;
    payment_terms: string;
    delivery_timeline?: string;
    terms_and_conditions?: string;
  };
}

export function QuoteTermsDisplay({ terms }: QuoteTermsDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms & Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Valid Until</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(terms.valid_until), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Payment Terms</p>
            <p className="text-sm text-muted-foreground">{terms.payment_terms}</p>
          </div>
        </div>

        {terms.delivery_timeline && (
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Delivery Timeline</p>
              <p className="text-sm text-muted-foreground">{terms.delivery_timeline}</p>
            </div>
          </div>
        )}

        {terms.terms_and_conditions && (
          <div className="border-t pt-4">
            <p className="font-medium mb-2">Additional Terms</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {terms.terms_and_conditions}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
