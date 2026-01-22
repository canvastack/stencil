import { Badge } from '@/components/ui/badge';
import { Shield, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SslStatus } from '@/types/tenant-url';

/**
 * Props untuk SslStatusBadge component
 */
interface SslStatusBadgeProps {
  status: SslStatus;
  expiresAt?: string | null;
  showTooltip?: boolean;
}

const statusConfig = {
  active: {
    variant: 'success' as const,
    label: 'SSL Active',
    icon: Shield,
  },
  pending: {
    variant: 'warning' as const,
    label: 'SSL Pending',
    icon: Clock,
  },
  expired: {
    variant: 'destructive' as const,
    label: 'SSL Expired',
    icon: AlertTriangle,
  },
  failed: {
    variant: 'destructive' as const,
    label: 'SSL Failed',
    icon: XCircle,
  },
};

/**
 * SslStatusBadge Component
 * 
 * Menampilkan status SSL certificate untuk custom domain dengan indicator visual yang jelas.
 * Component ini juga menghitung dan menampilkan sisa hari sebelum certificate expire dalam tooltip.
 * 
 * @component
 * @example
 * ```tsx
 * <SslStatusBadge status="active" expiresAt="2026-06-15" showTooltip={true} />
 * <SslStatusBadge status="pending" />
 * <SslStatusBadge status="expired" showTooltip={false} />
 * ```
 * 
 * @param {SslStatusBadgeProps} props - Component props
 * @param {SslStatus} props.status - Status SSL certificate ('active', 'pending', 'expired', atau 'failed')
 * @param {string | null} [props.expiresAt] - Tanggal expiry SSL certificate (ISO 8601 format)
 * @param {boolean} [props.showTooltip=true] - Apakah menampilkan tooltip dengan informasi expiry (default: true)
 * 
 * @returns {JSX.Element} Badge component dengan SSL status indicator
 * 
 * @see {@link SslStatus} untuk tipe status definition
 */
export default function SslStatusBadge({
  status,
  expiresAt,
  showTooltip = true,
}: SslStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const getDaysUntilExpiry = (): number | null => {
    if (!expiresAt) return null;
    const expiryDate = new Date(expiresAt);
    const today = new Date();
    const diffMs = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  const getTooltipContent = (): string => {
    if (status === 'active' && daysUntilExpiry !== null) {
      return `SSL certificate expires in ${daysUntilExpiry} days (${new Date(
        expiresAt!
      ).toLocaleDateString()})`;
    }
    return config.label;
  };

  const badgeContent = (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
