/**
 * QuoteDetail Query Tests
 * Tests for quote query with order status and production progress
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { quoteService } from '@/services/tenant/quoteService';
import type { Quote } from '@/services/tenant/quoteService';

// Mock the quoteService
vi.mock('@/services/tenant/quoteService', () => ({
  quoteService: {
    getQuote: vi.fn(),
  },
}));

describe('QuoteDetail Query', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch quote with order status fields', async () => {
    const mockQuote: Partial<Quote> = {
      id: 'quote-1',
      uuid: 'quote-uuid-1',
      quote_number: 'Q-2024-001',
      status: 'accepted',
      order_status: 'customer_quote',
      order_status_label: 'Customer Quote',
      responded_at: '2024-01-15T10:00:00Z',
      quote_details: {
        estimated_delivery_days: 14,
      },
    };

    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote as Quote);

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['quote', 'quote-uuid-1'],
          queryFn: () => quoteService.getQuote('quote-uuid-1'),
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.order_status).toBe('customer_quote');
    expect(result.current.data?.order_status_label).toBe('Customer Quote');
  });

  it('should fetch quote with production progress', async () => {
    const mockQuote: Partial<Quote> = {
      id: 'quote-1',
      uuid: 'quote-uuid-1',
      quote_number: 'Q-2024-001',
      status: 'accepted',
      responded_at: '2024-01-15T10:00:00Z',
      production_progress: {
        accepted_date: '2024-01-15T10:00:00Z',
        expected_delivery_date: '2024-01-29T10:00:00Z',
        days_elapsed: 5,
        days_remaining: 9,
        progress_percentage: 35.71,
        is_overdue: false,
      },
      quote_details: {
        estimated_delivery_days: 14,
      },
    };

    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote as Quote);

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['quote', 'quote-uuid-1'],
          queryFn: () => quoteService.getQuote('quote-uuid-1'),
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.production_progress).toBeDefined();
    expect(result.current.data?.production_progress?.days_elapsed).toBe(5);
    expect(result.current.data?.production_progress?.days_remaining).toBe(9);
    expect(result.current.data?.production_progress?.is_overdue).toBe(false);
  });

  it('should handle loading state', async () => {
    vi.mocked(quoteService.getQuote).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({} as Quote), 100))
    );

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['quote', 'quote-uuid-1'],
          queryFn: () => quoteService.getQuote('quote-uuid-1'),
        }),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should handle error state', async () => {
    const error = new Error('Failed to fetch quote');
    vi.mocked(quoteService.getQuote).mockRejectedValue(error);

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['quote', 'quote-uuid-1'],
          queryFn: () => quoteService.getQuote('quote-uuid-1'),
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it('should handle quote without production progress (non-accepted status)', async () => {
    const mockQuote: Partial<Quote> = {
      id: 'quote-1',
      uuid: 'quote-uuid-1',
      quote_number: 'Q-2024-001',
      status: 'sent',
      order_status: 'vendor_negotiation',
      order_status_label: 'Vendor Negotiation',
    };

    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote as Quote);

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['quote', 'quote-uuid-1'],
          queryFn: () => quoteService.getQuote('quote-uuid-1'),
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.production_progress).toBeUndefined();
    expect(result.current.data?.order_status).toBe('vendor_negotiation');
  });

  it('should retry failed requests with exponential backoff', async () => {
    let attemptCount = 0;
    vi.mocked(quoteService.getQuote).mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        id: 'quote-1',
        status: 'accepted',
      } as Quote);
    });

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['quote', 'quote-uuid-1'],
          queryFn: () => quoteService.getQuote('quote-uuid-1'),
          retry: 2,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 5000,
    });

    expect(attemptCount).toBe(3);
    expect(result.current.data).toBeDefined();
  });

  it('should handle stale data correctly', async () => {
    const mockQuote: Partial<Quote> = {
      id: 'quote-1',
      uuid: 'quote-uuid-1',
      quote_number: 'Q-2024-001',
      status: 'accepted',
    };

    vi.mocked(quoteService.getQuote).mockResolvedValue(mockQuote as Quote);

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['quote', 'quote-uuid-1'],
          queryFn: () => quoteService.getQuote('quote-uuid-1'),
          staleTime: 30000,
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isStale).toBe(false);
  });
});
