import { authService } from '@/services/api/auth';

export interface DeploymentMetrics {
  pageLoadTime: number;
  apiLatencyP50: number;
  apiLatencyP95: number;
  apiLatencyP99: number;
  
  errorRate: number;
  successRate: number;
  uptime: number;
  
  timeToInteractive: number;
  firstContentfulPaint: number;
  cumulativeLayoutShift: number;
  
  activeUsers: number;
  sessionDuration: number;
  featureAdoption: Record<string, number>;
  
  jsErrors: number;
  apiErrors: number;
  renderErrors: number;
}

export interface VersionComparison {
  significant: boolean;
  improvement: number;
  metric: string;
  treatmentValue: number;
  controlValue: number;
}

export interface DeploymentHealth {
  healthy: boolean;
  metrics: DeploymentMetrics;
  issues: string[];
}

export class DeploymentMonitor {
  private metricsCache: DeploymentMetrics | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 30 * 1000;

  async checkHealth(): Promise<DeploymentHealth> {
    const metrics = await this.collectMetrics();
    
    const issues: string[] = [];
    
    if (metrics.errorRate >= 0.1) {
      issues.push(`High error rate: ${metrics.errorRate.toFixed(2)}%`);
    }
    
    if (metrics.apiLatencyP95 >= 500) {
      issues.push(`High API latency (P95): ${metrics.apiLatencyP95}ms`);
    }
    
    if (metrics.pageLoadTime >= 800) {
      issues.push(`Slow page load time: ${metrics.pageLoadTime}ms`);
    }
    
    if (metrics.uptime < 99.9) {
      issues.push(`Low uptime: ${metrics.uptime.toFixed(2)}%`);
    }
    
    const healthy = 
      metrics.errorRate < 0.1 &&
      metrics.apiLatencyP95 < 500 &&
      metrics.pageLoadTime < 800 &&
      metrics.uptime >= 99.9;
    
    return { healthy, metrics, issues };
  }

  async collectMetrics(): Promise<DeploymentMetrics> {
    if (this.metricsCache && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return this.metricsCache;
    }

    try {
      const token = authService.getToken();
      const accountType = authService.getAccountType();

      const endpoint = accountType === 'platform'
        ? '/api/v1/platform/analytics/deployment-metrics'
        : '/api/v1/tenant/analytics/deployment-metrics';

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(accountType && { 'X-Account-Type': accountType }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch deployment metrics');
      }

      const data = await response.json();
      this.metricsCache = data.metrics;
      this.cacheTimestamp = Date.now();

      return data.metrics;
    } catch (error) {
      console.error('Failed to collect deployment metrics:', error);
      
      return this.getDefaultMetrics();
    }
  }

  async compareVersions(
    treatment: string,
    control: string,
    metric: keyof DeploymentMetrics = 'pageLoadTime'
  ): Promise<VersionComparison> {
    try {
      const token = authService.getToken();
      const accountType = authService.getAccountType();

      const endpoint = accountType === 'platform'
        ? '/api/v1/platform/analytics/compare-versions'
        : '/api/v1/tenant/analytics/compare-versions';

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(accountType && { 'X-Account-Type': accountType }),
        },
        body: JSON.stringify({
          treatment,
          control,
          metric,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare versions');
      }

      return response.json();
    } catch (error) {
      console.error('Failed to compare versions:', error);
      
      return {
        significant: false,
        improvement: 0,
        metric: String(metric),
        treatmentValue: 0,
        controlValue: 0,
      };
    }
  }

  async trackDeployment(deploymentId: string, phase: string): Promise<void> {
    try {
      const token = authService.getToken();
      const accountType = authService.getAccountType();

      if (accountType !== 'platform') {
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/platform/analytics/track-deployment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Account-Type': accountType,
          },
          body: JSON.stringify({
            deployment_id: deploymentId,
            phase,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to track deployment');
      }
    } catch (error) {
      console.error('Failed to track deployment:', error);
    }
  }

  private getDefaultMetrics(): DeploymentMetrics {
    return {
      pageLoadTime: 0,
      apiLatencyP50: 0,
      apiLatencyP95: 0,
      apiLatencyP99: 0,
      errorRate: 0,
      successRate: 100,
      uptime: 100,
      timeToInteractive: 0,
      firstContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      activeUsers: 0,
      sessionDuration: 0,
      featureAdoption: {},
      jsErrors: 0,
      apiErrors: 0,
      renderErrors: 0,
    };
  }

  clearCache(): void {
    this.metricsCache = null;
    this.cacheTimestamp = 0;
  }
}

export const deploymentMonitor = new DeploymentMonitor();

export const getHealthStatus = async (): Promise<'healthy' | 'degraded' | 'unhealthy'> => {
  const health = await deploymentMonitor.checkHealth();
  
  if (health.healthy) return 'healthy';
  if (health.issues.length <= 2) return 'degraded';
  return 'unhealthy';
};

export const getMetricColor = (
  metricName: keyof DeploymentMetrics,
  value: number
): 'green' | 'yellow' | 'red' => {
  const thresholds: Record<string, { good: number; warning: number }> = {
    pageLoadTime: { good: 800, warning: 1500 },
    apiLatencyP95: { good: 500, warning: 1000 },
    errorRate: { good: 0.1, warning: 1 },
    uptime: { good: 99.9, warning: 99 },
  };

  const threshold = thresholds[metricName];
  if (!threshold) return 'green';

  if (metricName === 'uptime') {
    if (value >= threshold.good) return 'green';
    if (value >= threshold.warning) return 'yellow';
    return 'red';
  } else {
    if (value <= threshold.good) return 'green';
    if (value <= threshold.warning) return 'yellow';
    return 'red';
  }
};
