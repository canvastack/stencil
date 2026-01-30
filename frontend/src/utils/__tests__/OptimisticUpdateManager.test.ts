/**
 * OptimisticUpdateManager Tests
 * 
 * Tests for the enhanced optimistic update system
 */

import { QueryClient } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import OptimisticUpdateManager from '../OptimisticUpdateManager';
import { BusinessStage } from '../OrderProgressCalculator';
import { OrderStatus } from '@/types/order';
import { queryKeys } from '@/lib/react-query';

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
vi.mock('../OrderStatusMessaging', () => ({
  OrderStatusMessaging: {
    showProgressIndicator: vi.fn(),
    dismissProgressIndicator: vi.fn(),
    showStageAdvancementSuccess: vi.fn(),
    showStageAdvancementError: vi.fn(),
  },
}));

describe('OptimisticUpdateManager', () => {
  let queryClient: QueryClient;
  let optimisticManager: OptimisticUpdateManager;
  let mockOrder: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Create a new instance for each test to avoid singleton issues
    optimisticManager = new OptimisticUpdateManager(queryClient);
    
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

    // Set initial order data in cache
    queryClient.setQueryData(queryKeys.orders.detail('test-order-1'), mockOrder);
  });

  afterEach(() => {
    queryClient.clear();
    optimisticManager.clearAllUpdates();
    vi.clearAllMocks();
  });

  describe('applyOptimisticStatusUpdate', () => {
    it('should apply optimistic update successfully', async () => {
      const context = {
        orderId: 'test-order-1',
        operation: 'stage_advance' as const,
        fromState: {
          status: 'pending' as OrderStatus,
          stage: BusinessStage.PENDING,
          updatedAt: mockOrder.updated_at,
        },
        toState: {
          status: 'vendor_sourcing' as OrderStatus,
          stage: BusinessStage.VENDOR_SOURCING,
          notes: 'Starting vendor sourcing',
        },
        userFeedback: {
          showProgress: true,
          progressMessage: 'Advancing to vendor sourcing',
        },
      };

      const result = await optimisticManager.applyOptimisticStatusUpdate(context);

      expect(result).toBeDefined();
      expect(result.updateId).toBeDefined();
      expect(result.context).toEqual(context);
      expect(typeof result.rollback).toBe('function');

      // Check that order was updated optimistically
      const updatedOrder = queryClient.getQueryData(queryKeys.orders.detail('test-order-1'));
      expect(updatedOrder).toBeDefined();
      expect((updatedOrder as any).status).toBe('vendor_sourcing');
      expect((updatedOrder as any)._optimistic).toBeDefined();
    });

    it('should handle missing order gracefully', async () => {
      const context = {
        orderId: 'non-existent-order',
        operation: 'stage_advance' as const,
        toState: {
          status: 'vendor_sourcing' as OrderStatus,
          stage: BusinessStage.VENDOR_SOURCING,
        },
      };

      await expect(
        optimisticManager.applyOptimisticStatusUpdate(context)
      ).rejects.toThrow('Order not found in cache for optimistic update');
    });
  });

  describe('confirmUpdate', () => {
    it('should confirm optimistic update with server response', async () => {
      // Apply optimistic update first
      const context = {
        orderId: 'test-order-1',
        operation: 'stage_advance' as const,
        toState: {
          status: 'vendor_sourcing' as OrderStatus,
          stage: BusinessStage.VENDOR_SOURCING,
        },
      };

      const result = await optimisticManager.applyOptimisticStatusUpdate(context);

      // Mock server response
      const serverResponse = {
        ...mockOrder,
        status: 'vendor_sourcing',
        updated_at: '2024-01-01T01:00:00Z',
      };

      // Confirm update
      optimisticManager.confirmUpdate(result.updateId, serverResponse);

      // Check that order was updated with server data
      const confirmedOrder = queryClient.getQueryData(queryKeys.orders.detail('test-order-1'));
      expect(confirmedOrder).toEqual(serverResponse);
      expect((confirmedOrder as any)._optimistic).toBeUndefined();
    });

    it('should handle confirmation of non-existent update', () => {
      // Should not throw
      expect(() => {
        optimisticManager.confirmUpdate('non-existent-update', mockOrder);
      }).not.toThrow();
    });
  });

  describe('rollbackUpdate', () => {
    it('should rollback optimistic update', async () => {
      const originalOrder = { ...mockOrder };
      
      // Apply optimistic update
      const context = {
        orderId: 'test-order-1',
        operation: 'stage_advance' as const,
        toState: {
          status: 'vendor_sourcing' as OrderStatus,
          stage: BusinessStage.VENDOR_SOURCING,
        },
      };

      const result = await optimisticManager.applyOptimisticStatusUpdate(context);

      // Verify optimistic update was applied
      const optimisticOrder = queryClient.getQueryData(queryKeys.orders.detail('test-order-1'));
      expect((optimisticOrder as any).status).toBe('vendor_sourcing');

      // Rollback
      result.rollback();

      // Verify rollback
      const rolledBackOrder = queryClient.getQueryData(queryKeys.orders.detail('test-order-1'));
      expect(rolledBackOrder).toEqual(originalOrder);
    });

    it('should handle rollback with explicit original order', () => {
      const originalOrder = { ...mockOrder };
      
      // Should not throw
      expect(() => {
        optimisticManager.rollbackUpdate('test-update', 'test-order-1', originalOrder);
      }).not.toThrow();

      // Check that order was restored
      const restoredOrder = queryClient.getQueryData(queryKeys.orders.detail('test-order-1'));
      expect(restoredOrder).toEqual(originalOrder);
    });
  });

  describe('handleUpdateError', () => {
    it('should handle update error and rollback', async () => {
      const originalOrder = { ...mockOrder };
      
      // Apply optimistic update
      const context = {
        orderId: 'test-order-1',
        operation: 'stage_advance' as const,
        toState: {
          status: 'vendor_sourcing' as OrderStatus,
          stage: BusinessStage.VENDOR_SOURCING,
        },
      };

      const result = await optimisticManager.applyOptimisticStatusUpdate(context);

      // Verify optimistic update was applied
      const optimisticOrder = queryClient.getQueryData(queryKeys.orders.detail('test-order-1'));
      expect((optimisticOrder as any).status).toBe('vendor_sourcing');

      // Handle error (this should trigger rollback)
      const error = new Error('Network error');
      optimisticManager.handleUpdateError(result.updateId, error, context);

      // Verify rollback occurred
      const rolledBackOrder = queryClient.getQueryData(queryKeys.orders.detail('test-order-1'));
      expect(rolledBackOrder).toEqual(originalOrder);
    });
  });

  describe('timeline management', () => {
    it('should create optimistic timeline entry', () => {
      const entry = optimisticManager.createOptimisticTimelineEntry(
        'test-order-1',
        BusinessStage.VENDOR_SOURCING,
        'Starting vendor sourcing'
      );

      expect(entry).toBeDefined();
      expect(entry.id).toContain('optimistic-');
      expect(entry.type).toBe('status_change');
      expect(entry.notes).toBe('Starting vendor sourcing');
      expect(entry._optimistic).toBe(true);
    });

    it('should update timeline cache with optimistic entry', () => {
      const mockTimeline = [
        { id: 'existing-1', type: 'status_change', timestamp: '2024-01-01T00:00:00Z' }
      ];
      
      // Set initial timeline
      queryClient.setQueryData(queryKeys.orders.history('test-order-1'), mockTimeline);

      const optimisticEntry = optimisticManager.createOptimisticTimelineEntry(
        'test-order-1',
        BusinessStage.VENDOR_SOURCING,
        'Test note'
      );

      const rollback = optimisticManager.updateTimelineCache('test-order-1', optimisticEntry);

      // Check timeline was updated
      const updatedTimeline = queryClient.getQueryData(queryKeys.orders.history('test-order-1'));
      expect(Array.isArray(updatedTimeline)).toBe(true);
      expect((updatedTimeline as any[]).length).toBe(2);
      expect((updatedTimeline as any[])[0]).toEqual(optimisticEntry);

      // Test rollback
      rollback();
      const rolledBackTimeline = queryClient.getQueryData(queryKeys.orders.history('test-order-1'));
      expect(rolledBackTimeline).toEqual(mockTimeline);
    });
  });

  describe('utility methods', () => {
    it('should track active updates', async () => {
      expect(optimisticManager.hasPendingUpdates('test-order-1')).toBe(false);

      const context = {
        orderId: 'test-order-1',
        operation: 'stage_advance' as const,
        toState: {
          status: 'vendor_sourcing' as OrderStatus,
          stage: BusinessStage.VENDOR_SOURCING,
        },
      };

      await optimisticManager.applyOptimisticStatusUpdate(context);

      expect(optimisticManager.hasPendingUpdates('test-order-1')).toBe(true);
      
      const pendingUpdates = optimisticManager.getPendingUpdates('test-order-1');
      expect(pendingUpdates.length).toBe(1);
      expect(pendingUpdates[0].context.orderId).toBe('test-order-1');
    });

    it('should clear all updates', async () => {
      const context = {
        orderId: 'test-order-1',
        operation: 'stage_advance' as const,
        toState: {
          status: 'vendor_sourcing' as OrderStatus,
          stage: BusinessStage.VENDOR_SOURCING,
        },
      };

      await optimisticManager.applyOptimisticStatusUpdate(context);
      expect(optimisticManager.hasPendingUpdates('test-order-1')).toBe(true);

      optimisticManager.clearAllUpdates();
      expect(optimisticManager.hasPendingUpdates('test-order-1')).toBe(false);
    });
  });

  describe('orders list cache updates', () => {
    it('should update orders list cache when order is updated', async () => {
      // Set up orders list cache with the correct query key structure
      const mockOrdersList = {
        data: [mockOrder, { ...mockOrder, id: 'test-order-2' }],
        meta: { total: 2, page: 1, per_page: 10 },
      };
      
      // Use the lists() key that the updateOrdersListCache method looks for
      queryClient.setQueryData(queryKeys.orders.lists(), mockOrdersList);

      // Apply optimistic update
      const context = {
        orderId: 'test-order-1',
        operation: 'stage_advance' as const,
        toState: {
          status: 'vendor_sourcing' as OrderStatus,
          stage: BusinessStage.VENDOR_SOURCING,
        },
      };

      await optimisticManager.applyOptimisticStatusUpdate(context);

      // Check that orders list was updated
      const updatedList = queryClient.getQueryData(queryKeys.orders.lists());
      expect(updatedList).toBeDefined();
      expect((updatedList as any).data[0].status).toBe('vendor_sourcing');
      expect((updatedList as any).data[1].status).toBe('pending'); // Other order unchanged
    });
  });
});