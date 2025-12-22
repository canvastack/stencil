import { QueryClient } from '@tanstack/react-query';
import { errorHandlingService } from '../services/errors/errorHandlingService';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time: How long inactive data stays in cache (30 minutes)
      gcTime: 30 * 60 * 1000,
      // Enhanced retry logic using error handling service
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          if ([408, 429].includes(error.response.status)) {
            return failureCount < 3;
          }
          return false;
        }
        // Retry up to 3 times for network errors and 5xx
        return failureCount < 3;
      },
      // Exponential backoff with jitter
      retryDelay: (attemptIndex, error) => {
        const baseDelay = 1000;
        const maxDelay = 30000;
        const exponentialDelay = Math.min(baseDelay * 2 ** attemptIndex, maxDelay);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * exponentialDelay;
        return exponentialDelay + jitter;
      },
      // Refetch on window focus (but not too frequently)
      refetchOnWindowFocus: 'always',
      // Automatically refetch when network comes back online
      refetchOnReconnect: 'always',
      // Don't refetch on mount if data is still fresh
      refetchOnMount: true,
      // Global error handler
      onError: (error: any) => {
        errorHandlingService.handleError(error, {
          context: 'Query Error',
          showToast: true,
          reportError: true,
        });
      },
    },
    mutations: {
      // Retry mutations with enhanced logic
      retry: (failureCount, error: any) => {
        // Don't retry client errors (4xx) except specific cases
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          if ([408, 409, 429].includes(error.response.status)) {
            return failureCount < 2;
          }
          return false;
        }
        // Retry network errors and server errors
        return failureCount < 2;
      },
      // Exponential backoff with jitter for mutations
      retryDelay: (attemptIndex) => {
        const baseDelay = 1000;
        const maxDelay = 10000; // Shorter max delay for mutations
        const exponentialDelay = Math.min(baseDelay * 2 ** attemptIndex, maxDelay);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        return exponentialDelay + jitter;
      },
      // Global mutation error handler
      onError: (error: any, variables, context) => {
        errorHandlingService.handleError(error, {
          context: 'Mutation Error',
          showToast: true,
          reportError: true,
        });
      },
    },
  },
});

// Query keys factory for consistent cache key management
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    analytics: () => [...queryKeys.dashboard.all, 'analytics'] as const,
    metrics: (timeframe?: string) => [...queryKeys.dashboard.all, 'metrics', timeframe] as const,
    sales: (period?: string) => [...queryKeys.dashboard.all, 'sales', period] as const,
  },
  
  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    history: (id: string) => [...queryKeys.orders.detail(id), 'history'] as const,
    payments: (id: string) => [...queryKeys.orders.detail(id), 'payments'] as const,
    shipments: (id: string) => [...queryKeys.orders.detail(id), 'shipments'] as const,
  },

  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    orders: (id: string) => [...queryKeys.customers.detail(id), 'orders'] as const,
  },

  // Vendors
  vendors: {
    all: ['vendors'] as const,
    lists: () => [...queryKeys.vendors.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.vendors.lists(), filters] as const,
    details: () => [...queryKeys.vendors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vendors.details(), id] as const,
    products: (id: string) => [...queryKeys.vendors.detail(id), 'products'] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    inventory: (id: string) => [...queryKeys.products.detail(id), 'inventory'] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
  },

  // Shipping
  shipping: {
    all: ['shipping'] as const,
    shipments: () => [...queryKeys.shipping.all, 'shipments'] as const,
    shipment: (id: string) => [...queryKeys.shipping.shipments(), id] as const,
    carriers: () => [...queryKeys.shipping.all, 'carriers'] as const,
    rates: (params?: Record<string, any>) => [...queryKeys.shipping.all, 'rates', params] as const,
  },

  // Inventory
  inventory: {
    all: ['inventory'] as const,
    items: () => [...queryKeys.inventory.all, 'items'] as const,
    item: (id: string) => [...queryKeys.inventory.items(), id] as const,
    movements: (id?: string) => [...queryKeys.inventory.all, 'movements', id] as const,
  },

  // Financial
  financial: {
    all: ['financial'] as const,
    reports: () => [...queryKeys.financial.all, 'reports'] as const,
    report: (type: string, params?: Record<string, any>) => 
      [...queryKeys.financial.reports(), type, params] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.notifications.all, 'list', filters] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
  },
} as const;

// Real-time update configuration
export const realtimeConfig = {
  // Polling intervals for different data types (in milliseconds)
  polling: {
    dashboard: 30000, // 30 seconds
    orders: 15000,    // 15 seconds
    inventory: 60000, // 1 minute
    notifications: 60000, // 1 minute (reduced from 10s for performance)
    payments: 30000,  // 30 seconds
    shipping: 45000,  // 45 seconds
  },
  
  // Stale time for real-time sensitive data
  staleTime: {
    dashboard: 30000, // 30 seconds
    orders: 15000,    // 15 seconds
    inventory: 60000, // 1 minute
    notifications: 30000, // 30 seconds (increased from 5s)
    payments: 30000,  // 30 seconds
    shipping: 45000,  // 45 seconds
  },
};

// Helper functions for cache management
export const cacheUtils = {
  // Invalidate all queries matching a pattern
  invalidateQueries: (pattern: readonly unknown[]) => {
    return queryClient.invalidateQueries({ queryKey: pattern });
  },

  // Remove queries from cache
  removeQueries: (pattern: readonly unknown[]) => {
    return queryClient.removeQueries({ queryKey: pattern });
  },

  // Refetch queries
  refetchQueries: (pattern: readonly unknown[]) => {
    return queryClient.refetchQueries({ queryKey: pattern });
  },

  // Set query data manually
  setQueryData: <T>(key: readonly unknown[], data: T) => {
    return queryClient.setQueryData(key, data);
  },

  // Get query data from cache
  getQueryData: <T>(key: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData<T>(key);
  },

  // Clear all cache
  clear: () => {
    return queryClient.clear();
  },

  // Optimistic update helper
  optimisticUpdate: async <T>(
    queryKey: readonly unknown[],
    updater: (old: T | undefined) => T,
    rollbackData?: T
  ) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousData = queryClient.getQueryData<T>(queryKey);

    // Optimistically update to the new value
    queryClient.setQueryData(queryKey, updater(previousData));

    // Return rollback function
    return () => {
      if (rollbackData !== undefined) {
        queryClient.setQueryData(queryKey, rollbackData);
      } else if (previousData !== undefined) {
        queryClient.setQueryData(queryKey, previousData);
      }
    };
  },
};

export default queryClient;