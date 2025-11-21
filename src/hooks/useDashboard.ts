import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardService } from '../services/api/dashboard';
import { queryKeys, realtimeConfig } from '../lib/react-query';

// Dashboard analytics with real-time updates
export const useDashboardAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.analytics(),
    queryFn: () => dashboardService.getAnalytics(),
    staleTime: realtimeConfig.staleTime.dashboard,
    refetchInterval: realtimeConfig.polling.dashboard,
    refetchIntervalInBackground: true,
  });
};

// Dashboard metrics with configurable timeframe
export const useDashboardMetrics = (timeframe: string = '30d') => {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(timeframe),
    queryFn: () => dashboardService.getMetrics(timeframe),
    staleTime: realtimeConfig.staleTime.dashboard,
    refetchInterval: realtimeConfig.polling.dashboard,
    refetchIntervalInBackground: true,
  });
};

// Sales data with period filtering
export const useDashboardSales = (period: string = 'month') => {
  return useQuery({
    queryKey: queryKeys.dashboard.sales(period),
    queryFn: () => dashboardService.getSalesData(period),
    staleTime: realtimeConfig.staleTime.dashboard,
    refetchInterval: realtimeConfig.polling.dashboard,
    refetchIntervalInBackground: true,
  });
};