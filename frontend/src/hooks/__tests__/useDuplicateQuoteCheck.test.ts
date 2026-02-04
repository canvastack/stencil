import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { useDuplicateQuoteCheck } from '../useDuplicateQuoteCheck';
import { quoteService, Quote } from '@/services/tenant/quoteService';

// Mock the quoteService
vi.mock('@/services/tenant/quoteService', () => ({
  quoteService: {
    checkExisting: vi.fn(),
  },
  Quote: {},
}));

// Mock the error handler
vi.mock('@/lib/api/error-handler', () => ({
  handleApiError: (err: any) => ({
    message: err.message || 'An error occurred',
    status: err.status || 500,
  }),
}));

describe('useDuplicateQuoteCheck Hook', () => {
  const mockOrderId = 'order-uuid-123';
  
  const mockExistingQuote: Quote = {
    id: 'quote-uuid-456',
    quote_number: 'Q-2024-001',
    order_id: mockOrderId,
    customer_id: 'customer-uuid-789',
    vendor_id: 'vendor-uuid-012',
    title: 'Custom Etching Quote',
    description: 'Quote for custom etching order',
    status: 'draft',
    total_amount: 100000,
    tax_amount: 10000,
    grand_total: 110000,
    currency: 'IDR',
    valid_until: '2024-12-31',
    terms_and_conditions: 'Standard terms',
    notes: 'Test notes',
    revision_number: 1,
    created_by: 'user-uuid-345',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    customer: {
      id: 'customer-uuid-789',
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
    },
    vendor: {
      id: 'vendor-uuid-012',
      name: 'Vendor Name',
      email: 'vendor@example.com',
      company: 'Vendor Corp',
    },
    items: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should initialize with default state when no orderId provided', () => {
    const { result } = renderHook(() => useDuplicateQuoteCheck());

    expect(result.current.checking).toBe(false);
    expect(result.current.hasActiveQuote).toBe(false);
    expect(result.current.existingQuote).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('should detect existing active quote', async () => {
    vi.mocked(quoteService.checkExisting).mockResolvedValue({
      has_active_quote: true,
      quote: mockExistingQuote,
    });

    const { result } = renderHook(() => useDuplicateQuoteCheck(mockOrderId));

    // Initially should be checking
    expect(result.current.checking).toBe(true);
    expect(result.current.hasActiveQuote).toBe(false);
    expect(result.current.existingQuote).toBe(null);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    // Should have detected the active quote
    expect(result.current.hasActiveQuote).toBe(true);
    expect(result.current.existingQuote).toEqual(mockExistingQuote);
    expect(result.current.error).toBe(null);

    // Verify API was called with correct parameters
    expect(quoteService.checkExisting).toHaveBeenCalledWith({
      order_id: mockOrderId,
      status: ['draft', 'open', 'sent', 'countered'],
    });
    expect(quoteService.checkExisting).toHaveBeenCalledTimes(1);
  });

  test('should return null when no active quote exists', async () => {
    vi.mocked(quoteService.checkExisting).mockResolvedValue({
      has_active_quote: false,
      quote: null,
    });

    const { result } = renderHook(() => useDuplicateQuoteCheck(mockOrderId));

    // Initially should be checking
    expect(result.current.checking).toBe(true);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    // Should not have found an active quote
    expect(result.current.hasActiveQuote).toBe(false);
    expect(result.current.existingQuote).toBe(null);
    expect(result.current.error).toBe(null);

    // Verify API was called
    expect(quoteService.checkExisting).toHaveBeenCalledWith({
      order_id: mockOrderId,
      status: ['draft', 'open', 'sent', 'countered'],
    });
  });

  test('should show loading state during check', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(quoteService.checkExisting).mockReturnValue(promise as any);

    const { result } = renderHook(() => useDuplicateQuoteCheck(mockOrderId));

    // Should be in checking state
    expect(result.current.checking).toBe(true);
    expect(result.current.hasActiveQuote).toBe(false);
    expect(result.current.existingQuote).toBe(null);

    // Resolve the promise
    resolvePromise!({
      has_active_quote: false,
      quote: null,
    });

    // Wait for state to update
    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });
  });

  test('should handle API errors gracefully', async () => {
    const mockError = new Error('Network error');
    vi.mocked(quoteService.checkExisting).mockRejectedValue(mockError);

    // Spy on console.error to verify error logging
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useDuplicateQuoteCheck(mockOrderId));

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    // Should have error state
    expect(result.current.error).toBe('Network error');
    expect(result.current.hasActiveQuote).toBe(false);
    expect(result.current.existingQuote).toBe(null);

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to check for existing quote:',
      expect.objectContaining({ message: 'Network error' })
    );

    consoleErrorSpy.mockRestore();
  });

  test('should reset state when orderId changes to undefined', async () => {
    vi.mocked(quoteService.checkExisting).mockResolvedValue({
      has_active_quote: true,
      quote: mockExistingQuote,
    });

    const { result, rerender } = renderHook(
      ({ orderId }) => useDuplicateQuoteCheck(orderId),
      { initialProps: { orderId: mockOrderId } }
    );

    // Wait for initial check to complete
    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.hasActiveQuote).toBe(true);
    expect(result.current.existingQuote).toEqual(mockExistingQuote);

    // Change orderId to undefined
    rerender({ orderId: undefined });

    // State should be reset immediately
    expect(result.current.checking).toBe(false);
    expect(result.current.hasActiveQuote).toBe(false);
    expect(result.current.existingQuote).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('should re-check when orderId changes', async () => {
    const firstOrderId = 'order-uuid-111';
    const secondOrderId = 'order-uuid-222';

    const firstQuote = { ...mockExistingQuote, id: 'quote-1', order_id: firstOrderId };
    const secondQuote = { ...mockExistingQuote, id: 'quote-2', order_id: secondOrderId };

    vi.mocked(quoteService.checkExisting)
      .mockResolvedValueOnce({
        has_active_quote: true,
        quote: firstQuote,
      })
      .mockResolvedValueOnce({
        has_active_quote: true,
        quote: secondQuote,
      });

    const { result, rerender } = renderHook(
      ({ orderId }) => useDuplicateQuoteCheck(orderId),
      { initialProps: { orderId: firstOrderId } }
    );

    // Wait for first check
    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.existingQuote?.id).toBe('quote-1');
    expect(quoteService.checkExisting).toHaveBeenCalledTimes(1);

    // Change orderId
    rerender({ orderId: secondOrderId });

    // Should start checking again
    expect(result.current.checking).toBe(true);

    // Wait for second check
    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.existingQuote?.id).toBe('quote-2');
    expect(quoteService.checkExisting).toHaveBeenCalledTimes(2);
    expect(quoteService.checkExisting).toHaveBeenLastCalledWith({
      order_id: secondOrderId,
      status: ['draft', 'open', 'sent', 'countered'],
    });
  });

  test('should prevent state updates after unmount', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(quoteService.checkExisting).mockReturnValue(promise as any);

    const { result, unmount } = renderHook(() => useDuplicateQuoteCheck(mockOrderId));

    // Should be checking
    expect(result.current.checking).toBe(true);

    // Unmount before promise resolves
    unmount();

    // Resolve the promise after unmount
    resolvePromise!({
      has_active_quote: true,
      quote: mockExistingQuote,
    });

    // Wait a bit to ensure no state updates occur
    await new Promise((resolve) => setTimeout(resolve, 100));

    // State should remain in checking state (no updates after unmount)
    expect(result.current.checking).toBe(true);
  });

  test('should handle different quote statuses correctly', async () => {
    const statuses = ['draft', 'open', 'sent', 'countered'];

    for (const status of statuses) {
      vi.clearAllMocks();
      
      const quoteWithStatus = {
        ...mockExistingQuote,
        status: status as Quote['status'],
      };

      vi.mocked(quoteService.checkExisting).mockResolvedValue({
        has_active_quote: true,
        quote: quoteWithStatus,
      });

      const { result } = renderHook(() => useDuplicateQuoteCheck(mockOrderId));

      await waitFor(() => {
        expect(result.current.checking).toBe(false);
      });

      expect(result.current.hasActiveQuote).toBe(true);
      expect(result.current.existingQuote?.status).toBe(status);
    }
  });

  test('should clear error on successful retry', async () => {
    const mockError = new Error('Network error');
    
    vi.mocked(quoteService.checkExisting)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({
        has_active_quote: true,
        quote: mockExistingQuote,
      });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, rerender } = renderHook(
      ({ orderId }) => useDuplicateQuoteCheck(orderId),
      { initialProps: { orderId: mockOrderId } }
    );

    // Wait for first check (error)
    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.hasActiveQuote).toBe(false);

    // Trigger re-check by changing orderId
    rerender({ orderId: 'order-uuid-999' });

    // Wait for second check (success)
    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.hasActiveQuote).toBe(true);
    expect(result.current.existingQuote).toEqual(mockExistingQuote);

    consoleErrorSpy.mockRestore();
  });

  test('should handle empty orderId string as no orderId', () => {
    const { result } = renderHook(() => useDuplicateQuoteCheck(''));

    expect(result.current.checking).toBe(false);
    expect(result.current.hasActiveQuote).toBe(false);
    expect(result.current.existingQuote).toBe(null);
    expect(result.current.error).toBe(null);
    expect(quoteService.checkExisting).not.toHaveBeenCalled();
  });
});
