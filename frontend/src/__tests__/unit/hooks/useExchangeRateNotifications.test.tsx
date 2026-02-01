import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useExchangeRateNotifications,
  useProviderSwitchListener,
  useStaleRateCheck,
  useExchangeRateNotificationSystem,
} from '@/hooks/useExchangeRateNotifications';
import { exchangeRateService } from '@/services/api/exchangeRate';
import * as notifications from '@/services/notifications/exchangeRateNotifications';
import type { QuotaStatus, ExchangeRateSetting } from '@/types/exchangeRate';

// Mock the API service
vi.mock('@/services/api/exchangeRate', () => ({
  exchangeRateService: {
    getQuotaStatus: vi.fn(),
    getSettings: vi.fn(),
  },
}));

// Mock the notification service
vi.mock('@/services/notifications/exchangeRateNotifications', () => ({
  showQuotaWarning: vi.fn(),
  showCriticalQuotaWarning: vi.fn(),
  showProviderSwitched: vi.fn(),
  showStaleRateWarning: vi.fn(),
}));

// Create a wrapper with QueryClient
const createWrapper = () => {
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
};

describe('useExchangeRateNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches quota status when enabled', async () => {
    const mockQuotaStatuses: QuotaStatus[] = [
      {
        provider_id: 'provider-1',
        provider_name: 'exchangerate-api.com',
        monthly_quota: 1500,
        requests_used: 100,
        remaining_quota: 1400,
        is_unlimited: false,
        is_exhausted: false,
        is_at_warning: false,
        is_at_critical: false,
        next_reset_date: '2024-02-01',
      },
    ];

    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(mockQuotaStatuses);

    const { result } = renderHook(() => useExchangeRateNotifications({ enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.quotaStatuses).toEqual(mockQuotaStatuses);
    });
  });

  it('shows warning notification when quota is at warning level', async () => {
    const mockQuotaStatuses: QuotaStatus[] = [
      {
        provider_id: 'provider-1',
        provider_name: 'exchangerate-api.com',
        monthly_quota: 1500,
        requests_used: 1450,
        remaining_quota: 50,
        is_unlimited: false,
        is_exhausted: false,
        is_at_warning: true,
        is_at_critical: false,
        next_reset_date: '2024-02-01',
      },
    ];

    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(mockQuotaStatuses);

    renderHook(() => useExchangeRateNotifications({ enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(notifications.showQuotaWarning).toHaveBeenCalledWith('exchangerate-api.com', 50);
    });
  });

  it('shows critical notification when quota is at critical level', async () => {
    const mockQuotaStatuses: QuotaStatus[] = [
      {
        provider_id: 'provider-1',
        provider_name: 'exchangerate-api.com',
        monthly_quota: 1500,
        requests_used: 1480,
        remaining_quota: 20,
        is_unlimited: false,
        is_exhausted: false,
        is_at_warning: true,
        is_at_critical: true,
        next_reset_date: '2024-02-01',
      },
      {
        provider_id: 'provider-2',
        provider_name: 'currencyapi.com',
        monthly_quota: 300,
        requests_used: 50,
        remaining_quota: 250,
        is_unlimited: false,
        is_exhausted: false,
        is_at_warning: false,
        is_at_critical: false,
        next_reset_date: '2024-02-01',
      },
    ];

    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(mockQuotaStatuses);

    renderHook(() => useExchangeRateNotifications({ enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(notifications.showCriticalQuotaWarning).toHaveBeenCalledWith(
        'exchangerate-api.com',
        20,
        'currencyapi.com',
        250
      );
    });
  });

  it('skips unlimited providers', async () => {
    const mockQuotaStatuses: QuotaStatus[] = [
      {
        provider_id: 'provider-1',
        provider_name: 'frankfurter.app',
        monthly_quota: 0,
        requests_used: 1000,
        remaining_quota: Number.MAX_SAFE_INTEGER,
        is_unlimited: true,
        is_exhausted: false,
        is_at_warning: false,
        is_at_critical: false,
        next_reset_date: '2024-02-01',
      },
    ];

    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(mockQuotaStatuses);

    renderHook(() => useExchangeRateNotifications({ enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(notifications.showQuotaWarning).not.toHaveBeenCalled();
      expect(notifications.showCriticalQuotaWarning).not.toHaveBeenCalled();
    });
  });

  it('does not fetch when disabled', () => {
    renderHook(() => useExchangeRateNotifications({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(exchangeRateService.getQuotaStatus).not.toHaveBeenCalled();
  });
});

describe('useProviderSwitchListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows notification when provider switches', () => {
    const onProviderSwitch = vi.fn();
    const { result } = renderHook(() => useProviderSwitchListener(onProviderSwitch));

    result.current.handleProviderSwitch('old-provider', 'new-provider', 300);

    expect(notifications.showProviderSwitched).toHaveBeenCalledWith('new-provider', 300);
    expect(onProviderSwitch).toHaveBeenCalledWith('old-provider', 'new-provider');
  });

  it('works without callback', () => {
    const { result } = renderHook(() => useProviderSwitchListener());

    result.current.handleProviderSwitch('old-provider', 'new-provider', 300);

    expect(notifications.showProviderSwitched).toHaveBeenCalledWith('new-provider', 300);
  });
});

describe('useStaleRateCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows warning for stale rate (older than 7 days)', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

    const mockSettings: ExchangeRateSetting = {
      uuid: 'setting-1',
      tenant_id: 'tenant-1',
      mode: 'auto',
      manual_rate: 15000,
      active_provider_id: 'provider-1',
      auto_update_enabled: true,
      update_time: '00:00:00',
      last_updated_at: oldDate.toISOString(),
    };

    vi.mocked(exchangeRateService.getSettings).mockResolvedValue(mockSettings);

    renderHook(() => useStaleRateCheck({ enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(notifications.showStaleRateWarning).toHaveBeenCalledWith(15000, 10);
    });
  });

  it('does not show warning for recent rate', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2); // 2 days ago

    const mockSettings: ExchangeRateSetting = {
      uuid: 'setting-1',
      tenant_id: 'tenant-1',
      mode: 'auto',
      manual_rate: 15000,
      active_provider_id: 'provider-1',
      auto_update_enabled: true,
      update_time: '00:00:00',
      last_updated_at: recentDate.toISOString(),
    };

    vi.mocked(exchangeRateService.getSettings).mockResolvedValue(mockSettings);

    renderHook(() => useStaleRateCheck({ enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(notifications.showStaleRateWarning).not.toHaveBeenCalled();
    });
  });

  it('does not show warning in manual mode', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

    const mockSettings: ExchangeRateSetting = {
      uuid: 'setting-1',
      tenant_id: 'tenant-1',
      mode: 'manual',
      manual_rate: 15000,
      active_provider_id: null,
      auto_update_enabled: false,
      update_time: '00:00:00',
      last_updated_at: oldDate.toISOString(),
    };

    vi.mocked(exchangeRateService.getSettings).mockResolvedValue(mockSettings);

    renderHook(() => useStaleRateCheck({ enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(notifications.showStaleRateWarning).not.toHaveBeenCalled();
    });
  });
});

describe('useExchangeRateNotificationSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('combines all notification hooks', async () => {
    const mockQuotaStatuses: QuotaStatus[] = [];
    const mockSettings: ExchangeRateSetting = {
      uuid: 'setting-1',
      tenant_id: 'tenant-1',
      mode: 'auto',
      manual_rate: 15000,
      active_provider_id: 'provider-1',
      auto_update_enabled: true,
      update_time: '00:00:00',
      last_updated_at: new Date().toISOString(),
    };

    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(mockQuotaStatuses);
    vi.mocked(exchangeRateService.getSettings).mockResolvedValue(mockSettings);

    const { result } = renderHook(() => useExchangeRateNotificationSystem({ enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.quotaStatuses).toBeDefined();
      expect(result.current.settings).toBeDefined();
      expect(result.current.handleProviderSwitch).toBeDefined();
    });
  });

  it('respects enabled flag', () => {
    renderHook(() => useExchangeRateNotificationSystem({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(exchangeRateService.getQuotaStatus).not.toHaveBeenCalled();
    expect(exchangeRateService.getSettings).not.toHaveBeenCalled();
  });
});
