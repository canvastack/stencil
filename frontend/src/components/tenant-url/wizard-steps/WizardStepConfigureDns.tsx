import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, ExternalLink, Info } from 'lucide-react';
import type { CustomDomain, DomainVerificationMethod } from '@/types/tenant-url';

/**
 * Props untuk WizardStepConfigureDns component
 */
interface WizardStepConfigureDnsProps {
  domain: CustomDomain;
  verificationMethod: DomainVerificationMethod;
  verificationToken: string;
}

/**
 * WizardStepConfigureDns Component - Step 3 of Domain Verification Wizard
 * 
 * Langkah ketiga dalam wizard yang menampilkan DNS configuration instructions kepada user.
 * Menampilkan detail DNS record yang harus ditambahkan (Record Type, Name/Host, Value, TTL)
 * dengan copy-to-clipboard buttons untuk memudahkan user.
 * 
 * Instructions akan berbeda tergantung verification method yang dipilih:
 * - TXT Record: Menambahkan TXT record dengan verification token
 * - CNAME Record: Menambahkan CNAME record yang point ke verification server
 * - File Upload: Instruksi untuk upload verification file ke web server
 * 
 * @component
 * @example
 * ```tsx
 * <WizardStepConfigureDns 
 *   domain={domainObject} 
 *   verificationMethod="txt" 
 *   verificationToken="verify_abc123xyz" 
 * />
 * ```
 * 
 * @param {WizardStepConfigureDnsProps} props - Component props
 * @param {CustomDomain} props.domain - Domain object yang sedang dikonfigurasi
 * @param {DomainVerificationMethod} props.verificationMethod - Metode verifikasi yang dipilih
 * @param {string} props.verificationToken - Token verifikasi unik untuk domain ini
 * 
 * @returns {JSX.Element} DNS configuration instructions card dengan copy buttons
 */
export default function WizardStepConfigureDns({
  domain,
  verificationMethod,
  verificationToken,
}: WizardStepConfigureDnsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getDnsInstructions = () => {
    switch (verificationMethod) {
      case 'txt':
        return {
          recordType: 'TXT',
          name: `_stencil-verify.${domain.domain_name}`,
          value: verificationToken,
          ttl: '3600',
        };
      case 'cname':
        return {
          recordType: 'CNAME',
          name: domain.domain_name,
          value: `verify.stencil.canvastack.com`,
          ttl: '3600',
        };
      case 'file':
        return {
          recordType: 'FILE',
          name: `/.well-known/stencil-verification.txt`,
          value: verificationToken,
          ttl: 'N/A',
        };
    }
  };

  const instructions = getDnsInstructions();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure DNS Records</h3>
        <p className="text-sm text-muted-foreground">
          Add the following DNS record to your domain's DNS settings.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Changes to DNS records may take up to 48 hours to propagate globally.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">DNS Record Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm font-medium">Record Type:</span>
            <code className="col-span-2 bg-muted px-3 py-2 rounded text-sm font-mono">
              {instructions.recordType}
            </code>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm font-medium">Name/Host:</span>
            <div className="col-span-2 flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                {instructions.name}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(instructions.name, 'name')}
              >
                {copiedField === 'name' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-start">
            <span className="text-sm font-medium">Value:</span>
            <div className="col-span-2 flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                {instructions.value}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(instructions.value, 'value')}
              >
                {copiedField === 'value' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm font-medium">TTL:</span>
            <code className="col-span-2 bg-muted px-3 py-2 rounded text-sm font-mono">
              {instructions.ttl}
            </code>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          Need help? Check your DNS provider's documentation for instructions on adding DNS
          records.
        </AlertDescription>
      </Alert>
    </div>
  );
}
