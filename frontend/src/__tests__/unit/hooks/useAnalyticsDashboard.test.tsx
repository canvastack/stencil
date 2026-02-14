import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import { ReactNode } from 'react';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockMetricsResponse = {
  data: {
    metrics: {
      active_orders: 45,
      active_orders_change: 12.5,
      on_time_delivery_rate: 87.3,
      on_time_delivery_rate_change: 5.2,
      avg_production_time: 14.5,
      avg_production_time_change: -2.1,
      quote_acceptance_rate: 78.9,
      quote_acceptance_rate_change: 3.4,
    },
    period: {
      start: '2026-01-15T00:00:00Z',
      end: '2026-02-14T23:59:59Z',
    },
  },
};

const mockTimelineResponse = {
  data: {
    timeline: [
      { date: '2026-02-01', accepted: 5, completed: 3, overdue: 1 },
      { date: '2026-02-02', accepted: 7, completed: 4, overdue: 0 },
    ],
  },
};

const mockVendorResponse = {
  data: {
    vendors: [
      {
        id: 'vendor-1',
        name: 'PT Vendor A',
        total_orders: 25,
        on_time_delivery_rate: 92.0,
        avg_production_time: 12.5,
        quality_score: 4.8,
        status: 'active',
      },
    ],
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 1,
      last_page: 1,
    },
  },
};

const mockDeliveryStatusResponse = {
  data: {
    distribution: [
      { status: 'on_track', count: 25, percentage: 55.6 },
      { status: 'approaching', count: 12, percentage: 26.7 },
    ],
    total: 45,
  },
};

const mockActivitiesResponse = {
  data: {
    activities: [
      {
        id: 'activity-1',
        type: 'quote_accepted',
        title: 'Quote Accepted',
        description: 'Vendor accepted quote',
        timestamp: '2026-02-14T10:30:00Z',
        order_id: 'order-123',
      },
    ],
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAnalyticsDashboard Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');

    // Setup default mock responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/metrics')) {
        return Promise.resolve(mockMetricsResponse);
      }
      if (url.includes('/production-timeline')) {
        return Promise.resolve(mockTimelineResponse);
      }
      if (url.includes('/vendor-performance')) {
        return Promise.resolve(mockVendorResponse);
      }
      if (url.includes('/delivery-status')) {
        return Promise.resolve(mockDeliveryStatusResponse);
      }
      if (url.includes('/recent-activity')) {
        return Promise.resolve(mockActivitiesResponse);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('fetches and returns all dashboard data', async () => {
    const { result } = renderHook(() => useAnalyticsDashboard('30d'), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check metrics
    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics?.activeOrders).toBe(45);
    expect(result.current.metrics?.onTimeDeliveryRate).toBe(87.3);

    // Check timeline
    expect(result.current.timeline).toHaveLength(2);
    expect(result.current.timeline[0].date).toBe('2026-02-01');

    // Check vendors
    expect(result.current.vendors).toHaveLength(1);
    expect(result.current.vendors[0].name).toBe('PT Vendor A');

    // Check delivery status
    expect(result.current.deliveryStatus).toHaveLength(2);

    // Check activities
    expect(result.current.activities).toHaveLength(1);
  });

  it('passes correct time range to API', async () => {
    renderHook(() => useAnalyticsDashboard('7d'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/metrics'),
        expect.objectContaining({
          params: { time_range: '7d' },
        })
      );
    });
  });

  it('includes authorization header in requests', async () => {
    renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    // Check all calls have auth header
    mockedAxios.get.mock.calls.forEach((call) => {
      expect(call[1]).toMatchObject({
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });

  it('transforms metrics data correctly', async () => {
    const { result } = renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.metrics).toBeDefined();
    });

    // Check camelCase transformation
    expect(result.current.metrics).toEqual({
      activeOrders: 45,
      activeOrdersChange: 12.5,
      onTimeDeliveryRate: 87.3,
      onTimeDeliveryRateChange: 5.2,
      avgProductionTime: 14.5,
      avgProductionTimeChange: -2.1,
      quoteAcceptanceRate: 78.9,
      quoteAcceptanceRateChange: 3.4,
    });
  });

  it('transforms vendor data correctly', async () => {
    const { result } = renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.vendors).toHaveLength(1);
    });

    expect(result.current.vendors[0]).toEqual({
      id: 'vendor-1',
      name: 'PT Vendor A',
      totalOrders: 25,
      onTimeDeliveryRate: 92.0,
      avgProductionTime: 12.5,
      qualityScore: 4.8,
      status: 'active',
    });
  });

  it('returns vendor pagination data', async () => {
    const { result } = renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.vendorsPagination).toBeDefined();
    });

    expect(result.current.vendorsPagination).toEqual({
      current_page: 1,
      per_page: 10,
      total: 1,
      last_page: 1,
    });
  });

  it('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should return undefined/empty data
    expect(result.current.metrics).toBeUndefined();
    expect(result.current.timeline).toEqual([]);
    expect(result.current.vendors).toEqual([]);
  });

  it('handles empty responses', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/metrics')) {
        return Promise.resolve({ data: { metrics: {}, period: {} } });
      }
      if (url.includes('/vendor-performance')) {
        return Promise.resolve({ data: { vendors: [], pagination: {} } });
      }
      return Promise.resolve({ data: {} });
    });

    const { result } = renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.timeline).toEqual([]);
    expect(result.current.vendors).toEqual([]);
    expect(result.current.deliveryStatus).toEqual([]);
    expect(result.current.activities).toEqual([]);
  });

  it('uses default time range when not specified', async () => {
    renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/metrics'),
        expect.objectContaining({
          params: { time_range: '30d' },
        })
      );
    });
  });

  it('fetches all endpoints in parallel', async () => {
    renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(5);
    });

    // Verify all endpoints called
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/metrics'),
      expect.any(Object)
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/production-timeline'),
      expect.any(Object)
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/vendor-performance'),
      expect.any(Object)
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/delivery-status'),
      expect.any(Object)
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/recent-activity'),
      expect.any(Object)
    );
  });

  it('returns loading state correctly', async () => {
    const { result } = renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // After data loads
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles partial data loading', async () => {
    let callCount = 0;
    mockedAxios.get.mockImplementation((url: string) => {
      callCount++;
      if (callCount <= 3) {
        return Promise.resolve(mockMetricsResponse);
      }
      // Delay remaining calls
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockMetricsResponse), 1000)
      );
    });

    const { result } = renderHook(() => useAnalyticsDashboard(), {
      wrapper: createWrapper(),
    });

    // Should still be loading while some queries pending
    expect(result.current.isLoading).toBe(true);
  });
});
