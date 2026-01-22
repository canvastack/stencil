import { useState, useEffect } from 'react';
import { useAddCustomDomain, useVerifyDomain } from '@/hooks/useTenantUrl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import WizardStepAddDomain from '@/components/tenant-url/wizard-steps/WizardStepAddDomain';
import WizardStepChooseMethod from '@/components/tenant-url/wizard-steps/WizardStepChooseMethod';
import WizardStepConfigureDns from '@/components/tenant-url/wizard-steps/WizardStepConfigureDns';
import WizardStepVerify from '@/components/tenant-url/wizard-steps/WizardStepVerify';
import WizardStepSslSetup from '@/components/tenant-url/wizard-steps/WizardStepSslSetup';
import type { CustomDomain, DomainVerificationMethod } from '@/types/tenant-url';

/**
 * Props untuk DomainVerificationWizard component
 */
interface DomainVerificationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain?: CustomDomain | null;
}

interface Step {
  id: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 1, title: 'Add Domain', description: 'Enter your domain name' },
  { id: 2, title: 'Choose Method', description: 'Select verification method' },
  { id: 3, title: 'Configure DNS', description: 'Update DNS records' },
  { id: 4, title: 'Verify', description: 'Confirm ownership' },
  { id: 5, title: 'SSL Setup', description: 'Certificate provisioning' },
];

/**
 * DomainVerificationWizard Component
 * 
 * Multi-step wizard untuk menambahkan dan memverifikasi custom domain.
 * Wizard memandu user melalui 5 langkah: Add Domain → Choose Method → Configure DNS → Verify → SSL Setup.
 * 
 * Wizard dapat dibuka dalam 2 mode:
 * 1. Add new domain (semua steps dari awal)
 * 2. Resume verification (melanjutkan dari step terakhir untuk domain yang sudah ada)
 * 
 * @component
 * @example
 * ```tsx
 * // Add new domain
 * <DomainVerificationWizard 
 *   open={isOpen} 
 *   onOpenChange={setIsOpen}
 * />
 * 
 * // Resume existing domain verification
 * <DomainVerificationWizard 
 *   open={isOpen} 
 *   onOpenChange={setIsOpen}
 *   domain={existingDomain}
 * />
 * ```
 * 
 * @param {DomainVerificationWizardProps} props - Component props
 * @param {boolean} props.open - Apakah wizard dialog terbuka
 * @param {Function} props.onOpenChange - Callback untuk mengubah state open/close
 * @param {CustomDomain | null} [props.domain] - Optional existing domain untuk resume verification
 * 
 * @returns {JSX.Element} Dialog modal dengan 5-step wizard interface
 */
export default function DomainVerificationWizard({
  open,
  onOpenChange,
  domain,
}: DomainVerificationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [domainName, setDomainName] = useState(domain?.domain_name || '');
  const [verificationMethod, setVerificationMethod] = useState<DomainVerificationMethod>('txt');
  const [addedDomain, setAddedDomain] = useState<CustomDomain | null>(domain || null);
  const [verificationToken, setVerificationToken] = useState(domain?.verification_token || '');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const addMutation = useAddCustomDomain();
  const verifyMutation = useVerifyDomain();

  useEffect(() => {
    if (domain) {
      setAddedDomain(domain);
      setDomainName(domain.domain_name);
      setVerificationToken(domain.verification_token);

      if (domain.verification_status === 'verified') {
        setCurrentStep(5);
      } else if (domain.verification_token) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else {
      setCurrentStep(1);
      setDomainName('');
      setAddedDomain(null);
      setVerificationToken('');
      setVerificationError(null);
    }
  }, [domain, open]);

  const progressPercentage = (currentStep / STEPS.length) * 100;

  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setVerificationError(null);
    }
  };

  const handleAddDomain = async () => {
    try {
      const result = await addMutation.mutateAsync({
        domain_name: domainName,
        verification_method: verificationMethod,
      });
      setAddedDomain(result);
      setVerificationToken(result.verification_token);
      goToNextStep();
    } catch (error) {
      console.error('Failed to add domain:', error);
    }
  };

  const handleMethodSelected = () => {
    goToNextStep();
  };

  const handleDnsConfigured = () => {
    goToNextStep();
  };

  const handleVerify = async () => {
    if (addedDomain) {
      try {
        setVerificationError(null);
        const result = await verifyMutation.mutateAsync(addedDomain.uuid);
        setAddedDomain(result.domain);
        goToNextStep();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Verification failed';
        setVerificationError(errorMessage);
      }
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    setTimeout(() => {
      setCurrentStep(1);
      setDomainName('');
      setAddedDomain(null);
      setVerificationToken('');
      setVerificationError(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Domain Verification Wizard</DialogTitle>
          <DialogDescription>
            Follow these steps to add and verify your custom domain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {currentStep} of {STEPS.length}
            </span>
            <span>{STEPS[currentStep - 1].title}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  currentStep > step.id
                    ? 'bg-primary border-primary text-primary-foreground'
                    : currentStep === step.id
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-full h-0.5 mx-2',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )}
                  style={{ minWidth: '20px', maxWidth: '60px' }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="min-h-[300px] py-4">
          {currentStep === 1 && (
            <WizardStepAddDomain domainName={domainName} onDomainNameChange={setDomainName} />
          )}
          {currentStep === 2 && (
            <WizardStepChooseMethod
              selectedMethod={verificationMethod}
              onMethodChange={setVerificationMethod}
            />
          )}
          {currentStep === 3 && addedDomain && (
            <WizardStepConfigureDns
              domain={addedDomain}
              verificationMethod={verificationMethod}
              verificationToken={verificationToken}
            />
          )}
          {currentStep === 4 && addedDomain && (
            <WizardStepVerify
              domain={addedDomain}
              isVerifying={verifyMutation.isPending}
              verificationError={verificationError}
              onVerify={handleVerify}
            />
          )}
          {currentStep === 5 && addedDomain && <WizardStepSslSetup domain={addedDomain} />}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={goToPrevStep}
            disabled={currentStep === 1 || addMutation.isPending || verifyMutation.isPending}
          >
            Previous
          </Button>
          {currentStep < STEPS.length && currentStep !== 4 && (
            <Button
              onClick={() => {
                if (currentStep === 1) {
                  handleAddDomain();
                } else if (currentStep === 2) {
                  handleMethodSelected();
                } else if (currentStep === 3) {
                  handleDnsConfigured();
                }
              }}
              disabled={currentStep === 1 && (!domainName || addMutation.isPending)}
            >
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Next
            </Button>
          )}
          {currentStep === STEPS.length && (
            <Button onClick={handleComplete}>Finish</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
