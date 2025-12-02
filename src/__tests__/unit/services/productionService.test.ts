import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  productionService,
  ProductionItem,
  CreateProductionItemRequest,
  UpdateProductionItemRequest,
  ProductionListParams 
} from '@/services/tenant/productionService';

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
};

vi.mock('@/lib/tenant-api-client', () => ({
  tenantApiClient: mockApiClient,
}));

// Mock production data
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
  quality_requirements: ['Dimensional Tolerance: ±0.1mm', 'Surface Finish: Ra 1.6'],
  specifications: {
    material: 'Aluminum 6061-T6',
    finish: 'Anodized',
    hardness: '50 HRC',
    weight: '2.5 kg',
  },
  material_requirements: [
    {
      material_type: 'Raw Material Stock',
      quantity: 110,
      unit: 'kg',
      supplier: 'Supplier A Corp',
    },
  ],
  assigned_to: ['John Smith', 'Sarah Wilson'],
  production_line: 'Line A1',
  workstation: 'Station-001',
  shift: 'morning',
  supervisor_id: '1',
  supervisor_name: 'Ahmad Sudarto',
  checkpoints: [],
  issues: [],
  qc_status: 'pending',
  qc_inspector_id: undefined,
  qc_inspector_name: undefined,
  qc_date: undefined,
  qc_notes: undefined,
  notes: 'Standard production run',
  internal_notes: 'Customer priority order',
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

const mockPaginatedResponse = {
  data: [mockProductionItem],
  meta: {
    total: 1,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  },
};

describe('ProductionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProductionItems', () => {
    it('should fetch production items successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockPaginatedResponse });

      const result = await productionService.getProductionItems();

      expect(mockApiClient.get).toHaveBeenCalledWith('/production');
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should fetch production items with filters', async () => {
      const filters: ProductionListParams = {
        status: 'in_progress',
        priority: 'high',
        page: 2,
        per_page: 20,
      };

      mockApiClient.get.mockResolvedValue({ data: mockPaginatedResponse });

      const result = await productionService.getProductionItems(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/production', { params: filters });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      mockApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(productionService.getProductionItems()).rejects.toThrow(errorMessage);
      expect(mockApiClient.get).toHaveBeenCalledWith('/production');
    });
  });

  describe('getProductionItem', () => {
    it('should fetch a single production item successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockProductionItem });

      const result = await productionService.getProductionItem('prod-001');

      expect(mockApiClient.get).toHaveBeenCalledWith('/production/prod-001');
      expect(result).toEqual(mockProductionItem);
    });

    it('should handle not found error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Production item not found'));

      await expect(productionService.getProductionItem('nonexistent')).rejects.toThrow('Production item not found');
    });
  });

  describe('createProductionItem', () => {
    it('should create production item successfully', async () => {
      const createRequest: CreateProductionItemRequest = {
        order_id: 'order-001',
        product_id: 'product-001',
        quantity: 50,
        unit_of_measure: 'pcs',
        scheduled_start_date: '2024-12-01T08:00:00Z',
        scheduled_completion_date: '2024-12-03T17:00:00Z',
        estimated_duration_hours: 16,
        production_line: 'Line A1',
        workstation: 'Station-001',
        priority: 'normal',
        quality_requirements: ['Standard quality check'],
        material_requirements: [
          {
            material_type: 'Raw Material',
            quantity: 55,
            unit: 'kg',
            supplier: 'Test Supplier',
          },
        ],
      };

      mockApiClient.post.mockResolvedValue({ data: mockProductionItem });

      const result = await productionService.createProductionItem(createRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/production', createRequest);
      expect(result).toEqual(mockProductionItem);
    });

    it('should handle validation errors', async () => {
      const invalidRequest = {} as CreateProductionItemRequest;
      mockApiClient.post.mockRejectedValue(new Error('Validation failed'));

      await expect(productionService.createProductionItem(invalidRequest)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateProductionItem', () => {
    it('should update production item successfully', async () => {
      const updateRequest: UpdateProductionItemRequest = {
        status: 'quality_check',
        progress_percentage: 90,
        current_stage: 'Final Inspection',
        notes: 'Ready for quality inspection',
      };

      const updatedItem = { ...mockProductionItem, ...updateRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedItem });

      const result = await productionService.updateProductionItem('prod-001', updateRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith('/production/prod-001', updateRequest);
      expect(result).toEqual(updatedItem);
    });

    it('should handle update errors', async () => {
      mockApiClient.put.mockRejectedValue(new Error('Update failed'));

      await expect(
        productionService.updateProductionItem('prod-001', { status: 'completed' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteProductionItem', () => {
    it('should delete production item successfully', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await productionService.deleteProductionItem('prod-001');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/production/prod-001');
    });

    it('should handle delete errors', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(productionService.deleteProductionItem('prod-001')).rejects.toThrow('Delete failed');
    });
  });

  describe('startProduction', () => {
    it('should start production successfully', async () => {
      const startedItem = { 
        ...mockProductionItem, 
        status: 'in_progress' as const,
        actual_start_date: '2024-12-01T08:00:00Z',
        progress_percentage: 5,
        current_stage: 'Material Preparation'
      };

      mockApiClient.patch.mockResolvedValue({ data: startedItem });

      const result = await productionService.startProduction('prod-001');

      expect(mockApiClient.patch).toHaveBeenCalledWith('/production/prod-001/start');
      expect(result).toEqual(startedItem);
    });
  });

  describe('pauseProduction', () => {
    it('should pause production successfully', async () => {
      const pausedItem = { 
        ...mockProductionItem, 
        status: 'on_hold' as const,
        current_stage: 'Paused - Material Shortage'
      };

      mockApiClient.patch.mockResolvedValue({ data: pausedItem });

      const result = await productionService.pauseProduction('prod-001', 'Material shortage');

      expect(mockApiClient.patch).toHaveBeenCalledWith('/production/prod-001/pause', {
        reason: 'Material shortage'
      });
      expect(result).toEqual(pausedItem);
    });
  });

  describe('completeProduction', () => {
    it('should complete production successfully', async () => {
      const completedItem = { 
        ...mockProductionItem, 
        status: 'completed' as const,
        progress_percentage: 100,
        actual_completion_date: '2024-12-03T15:30:00Z',
        actual_duration_hours: 22,
        qc_status: 'passed' as const
      };

      mockApiClient.patch.mockResolvedValue({ data: completedItem });

      const result = await productionService.completeProduction('prod-001');

      expect(mockApiClient.patch).toHaveBeenCalledWith('/production/prod-001/complete');
      expect(result).toEqual(completedItem);
    });
  });

  describe('getProductionStats', () => {
    it('should fetch production statistics successfully', async () => {
      const mockStats = {
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

      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await productionService.getProductionStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/production/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getProductionSchedules', () => {
    it('should fetch production schedules successfully', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        schedule_uuid: 'sched-uuid-1',
        schedule_date: '2024-12-01',
        shift: 'morning' as const,
        production_line: 'Line A1',
        capacity_hours: 8,
        allocated_hours: 6,
        efficiency_target: 85,
        actual_efficiency: 88,
        production_items: ['prod-001', 'prod-002'],
        supervisor_id: '1',
        supervisor_name: 'Ahmad Sudarto',
        status: 'active' as const,
        created_at: '2024-11-30T10:00:00Z',
        updated_at: '2024-12-01T08:00:00Z',
      };

      mockApiClient.get.mockResolvedValue({ data: [mockSchedule] });

      const result = await productionService.getProductionSchedules();

      expect(mockApiClient.get).toHaveBeenCalledWith('/production/schedules');
      expect(result).toEqual([mockSchedule]);
    });

    it('should fetch schedules with filters', async () => {
      const filters = { date: '2024-12-01', shift: 'morning' as const };
      mockApiClient.get.mockResolvedValue({ data: [] });

      await productionService.getProductionSchedules(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/production/schedules', { params: filters });
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should bulk update production items status successfully', async () => {
      const itemIds = ['prod-001', 'prod-002'];
      const status = 'on_hold' as const;
      const mockResponse = { success: true, updated_count: 2 };

      mockApiClient.patch.mockResolvedValue({ data: mockResponse });

      const result = await productionService.bulkUpdateStatus(itemIds, status);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/production/bulk-update', {
        item_ids: itemIds,
        status: status,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('assignSupervisor', () => {
    it('should assign supervisor successfully', async () => {
      const supervisorId = '2';
      const supervisorName = 'Lisa Chen';
      const updatedItem = { 
        ...mockProductionItem, 
        supervisor_id: supervisorId,
        supervisor_name: supervisorName
      };

      mockApiClient.patch.mockResolvedValue({ data: updatedItem });

      const result = await productionService.assignSupervisor('prod-001', supervisorId, supervisorName);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/production/prod-001/assign-supervisor', {
        supervisor_id: supervisorId,
        supervisor_name: supervisorName,
      });
      expect(result).toEqual(updatedItem);
    });
  });

  describe('getProductionReports', () => {
    it('should generate production reports successfully', async () => {
      const filters = {
        date_from: '2024-12-01',
        date_to: '2024-12-31',
        report_type: 'efficiency' as const,
      };

      const mockReport = {
        report_type: 'efficiency',
        generated_at: '2024-12-02T10:00:00Z',
        data: {
          overall_efficiency: 82.4,
          line_efficiency: [
            { line: 'Line A1', efficiency: 85.2 },
            { line: 'Line A2', efficiency: 79.6 },
          ],
        },
      };

      mockApiClient.get.mockResolvedValue({ data: mockReport });

      const result = await productionService.getProductionReports(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/production/reports', { params: filters });
      expect(result).toEqual(mockReport);
    });
  });

  describe('exportProductionData', () => {
    it('should export production data successfully', async () => {
      const exportRequest = {
        format: 'excel' as const,
        date_from: '2024-12-01',
        date_to: '2024-12-31',
        include_fields: ['id', 'product_name', 'status', 'progress_percentage'],
      };

      const mockBlob = new Blob(['mock excel data'], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      mockApiClient.get.mockResolvedValue({ data: mockBlob });

      const result = await productionService.exportProductionData(exportRequest);

      expect(mockApiClient.get).toHaveBeenCalledWith('/production/export', {
        params: exportRequest,
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });
  });
});