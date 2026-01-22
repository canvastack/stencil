import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, CheckCircle2, Info } from 'lucide-react';
import type { CustomDomain } from '@/types/tenant-url';

/**
 * Props untuk WizardStepSslSetup component
 */
interface WizardStepSslSetupProps {
  domain: CustomDomain;
  isProvisioning?: boolean;
}

/**
 * WizardStepSslSetup Component - Step 5 of Domain Verification Wizard
 * 
 * Langkah kelima (final) dalam wizard yang menampilkan SSL certificate provisioning status.
 * SSL certificate otomatis di-provision setelah domain berhasil diverifikasi menggunakan Let's Encrypt.
 * 
 * Component menampilkan:
 * - SSL certificate status (active/pending/failed)
 * - SSL provider (Let's Encrypt)
 * - Certificate expiry date
 * - Auto-renewal information
 * 
 * Certificate biasanya membutuhkan 5-10 menit untuk provisioning dan akan automatically renewed
 * sebelum expiration date.
 * 
 * @component
 * @example
 * ```tsx
 * <WizardStepSslSetup 
 *   domain={domainObject} 
 *   isProvisioning={false} 
 * />
 * ```
 * 
 * @param {WizardStepSslSetupProps} props - Component props
 * @param {CustomDomain} props.domain - Domain object dengan SSL certificate information
 * @param {boolean} [props.isProvisioning=false] - Apakah SSL certificate sedang di-provision
 * 
 * @returns {JSX.Element} SSL status card dengan certificate details
 */
export default function WizardStepSslSetup({
  domain,
  isProvisioning = false,
}: WizardStepSslSetupProps) {
  const sslActive = domain.ssl_status === 'active';
  const sslPending = domain.ssl_status === 'pending';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">SSL Certificate Setup</h3>
        <p className="text-sm text-muted-foreground">
          We're provisioning a free SSL certificate for your domain to ensure secure HTTPS
          connections.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SSL Certificate Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sslActive && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>SSL Certificate Active!</strong>
                {domain.ssl_expires_at && (
                  <span className="block mt-1">
                    Expires: {new Date(domain.ssl_expires_at).toLocaleDateString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {sslPending && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                <strong>SSL Certificate Provisioning</strong>
                <span className="block mt-1">
                  Your SSL certificate is being generated. This usually takes 5-10 minutes.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {!sslActive && !sslPending && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                SSL certificate will be automatically provisioned once domain verification is
                complete.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-medium">{domain.ssl_provider || "Let's Encrypt"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{domain.ssl_status}</span>
            </div>
            {domain.ssl_expires_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-medium">
                  {new Date(domain.ssl_expires_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          SSL certificates are automatically renewed before expiration. You don't need to do
          anything.
        </AlertDescription>
      </Alert>

      {sslActive && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              Domain Setup Complete!
            </p>
            <p className="text-sm text-muted-foreground">
              Your custom domain is now active and secured with SSL
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
