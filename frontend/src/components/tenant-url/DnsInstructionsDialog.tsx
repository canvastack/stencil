import { useState, useEffect } from 'react';
import { useDnsInstructions } from '@/hooks/useTenantUrl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, ExternalLink, Info } from 'lucide-react';
import type { CustomDomain } from '@/types/tenant-url';

/**
 * Props untuk DnsInstructionsDialog component
 */
interface DnsInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: CustomDomain | null;
}

/**
 * DnsInstructionsDialog Component
 * 
 * Dialog modal untuk menampilkan DNS configuration instructions untuk domain.
 * Fetch DNS instructions dari API dan menyediakan copy-to-clipboard functionality.
 * Menampilkan semua DNS record details yang diperlukan untuk verifikasi.
 * 
 * @component
 * @example
 * ```tsx
 * <DnsInstructionsDialog 
 *   open={isOpen} 
 *   onOpenChange={setIsOpen}
 *   domain={selectedDomain}
 * />
 * ```
 * 
 * @param {DnsInstructionsDialogProps} props - Component props
 * @param {boolean} props.open - Apakah dialog terbuka
 * @param {Function} props.onOpenChange - Callback untuk mengubah state open/close
 * @param {CustomDomain | null} props.domain - Domain yang akan ditampilkan DNS instructions-nya
 * 
 * @returns {JSX.Element} Dialog dengan DNS configuration details
 */
export default function DnsInstructionsDialog({
  open,
  onOpenChange,
  domain,
}: DnsInstructionsDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: instructions, isLoading } = useDnsInstructions(domain?.uuid || '', {
    enabled: !!domain?.uuid && open,
  });

  useEffect(() => {
    if (!open) {
      setCopiedField(null);
    }
  }, [open]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!domain) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>DNS Configuration</DialogTitle>
          <DialogDescription>
            Configure your DNS settings for {domain.domain_name}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : instructions ? (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Add the following DNS records to your domain registrar or DNS provider.
                Changes may take up to 48 hours to propagate.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verification Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <span className="text-sm font-medium">Record Type:</span>
                  <code className="col-span-2 bg-muted px-3 py-2 rounded text-sm font-mono">
                    {instructions.record_type}
                  </code>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <span className="text-sm font-medium">Host/Name:</span>
                  <div className="col-span-2 flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                      {instructions.host}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(instructions.host, 'host')}
                    >
                      {copiedField === 'host' ? (
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

                {instructions.priority && (
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <span className="text-sm font-medium">Priority:</span>
                    <code className="col-span-2 bg-muted px-3 py-2 rounded text-sm font-mono">
                      {instructions.priority}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                Need help? Check your DNS provider's documentation for instructions on adding
                DNS records.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>Failed to load DNS instructions</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
