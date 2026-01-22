import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const subdomainSchema = z.object({
  enabled: z.boolean(),
  pattern: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must not exceed 63 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9]/, 'Subdomain must start with a letter or number')
    .regex(/[a-z0-9]$/, 'Subdomain must end with a letter or number'),
});

type SubdomainFormData = z.infer<typeof subdomainSchema>;

/**
 * Props untuk SubdomainConfigForm component
 */
interface SubdomainConfigFormProps {
  enabled: boolean;
  pattern: string;
  onChange: (data: { enabled: boolean; pattern: string }) => void;
}

/**
 * SubdomainConfigForm Component
 * 
 * Form untuk konfigurasi subdomain-based URL pattern.
 * Menyediakan validasi real-time dengan Zod schema dan menampilkan preview URL.
 * 
 * @component
 * @example
 * ```tsx
 * <SubdomainConfigForm 
 *   enabled={true} 
 *   pattern="mytenant"
 *   onChange={(data) => updateConfig(data)}
 * />
 * ```
 * 
 * @param {SubdomainConfigFormProps} props - Component props
 * @param {boolean} props.enabled - Apakah subdomain access diaktifkan
 * @param {string} props.pattern - Subdomain pattern (contoh: "mytenant")
 * @param {Function} props.onChange - Callback saat form value berubah dengan valid data
 * 
 * @returns {JSX.Element} Form dengan subdomain configuration fields
 */
export default function SubdomainConfigForm({
  enabled,
  pattern,
  onChange,
}: SubdomainConfigFormProps) {
  const form = useForm<SubdomainFormData>({
    resolver: zodResolver(subdomainSchema),
    defaultValues: {
      enabled,
      pattern,
    },
  });

  const watchedValues = form.watch();
  
  useEffect(() => {
    if (form.formState.isValid) {
      onChange(watchedValues);
    }
  }, [watchedValues, form.formState.isValid, onChange]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Subdomain Access</FormLabel>
                <FormDescription>
                  Allow users to access your site via subdomain
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

        {form.watch('enabled') && (
          <>
            <FormField
              control={form.control}
              name="pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain Pattern</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        {...field}
                        placeholder="mytenant"
                        className="max-w-xs"
                      />
                      <span className="text-muted-foreground">.stencil.canvastack.com</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose your unique subdomain (lowercase letters, numbers, hyphens only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('pattern') && form.formState.isValid && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your URL will be:</strong>{' '}
                  <code className="bg-muted px-2 py-1 rounded">
                    https://{form.watch('pattern')}.stencil.canvastack.com
                  </code>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </form>
    </Form>
  );
}
