import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileText, Globe, CheckCircle2 } from 'lucide-react';
import type { DomainVerificationMethod } from '@/types/tenant-url';

/**
 * Props untuk WizardStepChooseMethod component
 */
interface WizardStepChooseMethodProps {
  selectedMethod: DomainVerificationMethod;
  onMethodChange: (method: DomainVerificationMethod) => void;
}

interface MethodOption {
  value: DomainVerificationMethod;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
}

const METHOD_OPTIONS: MethodOption[] = [
  {
    value: 'txt',
    title: 'TXT Record',
    description: 'Add a TXT record to your DNS settings',
    icon: Globe,
    recommended: true,
  },
  {
    value: 'cname',
    title: 'CNAME Record',
    description: 'Point your domain to our verification server',
    icon: Globe,
  },
  {
    value: 'file',
    title: 'File Upload',
    description: 'Upload a verification file to your website',
    icon: FileText,
  },
];

/**
 * WizardStepChooseMethod Component - Step 2 of Domain Verification Wizard
 * 
 * Langkah kedua dalam wizard untuk memilih metode verifikasi domain ownership.
 * Menyediakan 3 pilihan metode verifikasi: TXT Record (recommended), CNAME Record, atau File Upload.
 * 
 * TXT Record adalah metode yang paling recommended karena paling universal dan didukung oleh semua DNS providers.
 * 
 * @component
 * @example
 * ```tsx
 * <WizardStepChooseMethod 
 *   selectedMethod="txt" 
 *   onMethodChange={(method) => setMethod(method)} 
 * />
 * ```
 * 
 * @param {WizardStepChooseMethodProps} props - Component props
 * @param {DomainVerificationMethod} props.selectedMethod - Metode verifikasi yang sedang dipilih ('txt', 'cname', atau 'file')
 * @param {Function} props.onMethodChange - Callback saat metode verifikasi berubah
 * 
 * @returns {JSX.Element} Grid of selectable verification method cards
 * 
 * @see {@link DomainVerificationMethod} untuk tipe metode yang tersedia
 */
export default function WizardStepChooseMethod({
  selectedMethod,
  onMethodChange,
}: WizardStepChooseMethodProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Verification Method</h3>
        <p className="text-sm text-muted-foreground">
          Select how you want to verify domain ownership
        </p>
      </div>

      <div className="grid gap-3">
        {METHOD_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMethod === option.value;

          return (
            <Card
              key={option.value}
              className={cn(
                'relative cursor-pointer p-4 transition-all hover:border-primary',
                isSelected && 'border-primary bg-primary/5'
              )}
              onClick={() => onMethodChange(option.value)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{option.title}</h4>
                    {option.recommended && (
                      <Badge variant="default" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>

                {isSelected && (
                  <div className="text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
