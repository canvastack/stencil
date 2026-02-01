import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { exchangeRateService } from '@/services/api/exchangeRate';
import { QuotaStatus } from '@/types/exchangeRate';

export default function QuotaDashboard() {
  const [quotaStatuses, setQuotaStatuses] = useState<QuotaStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotaStatus();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(loadQuotaStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadQuotaStatus = async () => {
    try {
      const data = await exchangeRateService.getQuotaStatus();
      setQuotaStatuses(data);
    } catch (error) {
      console.error('Failed to load quota status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: QuotaStatus) => {
    if (status.is_exhausted) return 'destructive';
    if (status.is_at_critical) return 'destructive';
    if (status.is_at_warning) return 'warning';
    return 'default';
  };

  const getStatusIcon = (status: QuotaStatus) => {
    if (status.is_exhausted) return <AlertCircle className="h-4 w-4" />;
    if (status.is_at_critical) return <AlertTriangle className="h-4 w-4" />;
    if (status.is_at_warning) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getProgressPercentage = (status: QuotaStatus) => {
    if (status.is_unlimited) return 0;
    return (status.requests_used / status.monthly_quota) * 100;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Quota Monitoring</h3>
        <p className="text-sm text-muted-foreground">
          Real-time API usage tracking across all providers
        </p>
      </div>

      <div className="space-y-4">
        {quotaStatuses.map((status) => (
          <div key={status.provider_id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{status.provider_name}</span>
                <Badge variant={getStatusColor(status)} className="flex items-center gap-1">
                  {getStatusIcon(status)}
                  {status.is_exhausted
                    ? 'Exhausted'
                    : status.is_at_critical
                    ? 'Critical'
                    : status.is_at_warning
                    ? 'Warning'
                    : 'Healthy'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {status.is_unlimited ? (
                  'Unlimited'
                ) : (
                  <>
                    {status.remaining_quota.toLocaleString()} /{' '}
                    {status.monthly_quota.toLocaleString()} remaining
                  </>
                )}
              </div>
            </div>

            {!status.is_unlimited && (
              <Progress
                value={getProgressPercentage(status)}
                className={`h-2 ${
                  status.is_exhausted || status.is_at_critical
                    ? 'bg-red-200 dark:bg-red-900'
                    : status.is_at_warning
                    ? 'bg-yellow-200 dark:bg-yellow-900'
                    : ''
                }`}
              />
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {status.requests_used.toLocaleString()} requests used this month
              </span>
              <span>Resets: {new Date(status.next_reset_date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {quotaStatuses.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No quota data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}
