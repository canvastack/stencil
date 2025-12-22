import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Search, 
  Filter, 
  RefreshCw, 
  Download,
  Clock,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';
import { activityService, ActivityLog, ActivityFilter, ActivityStats } from '@/services/activity/activityService';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface ActivityLogViewerProps {
  className?: string;
  showStats?: boolean;
  defaultFilters?: Partial<ActivityFilter>;
}

const ActivityIcon: React.FC<{ action: string }> = ({ action }) => {
  const getIcon = () => {
    if (action.includes('login')) return <User className="h-4 w-4" />;
    if (action.includes('page_visit')) return <Activity className="h-4 w-4" />;
    if (action.includes('api_call')) return <BarChart3 className="h-4 w-4" />;
    if (action.includes('create')) return <CheckCircle className="h-4 w-4" />;
    if (action.includes('update')) return <RefreshCw className="h-4 w-4" />;
    if (action.includes('delete')) return <AlertCircle className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return <div className="text-muted-foreground">{getIcon()}</div>;
};

const StatusBadge: React.FC<{ status: ActivityLog['status'] }> = ({ status }) => {
  const variants = {
    success: 'default' as const,
    error: 'destructive' as const,
    pending: 'secondary' as const,
  };

  const colors = {
    success: 'text-green-600',
    error: 'text-red-600',
    pending: 'text-yellow-600',
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status}
    </Badge>
  );
};

const ActivityItem: React.FC<{ activity: ActivityLog }> = ({ activity }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <ActivityIcon action={activity.action} />
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {activity.userName}
              </span>
              <span className="text-muted-foreground text-sm">
                {activity.action.replace(/_/g, ' ')}
              </span>
              {activity.resourceId && (
                <Badge variant="outline" className="text-xs">
                  {activity.resource}:{activity.resourceId}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
              
              {activity.duration && (
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {activity.duration.toFixed(0)}ms
                </span>
              )}
              
              <span>{activity.ipAddress}</span>
            </div>

            {showDetails && activity.details && (
              <div className="mt-2 p-3 bg-muted/30 rounded-md">
                <pre className="text-xs text-muted-foreground overflow-x-auto">
                  {JSON.stringify(activity.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={activity.status} />
          
          {activity.details && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '-' : '+'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const StatsCard: React.FC<{ stats: ActivityStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold">{stats.totalActivities.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unique Users</p>
              <p className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-bold">{stats.averageDuration.toFixed(0)}ms</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {((stats.statusBreakdown.success || 0) / Math.max(stats.totalActivities, 1) * 100).toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ActivityLogViewer: React.FC<ActivityLogViewerProps> = ({ 
  className,
  showStats = true,
  defaultFilters = {}
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [filters, setFilters] = useState<ActivityFilter>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });

  const loadActivities = async (reset = false) => {
    setLoading(true);
    try {
      const result = await activityService.getActivityLogs({
        ...filters,
        page: reset ? 1 : pagination.page,
        limit: pagination.limit,
      });

      setActivities(reset ? result.data : [...activities, ...result.data]);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        hasMore: result.hasMore,
      });
    } catch (error) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!showStats) return;
    
    try {
      const result = await activityService.getActivityStats({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      setStats(result);
    } catch (error) {
      console.warn('Failed to load activity stats:', error);
    }
  };

  const handleFilterChange = (key: keyof ActivityFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    loadActivities(true);
    loadStats();
  };

  const handleLoadMore = () => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  };

  const exportActivities = async () => {
    try {
      const result = await activityService.getActivityLogs({
        ...filters,
        limit: 1000, // Export more records
      });

      const csv = [
        'Timestamp,User,Action,Resource,Status,Duration,IP Address',
        ...result.data.map(activity => [
          format(new Date(activity.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          activity.userName,
          activity.action,
          activity.resource,
          activity.status,
          activity.duration || '',
          activity.ipAddress,
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Activity log exported');
    } catch (error) {
      toast.error('Failed to export activity log');
    }
  };

  useEffect(() => {
    loadActivities(true);
  }, [filters]);

  useEffect(() => {
    if (pagination.page > 1) {
      loadActivities(false);
    }
  }, [pagination.page]);

  useEffect(() => {
    loadStats();
  }, [filters.dateFrom, filters.dateTo]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportActivities}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Resource</Label>
            <Select
              value={filters.resource || 'all'}
              onValueChange={(value) => handleFilterChange('resource', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="page">Pages</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats */}
        {showStats && stats && <StatsCard stats={stats} />}

        {/* Activity List */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {loading ? 'Loading activities...' : 'No activities found'}
                </p>
              </div>
            ) : (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}

            {pagination.hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator className="my-4" />
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {activities.length} of {pagination.total.toLocaleString()} activities
          </span>
          
          {pagination.total > 0 && (
            <span>
              Page {pagination.page}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityLogViewer;