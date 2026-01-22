import { useState } from 'react';
import { useUrlConfiguration, useUpdateUrlConfiguration } from '@/hooks/useTenantUrl';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import UrlPatternSelector from '@/components/tenant-url/UrlPatternSelector';
import SubdomainConfigForm from '@/components/tenant-url/SubdomainConfigForm';
import PathConfigForm from '@/components/tenant-url/PathConfigForm';
import AdvancedSettingsForm from '@/components/tenant-url/AdvancedSettingsForm';
import type { TenantUrlConfiguration, UrlPatternType } from '@/types/tenant-url';

/**
 * UrlConfiguration Page Component
 * 
 * Halaman untuk mengkonfigurasi URL pattern dan settings untuk tenant.
 * Memungkinkan admin tenant untuk:
 * - Memilih primary URL pattern (subdomain/path-based/custom domain)
 * - Mengkonfigurasi subdomain pattern
 * - Mengkonfigurasi path-based prefix
 * - Mengatur advanced settings (HTTPS enforcement, WWW redirect, Analytics tracking)
 * 
 * Component menggunakan local state untuk menyimpan perubahan sementara (unsaved changes)
 * dan menampilkan Save/Reset buttons saat ada perubahan yang belum disimpan.
 * 
 * Data fetching menggunakan React Query hooks untuk automatic caching dan refetching.
 * Form validation dilakukan menggunakan Zod schema di child components.
 * 
 * @page
 * @route /admin/url-configuration
 * @access Tenant Admin only
 * 
 * @returns {JSX.Element} URL configuration page dengan forms dan settings
 */
export default function UrlConfiguration() {
  const { tenant } = useTenantAuth();
  const { data: config, isLoading, isError, error } = useUrlConfiguration();
  const updateMutation = useUpdateUrlConfiguration();

  const [localConfig, setLocalConfig] = useState<Partial<TenantUrlConfiguration>>({});

  const currentConfig = { ...config, ...localConfig };

  const handlePatternChange = (pattern: UrlPatternType) => {
    setLocalConfig((prev) => ({
      ...prev,
      primary_url_pattern: pattern,
    }));
  };

  const handleSubdomainChange = (data: { enabled: boolean; pattern: string }) => {
    setLocalConfig((prev) => ({
      ...prev,
      is_subdomain_enabled: data.enabled,
      subdomain_pattern: data.pattern,
    }));
  };

  const handlePathChange = (data: { enabled: boolean; prefix: string }) => {
    setLocalConfig((prev) => ({
      ...prev,
      is_path_based_enabled: data.enabled,
      path_prefix: data.prefix,
    }));
  };

  const handleAdvancedChange = (data: {
    force_https: boolean;
    enable_www_redirect: boolean;
    enable_analytics_tracking: boolean;
  }) => {
    setLocalConfig((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(localConfig);
    setLocalConfig({});
  };

  const handleReset = () => {
    setLocalConfig({});
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load URL configuration: {(error as Error)?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            No URL configuration found. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasChanges = Object.keys(localConfig).length > 0;
  const tenantSlug = tenant?.slug || 'tenant';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">URL Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure how users can access your tenant via different URL patterns
        </p>
      </div>

      <Tabs defaultValue="patterns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="patterns">URL Patterns</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary URL Pattern</CardTitle>
              <CardDescription>
                Select your primary method for accessing the tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UrlPatternSelector
                value={currentConfig.primary_url_pattern}
                onChange={handlePatternChange}
                tenantSlug={tenantSlug}
              />
            </CardContent>
          </Card>

          {currentConfig.primary_url_pattern === 'subdomain' && (
            <Card>
              <CardHeader>
                <CardTitle>Subdomain Configuration</CardTitle>
                <CardDescription>
                  Configure subdomain-based access settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubdomainConfigForm
                  enabled={currentConfig.is_subdomain_enabled ?? false}
                  pattern={currentConfig.subdomain_pattern || tenantSlug}
                  onChange={handleSubdomainChange}
                />
              </CardContent>
            </Card>
          )}

          {currentConfig.primary_url_pattern === 'path' && (
            <Card>
              <CardHeader>
                <CardTitle>Path-Based Configuration</CardTitle>
                <CardDescription>
                  Configure path-based access settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PathConfigForm
                  enabled={currentConfig.is_path_based_enabled ?? false}
                  prefix={currentConfig.path_prefix || tenantSlug}
                  onChange={handlePathChange}
                />
              </CardContent>
            </Card>
          )}

          {currentConfig.primary_url_pattern === 'custom_domain' && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain Configuration</CardTitle>
                <CardDescription>
                  Custom domain management is available in the Custom Domains page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    To configure custom domains, please visit the{' '}
                    <a href="/admin/custom-domains" className="font-semibold text-primary hover:underline">
                      Custom Domains
                    </a>{' '}
                    page.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedSettingsForm
            forceHttps={currentConfig.force_https ?? true}
            enableWwwRedirect={currentConfig.enable_www_redirect ?? false}
            enableAnalyticsTracking={currentConfig.enable_analytics_tracking ?? true}
            onChange={handleAdvancedChange}
          />
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background pb-4">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || updateMutation.isPending}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Changes
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending || !hasChanges}
        >
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
