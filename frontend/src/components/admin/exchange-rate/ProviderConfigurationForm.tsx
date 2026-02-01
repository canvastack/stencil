import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Save,
  TestTube,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { exchangeRateService } from '@/services/api/exchangeRate';
import { ExchangeRateProvider, ProviderFormData } from '@/types/exchangeRate';

interface ProviderConfigurationFormProps {
  providers: ExchangeRateProvider[];
  activeProviderId: string | null;
  onUpdate: () => void;
}

export default function ProviderConfigurationForm({
  providers,
  activeProviderId,
  onUpdate,
}: ProviderConfigurationFormProps) {
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ProviderFormData>>({});

  const sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);

  const handleEdit = (provider: ExchangeRateProvider) => {
    setEditingProvider(provider.uuid);
    setFormData({
      name: provider.name,
      api_url: provider.api_url,
      monthly_quota: provider.monthly_quota,
      priority: provider.priority,
      enabled: provider.enabled,
      warning_threshold: provider.warning_threshold,
      critical_threshold: provider.critical_threshold,
    });
  };

  const handleCancel = () => {
    setEditingProvider(null);
    setFormData({});
  };

  const handleSave = async (uuid: string) => {
    try {
      setSavingProvider(uuid);
      await exchangeRateService.updateProvider(uuid, formData);
      toast.success('Provider updated successfully');
      setEditingProvider(null);
      setFormData({});
      onUpdate();
    } catch (error: any) {
      console.error('Failed to update provider:', error);
      toast.error(error?.message || 'Failed to update provider');
    } finally {
      setSavingProvider(null);
    }
  };

  const handleTest = async (uuid: string) => {
    try {
      setTestingProvider(uuid);
      const result = await exchangeRateService.testProviderConnection(uuid);
      if (result.success) {
        toast.success(
          <div>
            <div className="font-semibold">Connection successful!</div>
            <div className="text-sm">
              Current rate: 1 USD = {result.rate?.toLocaleString()} IDR
            </div>
          </div>
        );
      } else {
        toast.error(result.message || 'Connection test failed');
      }
    } catch (error: any) {
      console.error('Failed to test provider:', error);
      toast.error(error?.message || 'Failed to test provider connection');
    } finally {
      setTestingProvider(null);
    }
  };

  const handleToggleEnabled = async (uuid: string, enabled: boolean) => {
    try {
      await exchangeRateService.updateProvider(uuid, { enabled });
      toast.success(`Provider ${enabled ? 'enabled' : 'disabled'} successfully`);
      onUpdate();
    } catch (error: any) {
      console.error('Failed to toggle provider:', error);
      toast.error(error?.message || 'Failed to update provider');
    }
  };

  const handlePriorityChange = async (uuid: string, direction: 'up' | 'down') => {
    const provider = providers.find((p) => p.uuid === uuid);
    if (!provider) return;

    const newPriority = direction === 'up' ? provider.priority - 1 : provider.priority + 1;

    if (newPriority < 1) return;

    try {
      await exchangeRateService.updateProvider(uuid, { priority: newPriority });
      toast.success('Provider priority updated');
      onUpdate();
    } catch (error: any) {
      console.error('Failed to update priority:', error);
      toast.error(error?.message || 'Failed to update priority');
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) {
      return;
    }

    try {
      await exchangeRateService.deleteProvider(uuid);
      toast.success('Provider deleted successfully');
      onUpdate();
    } catch (error: any) {
      console.error('Failed to delete provider:', error);
      toast.error(error?.message || 'Failed to delete provider');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">API Providers</h3>
            <p className="text-sm text-muted-foreground">
              Configure external API providers for automatic exchange rate fetching
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sortedProviders.map((provider, index) => (
            <Card key={provider.uuid} className="p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handlePriorityChange(provider.uuid, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handlePriorityChange(provider.uuid, 'down')}
                        disabled={index === sortedProviders.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{provider.name}</h4>
                        <Badge variant="outline">Priority {provider.priority}</Badge>
                        {provider.uuid === activeProviderId && (
                          <Badge variant="default">Active</Badge>
                        )}
                        {provider.enabled ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{provider.api_url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={(checked) =>
                        handleToggleEnabled(provider.uuid, checked)
                      }
                    />
                  </div>
                </div>

                {editingProvider === provider.uuid ? (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`api-key-${provider.uuid}`}>API Key</Label>
                        <Input
                          id={`api-key-${provider.uuid}`}
                          type="password"
                          placeholder="Enter API key (if required)"
                          value={formData.api_key || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, api_key: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`monthly-quota-${provider.uuid}`}>Monthly Quota</Label>
                        <Input
                          id={`monthly-quota-${provider.uuid}`}
                          type="number"
                          placeholder="0 for unlimited"
                          value={formData.monthly_quota || 0}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              monthly_quota: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`warning-threshold-${provider.uuid}`}>Warning Threshold</Label>
                        <Input
                          id={`warning-threshold-${provider.uuid}`}
                          type="number"
                          value={formData.warning_threshold || 50}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              warning_threshold: parseInt(e.target.value) || 50,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`critical-threshold-${provider.uuid}`}>Critical Threshold</Label>
                        <Input
                          id={`critical-threshold-${provider.uuid}`}
                          type="number"
                          value={formData.critical_threshold || 20}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              critical_threshold: parseInt(e.target.value) || 20,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSave(provider.uuid)}
                        disabled={savingProvider === provider.uuid}
                      >
                        {savingProvider === provider.uuid && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(provider)}
                    >
                      Edit Configuration
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(provider.uuid)}
                      disabled={testingProvider === provider.uuid || !provider.enabled}
                    >
                      {testingProvider === provider.uuid ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                      )}
                      Test Connection
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(provider.uuid)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Monthly Quota:</span>{' '}
                    <span className="font-medium">
                      {provider.monthly_quota === 0
                        ? 'Unlimited'
                        : provider.monthly_quota.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Warning:</span>{' '}
                    <span className="font-medium">{provider.warning_threshold}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Critical:</span>{' '}
                    <span className="font-medium">{provider.critical_threshold}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {sortedProviders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No API providers configured</p>
            <p className="text-sm">Add providers to enable automatic rate fetching</p>
          </div>
        )}
      </Card>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Provider Priority
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Providers are used in priority order (1 = highest). When a provider's quota is
          exhausted, the system automatically switches to the next available provider.
        </p>
      </div>
    </div>
  );
}
