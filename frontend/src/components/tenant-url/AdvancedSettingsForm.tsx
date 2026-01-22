import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Shield, RefreshCw, BarChart } from 'lucide-react';

/**
 * Props untuk AdvancedSettingsForm component
 */
interface AdvancedSettingsFormProps {
  forceHttps: boolean;
  enableWwwRedirect: boolean;
  enableAnalyticsTracking: boolean;
  onChange: (data: {
    force_https: boolean;
    enable_www_redirect: boolean;
    enable_analytics_tracking: boolean;
  }) => void;
}

/**
 * AdvancedSettingsForm Component
 * 
 * Form untuk advanced URL configuration settings.
 * Mengatur HTTPS enforcement, WWW redirect, dan analytics tracking.
 * 
 * @component
 * @example
 * ```tsx
 * <AdvancedSettingsForm 
 *   forceHttps={true} 
 *   enableWwwRedirect={false}
 *   enableAnalyticsTracking={true}
 *   onChange={(data) => updateSettings(data)}
 * />
 * ```
 * 
 * @param {AdvancedSettingsFormProps} props - Component props
 * @param {boolean} props.forceHttps - Apakah force HTTPS redirect diaktifkan
 * @param {boolean} props.enableWwwRedirect - Apakah WWW redirect diaktifkan
 * @param {boolean} props.enableAnalyticsTracking - Apakah URL analytics tracking diaktifkan
 * @param {Function} props.onChange - Callback saat settings berubah
 * 
 * @returns {JSX.Element} Form dengan advanced settings switches
 */
export default function AdvancedSettingsForm({
  forceHttps,
  enableWwwRedirect,
  enableAnalyticsTracking,
  onChange,
}: AdvancedSettingsFormProps) {
  const form = useForm({
    defaultValues: {
      force_https: forceHttps,
      enable_www_redirect: enableWwwRedirect,
      enable_analytics_tracking: enableAnalyticsTracking,
    },
  });

  const watchedValues = form.watch();
  
  useEffect(() => {
    onChange({
      force_https: watchedValues.force_https,
      enable_www_redirect: watchedValues.enable_www_redirect,
      enable_analytics_tracking: watchedValues.enable_analytics_tracking,
    });
  }, [watchedValues, onChange]);

  return (
    <Form {...form}>
      <form className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>HTTPS Enforcement</CardTitle>
            </div>
            <CardDescription>
              Security settings for your URL configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="force_https"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Force HTTPS</FormLabel>
                    <FormDescription>
                      Automatically redirect all HTTP requests to HTTPS
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <CardTitle>URL Redirection</CardTitle>
            </div>
            <CardDescription>
              Configure URL redirection behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="enable_www_redirect"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable WWW Redirect</FormLabel>
                    <FormDescription>
                      Redirect www.yourdomain.com to yourdomain.com
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              <CardTitle>Analytics Tracking</CardTitle>
            </div>
            <CardDescription>
              Monitor URL access patterns and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="enable_analytics_tracking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable URL Analytics</FormLabel>
                    <FormDescription>
                      Track URL access metrics, performance, and user behavior
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
