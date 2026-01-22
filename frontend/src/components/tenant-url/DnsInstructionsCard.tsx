import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, ExternalLink, Info } from 'lucide-react';
import type { DnsInstructions } from '@/types/tenant-url';

/**
 * Props untuk DnsInstructionsCard component
 */
interface DnsInstructionsCardProps {
  instructions: DnsInstructions;
  domainName: string;
}

/**
 * DnsInstructionsCard Component
 * 
 * Menampilkan instruksi konfigurasi DNS untuk verifikasi domain.
 * Menyediakan fitur copy-to-clipboard untuk semua DNS record values.
 * Juga menampilkan informasi tentang DNS propagation time.
 * 
 * @component
 * @example
 * ```tsx
 * <DnsInstructionsCard 
 *   instructions={{
 *     record_type: 'TXT',
 *     host: '@',
 *     value: 'stencil-verification=abc123',
 *     ttl: 3600
 *   }}
 *   domainName="example.com"
 * />
 * ```
 * 
 * @param {DnsInstructionsCardProps} props - Component props
 * @param {DnsInstructions} props.instructions - DNS record information yang harus dikonfigurasi
 * @param {string} props.domainName - Nama domain yang sedang diverifikasi
 * 
 * @returns {JSX.Element} Card dengan DNS configuration instructions dan copy buttons
 */
export default function DnsInstructionsCard({
  instructions,
  domainName,
}: DnsInstructionsCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card hover={false}>
      <CardHeader>
        <CardTitle className="text-base">DNS Configuration for {domainName}</CardTitle>
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
          <div className="col-span-2 flex items-start gap-2">
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

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <p className="font-semibold mb-1">DNS propagation may take time:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Typical propagation: 15 minutes to 24 hours</li>
              <li>Lower TTL speeds up propagation</li>
              <li>You can verify after adding the record</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button variant="outline" className="w-full" asChild>
          <a href="https://www.whatsmydns.net/" target="_blank" rel="noopener noreferrer">
            Check DNS Propagation
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
