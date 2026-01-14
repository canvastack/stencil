import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { pluginService } from '@/services/api/plugins';
import { InstalledPlugin, PluginSettingField } from '@/types/plugin';

export default function PluginSettings() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<InstalledPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  const fetchPluginDetails = async () => {
    if (!uuid) return;

    setIsLoading(true);
    try {
      const data = await pluginService.getInstalledPluginDetails(uuid);
      setPlugin(data);

      if (data.settings) {
        Object.entries(data.settings).forEach(([key, value]) => {
          setValue(key, value);
        });
      }
    } catch (error: any) {
      toast.error('Failed to load plugin details', {
        description: error.message || 'Unable to fetch plugin information',
      });
      navigate('/admin/plugins/installed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPluginDetails();
  }, [uuid]);

  const onSubmit = async (data: Record<string, any>) => {
    if (!plugin) return;

    setIsSaving(true);
    try {
      await pluginService.updatePluginSettings(uuid!, { settings: data });
      toast.success('Settings saved successfully', {
        description: `${plugin.display_name} settings have been updated`,
      });
    } catch (error: any) {
      toast.error('Failed to save settings', {
        description: error.message || 'Unable to save plugin settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: PluginSettingField) => {
    const value = watch(field.key);

    switch (field.type) {
      case 'boolean':
        return (
          <div key={field.key} className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor={field.key} className="text-base">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
            </div>
            <Switch
              id={field.key}
              checked={value ?? field.default ?? false}
              onCheckedChange={(checked) => setValue(field.key, checked)}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.key}
              type="number"
              {...register(field.key, {
                required: field.required ? `${field.label} is required` : false,
                min: field.min !== undefined ? { value: field.min, message: `Minimum value is ${field.min}` } : undefined,
                max: field.max !== undefined ? { value: field.max, message: `Maximum value is ${field.max}` } : undefined,
                valueAsNumber: true,
              })}
              defaultValue={field.default}
              min={field.min}
              max={field.max}
              className={errors[field.key] ? 'border-destructive' : ''}
            />
            {errors[field.key] && (
              <p className="text-sm text-destructive">{errors[field.key]?.message as string}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Select
              value={value ?? field.default}
              onValueChange={(val) => setValue(field.key, val)}
            >
              <SelectTrigger id={field.key}>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[field.key] && (
              <p className="text-sm text-destructive">{errors[field.key]?.message as string}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Textarea
              id={field.key}
              {...register(field.key, {
                required: field.required ? `${field.label} is required` : false,
                minLength: field.min_length !== undefined ? { value: field.min_length, message: `Minimum length is ${field.min_length} characters` } : undefined,
                maxLength: field.max_length !== undefined ? { value: field.max_length, message: `Maximum length is ${field.max_length} characters` } : undefined,
              })}
              defaultValue={field.default}
              rows={field.rows || 4}
              className={errors[field.key] ? 'border-destructive' : ''}
            />
            {errors[field.key] && (
              <p className="text-sm text-destructive">{errors[field.key]?.message as string}</p>
            )}
          </div>
        );

      case 'color':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <div className="flex gap-2">
              <Input
                id={field.key}
                type="color"
                {...register(field.key, {
                  required: field.required ? `${field.label} is required` : false,
                  pattern: {
                    value: /^#[0-9A-Fa-f]{6}$/,
                    message: 'Must be a valid hex color (e.g., #FF5733)',
                  },
                })}
                defaultValue={field.default || '#3B82F6'}
                className={`w-20 h-10 ${errors[field.key] ? 'border-destructive' : ''}`}
              />
              <Input
                type="text"
                value={value ?? field.default ?? '#3B82F6'}
                onChange={(e) => setValue(field.key, e.target.value)}
                className="flex-1"
                placeholder="#FF5733"
              />
            </div>
            {errors[field.key] && (
              <p className="text-sm text-destructive">{errors[field.key]?.message as string}</p>
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.key}
              type="text"
              {...register(field.key, {
                required: field.required ? `${field.label} is required` : false,
                minLength: field.min_length !== undefined ? { value: field.min_length, message: `Minimum length is ${field.min_length} characters` } : undefined,
                maxLength: field.max_length !== undefined ? { value: field.max_length, message: `Maximum length is ${field.max_length} characters` } : undefined,
              })}
              defaultValue={field.default}
              className={errors[field.key] ? 'border-destructive' : ''}
            />
            {errors[field.key] && (
              <p className="text-sm text-destructive">{errors[field.key]?.message as string}</p>
            )}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plugin) {
    return null;
  }

  if (plugin.status !== 'active') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/plugins/installed')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-light bg-clip-text text-transparent">
            Plugin Settings
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <SettingsIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Plugin Not Active</h3>
              <p className="text-muted-foreground mb-4">
                This plugin is currently{' '}
                <Badge variant="secondary">{plugin.status}</Badge>. Settings are only
                available for active plugins.
              </p>
              <Button onClick={() => navigate('/admin/plugins/installed')}>
                Back to Installed Plugins
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const schema = plugin?.manifest?.settings_schema;
  const hasSettings = schema && schema.fields && schema.fields.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/plugins/installed')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-light bg-clip-text text-transparent">
              {plugin.display_name} Settings
            </h1>
            <p className="text-muted-foreground mt-1">Configure plugin options</p>
          </div>
        </div>
        {hasSettings && (
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-primary to-orange-light hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plugin Configuration</CardTitle>
          <CardDescription>
            Customize {plugin.display_name} to suit your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasSettings ? (
            <div className="space-y-6">
              {schema.fields.map((field) => renderField(field))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <SettingsIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Configurable Settings
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This plugin currently has no configurable settings defined in its manifest.
                  Contact the plugin developer if you need customization options.
                </p>
              </div>

              {plugin.manifest?.settings && Object.keys(plugin.manifest.settings).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3">Default Configuration</h3>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(plugin.manifest.settings, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plugin Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Plugin Name
              </div>
              <div className="text-sm">{plugin.plugin_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Version</div>
              <Badge variant="secondary">{plugin.version}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
              <Badge variant="default">{plugin.status}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Installed On
              </div>
              <div className="text-sm">
                {plugin.installed_at
                  ? new Date(plugin.installed_at).toLocaleDateString()
                  : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plugin Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Plugin Name
              </div>
              <div className="text-sm">{plugin.plugin_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Version</div>
              <Badge variant="secondary">{plugin.version}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
              <Badge variant="default">{plugin.status}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Installed On
              </div>
              <div className="text-sm">
                {plugin.installed_at
                  ? new Date(plugin.installed_at).toLocaleDateString()
                  : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
