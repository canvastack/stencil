import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const pathSchema = z.object({
  enabled: z.boolean(),
  prefix: z.string()
    .min(2, 'Path prefix must be at least 2 characters')
    .max(50, 'Path prefix must not exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Path prefix can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z]/, 'Path prefix must start with a letter'),
});

type PathFormData = z.infer<typeof pathSchema>;

/**
 * Props untuk PathConfigForm component
 */
interface PathConfigFormProps {
  enabled: boolean;
  prefix: string;
  onChange: (data: { enabled: boolean; prefix: string }) => void;
}

/**
 * PathConfigForm Component
 * 
 * Form untuk konfigurasi path-based URL pattern.
 * Menyediakan validasi real-time dengan Zod schema dan menampilkan preview URL.
 * 
 * @component
 * @example
 * ```tsx
 * <PathConfigForm 
 *   enabled={true} 
 *   prefix="mytenant"
 *   onChange={(data) => updateConfig(data)}
 * />
 * ```
 * 
 * @param {PathConfigFormProps} props - Component props
 * @param {boolean} props.enabled - Apakah path-based access diaktifkan
 * @param {string} props.prefix - Path prefix (contoh: "mytenant" untuk stencil.canvastack.com/mytenant)
 * @param {Function} props.onChange - Callback saat form value berubah dengan valid data
 * 
 * @returns {JSX.Element} Form dengan path configuration fields
 */
export default function PathConfigForm({
  enabled,
  prefix,
  onChange,
}: PathConfigFormProps) {
  const form = useForm<PathFormData>({
    resolver: zodResolver(pathSchema),
    defaultValues: {
      enabled,
      prefix,
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
                <FormLabel className="text-base">Enable Path-Based Access</FormLabel>
                <FormDescription>
                  Allow users to access your site via URL path
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
              name="prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Path Prefix</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">stencil.canvastack.com/</span>
                      <Input
                        {...field}
                        placeholder="mytenant"
                        className="max-w-xs"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose your URL path prefix (lowercase letters, numbers, hyphens only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('prefix') && form.formState.isValid && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your URL will be:</strong>{' '}
                  <code className="bg-muted px-2 py-1 rounded">
                    https://stencil.canvastack.com/{form.watch('prefix')}
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
