import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useProductionStore } from '@/stores/productionStore';
import { productionService } from '@/services/tenant/productionService';
import type { ProductionItem, ProductionStats, CreateProductionItemRequest, UpdateProductionItemRequest } from '@/services/tenant/productionService';

// Mock the production service
vi.mock('@/services/tenant/productionService', () => ({
  productionService: {
    getProductionItems: vi.fn(),
    getProductionItem: vi.fn(),
    createProductionItem: vi.fn(),
    updateProductionItem: vi.fn(),
    deleteProductionItem: vi.fn(),
    startProduction: vi.fn(),
    pauseProduction: vi.fn(),
    completeProduction: vi.fn(),
    getProductionStats: vi.fn(),
    getProductionSchedules: vi.fn(),
    getProductionIssues: vi.fn(),
    bulkUpdateStatus: vi.fn(),
    assignSupervisor: vi.fn(),
    getProductionReports: vi.fn(),
    exportProductionData: vi.fn(),
    getOverdueItems: vi.fn(),
    getDashboardSummary: vi.fn(),
    getProductionCheckpoints: vi.fn(),
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockProductionItem: ProductionItem = {
  id: 'prod-001',
  production_item_uuid: 'prod-uuid-001',
  order_id: 'order-001',
  product_id: 'product-001',
  product_name: 'Custom Etched Plate',
  product_sku: 'CEP-001',
  quantity: 100,
  unit_of_measure: 'pcs',
  batch_number: 'B2024001',
  lot_number: 'L1001',
  scheduled_start_date: '2024-12-01T08:00:00Z',
  scheduled_completion_date: '2024-12-03T17:00:00Z',
  actual_start_date: '2024-12-01T08:30:00Z',
  actual_completion_date: undefined,
  estimated_duration_hours: 24,
  actual_duration_hours: 12,
  status: 'in_progress',
  progress_percentage: 45,
  current_stage: 'Machining',
  quality_requirements: ['Dimensional Tolerance: ±0.1mm'],
  specifications: { material: 'Aluminum 6061-T6' },
  material_requirements: [{ material_type: 'Raw Material', quantity: 110, unit: 'kg' }],
  assigned_to: ['John Smith'],
  production_line: 'Line A1',
  workstation: 'Station-001',
  shift: 'morning',
  supervisor_id: '1',
  supervisor_name: 'Ahmad Sudarto',
  checkpoints: [],
  issues: [],
  qc_status: 'pending',
  notes: 'Standard production run',
  priority: 'high',
  created_by: 'production_manager',
  updated_by: 'production_manager',
  created_at: '2024-11-30T10:00:00Z',
  updated_at: '2024-12-01T09:00:00Z',
  order: {
    id: 'order-001',
    order_code: 'ORD-2024-001',
    customer_name: 'ABC Manufacturing Corp',
    due_date: '2024-12-05T17:00:00Z',
  },
  product: {
    id: 'product-001',
    name: 'Custom Etched Plate',
    sku: 'CEP-001',
    category: 'Custom Fabrication',
  },
};

const mockStats: ProductionStats = {
  total_items: 100,
  active_items: 25,
  completed_items: 70,
  overdue_items: 5,
  items_by_status: {
    scheduled: 10,
    material_preparation: 5,
    in_progress: 15,
    quality_check: 8,
    completed: 70,
    on_hold: 2,
    cancelled: 0,
    rejected: 0,
  },
  items_by_priority: {
    low: 20,
    normal: 60,
    high: 15,
    urgent: 5,
  },
  qc_stats: {
    pending: 10,
    in_progress: 3,
    passed: 75,
    failed: 2,
    rework_required: 5,
    pass_rate: 88,
  },
  avg_completion_time_hours: 24.5,
  on_time_delivery_rate: 87.3,
  capacity_utilization: 78.9,
  efficiency_rate: 82.4,
  total_production_value: 1250000,
  completed_value: 890000,
  pending_value: 360000,
  daily_completed: [],
  total_issues: 15,
  open_issues: 3,
  critical_issues: 1,
  avg_resolution_time_hours: 18.2,
};

describe('ProductionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useProductionStore());
    act(() => {
      result.current.clearSelections();
      result.current.resetFilters();
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProductionStore());

      expect(result.current.productionItems).toEqual([]);
      expect(result.current.selectedProductionItem).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.currentPage).toBe(1);
      expect(result.current.perPage).toBe(10);
      expect(result.current.selectedItems).toEqual([]);
    });
  });

  describe('fetchProductionItems', () => {
    it('should fetch production items successfully', async () => {
      const mockResponse = {
        data: [mockProductionItem],
        meta: { total: 1, per_page: 10, current_page: 1, last_page: 1 }
      };
      (productionService.getProductionItems as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useProductionStore());

      await act(async () => {
        await result.current.fetchProductionItems();
      });

      expect(result.current.productionItems).toEqual([mockProductionItem]);
      expect(result.current.totalCount).toBe(1);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.itemsLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch');
      (productionService.getProductionItems as any).mockRejectedValue(error);

      const { result } = renderHook(() => useProductionStore());

      await act(async () => {
        await result.current.fetchProductionItems();
      });

      expect(result.current.productionItems).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch');
      expect(result.current.itemsLoading).toBe(false);
    });

    it('should apply filters when fetching', async () => {
      const mockResponse = {
        data: [mockProductionItem],
        meta: { total: 1, per_page: 10, current_page: 1, last_page: 1 }
      };
      (productionService.getProductionItems as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useProductionStore());

      await act(async () => {
        result.current.setFilters({ status: 'in_progress' });
        await result.current.fetchProductionItems();
      });

      expect(productionService.getProductionItems).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
          page: 1,
          per_page: 10
        })
      );
    });
  });

  describe('fetchProductionItem', () => {
    it('should fetch single production item successfully', async () => {
      (productionService.getProductionItem as any).mockResolvedValue(mockProductionItem);

      const { result } = renderHook(() => useProductionStore());

      await act(async () => {
        await result.current.fetchProductionItem('prod-001');
      });

      expect(result.current.selectedProductionItem).toEqual(mockProductionItem);
      expect(result.current.itemLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch single item error', async () => {
      const error = new Error('Item not found');
      (productionService.getProductionItem as any).mockRejectedValue(error);

      const { result } = renderHook(() => useProductionStore());

      await act(async () => {
        await result.current.fetchProductionItem('nonexistent');
      });

      expect(result.current.selectedProductionItem).toBeNull();
      expect(result.current.error).toBe('Item not found');
      expect(result.current.itemLoading).toBe(false);
    });
  });

  describe('createProductionItem', () => {
    it('should create production item successfully', async () => {
      const createRequest: CreateProductionItemRequest = {
        order_id: 'order-001',
        product_id: 'product-001',
        quantity: 50,
        unit_of_measure: 'pcs',
        estimated_duration_hours: 16,
        priority: 'normal',
        quality_requirements: ['Standard check'],
        material_requirements: [{ material_type: 'Raw Material', quantity: 55, unit: 'kg' }],
      };

      (productionService.createProductionItem as any).mockResolvedValue(mockProductionItem);

      const { result } = renderHook(() => useProductionStore());

      let createdItem;
      await act(async () => {
        createdItem = await result.current.createProductionItem(createRequest);
      });

      expect(createdItem).toEqual(mockProductionItem);
      expect(result.current.error).toBeNull();
      expect(productionService.createProductionItem).toHaveBeenCalledWith(createRequest);
    });

    it('should handle create error', async () => {
      const error = new Error('Validation failed');
      (productionService.createProductionItem as any).mockRejectedValue(error);

      const { result } = renderHook(() => useProductionStore());

      await act(async () => {
        try {
          await result.current.createProductionItem({} as CreateProductionItemRequest);
        } catch (e) {
          expect(e).toEqual(error);
        }
      });

      expect(result.current.error).toBe('Validation failed');
    });
  });

  describe('updateProductionItem', () => {
    it('should update production item successfully', async () => {
      const updateRequest: UpdateProductionItemRequest = {
        status: 'quality_check',
        progress_percentage: 90,
        current_stage: 'Final Inspection',
      };

      const updatedItem = { ...mockProductionItem, ...updateRequest };
      (productionService.updateProductionItem as any).mockResolvedValue(updatedItem);

      const { result } = renderHook(() => useProductionStore());

      let updated;
      await act(async () => {
        updated = await result.current.updateProductionItem('prod-001', updateRequest);
      });

      expect(updated).toEqual(updatedItem);
      expect(result.current.error).toBeNull();
      expect(productionService.updateProductionItem).toHaveBeenCalledWith('prod-001', updateRequest);
    });
  });

  describe('deleteProductionItem', () => {
    it('should delete production item successfully', async () => {
      (productionService.deleteProductionItem as any).mockResolvedValue(undefined);

      // Set up initial items in store
      const { result } = renderHook(() => useProductionStore());
      act(() => {
        result.current.productionItems = [mockProductionItem];
      });

      await act(async () => {
        await result.current.deleteProductionItem('prod-001');
      });

      expect(result.current.productionItems).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(productionService.deleteProductionItem).toHaveBeenCalledWith('prod-001');
    });
  });

  describe('fetchProductionStats', () => {
    it('should fetch production statistics successfully', async () => {
      (productionService.getProductionStats as any).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useProductionStore());

      await act(async () => {
        await result.current.fetchProductionStats();
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.statsLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Production Actions', () => {
    it('should start production successfully', async () => {
      const startedItem = { 
        ...mockProductionItem, 
        status: 'in_progress' as const,
        actual_start_date: '2024-12-01T08:00:00Z' 
      };
      (productionService.startProduction as any).mockResolvedValue(startedItem);

      const { result } = renderHook(() => useProductionStore());

      let updated;
      await act(async () => {
        updated = await result.current.startProduction('prod-001');
      });

      expect(updated).toEqual(startedItem);
      expect(productionService.startProduction).toHaveBeenCalledWith('prod-001');
    });

    it('should pause production successfully', async () => {
      const pausedItem = { 
        ...mockProductionItem, 
        status: 'on_hold' as const 
      };
      (productionService.pauseProduction as any).mockResolvedValue(pausedItem);

      const { result } = renderHook(() => useProductionStore());

      let updated;
      await act(async () => {
        updated = await result.current.pauseProduction('prod-001', 'Material shortage');
      });

      expect(updated).toEqual(pausedItem);
      expect(productionService.pauseProduction).toHaveBeenCalledWith('prod-001', 'Material shortage');
    });

    it('should complete production successfully', async () => {
      const completedItem = { 
        ...mockProductionItem, 
        status: 'completed' as const,
        progress_percentage: 100
      };
      (productionService.completeProduction as any).mockResolvedValue(completedItem);

      const { result } = renderHook(() => useProductionStore());

      let updated;
      await act(async () => {
        updated = await result.current.completeProduction('prod-001');
      });

      expect(updated).toEqual(completedItem);
      expect(productionService.completeProduction).toHaveBeenCalledWith('prod-001');
    });
  });

  describe('Bulk Operations', () => {
    it('should perform bulk status update successfully', async () => {
      const mockResponse = { success: true, updated_count: 2 };
      (productionService.bulkUpdateStatus as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useProductionStore());

      // Set selected items
      act(() => {
        result.current.selectedItems = ['prod-001', 'prod-002'];
      });

      let response;
      await act(async () => {
        response = await result.current.bulkUpdateStatus('on_hold');
      });

      expect(response).toEqual(mockResponse);
      expect(productionService.bulkUpdateStatus).toHaveBeenCalledWith(['prod-001', 'prod-002'], 'on_hold');
    });
  });

  describe('Selection Management', () => {
    it('should toggle item selection correctly', () => {
      const { result } = renderHook(() => useProductionStore());

      act(() => {
        result.current.toggleItemSelection('prod-001');
      });

      expect(result.current.selectedItems).toContain('prod-001');

      act(() => {
        result.current.toggleItemSelection('prod-001');
      });

      expect(result.current.selectedItems).not.toContain('prod-001');
    });

    it('should toggle all items selection correctly', () => {
      const { result } = renderHook(() => useProductionStore());

      // Set some items in the store
      act(() => {
        result.current.productionItems = [mockProductionItem, { ...mockProductionItem, id: 'prod-002' }];
      });

      act(() => {
        result.current.toggleAllSelection();
      });

      expect(result.current.selectedItems).toEqual(['prod-001', 'prod-002']);

      act(() => {
        result.current.toggleAllSelection();
      });

      expect(result.current.selectedItems).toEqual([]);
    });

    it('should clear selections', () => {
      const { result } = renderHook(() => useProductionStore());

      act(() => {
        result.current.selectedItems = ['prod-001', 'prod-002'];
        result.current.clearSelections();
      });

      expect(result.current.selectedItems).toEqual([]);
      expect(result.current.selectedProductionItem).toBeNull();
    });
  });

  describe('Filter Management', () => {
    it('should update filters correctly', () => {
      const { result } = renderHook(() => useProductionStore());

      const newFilters = {
        status: 'in_progress' as const,
        priority: 'high' as const,
        search: 'test'
      };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(expect.objectContaining(newFilters));
    });

    it('should reset filters correctly', () => {
      const { result } = renderHook(() => useProductionStore());

      act(() => {
        result.current.setFilters({ status: 'in_progress', search: 'test' });
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual({});
      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('Pagination', () => {
    it('should update pagination correctly', () => {
      const { result } = renderHook(() => useProductionStore());

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.currentPage).toBe(3);

      act(() => {
        result.current.setPerPage(25);
      });

      expect(result.current.perPage).toBe(25);
      expect(result.current.currentPage).toBe(1); // Should reset page when changing per page
    });
  });

  describe('Error Handling', () => {
    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useProductionStore());

      act(() => {
        result.current.error = 'Some error';
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data correctly', async () => {
      const mockItemsResponse = {
        data: [mockProductionItem],
        meta: { total: 1, per_page: 10, current_page: 1, last_page: 1 }
      };
      (productionService.getProductionItems as any).mockResolvedValue(mockItemsResponse);
      (productionService.getProductionStats as any).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useProductionStore());

      await act(async () => {
        await result.current.refreshData();
      });

      expect(productionService.getProductionItems).toHaveBeenCalled();
      expect(productionService.getProductionStats).toHaveBeenCalled();
      expect(result.current.productionItems).toEqual([mockProductionItem]);
      expect(result.current.stats).toEqual(mockStats);
    });
  });
});