import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import QuotaDashboard from '@/components/admin/exchange-rate/QuotaDashboard';
import { exchangeRateService } from '@/services/api/exchangeRate';
import { QuotaStatus } from '@/types/exchangeRate';

// Mock the exchangeRate service
vi.mock('@/services/api/exchangeRate', () => ({
  exchangeRateService: {
    getQuotaStatus: vi.fn(),
  },
}));

describe('QuotaDashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockQuotaStatuses: QuotaStatus[] = [
    {
      provider_id: 'provider-1',
      provider_name: 'ExchangeRate-API',
      monthly_quota: 1500,
      requests_used: 100,
      remaining_quota: 1400,
      is_unlimited: false,
      is_exhausted: false,
      is_at_warning: false,
      is_at_critical: false,
      next_reset_date: '2024-02-01',
    },
    {
      provider_id: 'provider-2',
      provider_name: 'CurrencyAPI',
      monthly_quota: 300,
      requests_used: 260,
      remaining_quota: 40,
      is_unlimited: false,
      is_exhausted: false,
      is_at_warning: true,
      is_at_critical: false,
      next_reset_date: '2024-02-01',
    },
    {
      provider_id: 'provider-3',
      provider_name: 'Frankfurter',
      monthly_quota: 0,
      requests_used: 0,
      remaining_quota: Number.MAX_SAFE_INTEGER,
      is_unlimited: true,
      is_exhausted: false,
      is_at_warning: false,
      is_at_critical: false,
      next_reset_date: '2024-02-01',
    },
  ];

  it('should display quota status for all providers', async () => {
    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(mockQuotaStatuses);

    render(<QuotaDashboard />);

    // Wait for loading to complete and providers to be displayed
    await waitFor(
      () => {
        expect(screen.getByText('ExchangeRate-API')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Check that all providers are displayed
    expect(screen.getByText('CurrencyAPI')).toBeInTheDocument();
    expect(screen.getByText('Frankfurter')).toBeInTheDocument();
  });

  it('should display correct color coding for critical status', async () => {
    const criticalQuotaStatuses: QuotaStatus[] = [
      {
        provider_id: 'provider-1',
        provider_name: 'Provider 1',
        monthly_quota: 1500,
        requests_used: 1485,
        remaining_quota: 15,
        is_unlimited: false,
        is_exhausted: false,
        is_at_warning: false,
        is_at_critical: true,
        next_reset_date: '2024-02-01',
      },
    ];

    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(criticalQuotaStatuses);

    render(<QuotaDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Critical')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should display correct color coding for exhausted status', async () => {
    const exhaustedQuotaStatuses: QuotaStatus[] = [
      {
        provider_id: 'provider-2',
        provider_name: 'Provider 2',
        monthly_quota: 300,
        requests_used: 300,
        remaining_quota: 0,
        is_unlimited: false,
        is_exhausted: true,
        is_at_warning: false,
        is_at_critical: false,
        next_reset_date: '2024-02-01',
      },
    ];

    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(exhaustedQuotaStatuses);

    render(<QuotaDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Exhausted')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should display warning color coding', async () => {
    const warningQuotaStatuses: QuotaStatus[] = [
      {
        provider_id: 'provider-1',
        provider_name: 'Provider 1',
        monthly_quota: 1500,
        requests_used: 1455,
        remaining_quota: 45,
        is_unlimited: false,
        is_exhausted: false,
        is_at_warning: true,
        is_at_critical: false,
        next_reset_date: '2024-02-01',
      },
    ];

    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(warningQuotaStatuses);

    render(<QuotaDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Warning')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should display healthy status for providers with sufficient quota', async () => {
    const healthyQuotaStatuses: QuotaStatus[] = [
      {
        provider_id: 'provider-1',
        provider_name: 'Provider 1',
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

    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue(healthyQuotaStatuses);

    render(<QuotaDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Healthy')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should handle empty quota status gracefully', async () => {
    vi.mocked(exchangeRateService.getQuotaStatus).mockResolvedValue([]);

    render(<QuotaDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('No quota data available')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(exchangeRateService.getQuotaStatus).mockRejectedValue(
      new Error('API Error')
    );

    render(<QuotaDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Quota Monitoring')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    consoleErrorSpy.mockRestore();
  });
});
