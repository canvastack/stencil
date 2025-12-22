import React from 'react';
import { ActivityLogViewer } from '@/components/admin/ActivityLogViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, TrendingUp, Clock } from 'lucide-react';
import { activityService } from '@/services/activity/activityService';
import { toast } from 'sonner';

export default function ActivityLog() {
  const handleTestActivity = async () => {
    try {
      // Test different types of activities
      await activityService.logActivity({
        action: 'test_action',
        resource: 'admin_panel',
        details: { 
          message: 'This is a test activity log entry',
          timestamp: new Date().toISOString(),
        },
      });

      await activityService.trackPageVisit('/admin/activity-log', {
        source: 'manual_test',
      });

      await activityService.trackCrud('create', 'test_resource', 'test-123', {
        test: true,
        values: { name: 'Test Resource', status: 'active' },
      });

      toast.success('Test activities logged successfully');
    } catch (error) {
      toast.error('Failed to log test activities');
    }
  };

  const handleFlushLogs = async () => {
    try {
      await activityService.flushPendingLogs();
      toast.success('Pending logs flushed successfully');
    } catch (error) {
      toast.error('Failed to flush pending logs');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Monitor user activities, API calls, and system events across your application.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === 'development' && (
            <>
              <Button
                variant="outline"
                onClick={handleTestActivity}
              >
                Generate Test Data
              </Button>
              
              <Button
                variant="outline"
                onClick={handleFlushLogs}
              >
                Flush Pending Logs
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Tracking</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Real-time activity monitoring enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Real-time</div>
            <p className="text-xs text-muted-foreground">
              Live user activity tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Monitored</div>
            <p className="text-xs text-muted-foreground">
              API call duration tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Retention</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30 Days</div>
            <p className="text-xs text-muted-foreground">
              Activity data retention period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Types Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Authentication</Badge>
              <span className="text-sm text-muted-foreground">Login/Logout</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">Page Visits</Badge>
              <span className="text-sm text-muted-foreground">Navigation</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">API Calls</Badge>
              <span className="text-sm text-muted-foreground">Backend Requests</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">CRUD Operations</Badge>
              <span className="text-sm text-muted-foreground">Data Changes</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">Form Submissions</Badge>
              <span className="text-sm text-muted-foreground">User Input</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">Downloads</Badge>
              <span className="text-sm text-muted-foreground">File Access</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Activity Log Viewer */}
      <ActivityLogViewer 
        showStats={true}
        defaultFilters={{
          limit: 50,
        }}
      />
    </div>
  );
}