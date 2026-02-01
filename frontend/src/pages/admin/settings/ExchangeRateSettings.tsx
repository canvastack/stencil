import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, Settings as SettingsIcon, History } from 'lucide-react';
import { toast } from 'sonner';
import { exchangeRateService } from '@/services/api/exchangeRate';
import { ExchangeRateSetting, ExchangeRateProvider } from '@/types/exchangeRate';
import { ManualRateForm } from '@/components/admin/exchange-rate/ManualRateForm';
import { ProviderConfigurationForm } from '@/components/admin/exchange-rate/ProviderConfigurationForm';
import { QuotaDashboard } from '@/components/admin/exchange-rate/QuotaDashboard';
import { ExchangeRateHistory } from '@/components/admin/exchange-rate/ExchangeRateHistory';

export default function ExchangeRateSettings() {
  const [settings, setSettings] = useState<ExchangeRateSetting | null>(null);
  const [providers, setProviders] = useState<ExchangeRateProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, providersData] = await Promise.all([
        exchangeRateService.getSettings(),
        exchangeRateService.getProviders(),
      ]);
      setSettings(settingsData);
      setProviders(providersData);
    } catch (error) {
      console.error('Failed to load exchange rate data:', error);
      toast.error('Failed to load exchange rate settings');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (mode: 'manual' | 'auto') => {
    if (!settings) return;

    // If switching to manual mode and no manual_rate exists, just switch mode
    // The ManualRateForm will be shown and user can set the rate there
    if (mode === 'manual' && !settings.manual_rate) {
      // Use a default rate (current_rate or 16000 as fallback)
      const defaultRate = settings.current_rate || 16000;
      
      try {
        const updatedSettings = await exchangeRateService.updateSettings({
          mode: 'manual',
          manual_rate: defaultRate,
          auto_update_enabled: settings.auto_update_enabled,
          update_time: settings.update_time,
        });
        setSettings(updatedSettings);
        toast.success('Switched to Manual mode. You can now update the rate below.');
        return;
      } catch (error) {
        console.error('Failed to switch to manual mode:', error);
        toast.error('Failed to switch to manual mode');
        return;
      }
    }

    try {
      const updateData: any = {
        mode,
        auto_update_enabled: settings.auto_update_enabled,
        update_time: settings.update_time,
      };

      // Include manual_rate when switching to manual mode
      if (mode === 'manual') {
        updateData.manual_rate = settings.manual_rate;
      }

      // Include active_provider_id when switching to auto mode
      if (mode === 'auto' && settings.active_provider_id) {
        updateData.active_provider_id = settings.active_provider_id;
      }

      const updatedSettings = await exchangeRateService.updateSettings(updateData);
      setSettings(updatedSettings);
      toast.success(`Switched to ${mode === 'manual' ? 'Manual' : 'Automatic'} mode`);
    } catch (error) {
      console.error('Failed to update mode:', error);
      toast.error('Failed to update exchange rate mode');
    }
  };

  const handleSettingsUpdate = (updatedSettings: ExchangeRateSetting) => {
    setSettings(updatedSettings);
  };

  const handleProvidersUpdate = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Failed to load exchange rate settings</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exchange Rate Settings</h1>
        <p className="text-muted-foreground">
          Configure currency conversion rates and API providers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">
            <DollarSign className="mr-2 h-4 w-4" />
            Rate Settings
          </TabsTrigger>
          <TabsTrigger value="providers">
            <SettingsIcon className="mr-2 h-4 w-4" />
            API Providers
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Exchange Rate Mode</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose how exchange rates are managed for your store
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleModeChange('manual')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    settings.mode === 'manual'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold mb-1">Manual Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Set exchange rates manually
                  </div>
                </button>

                <button
                  onClick={() => handleModeChange('auto')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    settings.mode === 'auto'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold mb-1">Automatic Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Fetch rates from API providers
                  </div>
                </button>
              </div>
            </div>

            {settings.mode === 'manual' && (
              <ManualRateForm
                settings={settings}
                onUpdate={handleSettingsUpdate}
              />
            )}

            {settings.mode === 'auto' && (
              <div className="space-y-4">
                <QuotaDashboard />
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Automatic Rate Updates
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Exchange rates are automatically fetched from configured API providers.
                    Configure providers in the "API Providers" tab.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <ProviderConfigurationForm
            providers={providers}
            activeProviderId={settings.active_provider_id}
            onUpdate={handleProvidersUpdate}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ExchangeRateHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
