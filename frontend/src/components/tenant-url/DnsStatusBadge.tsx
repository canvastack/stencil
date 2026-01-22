import { Badge } from '@/components/ui/badge';
import { Database, AlertTriangle } from 'lucide-react';

/**
 * Props untuk DnsStatusBadge component
 */
interface DnsStatusBadgeProps {
  configured: boolean;
}

/**
 * DnsStatusBadge Component
 * 
 * Menampilkan status konfigurasi DNS untuk custom domain.
 * Badge menunjukkan apakah DNS records sudah dikonfigurasi dengan benar atau masih pending.
 * 
 * @component
 * @example
 * ```tsx
 * <DnsStatusBadge configured={true} />
 * <DnsStatusBadge configured={false} />
 * ```
 * 
 * @param {DnsStatusBadgeProps} props - Component props
 * @param {boolean} props.configured - Apakah DNS sudah dikonfigurasi dengan benar
 * 
 * @returns {JSX.Element} Badge component dengan DNS status indicator
 */
export default function DnsStatusBadge({ configured }: DnsStatusBadgeProps) {
  return (
    <Badge variant={configured ? 'outline' : 'destructive'} className="gap-1">
      {configured ? (
        <>
          <Database className="h-3 w-3" />
          DNS OK
        </>
      ) : (
        <>
          <AlertTriangle className="h-3 w-3" />
          DNS Pending
        </>
      )}
    </Badge>
  );
}
