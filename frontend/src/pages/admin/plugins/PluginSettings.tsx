import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { pluginService } from '@/services/api/plugins';
import { InstalledPlugin } from '@/types/plugin';

export default function PluginSettings() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<InstalledPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});

  const fetchPluginDetails = async () => {
    if (!uuid) return;

    setIsLoading(true);
    try {
      const data = await pluginService.getInstalledPluginDetails(uuid);
      setPlugin(data);
      setSettings(data.settings || {});
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

  const handleSave = async () => {
    if (!plugin) return;

    setIsSaving(true);
    try {
      toast.info('Settings saved', {
        description: 'Plugin settings will be updated when the backend API is implemented',
      });
    } catch (error: any) {
      toast.error('Failed to save settings', {
        description: error.message || 'Unable to save plugin settings',
      });
    } finally {
      setIsSaving(false);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
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
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-primary to-orange-light hover:opacity-90"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plugin Configuration</CardTitle>
          <CardDescription>
            Customize {plugin.display_name} to suit your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <SettingsIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Plugin-Specific Settings Coming Soon
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This plugin currently has no configurable settings, or settings will be
                loaded from the plugin's configuration schema. Each plugin can define its
                own settings interface.
              </p>
            </div>

            {plugin.manifest && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Current Configuration</h3>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(settings, null, 2)}
                  </pre>
                </div>
              </div>
            )}
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
    </div>
  );
}
