import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * Props untuk SslExpiryAlert component
 */
interface SslExpiryAlertProps {
  expiresAt: string;
  onRenew?: () => void;
}

/**
 * SslExpiryAlert Component
 * 
 * Menampilkan alert untuk SSL certificate yang akan expire atau mendekati expiry.
 * Alert menjadi destructive (merah) jika certificate expire dalam 7 hari atau kurang.
 * 
 * @component
 * @example
 * ```tsx
 * <SslExpiryAlert 
 *   expiresAt="2026-02-01" 
 *   onRenew={() => renewCertificate()} 
 * />
 * ```
 * 
 * @param {SslExpiryAlertProps} props - Component props
 * @param {string} props.expiresAt - Tanggal expiry SSL certificate (ISO 8601 format)
 * @param {Function} [props.onRenew] - Optional callback untuk renew certificate
 * 
 * @returns {JSX.Element} Alert component dengan expiry warning dan optional renew button
 */
export default function SslExpiryAlert({ expiresAt, onRenew }: SslExpiryAlertProps) {
  const expiryDate = new Date(expiresAt);
  const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const variant = daysRemaining < 7 ? 'destructive' : 'default';
  const Icon = daysRemaining < 7 ? AlertTriangle : Shield;

  return (
    <Alert variant={variant}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          SSL certificate expires in <strong>{daysRemaining} days</strong> (
          {expiryDate.toLocaleDateString()})
        </span>
        {onRenew && (
          <Button size="sm" variant={daysRemaining < 7 ? 'default' : 'outline'} onClick={onRenew}>
            Renew Now
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
