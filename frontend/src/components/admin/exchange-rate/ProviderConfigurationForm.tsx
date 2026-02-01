import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Settings, 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Infinity,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';

interface Provider {
  uuid: string;
  name: string;
  code: string;
  is_enabled: boolean;
  requires_api_key: boolean;
  api_key?: string;
  is_unlimited: boolean;
  monthly_quota: number;
  priority: number;
  warning_threshold: number;
  critical_threshold: number;
  remaining_quota: number | null;
  quota_percentage: number;
  next_reset_date: string;
}

interface ProviderConfigurationFormProps {
  providers: Provider[];
  onUpdate: () => void;
}

export function ProviderConfigurationForm({ providers, onUpdate }: ProviderConfigurationFormProps) {
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const getQuotaStatus = (provider: Provider) => {
    if (provider.is_unlimited) {
      return { color: 'green', label: 'Unlimited', icon: Infinity };
    }

    const percentage = provider.quota_percentage;
    if (percentage >= 90) {
      return { color: 'red', label: 'Critical', icon: XCircle };
    } else if (percentage >= 70) {
      return { color: 'yellow', label: 'Warning', icon: AlertTriangle };
    } else {
      return { color: 'green', label: 'Good', icon: CheckCircle };
    }
  };

  const handleToggleProvider = async (provider: Provider) => {
    try {
      setSaving(prev => ({ ...prev, [provider.uuid]: true }));
      
      await tenantApiClient.put(`/settings/exchange-rate-providers/${provider.uuid}`, {
        is_enabled: !provider.is_enabled
      });

      toast({
        title: 'Success',
        description: `Provider ${provider.is_enabled ? 'disabled' : 'enabled'} successfully`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update provider',
        variant: 'destructive',
      });
    } finally {
      setSaving(prev => ({ ...prev, [provider.uuid]: false }));
    }
  };

  const handleUpdateApiKey = async (provider: Provider) => {
    const apiKey = apiKeys[provider.uuid];
    if (!apiKey?.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an API key',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(prev => ({ ...prev, [provider.uuid]: true }));
      
      await tenantApiClient.put(`/settings/exchange-rate-providers/${provider.uuid}`, {
        api_key: apiKey.trim()
      });

      toast({
        title: 'Success',
        description: 'API key updated successfully',
      });

      setApiKeys(prev => ({ ...prev, [provider.uuid]: '' }));
      setEditingProvider(null);
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update API key',
        variant: 'destructive',
      });
    } finally {
      setSaving(prev => ({ ...prev, [provider.uuid]: false }));
    }
  };

  const handleTestConnection = async (provider: Provider) => {
    try {
      setTesting(prev => ({ ...prev, [provider.uuid]: true }));
      
      const response = await tenantApiClient.post(`/settings/exchange-rate-providers/${provider.uuid}/test`);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Connection test successful',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: response.data.message || 'Connection test failed',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.response?.data?.message || 'Connection test failed',
        variant: 'destructive',
      });
    } finally {
      setTesting(prev => ({ ...prev, [provider.uuid]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Provider Configuration</h2>
        <p className="text-muted-foreground">
          Configure and manage exchange rate API providers
        </p>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => {
          const quotaStatus = getQuotaStatus(provider);
          const StatusIcon = quotaStatus.icon;

          return (
            <Card key={provider.uuid} className={`${!provider.is_enabled ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <Badge variant={provider.is_enabled ? 'default' : 'secondary'}>
                      Priority {provider.priority}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${quotaStatus.color === 'green' ? 'border-green-500 text-green-700' : ''}
                        ${quotaStatus.color === 'yellow' ? 'border-yellow-500 text-yellow-700' : ''}
                        ${quotaStatus.color === 'red' ? 'border-red-500 text-red-700' : ''}
                      `}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {quotaStatus.label}
                    </Badge>
                  </div>
                  
                  <Switch
                    checked={provider.is_enabled}
                    onCheckedChange={() => handleToggleProvider(provider)}
                    disabled={saving[provider.uuid]}
                  />
                </div>
                
                <CardDescription>
                  {provider.is_unlimited ? (
                    'Unlimited API requests'
                  ) : (
                    `${provider.remaining_quota?.toLocaleString() || 0} / ${provider.monthly_quota.toLocaleString()} requests remaining`
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Quota Progress Bar */}
                {!provider.is_unlimited && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quota Usage</span>
                      <span>{(provider.quota_percentage || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          (provider.quota_percentage || 0) >= 90 ? 'bg-red-500' :
                          (provider.quota_percentage || 0) >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(provider.quota_percentage || 0, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Resets on {new Date(provider.next_reset_date).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* API Key Configuration */}
                {provider.requires_api_key && (
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <Label className="font-medium">API Key Configuration</Label>
                    </div>
                    
                    {editingProvider === provider.uuid ? (
                      <div className="space-y-3">
                        <Input
                          type="password"
                          placeholder="Enter API key"
                          value={apiKeys[provider.uuid] || ''}
                          onChange={(e) => setApiKeys(prev => ({ 
                            ...prev, 
                            [provider.uuid]: e.target.value 
                          }))}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateApiKey(provider)}
                            disabled={saving[provider.uuid]}
                          >
                            {saving[provider.uuid] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProvider(null);
                              setApiKeys(prev => ({ ...prev, [provider.uuid]: '' }));
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {provider.api_key ? 'API key configured' : 'No API key set'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProvider(provider.uuid)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Test Connection */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(provider)}
                    disabled={testing[provider.uuid] || !provider.is_enabled}
                  >
                    {testing[provider.uuid] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>

                {/* Provider Info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Warning threshold: {provider.warning_threshold} requests</p>
                  <p>• Critical threshold: {provider.critical_threshold} requests</p>
                  {provider.requires_api_key && (
                    <p>• Requires API key for authentication</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {providers.length === 0 && (
        <Alert>
          <AlertDescription>
            No exchange rate providers configured. Please contact your administrator.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}