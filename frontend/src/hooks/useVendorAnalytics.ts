import { useState, useCallback, useEffect } from 'react';
import { tenantApiClient } from '../services/tenant/tenantApiClient';
import { toast } from 'sonner';

// Types for vendor analytics
export interface VendorKPI {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export interface VendorPerformanceHeatmap {
  vendor_id: string;
  vendor_name: string;
  vendor_code: string;
  quality_tier: string;
  metrics: Record<string, number>;
  overall_score: number;
}

export interface VendorRiskAnalysis {
  vendor_id: string;
  vendor_name: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  mitigation_actions: string[];
}

export interface VendorRecommendation {
  vendor_id: string;
  vendor_name: string;
  vendor_code: string;
  quality_tier: string;
  overall_score: number;
  sub_scores: Record<string, number>;
  estimated_price: number;
  estimated_lead_time: number;
  confidence_level: 'low' | 'medium' | 'high';
  match_explanation: string;
  risk_assessment?: {
    level: string;
    score: number;
    factors: string[];
  };
}

export interface VendorAnalyticsDashboard {
  summary_kpis: {
    top_performer: {
      name: string;
      score: number;
      trend: { direction: string; percentage: number };
    };
    average_response_time: number;
    response_time_trend: { direction: string; percentage: number };
    overall_on_time_rate: number;
    on_time_rate_trend: { direction: string; percentage: number };
    active_vendors: number;
    new_this_month: number;
    active_vendors_trend: { direction: string; percentage: number };
    average_profit_margin: number;
    profit_margin_trend: { direction: string; percentage: number };
    total_active_orders: number;
    completed_orders: number;
    average_order_value: number;
  };
  performance_matrix: VendorPerformanceHeatmap[];
  risk_analysis: {
    vendors: VendorRiskAnalysis[];
    risk_distribution: Record<string, number>;
    total_vendors_analyzed: number;
    high_risk_percentage: number;
  };
  top_performers: any[];
  trends?: any[];
  predictions?: any[];
}

// Hook for comprehensive vendor analytics
export const useVendorAnalytics = () => {
  const [analytics, setAnalytics] = useState<VendorAnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (options?: {
    dateFrom?: string;
    dateTo?: string;
    vendorIds?: number[];
    includeTrends?: boolean;
    includePredictions?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.dateFrom) params.append('date_from', options.dateFrom);
      if (options?.dateTo) params.append('date_to', options.dateTo);
      if (options?.vendorIds) {
        options.vendorIds.forEach((id, index) => {
          params.append(`vendor_ids[${index}]`, id.toString());
        });
      }
      if (options?.includeTrends !== undefined) params.append('include_trends', options.includeTrends.toString());
      if (options?.includePredictions !== undefined) params.append('include_predictions', options.includePredictions.toString());

      const response = await tenantApiClient.get(`/vendor-analytics/dashboard?${params.toString()}`);
      setAnalytics(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch vendor analytics';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
  };
};

// Hook for vendor performance heatmap
export const useVendorPerformanceHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState<VendorPerformanceHeatmap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHeatmap = useCallback(async (options?: {
    period?: 'daily' | 'weekly' | 'monthly';
    metrics?: string[];
    vendorIds?: number[];
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.period) params.append('period', options.period);
      if (options?.metrics) {
        options.metrics.forEach((metric, index) => {
          params.append(`metrics[${index}]`, metric);
        });
      }
      if (options?.vendorIds) {
        options.vendorIds.forEach((id, index) => {
          params.append(`vendor_ids[${index}]`, id.toString());
        });
      }

      const response = await tenantApiClient.get(`/vendor-analytics/performance-heatmap?${params.toString()}`);
      setHeatmapData(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch performance heatmap';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    heatmapData,
    isLoading,
    error,
    fetchHeatmap,
  };
};

// Hook for vendor risk analysis
export const useVendorRiskAnalysis = () => {
  const [riskData, setRiskData] = useState<{
    vendors: VendorRiskAnalysis[];
    risk_distribution: Record<string, number>;
    total_vendors_analyzed: number;
    high_risk_percentage: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskAnalysis = useCallback(async (options?: {
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    sortBy?: 'risk_score' | 'performance_score' | 'last_order_date';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.riskLevel) params.append('risk_level', options.riskLevel);
      if (options?.sortBy) params.append('sort_by', options.sortBy);
      if (options?.sortOrder) params.append('sort_order', options.sortOrder);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await tenantApiClient.get(`/vendor-analytics/risk-analysis?${params.toString()}`);
      setRiskData(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch risk analysis';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    riskData,
    isLoading,
    error,
    fetchRiskAnalysis,
  };
};

// Hook for AI-powered vendor recommendations
export const useVendorRecommendations = () => {
  const [recommendations, setRecommendations] = useState<{
    vendors: VendorRecommendation[];
    algorithm_version: string;
    total_candidates_evaluated: number;
    recommendation_criteria: any;
    generated_at: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(async (orderRequirements: {
    material: string;
    process: string;
    quantity: number;
    budget_min?: number;
    budget_max?: number;
    deadline_days?: number;
    quality_tier?: 'standard' | 'premium' | 'exclusive';
  }, options?: {
    limit?: number;
    includeRiskAssessment?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        order_requirements: orderRequirements,
        limit: options?.limit || 10,
        include_risk_assessment: options?.includeRiskAssessment ?? true,
      };

      const response = await tenantApiClient.post('/vendor-analytics/recommendations', payload);
      setRecommendations(response.data);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get vendor recommendations';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    getRecommendations,
  };
};

// Hook for vendor performance trends
export const useVendorPerformanceTrends = () => {
  const [trends, setTrends] = useState<{
    trends: any[];
    period_type: string;
    metrics_tracked: string[];
    date_range: { from: string; to: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async (options?: {
    vendorId?: number;
    dateFrom?: string;
    dateTo?: string;
    period?: 'weekly' | 'monthly' | 'quarterly';
    metrics?: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.vendorId) params.append('vendor_id', options.vendorId.toString());
      if (options?.dateFrom) params.append('date_from', options.dateFrom);
      if (options?.dateTo) params.append('date_to', options.dateTo);
      if (options?.period) params.append('period', options.period);
      if (options?.metrics) {
        options.metrics.forEach((metric, index) => {
          params.append(`metrics[${index}]`, metric);
        });
      }

      const response = await tenantApiClient.get(`/vendor-analytics/performance-trends?${params.toString()}`);
      setTrends(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch performance trends';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    trends,
    isLoading,
    error,
    fetchTrends,
  };
};

// Hook for vendor comparison
export const useVendorComparison = () => {
  const [comparison, setComparison] = useState<{
    vendors: any[];
    rankings: Record<string, string[]>;
    period: string;
    metrics: string[];
    best_overall: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compareVendors = useCallback(async (
    vendorIds: number[],
    options?: {
      metrics?: string[];
      period?: '1m' | '3m' | '6m' | '1y';
    }
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        vendor_ids: vendorIds,
        metrics: options?.metrics || ['overall_score', 'on_time_delivery', 'quality_rating', 'cost_efficiency'],
        period: options?.period || '6m',
      };

      const response = await tenantApiClient.post('/vendor-analytics/compare', payload);
      setComparison(response.data);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compare vendors';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    comparison,
    isLoading,
    error,
    compareVendors,
  };
};

// Hook for real-time vendor KPIs
export const useRealTimeVendorKPIs = (refreshInterval: number = 300) => {
  const [kpis, setKpis] = useState<{
    active_vendors: number;
    active_orders: number;
    overdue_orders: number;
    recent_negotiations: number;
    system_health: {
      score: number;
      status: string;
      active_vendors: number;
      total_vendors: number;
    };
    alerts?: Array<{
      type: string;
      message: string;
      action: string;
      severity: string;
    }>;
    last_updated: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = useCallback(async (includeAlerts: boolean = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('refresh_interval', refreshInterval.toString());
      params.append('include_alerts', includeAlerts.toString());

      const response = await tenantApiClient.get(`/vendor-analytics/real-time-kpis?${params.toString()}`);
      setKpis(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch real-time KPIs';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [refreshInterval]);

  useEffect(() => {
    fetchKPIs();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchKPIs();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [fetchKPIs, refreshInterval]);

  return {
    kpis,
    isLoading,
    error,
    fetchKPIs,
  };
};