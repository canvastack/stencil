import { useState } from 'react';
import { useCustomDomains, useDeleteCustomDomain, useSetPrimaryDomain } from '@/hooks/useTenantUrl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Globe, Plus, Trash2, Star, Settings, ExternalLink, AlertCircle } from 'lucide-react';
import DomainVerificationWizard from '@/components/tenant-url/DomainVerificationWizard';
import DomainVerificationBadge from '@/components/tenant-url/DomainVerificationBadge';
import SslStatusBadge from '@/components/tenant-url/SslStatusBadge';
import DnsInstructionsDialog from '@/components/tenant-url/DnsInstructionsDialog';
import type { CustomDomain } from '@/types/tenant-url';

/**
 * CustomDomains Page Component
 * 
 * Halaman untuk mengelola custom domains untuk tenant.
 * Memungkinkan admin tenant untuk:
 * - Menambahkan custom domain baru melalui 5-step verification wizard
 * - Melihat list semua custom domains dengan status verifikasi dan SSL
 * - Memverifikasi domain ownership (TXT/CNAME/File methods)
 * - Melihat DNS configuration instructions
 * - Set primary domain
 * - Delete domains dengan confirmation dialog
 * - Monitor SSL certificate status dan expiry
 * 
 * Domain Verification Flow:
 * 1. User memasukkan domain name
 * 2. Pilih verification method (TXT/CNAME/File)
 * 3. Configure DNS records
 * 4. Verify domain ownership
 * 5. SSL certificate provisioning
 * 
 * Component menampilkan empty state jika belum ada domains dan menggunakan
 * React Query untuk automatic refetching dan cache invalidation.
 * 
 * @page
 * @route /admin/custom-domains
 * @access Tenant Admin only
 * 
 * @returns {JSX.Element} Custom domains management page dengan domain cards dan wizard
 */
export default function CustomDomains() {
  const { data: domains, isLoading, isError, error } = useCustomDomains();
  
  const deleteMutation = useDeleteCustomDomain();
  const setPrimaryMutation = useSetPrimaryDomain();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<CustomDomain | null>(null);

  const [dnsDialogOpen, setDnsDialogOpen] = useState(false);
  const [dnsDomain, setDnsDomain] = useState<CustomDomain | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<CustomDomain | null>(null);

  const handleAddDomain = () => {
    setSelectedDomain(null);
    setWizardOpen(true);
  };

  const handleCompleteVerification = (domain: CustomDomain) => {
    setSelectedDomain(domain);
    setWizardOpen(true);
  };

  const handleSetPrimary = (domainUuid: string) => {
    setPrimaryMutation.mutate(domainUuid);
  };

  const handleViewDns = (domain: CustomDomain) => {
    setDnsDomain(domain);
    setDnsDialogOpen(true);
  };

  const handleDeleteClick = (domain: CustomDomain) => {
    setDomainToDelete(domain);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (domainToDelete) {
      deleteMutation.mutate(domainToDelete.uuid);
      setDeleteDialogOpen(false);
      setDomainToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load custom domains: {(error as Error)?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasVerifiedDomains = domains && domains.some((d) => d.verification_status === 'verified');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Custom Domains</h1>
          <p className="text-muted-foreground mt-2">
            Add and manage custom domain names for your tenant
          </p>
        </div>
        <Button onClick={handleAddDomain}>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {!domains || domains.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              No Custom Domains
            </CardTitle>
            <CardDescription>
              You haven't added any custom domains yet. Click "Add Domain" to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Custom domains allow you to use your own domain name (e.g., app.yourcompany.com)
                instead of a subdomain or path-based URL.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => (
            <Card key={domain.uuid}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{domain.domain_name}</CardTitle>
                      {domain.is_primary && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <DomainVerificationBadge status={domain.verification_status} />
                      <SslStatusBadge
                        status={domain.ssl_status}
                        expiresAt={domain.ssl_expires_at}
                      />
                      <Badge variant={domain.dns_configured ? 'default' : 'secondary'}>
                        DNS {domain.dns_configured ? 'Configured' : 'Pending'}
                      </Badge>
                      <Badge variant={domain.is_active ? 'default' : 'secondary'}>
                        {domain.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.verification_status !== 'verified' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteVerification(domain)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Complete Verification
                      </Button>
                    )}
                    {domain.verification_status === 'verified' && !domain.is_primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetPrimary(domain.uuid)}
                        disabled={setPrimaryMutation.isPending}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDns(domain)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      DNS Instructions
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(domain)}
                      disabled={domain.is_primary || deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Verification Method:</span>
                    <p className="font-medium uppercase">{domain.verification_method}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SSL Provider:</span>
                    <p className="font-medium">{domain.ssl_provider || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">DNS Provider:</span>
                    <p className="font-medium">{domain.dns_provider || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Added:</span>
                    <p className="font-medium">
                      {new Date(domain.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {domain.verification_status === 'failed' && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Domain verification failed. Please check your DNS configuration and try again.
                    </AlertDescription>
                  </Alert>
                )}

                {domain.verification_status === 'pending' && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      Domain verification is pending. Please ensure DNS records are configured correctly.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasVerifiedDomains && (
        <Alert>
          <AlertDescription>
            <strong>Tip:</strong> You can set any verified domain as your primary domain. The primary
            domain will be used as the default URL for your tenant.
          </AlertDescription>
        </Alert>
      )}

      <DomainVerificationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        domain={selectedDomain}
      />

      {dnsDomain && (
        <DnsInstructionsDialog
          open={dnsDialogOpen}
          onOpenChange={setDnsDialogOpen}
          domainUuid={dnsDomain.uuid}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{domainToDelete?.domain_name}</strong>? This
              action cannot be undone and the domain will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive">
              Delete Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
