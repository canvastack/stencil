import { Badge } from '@/components/ui/badge';
import { Clock, Send, Eye, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface QuoteStatusBadgeProps {
  status: string;
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const config: Record<string, { label: string; className: string; icon: any }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800', icon: Clock },
    sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800', icon: Send },
    viewed: { label: 'Viewed', className: 'bg-purple-100 text-purple-800', icon: Eye },
    countered: { label: 'Countered', className: 'bg-orange-100 text-orange-800', icon: RefreshCw },
    pending_approval: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800', icon: XCircle },
    expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600', icon: Clock },
  };

  const { label, className, icon: Icon } = config[status] || config.draft;

  return (
    <Badge className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}
