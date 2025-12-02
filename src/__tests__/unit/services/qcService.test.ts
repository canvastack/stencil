import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  qcService,
  QCInspection,
  CreateQCInspectionRequest,
  UpdateQCInspectionRequest,
  QCListParams,
  QCStats
} from '@/services/tenant/qcService';

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

// Mock QC inspection data
const mockQCInspection: QCInspection = {
  id: 'qc-001',
  inspection_uuid: 'insp-uuid-001',
  production_item_id: 'prod-001',
  order_id: 'order-001',
  product_id: 'product-001',
  inspection_type: 'final',
  inspection_date: '2024-12-02T10:00:00Z',
  inspection_number: 'QC-2024-001',
  batch_number: 'B2024001',
  lot_number: 'L1001',
  status: 'passed',
  overall_score: 95,
  pass_rate: 98,
  inspector_id: 'inspector-1',
  inspector_name: 'James Wilson',
  inspector_level: 'senior',
  inspection_duration_minutes: 45,
  sample_size: 10,
  total_quantity: 100,
  sample_method: 'random',
  criteria: [
    {
      id: 'crit-1',
      name: 'Dimensional Accuracy',
      description: 'Verify part dimensions meet specifications',
      category: 'dimensional',
      weight: 30,
      acceptable_range: { min: -0.1, max: 0.1, unit: 'mm' },
      inspection_method: 'measurement',
      result: 'pass',
      actual_value: '0.05',
      is_critical: true,
      reference_standard: 'ISO 2768-f',
    }
  ],
  defects: [
    {
      id: 'def-1',
      defect_type: 'minor',
      defect_code: 'VIS-001',
      defect_name: 'Visual Blemish',
      description: 'Minor visual imperfection not affecting function',
      location: 'Surface',
      quantity: 1,
      severity_score: 2,
      corrective_action: 'Accept with note',
      root_cause: 'Material quality',
      preventive_measures: 'Process adjustment',
      photos: ['defect-photo-1.jpg'],
      inspector_notes: 'Minor cosmetic issue, does not affect functionality',
    }
  ],
  measurements: [
    {
      id: 'meas-1',
      measurement_name: 'Length',
      measurement_type: 'dimensional',
      target_value: 100.0,
      actual_value: 100.05,
      unit: 'mm',
      tolerance_min: 99.9,
      tolerance_max: 100.1,
      result: 'pass',
      measuring_equipment: 'Digital Caliper',
      calibration_date: '2024-11-01T00:00:00Z',
      operator: 'James Wilson',
    }
  ],
  inspection_notes: 'All criteria met with excellent quality standards',
  recommendations: 'Continue current production process',
  corrective_actions: [],
  next_inspection_date: '2024-12-09T10:00:00Z',
  certification_required: true,
  certification_status: 'certified',
  certified_by: 'Robert Chang',
  certified_at: '2024-12-02T11:00:00Z',
  certificate_number: 'CERT-2024-001',
  photos: ['inspection-1-overview.jpg'],
  documents: ['inspection-report-1.pdf', 'final-inspection-1.pdf'],
  test_reports: ['test-report-1.pdf'],
  created_by: 'qc_inspector-1',
  updated_by: 'qc_inspector-1',
  created_at: '2024-12-01T09:00:00Z',
  updated_at: '2024-12-02T11:00:00Z',
  production_item: {
    id: 'prod-001',
    product_name: 'Custom Etched Steel Plate',
    product_sku: 'CEP-001',
    quantity: 100,
  },
  order: {
    id: 'order-001',
    order_code: 'ORD-2024-001',
    customer_name: 'ABC Manufacturing Corp',
  },
};

const mockPaginatedResponse = {
  data: [mockQCInspection],
  meta: {
    total: 1,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  },
};

const mockQCStats: QCStats = {
  total_inspections: 100,
  pending_inspections: 5,
  in_progress_inspections: 8,
  completed_inspections: 87,
  overall_pass_rate: 92,
  final_inspection_pass_rate: 95,
  total_defects: 25,
  critical_defects: 2,
  major_defects: 8,
  inspector_stats: [
    {
      inspector_id: 'inspector-1',
      inspector_name: 'James Wilson',
      total_inspections: 25,
      completed_inspections: 23,
      pass_rate: 95,
      avg_inspection_time: 45,
      defects_found: 3,
    }
  ],
  monthly_trends: [
    {
      month: '2024-12',
      total_inspections: 20,
      passed: 18,
      failed: 2,
      pass_rate: 90,
      avg_score: 88,
    }
  ],
  defect_categories: [
    {
      category: 'critical',
      count: 2,
      percentage: 8,
    }
  ],
  avg_inspection_duration: 42,
  avg_overall_score: 88,
  avg_sample_size: 12,
  certifications_issued: 45,
  certifications_pending: 5,
  certifications_rejected: 2,
};

describe('QCService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInspections', () => {
    it('should fetch QC inspections successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockPaginatedResponse });

      const result = await qcService.getInspections();

      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/inspections');
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should fetch inspections with filters', async () => {
      const filters: QCListParams = {
        status: 'passed',
        inspection_type: 'final',
        inspector_id: 'inspector-1',
        page: 1,
        per_page: 20,
      };

      mockApiClient.get.mockResolvedValue({ data: mockPaginatedResponse });

      const result = await qcService.getInspections(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/inspections', { params: filters });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      mockApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(qcService.getInspections()).rejects.toThrow(errorMessage);
      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/inspections');
    });
  });

  describe('getInspection', () => {
    it('should fetch a single QC inspection successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockQCInspection });

      const result = await qcService.getInspection('qc-001');

      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/inspections/qc-001');
      expect(result).toEqual(mockQCInspection);
    });

    it('should handle not found error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Inspection not found'));

      await expect(qcService.getInspection('nonexistent')).rejects.toThrow('Inspection not found');
    });
  });

  describe('createInspection', () => {
    it('should create QC inspection successfully', async () => {
      const createRequest: CreateQCInspectionRequest = {
        production_item_id: 'prod-001',
        order_id: 'order-001',
        product_id: 'product-001',
        inspection_type: 'final',
        inspector_id: 'inspector-1',
        sample_size: 10,
        total_quantity: 100,
        sample_method: 'random',
        criteria: [
          {
            name: 'Dimensional Accuracy',
            description: 'Check dimensions',
            category: 'dimensional',
            weight: 100,
            inspection_method: 'measurement',
            is_critical: true,
            reference_standard: 'ISO 2768',
          }
        ],
        inspection_notes: 'Standard final inspection',
      };

      mockApiClient.post.mockResolvedValue({ data: mockQCInspection });

      const result = await qcService.createInspection(createRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/qc/inspections', createRequest);
      expect(result).toEqual(mockQCInspection);
    });

    it('should handle validation errors', async () => {
      const invalidRequest = {} as CreateQCInspectionRequest;
      mockApiClient.post.mockRejectedValue(new Error('Validation failed'));

      await expect(qcService.createInspection(invalidRequest)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateInspection', () => {
    it('should update QC inspection successfully', async () => {
      const updateRequest: UpdateQCInspectionRequest = {
        status: 'passed',
        overall_score: 95,
        pass_rate: 98,
        inspection_notes: 'Updated inspection notes',
        certification_status: 'certified',
      };

      const updatedInspection = { ...mockQCInspection, ...updateRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedInspection });

      const result = await qcService.updateInspection('qc-001', updateRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith('/qc/inspections/qc-001', updateRequest);
      expect(result).toEqual(updatedInspection);
    });

    it('should handle update errors', async () => {
      mockApiClient.put.mockRejectedValue(new Error('Update failed'));

      await expect(
        qcService.updateInspection('qc-001', { status: 'failed' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteInspection', () => {
    it('should delete QC inspection successfully', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await qcService.deleteInspection('qc-001');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/qc/inspections/qc-001');
    });

    it('should handle delete errors', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(qcService.deleteInspection('qc-001')).rejects.toThrow('Delete failed');
    });
  });

  describe('startInspection', () => {
    it('should start inspection successfully', async () => {
      const startedInspection = { 
        ...mockQCInspection, 
        status: 'in_progress' as const,
        inspection_date: '2024-12-02T10:00:00Z'
      };

      mockApiClient.patch.mockResolvedValue({ data: startedInspection });

      const result = await qcService.startInspection('qc-001');

      expect(mockApiClient.patch).toHaveBeenCalledWith('/qc/inspections/qc-001/start');
      expect(result).toEqual(startedInspection);
    });
  });

  describe('completeInspection', () => {
    it('should complete inspection successfully', async () => {
      const completeRequest = {
        status: 'passed' as const,
        overall_score: 95,
        pass_rate: 98,
        inspection_notes: 'Inspection completed successfully',
        criteria: mockQCInspection.criteria,
        measurements: mockQCInspection.measurements,
      };

      const completedInspection = { 
        ...mockQCInspection, 
        ...completeRequest,
        certification_status: 'certified' as const
      };

      mockApiClient.patch.mockResolvedValue({ data: completedInspection });

      const result = await qcService.completeInspection('qc-001', completeRequest);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/qc/inspections/qc-001/complete', completeRequest);
      expect(result).toEqual(completedInspection);
    });
  });

  describe('recordDefect', () => {
    it('should record defect successfully', async () => {
      const defectRequest = {
        defect_type: 'major' as const,
        defect_code: 'SUR-001',
        defect_name: 'Surface Finish Issue',
        description: 'Surface roughness exceeds specification',
        location: 'Top surface',
        quantity: 1,
        severity_score: 6,
        corrective_action: 'Rework required',
      };

      const updatedInspection = {
        ...mockQCInspection,
        defects: [...mockQCInspection.defects, { id: 'def-2', ...defectRequest }]
      };

      mockApiClient.post.mockResolvedValue({ data: updatedInspection });

      const result = await qcService.recordDefect('qc-001', defectRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/qc/inspections/qc-001/defects', defectRequest);
      expect(result).toEqual(updatedInspection);
    });
  });

  describe('getQCStats', () => {
    it('should fetch QC statistics successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockQCStats });

      const result = await qcService.getQCStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/stats');
      expect(result).toEqual(mockQCStats);
    });
  });

  describe('getDefectAnalysis', () => {
    it('should fetch defect analysis successfully', async () => {
      const mockDefectAnalysis = {
        total_defects: 25,
        defect_breakdown: [
          {
            category: 'critical',
            count: 2,
            defects: [
              {
                defect_code: 'DIM-001',
                defect_name: 'Dimension Tolerance Exceeded',
                count: 2,
              }
            ]
          }
        ],
        most_common_defects: [
          {
            code: 'VIS-001',
            name: 'Visual Blemish',
            count: 8,
            description: 'Minor visual imperfection'
          }
        ]
      };

      mockApiClient.get.mockResolvedValue({ data: mockDefectAnalysis });

      const result = await qcService.getDefectAnalysis();

      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/defects/analysis');
      expect(result).toEqual(mockDefectAnalysis);
    });

    it('should fetch defect analysis with date filters', async () => {
      const filters = {
        date_from: '2024-12-01',
        date_to: '2024-12-31'
      };

      mockApiClient.get.mockResolvedValue({ data: {} });

      await qcService.getDefectAnalysis(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/defects/analysis', { params: filters });
    });
  });

  describe('getInspectorPerformance', () => {
    it('should fetch all inspector performance successfully', async () => {
      const mockPerformanceData = [
        {
          inspector: { id: 'inspector-1', name: 'James Wilson', level: 'senior', experience: 8 },
          performance: {
            total_inspections: 25,
            completed_inspections: 23,
            pass_rate: 95,
            avg_inspection_time: 45,
            defects_found: 3,
            avg_score: 92,
          }
        }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockPerformanceData });

      const result = await qcService.getInspectorPerformance();

      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/inspectors/performance');
      expect(result).toEqual(mockPerformanceData);
    });

    it('should fetch specific inspector performance', async () => {
      const inspectorId = 'inspector-1';
      const mockPerformanceData = [
        {
          inspector: { id: inspectorId, name: 'James Wilson', level: 'senior', experience: 8 },
          performance: {
            total_inspections: 25,
            completed_inspections: 23,
            pass_rate: 95,
            avg_inspection_time: 45,
            defects_found: 3,
            avg_score: 92,
          }
        }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockPerformanceData });

      const result = await qcService.getInspectorPerformance(inspectorId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/qc/inspectors/performance/${inspectorId}`);
      expect(result).toEqual(mockPerformanceData);
    });
  });

  describe('generateCertificate', () => {
    it('should generate certificate successfully', async () => {
      const mockCertificate = {
        certificate_number: 'CERT-2024-001',
        inspection_id: 'qc-001',
        issued_date: '2024-12-02T11:00:00Z',
        valid_until: '2025-12-02T11:00:00Z',
        certified_by: 'Robert Chang',
        certificate_url: '/certificates/CERT-2024-001.pdf'
      };

      mockApiClient.post.mockResolvedValue({ data: mockCertificate });

      const result = await qcService.generateCertificate('qc-001');

      expect(mockApiClient.post).toHaveBeenCalledWith('/qc/inspections/qc-001/certificate');
      expect(result).toEqual(mockCertificate);
    });
  });

  describe('getQCReports', () => {
    it('should generate QC reports successfully', async () => {
      const filters = {
        date_from: '2024-12-01',
        date_to: '2024-12-31',
        report_type: 'defect_analysis' as const,
      };

      const mockReport = {
        report_type: 'defect_analysis',
        generated_at: '2024-12-02T10:00:00Z',
        data: {
          total_defects: 25,
          defect_trends: [],
          inspector_performance: []
        },
      };

      mockApiClient.get.mockResolvedValue({ data: mockReport });

      const result = await qcService.getQCReports(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/reports', { params: filters });
      expect(result).toEqual(mockReport);
    });
  });

  describe('exportQCData', () => {
    it('should export QC data successfully', async () => {
      const exportRequest = {
        format: 'excel' as const,
        date_from: '2024-12-01',
        date_to: '2024-12-31',
        include_fields: ['inspection_number', 'status', 'overall_score', 'pass_rate'],
      };

      const mockBlob = new Blob(['mock excel data'], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      mockApiClient.get.mockResolvedValue({ data: mockBlob });

      const result = await qcService.exportQCData(exportRequest);

      expect(mockApiClient.get).toHaveBeenCalledWith('/qc/export', {
        params: exportRequest,
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });
  });

  describe('assignInspector', () => {
    it('should assign inspector successfully', async () => {
      const inspectorId = 'inspector-2';
      const inspectorName = 'Maria Santos';
      const updatedInspection = {
        ...mockQCInspection,
        inspector_id: inspectorId,
        inspector_name: inspectorName,
        status: 'in_progress' as const
      };

      mockApiClient.patch.mockResolvedValue({ data: updatedInspection });

      const result = await qcService.assignInspector('qc-001', inspectorId, inspectorName);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/qc/inspections/qc-001/assign-inspector', {
        inspector_id: inspectorId,
        inspector_name: inspectorName,
      });
      expect(result).toEqual(updatedInspection);
    });
  });

  describe('bulkUpdateInspections', () => {
    it('should bulk update inspections successfully', async () => {
      const inspectionIds = ['qc-001', 'qc-002'];
      const updates = { status: 'passed' as const };
      const mockResponse = { success: true, updated_count: 2 };

      mockApiClient.patch.mockResolvedValue({ data: mockResponse });

      const result = await qcService.bulkUpdateInspections(inspectionIds, updates);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/qc/inspections/bulk-update', {
        inspection_ids: inspectionIds,
        ...updates,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});