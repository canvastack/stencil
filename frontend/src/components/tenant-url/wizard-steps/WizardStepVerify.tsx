import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import type { CustomDomain } from '@/types/tenant-url';

/**
 * Props untuk WizardStepVerify component
 */
interface WizardStepVerifyProps {
  domain: CustomDomain;
  isVerifying: boolean;
  verificationError: string | null;
  onVerify: () => void;
}

/**
 * WizardStepVerify Component - Step 4 of Domain Verification Wizard
 * 
 * Langkah keempat dalam wizard untuk melakukan verifikasi domain ownership.
 * User klik tombol "Verify Domain" untuk memicu verification check di backend.
 * 
 * Component menampilkan 3 possible states:
 * 1. Awaiting verification - Tombol "Verify Domain" siap diklik
 * 2. Verifying - Loading state saat verification sedang berjalan
 * 3. Verified - Success state dengan checkmark icon
 * 4. Failed - Error state dengan error message
 * 
 * Jika verification gagal, user dapat retry setelah memastikan DNS records sudah benar.
 * 
 * @component
 * @example
 * ```tsx
 * <WizardStepVerify 
 *   domain={domainObject} 
 *   isVerifying={false} 
 *   verificationError={null} 
 *   onVerify={() => handleVerify()} 
 * />
 * ```
 * 
 * @param {WizardStepVerifyProps} props - Component props
 * @param {CustomDomain} props.domain - Domain object dengan verification status
 * @param {boolean} props.isVerifying - Apakah verification sedang dalam proses
 * @param {string | null} props.verificationError - Error message jika verification gagal
 * @param {Function} props.onVerify - Callback untuk trigger verification
 * 
 * @returns {JSX.Element} Verification interface dengan button dan status alerts
 */
export default function WizardStepVerify({
  domain,
  isVerifying,
  verificationError,
  onVerify,
}: WizardStepVerifyProps) {
  const isVerified = domain.verification_status === 'verified';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Verify Domain Ownership</h3>
        <p className="text-sm text-muted-foreground">
          Click the button below to verify that you've configured the DNS records correctly.
        </p>
      </div>

      {!isVerified && !verificationError && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Make sure you've added the DNS records to your domain provider before attempting
            verification. DNS changes can take up to 48 hours to propagate.
          </AlertDescription>
        </Alert>
      )}

      {verificationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Verification Failed:</strong> {verificationError}
          </AlertDescription>
        </Alert>
      )}

      {isVerified && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Domain Verified!</strong> Your domain has been successfully verified and is
            ready to use.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center justify-center py-8">
        {isVerified ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">
              Verification Complete
            </p>
          </div>
        ) : (
          <Button onClick={onVerify} disabled={isVerifying} size="lg">
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Verify Domain
              </>
            )}
          </Button>
        )}
      </div>

      {!isVerified && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            If verification fails, double-check your DNS records and wait a few minutes before
            trying again. DNS propagation can take time.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
