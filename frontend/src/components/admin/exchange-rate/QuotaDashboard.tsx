import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  TrendingUp, 
  Activity,
  Calendar,
  Infinity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';

interface Provider {
  uuid: string;
  name: string;
  code: string;
  is_enabled: boolean;
  is_unlimited: boolean;
  monthly_quota: number;
  priority: number;
  warning_threshold: number;
  critical_threshold: number;
  remaining_quota: number | null;
  quota_percentage: number;
  next_reset_date: string;
}

interface QuotaStats {
  total_requests_today: number;
  total_requests_this_month: number;
  active_providers: number;
  providers_with_quota: number;
  next_reset_date: string;
}

interface QuotaDashboardProps {
  refreshTrigger?: number;
}

export const QuotaDashboard: React.FC<QuotaDashboardProps> = ({ refreshTrigger }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<QuotaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersResponse, statsResponse] = await Promise.all([
        tenantApiClient.get('/settings/exchange-rate-providers'),
        tenantApiClient.get('/settings/exchange-rate-providers/quota-status')
      ]);
      
      setProviders(providersResponse.data.data || []);
      setStats(statsResponse.data.data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quota data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getProviderStatus = (provider: Provider) => {
    if (!provider.is_enabled) {
      return { color: 'gray', label: 'Disabled', icon: XCircle };
    }

    if (provider.is_unlimited) {
      return { color: 'blue', label: 'Unlimited', icon: Infinity };
    }

    const percentage = provider.quota_percentage;
    if (percentage >= 95) {
      return { color: 'red', label: 'Critical', icon: XCircle };
    } else if (percentage >= 80) {
      return { color: 'yellow', label: 'Warning', icon: AlertTriangle };
    } else {
      return { color: 'green', label: 'Good', icon: CheckCircle };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quota Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor API usage and quota status across all providers
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_requests_today.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Requests</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_requests_this_month.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_providers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Reset</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {new Date(stats.next_reset_date).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provider Status Cards */}
      <div className="grid gap-4">
        {providers.map((provider) => {
          const status = getProviderStatus(provider);
          const StatusIcon = status.icon;

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
                        ${status.color === 'green' ? 'border-green-500 text-green-700 bg-green-50' : ''}
                        ${status.color === 'yellow' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}
                        ${status.color === 'red' ? 'border-red-500 text-red-700 bg-red-50' : ''}
                        ${status.color === 'blue' ? 'border-blue-500 text-blue-700 bg-blue-50' : ''}
                        ${status.color === 'gray' ? 'border-gray-500 text-gray-700 bg-gray-50' : ''}
                      `}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {provider.is_unlimited ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Infinity className="h-5 w-5" />
                    <span className="font-medium">Unlimited API requests</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Quota Usage */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Quota Usage</span>
                        <span className="text-muted-foreground">
                          {(provider.monthly_quota - (provider.remaining_quota || 0)).toLocaleString()} / {provider.monthly_quota.toLocaleString()}
                        </span>
                      </div>
                      
                      <Progress 
                        value={provider.quota_percentage} 
                        className="h-3"
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{provider.quota_percentage.toFixed(1)}% used</span>
                        <span>{provider.remaining_quota?.toLocaleString() || 0} remaining</span>
                      </div>
                    </div>

                    {/* Threshold Indicators */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          provider.quota_percentage >= 80 ? 'bg-yellow-500' : 'bg-gray-300'
                        }`} />
                        <span>Warning: {provider.warning_threshold}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          provider.quota_percentage >= 95 ? 'bg-red-500' : 'bg-gray-300'
                        }`} />
                        <span>Critical: {provider.critical_threshold}</span>
                      </div>
                    </div>

                    {/* Reset Date */}
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Quota resets on {new Date(provider.next_reset_date).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {!provider.is_enabled && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This provider is currently disabled
                    </AlertDescription>
                  </Alert>
                )}

                {provider.is_enabled && !provider.is_unlimited && provider.quota_percentage >= 95 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Quota critically low! Consider switching to another provider or wait for reset.
                    </AlertDescription>
                  </Alert>
                )}

                {provider.is_enabled && !provider.is_unlimited && provider.quota_percentage >= 80 && provider.quota_percentage < 95 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Quota usage is high. Monitor usage closely.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {providers.length === 0 && (
        <Alert>
          <AlertDescription>
            No exchange rate providers configured. Please configure providers first.
          </AlertDescription>
        </Alert>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}