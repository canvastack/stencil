import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, Settings, TrendingUp, History, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { tenantApiClient } from '@/lib/api-client';
import { ManualRateForm } from '@/components/admin/exchange-rate/ManualRateForm';
import { ProviderConfigurationForm } from '@/components/admin/exchange-rate/ProviderConfigurationForm';
import { QuotaDashboard } from '@/components/admin/exchange-rate/QuotaDashboard';
import { ExchangeRateHistory } from '@/components/admin/exchange-rate/ExchangeRateHistory';

interface ExchangeRateSettings {
  uuid: string;
  mode: 'manual' | 'auto';
  manual_rate: number | null;
  current_rate: number | null;
  active_provider_id: string | null;
  active_provider: {
    uuid: string;
    name: string;
    is_enabled: boolean;
    priority: number;
  } | null;
  auto_update_enabled: boolean;
  auto_update_time: string;
  last_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Provider {
  uuid: string;
  name: string;
  code: string;
  is_enabled: boolean;
  requires_api_key: boolean;
  is_unlimited: boolean;
  monthly_quota: number;
  priority: number;
  warning_threshold: number;
  critical_threshold: number;
  remaining_quota: number | null;
  quota_percentage: number;
  next_reset_date: string;
}

export default function ExchangeRateSettings() {
  const [settings, setSettings] = useState<ExchangeRateSettings | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const { toast } = useToast();

  // Load settings and providers
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsResponse, providersResponse] = await Promise.all([
        tenantApiClient.get('/settings/exchange-rate-settings'),
        tenantApiClient.get('/settings/exchange-rate-providers')
      ]);

      setSettings(settingsResponse.data.data);
      setProviders(providersResponse.data.data);
    } catch (error: any) {
      console.error('Failed to load exchange rate data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exchange rate settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<ExchangeRateSettings>) => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await tenantApiClient.put('/settings/exchange-rate-settings', updates);
      
      setSettings(response.data.data);
      toast({
        title: 'Success',
        description: 'Exchange rate settings updated successfully',
      });
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModeChange = async (mode: 'manual' | 'auto') => {
    if (mode === 'manual') {
      // When switching to manual, require manual_rate
      const manualRate = settings?.manual_rate || settings?.current_rate || 15000;
      await updateSettings({ 
        mode, 
        manual_rate: manualRate 
      });
    } else {
      // When switching to auto, require active_provider_id
      const activeProviderId = settings?.active_provider_id || providers.find(p => p.is_enabled)?.uuid;
      if (!activeProviderId) {
        toast({
          title: 'Error',
          description: 'Please enable at least one provider for auto mode',
          variant: 'destructive',
        });
        return;
      }
      await updateSettings({ 
        mode, 
        active_provider_id: activeProviderId 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load exchange rate settings. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exchange Rate Settings</h1>
        <p className="text-muted-foreground">
          Configure currency conversion settings and monitor API usage
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exchange Rate Mode</CardTitle>
              <CardDescription>
                Choose how exchange rates are determined for currency conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="manual"
                    name="mode"
                    value="manual"
                    checked={settings.mode === 'manual'}
                    onChange={() => handleModeChange('manual')}
                    disabled={saving}
                  />
                  <Label htmlFor="manual" className="font-medium">
                    Manual Mode
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Set a fixed exchange rate that will be used for all conversions
                </p>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="auto"
                    name="mode"
                    value="auto"
                    checked={settings.mode === 'auto'}
                    onChange={() => handleModeChange('auto')}
                    disabled={saving}
                  />
                  <Label htmlFor="auto" className="font-medium">
                    Automatic Mode
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Automatically fetch exchange rates from configured API providers
                </p>
              </div>

              {settings.mode === 'manual' && (
                <ManualRateForm
                  currentRate={settings.manual_rate}
                  onUpdate={(rate) => updateSettings({ manual_rate: rate })}
                  loading={saving}
                />
              )}

              {settings.mode === 'auto' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Active Provider</Label>
                      <Select
                        value={settings.active_provider_id || ''}
                        onValueChange={(value) => updateSettings({ active_provider_id: value })}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.filter(p => p.is_enabled).map((provider) => (
                            <SelectItem key={provider.uuid} value={provider.uuid}>
                              {provider.name} (Priority {provider.priority})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Current Rate</Label>
                      <Input
                        value={settings.current_rate ? `IDR ${settings.current_rate.toLocaleString()}` : 'Not set'}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-update"
                      checked={settings.auto_update_enabled}
                      onCheckedChange={(checked) => updateSettings({ auto_update_enabled: checked })}
                      disabled={saving}
                    />
                    <Label htmlFor="auto-update">Enable automatic daily updates</Label>
                  </div>

                  {settings.auto_update_enabled && (
                    <div className="space-y-2">
                      <Label>Update Time</Label>
                      <Input
                        type="time"
                        value={settings.auto_update_time}
                        onChange={(e) => updateSettings({ auto_update_time: e.target.value })}
                        disabled={saving}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              )}

              {settings.last_updated_at && (
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date(settings.last_updated_at).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <ProviderConfigurationForm
            providers={providers}
            onUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <QuotaDashboard providers={providers} />
        </TabsContent>

        <TabsContent value="history">
          <ExchangeRateHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}