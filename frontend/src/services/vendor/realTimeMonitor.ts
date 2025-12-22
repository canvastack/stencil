import { tenantApiClient } from '../tenant/tenantApiClient';
import { VendorRiskProfile, RiskAlert } from './riskAnalyzer';
import { VendorPerformanceScore } from './performanceCalculator';

export interface RealTimeMetric {
  metric_id: string;
  metric_name: string;
  current_value: number;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  last_updated: string;
  data_points: MetricDataPoint[];
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface VendorAlert {
  alert_id: string;
  vendor_id: string;
  vendor_name: string;
  alert_type: 'performance' | 'delivery' | 'quality' | 'capacity' | 'financial';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  triggered_at: string;
  auto_resolved: boolean;
  resolution_actions: string[];
  escalation_level: number;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface MonitoringConfig {
  refresh_interval: number; // seconds
  alert_thresholds: {
    performance_score_min: number;
    on_time_delivery_min: number;
    quality_rating_min: number;
    response_time_max: number;
    capacity_utilization_max: number;
  };
  notification_settings: {
    email_enabled: boolean;
    slack_enabled: boolean;
    sms_enabled: boolean;
    escalation_delay: number; // minutes
  };
  monitoring_scope: {
    vendor_ids?: number[];
    quality_tiers?: string[];
    risk_levels?: string[];
  };
}

export interface DashboardUpdate {
  timestamp: string;
  metrics: RealTimeMetric[];
  alerts: VendorAlert[];
  system_health: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    active_monitors: number;
    failed_checks: number;
  };
  vendor_summary: {
    total_active: number;
    high_risk_count: number;
    alerts_today: number;
    performance_avg: number;
  };
}

class VendorRealTimeMonitor {
  private static instance: VendorRealTimeMonitor;
  private config: MonitoringConfig;
  private subscribers: Map<string, (update: DashboardUpdate) => void> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private currentMetrics: Map<string, RealTimeMetric> = new Map();
  private activeAlerts: Map<string, VendorAlert> = new Map();

  private constructor(config: MonitoringConfig) {
    this.config = config;
  }

  static getInstance(config?: MonitoringConfig): VendorRealTimeMonitor {
    if (!VendorRealTimeMonitor.instance) {
      VendorRealTimeMonitor.instance = new VendorRealTimeMonitor(
        config || VendorRealTimeMonitor.getDefaultConfig()
      );
    }
    return VendorRealTimeMonitor.instance;
  }

  private static getDefaultConfig(): MonitoringConfig {
    return {
      refresh_interval: 30,
      alert_thresholds: {
        performance_score_min: 70,
        on_time_delivery_min: 80,
        quality_rating_min: 3.5,
        response_time_max: 48,
        capacity_utilization_max: 90,
      },
      notification_settings: {
        email_enabled: true,
        slack_enabled: false,
        sms_enabled: false,
        escalation_delay: 30,
      },
      monitoring_scope: {},
    };
  }

  /**
   * Start real-time monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.intervalId) {
      console.warn('Monitoring already active');
      return;
    }

    console.log('Starting vendor real-time monitoring...');

    // Initial data fetch
    await this.fetchAndProcessMetrics();

    // Set up periodic updates
    this.intervalId = setInterval(async () => {
      try {
        await this.fetchAndProcessMetrics();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      }
    }, this.config.refresh_interval * 1000);

    console.log(`Monitoring started with ${this.config.refresh_interval}s interval`);
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Vendor monitoring stopped');
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(subscriberId: string, callback: (update: DashboardUpdate) => void): () => void {
    this.subscribers.set(subscriberId, callback);
    
    // Send current state immediately
    this.broadcastUpdate();

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriberId);
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring with new config
    if (this.intervalId) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Manually trigger metrics refresh
   */
  async refreshMetrics(): Promise<void> {
    await this.fetchAndProcessMetrics();
  }

  /**
   * Get current alerts
   */
  getCurrentAlerts(): VendorAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledged_by = acknowledgedBy;
      alert.acknowledged_at = new Date().toISOString();

      // Update backend
      try {
        await tenantApiClient.post(`/vendor-alerts/${alertId}/acknowledge`, {
          acknowledged_by: acknowledgedBy,
        });
      } catch (error) {
        console.error('Failed to acknowledge alert on backend:', error);
      }

      this.broadcastUpdate();
    }
  }

  /**
   * Add custom metric tracker
   */
  addCustomMetric(metric: RealTimeMetric): void {
    this.currentMetrics.set(metric.metric_id, metric);
    this.broadcastUpdate();
  }

  /**
   * Remove metric tracker
   */
  removeMetric(metricId: string): void {
    this.currentMetrics.delete(metricId);
    this.broadcastUpdate();
  }

  /**
   * Fetch and process metrics from backend
   */
  private async fetchAndProcessMetrics(): Promise<void> {
    try {
      // Fetch real-time KPIs
      const kpisResponse = await tenantApiClient.get('/vendor-analytics/real-time-kpis', {
        params: {
          refresh_interval: this.config.refresh_interval,
          include_alerts: true,
        },
      });

      const kpis = kpisResponse.data;

      // Process metrics
      this.processKPIsIntoMetrics(kpis);

      // Fetch vendor performance data
      const performanceResponse = await tenantApiClient.get('/vendor-performance/metrics', {
        params: {
          vendor_ids: this.config.monitoring_scope.vendor_ids?.join(','),
          include_realtime: true,
        },
      });

      // Process performance metrics
      this.processPerformanceMetrics(performanceResponse.data);

      // Check for new alerts
      await this.checkForNewAlerts();

      // Broadcast update to subscribers
      this.broadcastUpdate();

    } catch (error) {
      console.error('Failed to fetch monitoring metrics:', error);
      
      // Create system error alert
      this.createSystemAlert('monitoring_error', 'Failed to fetch metrics', 'error');
    }
  }

  /**
   * Process KPIs into metrics format
   */
  private processKPIsIntoMetrics(kpis: any): void {
    const timestamp = new Date().toISOString();

    // Active vendors metric
    this.updateMetric('active_vendors', {
      metric_id: 'active_vendors',
      metric_name: 'Active Vendors',
      current_value: kpis.active_vendors || 0,
      threshold: 50, // Minimum expected active vendors
      status: this.calculateStatus(kpis.active_vendors || 0, 50, 'min'),
      trend: 'stable',
      last_updated: timestamp,
      data_points: this.addDataPoint('active_vendors', kpis.active_vendors || 0, timestamp),
    });

    // Active orders metric
    this.updateMetric('active_orders', {
      metric_id: 'active_orders',
      metric_name: 'Active Orders',
      current_value: kpis.active_orders || 0,
      threshold: 100,
      status: this.calculateStatus(kpis.active_orders || 0, 100, 'max'),
      trend: 'stable',
      last_updated: timestamp,
      data_points: this.addDataPoint('active_orders', kpis.active_orders || 0, timestamp),
    });

    // Overdue orders metric (critical threshold)
    this.updateMetric('overdue_orders', {
      metric_id: 'overdue_orders',
      metric_name: 'Overdue Orders',
      current_value: kpis.overdue_orders || 0,
      threshold: 5,
      status: this.calculateStatus(kpis.overdue_orders || 0, 5, 'max'),
      trend: 'stable',
      last_updated: timestamp,
      data_points: this.addDataPoint('overdue_orders', kpis.overdue_orders || 0, timestamp),
    });

    // System health metric
    const systemHealth = kpis.system_health?.score || 100;
    this.updateMetric('system_health', {
      metric_id: 'system_health',
      metric_name: 'System Health Score',
      current_value: systemHealth,
      threshold: 85,
      status: this.calculateStatus(systemHealth, 85, 'min'),
      trend: 'stable',
      last_updated: timestamp,
      data_points: this.addDataPoint('system_health', systemHealth, timestamp),
    });

    // Process alerts from KPIs
    if (kpis.alerts && Array.isArray(kpis.alerts)) {
      for (const alert of kpis.alerts) {
        this.processBackendAlert(alert);
      }
    }
  }

  /**
   * Process performance metrics
   */
  private processPerformanceMetrics(performanceData: any[]): void {
    if (!Array.isArray(performanceData)) return;

    const timestamp = new Date().toISOString();

    // Calculate average performance across all vendors
    const avgPerformance = performanceData.length > 0 
      ? performanceData.reduce((sum, vendor) => sum + (vendor.performance_score || 0), 0) / performanceData.length
      : 0;

    this.updateMetric('avg_vendor_performance', {
      metric_id: 'avg_vendor_performance',
      metric_name: 'Average Vendor Performance',
      current_value: avgPerformance,
      threshold: this.config.alert_thresholds.performance_score_min,
      status: this.calculateStatus(avgPerformance, this.config.alert_thresholds.performance_score_min, 'min'),
      trend: 'stable',
      last_updated: timestamp,
      data_points: this.addDataPoint('avg_vendor_performance', avgPerformance, timestamp),
    });

    // Calculate on-time delivery rate
    const totalOrders = performanceData.reduce((sum, vendor) => sum + (vendor.total_orders || 0), 0);
    const onTimeOrders = performanceData.reduce((sum, vendor) => sum + (vendor.on_time_orders || 0), 0);
    const onTimeRate = totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0;

    this.updateMetric('on_time_delivery_rate', {
      metric_id: 'on_time_delivery_rate',
      metric_name: 'On-Time Delivery Rate',
      current_value: onTimeRate,
      threshold: this.config.alert_thresholds.on_time_delivery_min,
      status: this.calculateStatus(onTimeRate, this.config.alert_thresholds.on_time_delivery_min, 'min'),
      trend: 'stable',
      last_updated: timestamp,
      data_points: this.addDataPoint('on_time_delivery_rate', onTimeRate, timestamp),
    });
  }

  /**
   * Check for new alerts based on current metrics
   */
  private async checkForNewAlerts(): Promise<void> {
    // Check each metric against thresholds
    for (const [metricId, metric] of this.currentMetrics) {
      if (metric.status === 'critical' || metric.status === 'warning') {
        const existingAlert = Array.from(this.activeAlerts.values()).find(
          alert => alert.alert_type === this.getAlertTypeFromMetric(metricId) && !alert.acknowledged
        );

        if (!existingAlert) {
          this.createMetricAlert(metric);
        }
      }
    }
  }

  /**
   * Create alert from metric threshold breach
   */
  private createMetricAlert(metric: RealTimeMetric): void {
    const alert: VendorAlert = {
      alert_id: `metric_${metric.metric_id}_${Date.now()}`,
      vendor_id: 'system',
      vendor_name: 'System-wide',
      alert_type: this.getAlertTypeFromMetric(metric.metric_id),
      severity: metric.status === 'critical' ? 'critical' : 'warning',
      title: `${metric.metric_name} Threshold Breached`,
      message: `${metric.metric_name} is ${metric.current_value}, ${metric.status} threshold: ${metric.threshold}`,
      triggered_at: new Date().toISOString(),
      auto_resolved: false,
      resolution_actions: this.getResolutionActions(metric.metric_id),
      escalation_level: metric.status === 'critical' ? 2 : 1,
      acknowledged: false,
    };

    this.activeAlerts.set(alert.alert_id, alert);
    this.sendNotification(alert);
  }

  /**
   * Create system alert
   */
  private createSystemAlert(type: string, message: string, severity: 'info' | 'warning' | 'error' | 'critical'): void {
    const alert: VendorAlert = {
      alert_id: `system_${type}_${Date.now()}`,
      vendor_id: 'system',
      vendor_name: 'System',
      alert_type: 'performance',
      severity,
      title: `System Alert: ${type}`,
      message,
      triggered_at: new Date().toISOString(),
      auto_resolved: false,
      resolution_actions: ['Check system logs', 'Contact technical support'],
      escalation_level: severity === 'critical' ? 3 : 1,
      acknowledged: false,
    };

    this.activeAlerts.set(alert.alert_id, alert);
    this.sendNotification(alert);
  }

  /**
   * Process alert from backend
   */
  private processBackendAlert(backendAlert: any): void {
    const alert: VendorAlert = {
      alert_id: backendAlert.id || `backend_${Date.now()}`,
      vendor_id: backendAlert.vendor_id || 'system',
      vendor_name: backendAlert.vendor_name || 'Unknown',
      alert_type: backendAlert.type || 'performance',
      severity: backendAlert.severity || 'warning',
      title: backendAlert.message || 'Backend Alert',
      message: backendAlert.description || backendAlert.message || '',
      triggered_at: backendAlert.created_at || new Date().toISOString(),
      auto_resolved: false,
      resolution_actions: backendAlert.actions || [],
      escalation_level: 1,
      acknowledged: backendAlert.acknowledged || false,
    };

    this.activeAlerts.set(alert.alert_id, alert);
  }

  /**
   * Update or add metric
   */
  private updateMetric(metricId: string, metric: RealTimeMetric): void {
    this.currentMetrics.set(metricId, metric);
  }

  /**
   * Add data point to metric history
   */
  private addDataPoint(metricId: string, value: number, timestamp: string): MetricDataPoint[] {
    const existingMetric = this.currentMetrics.get(metricId);
    const existingPoints = existingMetric?.data_points || [];
    
    // Keep only last 50 points
    const newPoints = [...existingPoints, { timestamp, value }].slice(-50);
    
    return newPoints;
  }

  /**
   * Calculate metric status based on threshold
   */
  private calculateStatus(value: number, threshold: number, type: 'min' | 'max'): 'normal' | 'warning' | 'critical' {
    if (type === 'min') {
      if (value < threshold * 0.7) return 'critical';
      if (value < threshold * 0.85) return 'warning';
      return 'normal';
    } else {
      if (value > threshold * 1.5) return 'critical';
      if (value > threshold * 1.2) return 'warning';
      return 'normal';
    }
  }

  /**
   * Get alert type from metric ID
   */
  private getAlertTypeFromMetric(metricId: string): VendorAlert['alert_type'] {
    const mapping = {
      overdue_orders: 'delivery',
      avg_vendor_performance: 'performance',
      on_time_delivery_rate: 'delivery',
      system_health: 'performance',
      active_orders: 'capacity',
    };
    
    return mapping[metricId as keyof typeof mapping] || 'performance';
  }

  /**
   * Get resolution actions for metric
   */
  private getResolutionActions(metricId: string): string[] {
    const actions = {
      overdue_orders: ['Contact vendors with overdue orders', 'Review delivery schedules', 'Escalate to management'],
      avg_vendor_performance: ['Review vendor performance', 'Schedule vendor meetings', 'Consider vendor replacements'],
      on_time_delivery_rate: ['Analyze delivery patterns', 'Improve vendor communication', 'Review SLAs'],
      system_health: ['Check system status', 'Review error logs', 'Contact IT support'],
      active_orders: ['Review order allocation', 'Check vendor capacity', 'Consider load balancing'],
    };
    
    return actions[metricId as keyof typeof actions] || ['Review metric details', 'Investigate root cause'];
  }

  /**
   * Send notification for alert
   */
  private sendNotification(alert: VendorAlert): void {
    console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.title} - ${alert.message}`);
    
    // Here you would integrate with actual notification systems
    // Email, Slack, SMS, etc.
    
    if (this.config.notification_settings.email_enabled && alert.severity === 'critical') {
      // Send email notification
      this.sendEmailNotification(alert);
    }
    
    if (this.config.notification_settings.slack_enabled) {
      // Send Slack notification
      this.sendSlackNotification(alert);
    }
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(alert: VendorAlert): Promise<void> {
    try {
      await tenantApiClient.post('/notifications/email', {
        subject: `[VENDOR ALERT] ${alert.title}`,
        body: alert.message,
        severity: alert.severity,
        alert_id: alert.alert_id,
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  /**
   * Send Slack notification (placeholder)
   */
  private async sendSlackNotification(alert: VendorAlert): Promise<void> {
    try {
      await tenantApiClient.post('/notifications/slack', {
        channel: '#vendor-alerts',
        message: `🚨 ${alert.title}: ${alert.message}`,
        severity: alert.severity,
        alert_id: alert.alert_id,
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  /**
   * Broadcast update to all subscribers
   */
  private broadcastUpdate(): void {
    const update: DashboardUpdate = {
      timestamp: new Date().toISOString(),
      metrics: Array.from(this.currentMetrics.values()),
      alerts: Array.from(this.activeAlerts.values()),
      system_health: {
        status: this.calculateSystemHealth(),
        uptime: this.calculateUptime(),
        active_monitors: this.currentMetrics.size,
        failed_checks: this.countFailedChecks(),
      },
      vendor_summary: {
        total_active: this.currentMetrics.get('active_vendors')?.current_value || 0,
        high_risk_count: this.countHighRiskVendors(),
        alerts_today: this.countAlertsToday(),
        performance_avg: this.currentMetrics.get('avg_vendor_performance')?.current_value || 0,
      },
    };

    // Send to all subscribers
    this.subscribers.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error broadcasting update to subscriber:', error);
      }
    });
  }

  // Helper methods for summary calculations
  private calculateSystemHealth(): 'healthy' | 'degraded' | 'critical' {
    const criticalAlerts = Array.from(this.activeAlerts.values()).filter(alert => alert.severity === 'critical').length;
    const warningMetrics = Array.from(this.currentMetrics.values()).filter(metric => metric.status !== 'normal').length;
    
    if (criticalAlerts > 0) return 'critical';
    if (warningMetrics > 2) return 'degraded';
    return 'healthy';
  }

  private calculateUptime(): number {
    // Simplified uptime calculation
    return 99.9; // This would be calculated from actual monitoring data
  }

  private countFailedChecks(): number {
    return Array.from(this.currentMetrics.values()).filter(metric => metric.status === 'critical').length;
  }

  private countHighRiskVendors(): number {
    // This would be calculated from actual vendor risk data
    return Array.from(this.activeAlerts.values()).filter(alert => 
      alert.vendor_id !== 'system' && alert.severity === 'critical'
    ).length;
  }

  private countAlertsToday(): number {
    const today = new Date().toDateString();
    return Array.from(this.activeAlerts.values()).filter(alert => 
      new Date(alert.triggered_at).toDateString() === today
    ).length;
  }
}

// Export singleton instance
export const vendorRealTimeMonitor = VendorRealTimeMonitor.getInstance();

// Export types and classes
export {
  VendorRealTimeMonitor,
  type MonitoringConfig,
  type DashboardUpdate,
  type RealTimeMetric,
  type VendorAlert,
};