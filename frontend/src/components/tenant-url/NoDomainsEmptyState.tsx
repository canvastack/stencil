import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Plus } from 'lucide-react';

/**
 * Props untuk NoDomainsEmptyState component
 */
interface NoDomainsEmptyStateProps {
  onAddDomain: () => void;
}

/**
 * NoDomainsEmptyState Component
 * 
 * Menampilkan empty state ketika tenant belum memiliki custom domain.
 * Memberikan call-to-action yang jelas untuk menambahkan domain pertama.
 * 
 * @component
 * @example
 * ```tsx
 * <NoDomainsEmptyState onAddDomain={() => openAddDomainDialog()} />
 * ```
 * 
 * @param {NoDomainsEmptyStateProps} props - Component props
 * @param {Function} props.onAddDomain - Callback yang dipanggil saat user klik tombol "Add Your First Domain"
 * 
 * @returns {JSX.Element} Empty state card dengan CTA button
 */
export default function NoDomainsEmptyState({ onAddDomain }: NoDomainsEmptyStateProps) {
  return (
    <Card hover={false}>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 rounded-full bg-primary/10 p-6">
          <Globe className="h-16 w-16 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold mb-3">No custom domains yet</h3>
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          Add your first custom domain to use your own domain name for your tenant.
          We'll guide you through the verification process step by step.
        </p>
        <Button size="lg" onClick={onAddDomain}>
          <Plus className="mr-2 h-5 w-5" />
          Add Your First Domain
        </Button>
      </CardContent>
    </Card>
  );
}
