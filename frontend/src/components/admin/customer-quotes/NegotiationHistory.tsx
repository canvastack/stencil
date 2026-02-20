import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { ArrowRight, User, Building2 } from 'lucide-react';

interface NegotiationHistoryProps {
  history: Array<{
    action: string;
    actor_type: 'admin' | 'customer' | 'system';
    actor_id?: string;
    timestamp: string;
    old_value?: any;
    new_value?: any;
    notes?: string;
    metadata?: any;
  }>;
}

export function NegotiationHistory({ history }: NegotiationHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No negotiation history yet
        </CardContent>
      </Card>
    );
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      quote_created: 'Quote Created',
      quote_sent: 'Sent to Customer',
      quote_viewed: 'Viewed by Customer',
      customer_accepted: 'Customer Accepted',
      customer_rejected: 'Customer Rejected',
      customer_countered: 'Customer Counter Offer',
      admin_countered: 'Admin Counter Offer',
      admin_approved: 'Admin Approved',
      admin_rejected: 'Admin Rejected',
      quote_expired: 'Quote Expired',
    };
    return labels[action] || action;
  };

  const getActorIcon = (actorType: string) => {
    if (actorType === 'customer') return <User className="w-4 h-4" />;
    if (actorType === 'admin') return <Building2 className="w-4 h-4" />;
    return null;
  };

  const getActorBadge = (actorType: string) => {
    const config: Record<string, { label: string; className: string }> = {
      customer: { label: 'Customer', className: 'bg-blue-100 text-blue-800' },
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800' },
      system: { label: 'System', className: 'bg-gray-100 text-gray-800' },
    };
    const { label, className } = config[actorType] || config.system;
    return (
      <Badge className={className}>
        {getActorIcon(actorType)}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Negotiation History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
              <div className="flex-shrink-0 w-2 bg-primary rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{getActionLabel(entry.action)}</span>
                    {getActorBadge(entry.actor_type)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>

                {entry.notes && (
                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                )}

                {entry.old_value && entry.new_value && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{formatCurrency(entry.old_value)}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-primary">{formatCurrency(entry.new_value)}</span>
                  </div>
                )}

                {entry.metadata?.approval_method && (
                  <div className="text-sm">
                    <Badge variant="outline">
                      {entry.metadata.approval_method === 'auto' ? 'Auto-Approved' : 'Manual Approval'}
                    </Badge>
                    {entry.metadata.approval_reason && (
                      <span className="ml-2 text-muted-foreground">
                        {entry.metadata.approval_reason}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
