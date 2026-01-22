import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

/**
 * Props untuk WizardStepAddDomain component
 */
interface WizardStepAddDomainProps {
  domainName: string;
  onDomainNameChange: (value: string) => void;
}

/**
 * WizardStepAddDomain Component - Step 1 of Domain Verification Wizard
 * 
 * Langkah pertama dalam wizard untuk menambahkan custom domain.
 * User memasukkan domain name yang ingin ditambahkan (contoh: example.com).
 * 
 * Input akan divalidasi di parent component sebelum melanjutkan ke step berikutnya.
 * 
 * @component
 * @example
 * ```tsx
 * <WizardStepAddDomain 
 *   domainName="example.com" 
 *   onDomainNameChange={(value) => setDomainName(value)} 
 * />
 * ```
 * 
 * @param {WizardStepAddDomainProps} props - Component props
 * @param {string} props.domainName - Domain name yang sedang diinput oleh user
 * @param {Function} props.onDomainNameChange - Callback saat domain name berubah
 * 
 * @returns {JSX.Element} Form input untuk domain name dengan info alert
 */
export default function WizardStepAddDomain({
  domainName,
  onDomainNameChange,
}: WizardStepAddDomainProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Enter Your Domain Name</h3>
        <p className="text-sm text-muted-foreground">
          Enter the custom domain you want to use for your tenant.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domainName">Domain Name</Label>
        <Input
          id="domainName"
          placeholder="example.com"
          value={domainName}
          onChange={(e) => onDomainNameChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Enter your domain without http:// or https://
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Make sure you have access to your domain's DNS settings before continuing.
        </AlertDescription>
      </Alert>
    </div>
  );
}
