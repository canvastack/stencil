import { tenantApiClient } from '../tenant/tenantApiClient';

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  duration?: number;
  status: 'success' | 'error' | 'pending';
  createdAt: string;
  tenantId: string;
}

export interface ActivityFilter {
  userId?: string;
  action?: string;
  resource?: string;
  status?: 'success' | 'error' | 'pending';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ActivityStats {
  totalActivities: number;
  uniqueUsers: number;
  averageDuration: number;
  actionBreakdown: Record<string, number>;
  resourceBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
}

class ActivityService {
  private isLoggingEnabled = true;
  private pendingLogs: Array<Partial<ActivityLog>> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.setupBeforeUnload();
    this.setupPageVisibilityChange();
  }

  private isDemoMode(): boolean {
    const token = localStorage.getItem('auth_token');
    const isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
    const isDemoToken = token?.startsWith('demo_token_');
    
    return isDevelopment || isDemoToken;
  }

  /**
   * Log user activity
   */
  async logActivity(activity: {
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, any>;
    duration?: number;
    status?: 'success' | 'error' | 'pending';
  }): Promise<void> {
    if (!this.isLoggingEnabled) {
      return;
    }

    // In demo mode, skip API calls and just log to console
    if (this.isDemoMode()) {
      console.log('Demo mode: Activity logged locally', {
        action: activity.action,
        resource: activity.resource,
        resourceId: activity.resourceId,
        details: activity.details,
        status: activity.status
      });
      return;
    }

    try {
      const activityLog: Partial<ActivityLog> = {
        userId: localStorage.getItem('user_id') || 'anonymous',
        userEmail: localStorage.getItem('user_email') || 'unknown',
        userName: localStorage.getItem('user_name') || 'Unknown User',
        action: activity.action,
        resource: activity.resource,
        resourceId: activity.resourceId,
        details: {
          ...activity.details,
          url: window.location.pathname,
          timestamp: new Date().toISOString(),
        },
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        duration: activity.duration,
        status: activity.status || 'success',
        createdAt: new Date().toISOString(),
        tenantId: localStorage.getItem('tenant_id') || '',
      };

      // Add to pending logs for batching
      this.pendingLogs.push(activityLog);

      // Send batch if we reach the batch size
      if (this.pendingLogs.length >= this.BATCH_SIZE) {
        await this.flushPendingLogs();
      } else {
        // Schedule batch send
        this.scheduleBatchSend();
      }
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }

  /**
   * Track page visit
   */
  async trackPageVisit(page: string, details?: Record<string, any>): Promise<void> {
    await this.logActivity({
      action: 'page_visit',
      resource: 'page',
      resourceId: page,
      details: {
        page,
        referrer: document.referrer,
        ...details,
      },
    });
  }

  /**
   * Track user login
   */
  async trackLogin(method: string = 'standard'): Promise<void> {
    await this.logActivity({
      action: 'user_login',
      resource: 'auth',
      details: {
        method,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track user logout
   */
  async trackLogout(): Promise<void> {
    await this.logActivity({
      action: 'user_logout',
      resource: 'auth',
      details: {
        timestamp: new Date().toISOString(),
      },
    });

    // Flush any pending logs before logout
    await this.flushPendingLogs();
  }

  /**
   * Track API call performance
   */
  async trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    status: 'success' | 'error',
    details?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      action: 'api_call',
      resource: 'api',
      resourceId: `${method.toLowerCase()}_${endpoint}`,
      duration,
      status,
      details: {
        endpoint,
        method,
        ...details,
      },
    });
  }

  /**
   * Track CRUD operations
   */
  async trackCrud(
    operation: 'create' | 'read' | 'update' | 'delete',
    resource: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      action: `${operation}_${resource}`,
      resource,
      resourceId,
      details,
    });
  }

  /**
   * Track form submission
   */
  async trackFormSubmission(
    formName: string,
    success: boolean,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      action: 'form_submit',
      resource: 'form',
      resourceId: formName,
      status: success ? 'success' : 'error',
      details,
    });
  }

  /**
   * Track download activity
   */
  async trackDownload(
    filename: string,
    fileType: string,
    fileSize?: number
  ): Promise<void> {
    await this.logActivity({
      action: 'file_download',
      resource: 'file',
      resourceId: filename,
      details: {
        filename,
        fileType,
        fileSize,
      },
    });
  }

  /**
   * Get activity logs with filtering
   */
  async getActivityLogs(filters: ActivityFilter = {}): Promise<{
    data: ActivityLog[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams();

      if (filters.userId) params.append('user_id', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/activity-logs?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get activity logs:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
      };
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(filters: Pick<ActivityFilter, 'dateFrom' | 'dateTo'> = {}): Promise<ActivityStats> {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);

      const response = await apiClient.get(`/activity-logs/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get activity stats:', error);
      return {
        totalActivities: 0,
        uniqueUsers: 0,
        averageDuration: 0,
        actionBreakdown: {},
        resourceBreakdown: {},
        statusBreakdown: {},
        dailyActivity: [],
      };
    }
  }

  /**
   * Enable or disable activity logging
   */
  setLoggingEnabled(enabled: boolean): void {
    this.isLoggingEnabled = enabled;
    
    if (!enabled && this.pendingLogs.length > 0) {
      // Clear pending logs if logging is disabled
      this.pendingLogs = [];
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
    }
  }

  /**
   * Manually flush any pending logs
   */
  async flushPendingLogs(): Promise<void> {
    if (this.pendingLogs.length === 0) {
      return;
    }

    // In demo mode, skip API calls and just clear pending logs
    if (this.isDemoMode()) {
      console.log('Demo mode: Clearing pending activity logs (skipping API)', this.pendingLogs.length);
      this.pendingLogs = [];
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
      return;
    }

    try {
      const logsToSend = [...this.pendingLogs];
      this.pendingLogs = [];

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }

      await tenantApiClient.post('/activity-logs/batch', {
        activities: logsToSend,
      });
    } catch (error) {
      console.warn('Failed to send activity logs batch:', error);
      // Re-add logs to pending if they failed to send
      this.pendingLogs.unshift(...this.pendingLogs.slice(0, 5)); // Keep only the first 5 to avoid memory issues
    }
  }

  /**
   * Schedule batch send with timeout
   */
  private scheduleBatchSend(): void {
    if (this.batchTimeout) {
      return; // Already scheduled
    }

    this.batchTimeout = setTimeout(() => {
      this.flushPendingLogs();
    }, this.BATCH_TIMEOUT);
  }

  /**
   * Get client IP address (approximation)
   */
  private async getClientIP(): Promise<string> {
    try {
      // In a real app, this might come from the server or a service
      return 'client-ip'; // Placeholder
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Setup beforeunload handler to flush logs
   */
  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for better reliability on page unload
      if (this.pendingLogs.length > 0) {
        const data = JSON.stringify({ activities: this.pendingLogs });
        navigator.sendBeacon('/api/v1/activity-logs/batch', data);
      }
    });
  }

  /**
   * Setup page visibility change handler
   */
  private setupPageVisibilityChange(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Flush logs when page becomes hidden
        this.flushPendingLogs();
      }
    });
  }

  /**
   * Create a performance tracker for measuring operation duration
   */
  createPerformanceTracker(action: string, resource: string, resourceId?: string) {
    const startTime = performance.now();
    
    return {
      finish: async (status: 'success' | 'error' = 'success', details?: Record<string, any>) => {
        const duration = performance.now() - startTime;
        await this.logActivity({
          action,
          resource,
          resourceId,
          duration,
          status,
          details,
        });
      }
    };
  }
}

// Export singleton instance
export const activityService = new ActivityService();

export default activityService;