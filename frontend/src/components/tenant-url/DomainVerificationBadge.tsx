import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DomainVerificationStatus } from '@/types/tenant-url';

/**
 * Props untuk DomainVerificationBadge component
 */
interface DomainVerificationBadgeProps {
  status: DomainVerificationStatus;
  showTooltip?: boolean;
}

const statusConfig = {
  verified: {
    variant: 'success' as const,
    label: 'Verified',
    icon: CheckCircle2,
    description: 'Domain ownership verified',
  },
  pending: {
    variant: 'warning' as const,
    label: 'Pending',
    icon: Clock,
    description: 'Verification in progress',
  },
  failed: {
    variant: 'destructive' as const,
    label: 'Failed',
    icon: XCircle,
    description: 'Verification failed',
  },
};

/**
 * DomainVerificationBadge Component
 * 
 * Menampilkan status verifikasi custom domain dengan color coding dan icon yang sesuai.
 * Badge menunjukkan apakah domain sudah terverifikasi, sedang dalam proses, atau gagal verifikasi.
 * 
 * @component
 * @example
 * ```tsx
 * <DomainVerificationBadge status="verified" showTooltip={true} />
 * <DomainVerificationBadge status="pending" />
 * <DomainVerificationBadge status="failed" showTooltip={false} />
 * ```
 * 
 * @param {DomainVerificationBadgeProps} props - Component props
 * @param {DomainVerificationStatus} props.status - Status verifikasi domain saat ini ('verified', 'pending', atau 'failed')
 * @param {boolean} [props.showTooltip=true] - Apakah menampilkan tooltip saat hover (default: true)
 * 
 * @returns {JSX.Element} Badge component dengan status indicator
 * 
 * @see {@link DomainVerificationStatus} untuk tipe status definition
 */
export default function DomainVerificationBadge({
  status,
  showTooltip = true,
}: DomainVerificationBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

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
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
