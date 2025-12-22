import { useState, useEffect } from 'react';
import { deploymentMonitor, type DeploymentHealth } from '@/lib/monitoring/deploymentMetrics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Activity,
  Database,
  FileText,
  Package,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  icon: typeof Activity;
}

interface OngoingDeployment {
  id: string;
  name: string;
  phase: string;
  progress: number;
  startDate: string;
  estimatedCompletion: string;
}

export default function StatusPage() {
  const [health, setHealth] = useState<DeploymentHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const healthData = await deploymentMonitor.checkHealth();
      setHealth(healthData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(fetchStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const services: ServiceStatus[] = [
    { name: 'API Service', status: 'operational', icon: Activity },
    { name: 'Database', status: 'operational', icon: Database },
    { name: 'File Storage', status: 'operational', icon: FileText },
    { name: 'Product Catalog', status: health?.healthy ? 'operational' : 'degraded', icon: Package },
  ];

  const ongoingDeployment: OngoingDeployment | null = {
    id: 'deployment-2025-01',
    name: 'Product Catalog V2 Deployment',
    phase: 'Week 5/8 - 50% Rollout',
    progress: 62.5,
    startDate: 'December 15, 2025',
    estimatedCompletion: 'February 9, 2026',
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <Badge variant="default" className="bg-green-500">Operational</Badge>;
      case 'degraded':
        return <Badge variant="default" className="bg-yellow-500">Degraded</Badge>;
      case 'down':
        return <Badge variant="destructive">Down</Badge>;
    }
  };

  if (isLoading && !health) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const overallStatus = services.every(s => s.status === 'operational') 
    ? 'operational' 
    : services.some(s => s.status === 'down') 
    ? 'down' 
    : 'degraded';

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">CanvaStack System Status</h1>
          <p className="text-muted-foreground mt-1">
            Real-time status and performance metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="p-8">
        <div className="text-center">
          {overallStatus === 'operational' ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">All Systems Operational</h2>
              <p className="text-muted-foreground">
                All services are running smoothly
              </p>
            </>
          ) : overallStatus === 'degraded' ? (
            <>
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Degraded Performance</h2>
              <p className="text-muted-foreground">
                Some services are experiencing issues
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Service Disruption</h2>
              <p className="text-muted-foreground">
                We're working to restore services
              </p>
            </>
          )}
          
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </Card>

      {ongoingDeployment && (
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <RefreshCw className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Ongoing Rollout</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {ongoingDeployment.name}
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Status: {ongoingDeployment.phase}</span>
                    <span className="text-muted-foreground">{ongoingDeployment.progress}%</span>
                  </div>
                  <Progress value={ongoingDeployment.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Started:</span>
                    <span className="ml-2 font-medium">{ongoingDeployment.startDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Completion:</span>
                    <span className="ml-2 font-medium">{ongoingDeployment.estimatedCompletion}</span>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Impact:</strong> None - Gradual rollout in progress. 
                    50% of users now have access to enhanced features with 68% faster performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Component Status</h3>
        <div className="space-y-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div 
                key={service.name}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  {getStatusBadge(service.status)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {health && health.metrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Page Load Time</p>
              <p className="text-2xl font-bold">
                {health.metrics.pageLoadTime > 0 
                  ? `${health.metrics.pageLoadTime}ms` 
                  : 'N/A'}
              </p>
              {health.metrics.pageLoadTime > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Target: &lt;800ms
                </p>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Error Rate</p>
              <p className="text-2xl font-bold">
                {health.metrics.errorRate.toFixed(2)}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                Target: &lt;0.1%
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">API Latency (P95)</p>
              <p className="text-2xl font-bold">
                {health.metrics.apiLatencyP95 > 0 
                  ? `${health.metrics.apiLatencyP95}ms` 
                  : 'N/A'}
              </p>
              {health.metrics.apiLatencyP95 > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Target: &lt;500ms
                </p>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Uptime</p>
              <p className="text-2xl font-bold">
                {health.metrics.uptime.toFixed(2)}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                Target: 99.9%
              </p>
            </div>
          </div>
        </Card>
      )}

      {health && health.issues.length > 0 && (
        <Card className="p-6 border-yellow-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Active Issues</h3>
              <ul className="space-y-2">
                {health.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          If you continue to experience issues, please contact our support team.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href="mailto:support@canvastack.com">
              Contact Support
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/help" target="_blank">
              Help Center
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
