/**
 * Optimistic Updates Integration Tests
 * 
 * Tests the integration of optimistic updates with order status workflow components
 * Focus: Testing fallback behavior when optimistic updates fail and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAdvanceOrderStage } from '@/hooks/useOrders';
import { BusinessStage } from '@/utils/OrderProgressCalculator';
import { queryKeys } from '@/lib/react-query';

// Mock the orders service
vi.mock('@/services/api/orders', () => ({
  ordersService: {
    advanceOrderStage: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock OrderStatusMessaging
vi.mock('@/utils/OrderStatusMessaging', () => ({
  OrderStatusMessaging: {
    showProgressIndicator: vi.fn(),
    dismissProgressIndicator: vi.fn(),
    showStageAdvancementSuccess: vi.fn(),
    showStageAdvancementError: vi.fn(),
  },
}));

// Test component that uses the optimistic updates hook
function TestOrderAdvanceComponent({ orderId }: { orderId: string }) {
  const advanceStage = useAdvanceOrderStage();

  const handleAdvance = () => {
    advanceStage.mutate({
      id: orderId,
      targetStage: BusinessStage.VENDOR_SOURCING,
      notes: 'Test advancement',
    });
  };

  return (
    <div>
      <button onClick={handleAdvance} disabled={advanceStage.isPending}>
        {advanceStage.isPending ? 'Advancing...' : 'Advance Stage'}
      </button>
      <div data-testid="status">
        {advanceStage.isPending ? 'Loading' : 'Ready'}
      </div>
      <div data-testid="error">
        {advanceStage.error ? 'Error occurred' : 'No error'}
      </div>
      <div data-testid="success">
        {advanceStage.isSuccess ? 'Success' : 'Not completed'}
      </div>
    </div>
  );
}

describe('Optimistic Updates Integration', () => {
  let queryClient: QueryClient;
  let mockOrder: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockOrder = {
      id: 'test-order-1',
      uuid: 'test-uuid-1',
      status: 'pending',
      customer_name: 'Test Customer',
      total_amount: 100000,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      items: [],
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should handle successful API response with fallback behavior', async () => {
    const { ordersService } = await import('@/services/api/orders');
    
    // Mock successful API response
    const mockResponse = {
      ...mockOrder,
      status: 'vendor_sourcing',
      updated_at: '2024-01-01T01:00:00Z',
    };
    
    (ordersService.advanceOrderStage as any).mockResolvedValue(mockResponse);

    renderWithProviders(<TestOrderAdvanceComponent orderId="test-order-1" />);

    const advanceButton = screen.getByText('Advance Stage');
    
    // Click advance button
    fireEvent.click(advanceButton);

    // Wait for mutation to complete (fallback behavior since no order in cache)
    await waitFor(() => {
      expect(screen.getByTestId('success')).toHaveTextContent('Success');
      expect(screen.getByTestId('status')).toHaveTextContent('Ready');
    }, { timeout: 3000 });

    // Verify API was called
    expect(ordersService.advanceOrderStage).toHaveBeenCalledWith(
      'test-order-1',
      BusinessStage.VENDOR_SOURCING,
      'Test advancement',
      undefined
    );
  });

  it('should handle API error with proper error state', async () => {
    const { ordersService } = await import('@/services/api/orders');
    
    // Mock API error
    const mockError = new Error('Network error');
    (ordersService.advanceOrderStage as any).mockRejectedValue(mockError);

    renderWithProviders(<TestOrderAdvanceComponent orderId="test-order-1" />);

    const advanceButton = screen.getByText('Advance Stage');
    
    // Click advance button
    fireEvent.click(advanceButton);

    // Wait for mutation to fail
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Error occurred');
      expect(screen.getByTestId('status')).toHaveTextContent('Ready');
    }, { timeout: 3000 });

    // Verify API was called
    expect(ordersService.advanceOrderStage).toHaveBeenCalledWith(
      'test-order-1',
      BusinessStage.VENDOR_SOURCING,
      'Test advancement',
      undefined
    );
  });

  it('should work with order data in cache for optimistic updates', async () => {
    const { ordersService } = await import('@/services/api/orders');
    
    // Set order data in cache BEFORE rendering
    queryClient.setQueryData(queryKeys.orders.detail('test-order-1'), mockOrder);
    
    // Mock successful API response
    const mockResponse = {
      ...mockOrder,
      status: 'vendor_sourcing',
      updated_at: '2024-01-01T01:00:00Z',
    };
    
    (ordersService.advanceOrderStage as any).mockResolvedValue(mockResponse);

    renderWithProviders(<TestOrderAdvanceComponent orderId="test-order-1" />);

    const advanceButton = screen.getByText('Advance Stage');
    
    // Click advance button
    fireEvent.click(advanceButton);

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByTestId('success')).toHaveTextContent('Success');
      expect(screen.getByTestId('status')).toHaveTextContent('Ready');
    }, { timeout: 3000 });

    // Check that order was updated in cache
    const updatedOrder = queryClient.getQueryData(queryKeys.orders.detail('test-order-1'));
    expect(updatedOrder).toEqual(mockResponse);
  });

  it('should handle missing order gracefully with fallback', async () => {
    const { ordersService } = await import('@/services/api/orders');
    
    // Don't set any order data in cache - this should trigger fallback behavior
    
    // Mock successful API response
    const mockResponse = {
      ...mockOrder,
      status: 'vendor_sourcing',
      updated_at: '2024-01-01T01:00:00Z',
    };
    
    (ordersService.advanceOrderStage as any).mockResolvedValue(mockResponse);

    renderWithProviders(<TestOrderAdvanceComponent orderId="test-order-1" />);

    const advanceButton = screen.getByText('Advance Stage');
    
    // Click advance button
    fireEvent.click(advanceButton);

    // Wait for completion (should use fallback behavior)
    await waitFor(() => {
      expect(screen.getByTestId('success')).toHaveTextContent('Success');
      expect(screen.getByTestId('status')).toHaveTextContent('Ready');
    }, { timeout: 3000 });

    // Verify API was still called
    expect(ordersService.advanceOrderStage).toHaveBeenCalledWith(
      'test-order-1',
      BusinessStage.VENDOR_SOURCING,
      'Test advancement',
      undefined
    );
  });

  it('should prevent multiple concurrent requests', async () => {
    const { ordersService } = await import('@/services/api/orders');
    
    // Mock delayed API response
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    (ordersService.advanceOrderStage as any).mockReturnValue(delayedPromise);

    renderWithProviders(<TestOrderAdvanceComponent orderId="test-order-1" />);

    const advanceButton = screen.getByText('Advance Stage');
    
    // Click advance button multiple times quickly
    fireEvent.click(advanceButton);
    
    // Wait a bit to ensure the first mutation starts
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Try to click again - should be disabled
    expect(advanceButton).toBeDisabled();
    
    // Additional clicks should not trigger more API calls
    fireEvent.click(advanceButton);
    fireEvent.click(advanceButton);

    // Verify API was called only once
    expect(ordersService.advanceOrderStage).toHaveBeenCalledTimes(1);

    // Resolve the API call
    const mockResponse = {
      ...mockOrder,
      status: 'vendor_sourcing',
      updated_at: '2024-01-01T01:00:00Z',
    };
    
    resolvePromise!(mockResponse);

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByTestId('success')).toHaveTextContent('Success');
      expect(advanceButton).not.toBeDisabled();
    }, { timeout: 3000 });
  });
});