import { tenantApiClient } from './tenantApiClient';

export interface QCInspection {
  id: string;
  inspection_uuid: string;
  production_item_id: string;
  order_id: string;
  product_id: string;
  
  // Inspection Details
  inspection_type: 'incoming' | 'in_process' | 'final' | 'customer_return' | 'supplier_audit';
  inspection_date: string;
  inspection_number: string;
  batch_number?: string;
  lot_number?: string;
  
  // Quality Metrics
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'conditional_pass' | 'rework_required' | 'rejected';
  overall_score: number; // 0-100
  pass_rate: number; // 0-100
  
  // Inspector Information
  inspector_id: string;
  inspector_name: string;
  inspector_level: 'junior' | 'senior' | 'lead' | 'certified';
  inspection_duration_minutes: number;
  
  // Sample Information
  sample_size: number;
  total_quantity: number;
  sample_method: 'random' | 'systematic' | 'stratified' | 'full_inspection';
  
  // Inspection Criteria
  criteria: QCCriterion[];
  defects: QCDefect[];
  measurements: QCMeasurement[];
  
  // Results & Notes
  inspection_notes: string;
  recommendations: string;
  corrective_actions: string[];
  next_inspection_date?: string;
  
  // Certification & Approval
  certification_required: boolean;
  certification_status?: 'pending' | 'certified' | 'rejected';
  certified_by?: string;
  certified_at?: string;
  certificate_number?: string;
  
  // Photos & Documentation
  photos: string[];
  documents: string[];
  test_reports: string[];
  
  // Metadata
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  production_item: {
    id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
  };
  order: {
    id: string;
    order_code: string;
    customer_name: string;
  };
}

export interface QCCriterion {
  id: string;
  name: string;
  description: string;
  category: 'dimensional' | 'visual' | 'functional' | 'material' | 'packaging' | 'safety' | 'environmental';
  weight: number; // 0-100 (contribution to overall score)
  acceptable_range?: {
    min?: number;
    max?: number;
    unit?: string;
  };
  inspection_method: 'visual' | 'measurement' | 'test' | 'sampling' | 'documentation';
  result: 'pass' | 'fail' | 'na' | 'conditional';
  actual_value?: any;
  notes?: string;
  is_critical: boolean; // If true, failure means overall failure
  reference_standard?: string;
}

export interface QCDefect {
  id: string;
  defect_type: 'critical' | 'major' | 'minor' | 'cosmetic';
  defect_code: string;
  defect_name: string;
  description: string;
  location?: string;
  quantity: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Defect Classification
  category: 'dimensional' | 'visual' | 'functional' | 'material' | 'packaging' | 'safety' | 'other';
  root_cause?: string;
  corrective_action?: string;
  
  // Cost Impact
  estimated_cost?: number;
  rework_time?: number; // minutes
  
  // Photos
  photos: string[];
  
  created_at: string;
}

export interface QCMeasurement {
  id: string;
  parameter_name: string;
  parameter_code: string;
  unit: string;
  target_value?: number;
  tolerance?: {
    upper: number;
    lower: number;
  };
  measured_values: number[];
  average_value: number;
  result: 'pass' | 'fail' | 'warning';
  deviation: number;
  measurement_method: string;
  instrument_used?: string;
  calibration_date?: string;
  operator_id?: string;
  measurement_date: string;
  notes?: string;
}

export interface QCReport {
  id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'product_specific' | 'custom';
  date_from: string;
  date_to: string;
  
  // Summary Statistics
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  pass_rate: number;
  
  // Quality Metrics
  average_quality_score: number;
  defect_rate: number;
  critical_defects: number;
  rework_rate: number;
  
  // Inspector Performance
  inspector_stats: Array<{
    inspector_id: string;
    inspector_name: string;
    inspections_completed: number;
    average_duration: number;
    pass_rate: number;
    accuracy_rate: number;
  }>;
  
  // Product Quality Analysis
  product_stats: Array<{
    product_id: string;
    product_name: string;
    inspections_count: number;
    pass_rate: number;
    common_defects: string[];
    quality_trend: 'improving' | 'stable' | 'declining';
  }>;
  
  // Defect Analysis
  defect_summary: Array<{
    defect_type: string;
    count: number;
    percentage: number;
    cost_impact: number;
  }>;
  
  // Trends
  quality_trends: Array<{
    date: string;
    pass_rate: number;
    defect_rate: number;
    quality_score: number;
  }>;
  
  generated_by: string;
  generated_at: string;
}

export interface CreateQCInspectionRequest {
  production_item_id: string;
  inspection_type: QCInspection['inspection_type'];
  inspection_date?: string;
  sample_size?: number;
  sample_method?: QCInspection['sample_method'];
  criteria: Omit<QCCriterion, 'id'>[];
  inspection_notes?: string;
  photos?: string[];
}

export interface UpdateQCInspectionRequest {
  status?: QCInspection['status'];
  criteria?: QCCriterion[];
  defects?: Omit<QCDefect, 'id'>[];
  measurements?: Omit<QCMeasurement, 'id'>[];
  inspection_notes?: string;
  recommendations?: string;
  corrective_actions?: string[];
  photos?: string[];
  documents?: string[];
}

export interface QCListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: QCInspection['status'];
  inspection_type?: QCInspection['inspection_type'];
  inspector_id?: string;
  product_id?: string;
  date_from?: string;
  date_to?: string;
  pass_rate_min?: number;
  pass_rate_max?: number;
  sort_by?: 'created_at' | 'inspection_date' | 'overall_score' | 'pass_rate';
  sort_order?: 'asc' | 'desc';
}

export interface QCListResponse {
  data: QCInspection[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    summary?: {
      total_inspections: number;
      pass_rate: number;
      average_score: number;
      pending_inspections: number;
      failed_inspections: number;
    };
  };
}

export interface QCStats {
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  pending_inspections: number;
  
  // Quality Metrics
  overall_pass_rate: number;
  average_quality_score: number;
  defect_rate: number;
  rework_rate: number;
  rejection_rate: number;
  
  // Inspector Performance
  active_inspectors: number;
  average_inspection_time: number;
  
  // Defect Analysis
  total_defects: number;
  critical_defects: number;
  defect_categories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  
  // Trends
  monthly_trends: Array<{
    month: string;
    inspections: number;
    pass_rate: number;
    quality_score: number;
  }>;
  
  // Product Quality
  product_quality_ranking: Array<{
    product_id: string;
    product_name: string;
    pass_rate: number;
    inspections_count: number;
  }>;
}

class QCService {
  private baseUrl = '/quality-control';

  /**
   * Get paginated list of QC inspections
   */
  async getInspections(params: QCListParams = {}): Promise<QCListResponse> {
    const response = await tenantApiClient.get(`${this.baseUrl}/inspections`, { params });
    return response;
  }

  /**
   * Get a specific QC inspection by ID
   */
  async getInspection(id: string): Promise<QCInspection> {
    const response = await tenantApiClient.get(`${this.baseUrl}/inspections/${id}`);
    return response.data;
  }

  /**
   * Create a new QC inspection
   */
  async createInspection(data: CreateQCInspectionRequest): Promise<QCInspection> {
    const response = await tenantApiClient.post(`${this.baseUrl}/inspections`, data);
    return response.data;
  }

  /**
   * Update an existing QC inspection
   */
  async updateInspection(id: string, data: UpdateQCInspectionRequest): Promise<QCInspection> {
    const response = await tenantApiClient.put(`${this.baseUrl}/inspections/${id}`, data);
    return response.data;
  }

  /**
   * Delete a QC inspection
   */
  async deleteInspection(id: string): Promise<void> {
    await tenantApiClient.delete(`${this.baseUrl}/inspections/${id}`);
  }

  /**
   * Start QC inspection
   */
  async startInspection(id: string): Promise<QCInspection> {
    const response = await tenantApiClient.post(`${this.baseUrl}/inspections/${id}/start`);
    return response.data;
  }

  /**
   * Complete QC inspection
   */
  async completeInspection(id: string, data: {
    status: 'passed' | 'failed' | 'conditional_pass' | 'rework_required';
    final_notes?: string;
    recommendations?: string;
    corrective_actions?: string[];
  }): Promise<QCInspection> {
    const response = await tenantApiClient.post(`${this.baseUrl}/inspections/${id}/complete`, data);
    return response.data;
  }

  /**
   * Add defect to inspection
   */
  async addDefect(inspectionId: string, defect: Omit<QCDefect, 'id' | 'created_at'>): Promise<QCDefect> {
    const response = await tenantApiClient.post(`${this.baseUrl}/inspections/${inspectionId}/defects`, defect);
    return response.data;
  }

  /**
   * Update defect
   */
  async updateDefect(inspectionId: string, defectId: string, data: Partial<QCDefect>): Promise<QCDefect> {
    const response = await tenantApiClient.put(`${this.baseUrl}/inspections/${inspectionId}/defects/${defectId}`, data);
    return response.data;
  }

  /**
   * Remove defect
   */
  async removeDefect(inspectionId: string, defectId: string): Promise<void> {
    await tenantApiClient.delete(`${this.baseUrl}/inspections/${inspectionId}/defects/${defectId}`);
  }

  /**
   * Add measurement to inspection
   */
  async addMeasurement(inspectionId: string, measurement: Omit<QCMeasurement, 'id'>): Promise<QCMeasurement> {
    const response = await tenantApiClient.post(`${this.baseUrl}/inspections/${inspectionId}/measurements`, measurement);
    return response.data;
  }

  /**
   * Update measurement
   */
  async updateMeasurement(inspectionId: string, measurementId: string, data: Partial<QCMeasurement>): Promise<QCMeasurement> {
    const response = await tenantApiClient.put(`${this.baseUrl}/inspections/${inspectionId}/measurements/${measurementId}`, data);
    return response.data;
  }

  /**
   * Get QC statistics
   */
  async getQCStats(params?: {
    date_from?: string;
    date_to?: string;
    product_id?: string;
    inspector_id?: string;
  }): Promise<QCStats> {
    const response = await tenantApiClient.get(`${this.baseUrl}/stats`, { params });
    return response.data;
  }

  /**
   * Get defect analysis
   */
  async getDefectAnalysis(params?: {
    date_from?: string;
    date_to?: string;
    product_id?: string;
    defect_type?: string;
  }): Promise<{
    total_defects: number;
    defect_types: Array<{
      type: string;
      count: number;
      cost_impact: number;
      trend: 'increasing' | 'stable' | 'decreasing';
    }>;
    pareto_analysis: Array<{
      defect: string;
      count: number;
      cumulative_percentage: number;
    }>;
  }> {
    const response = await tenantApiClient.get(`${this.baseUrl}/defect-analysis`, { params });
    return response.data;
  }

  /**
   * Generate QC report
   */
  async generateQCReport(data: {
    report_type: QCReport['report_type'];
    date_from: string;
    date_to: string;
    product_ids?: string[];
    inspector_ids?: string[];
    include_trends?: boolean;
    include_photos?: boolean;
  }): Promise<QCReport> {
    const response = await tenantApiClient.post(`${this.baseUrl}/reports/generate`, data);
    return response.data;
  }

  /**
   * Export QC report
   */
  async exportQCReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    const response = await tenantApiClient.get(`${this.baseUrl}/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get inspection templates
   */
  async getInspectionTemplates(productType?: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    criteria: Omit<QCCriterion, 'id' | 'result' | 'actual_value' | 'notes'>[];
  }>> {
    const response = await tenantApiClient.get(`${this.baseUrl}/templates`, {
      params: { product_type: productType }
    });
    return response.data;
  }

  /**
   * Create inspection template
   */
  async createInspectionTemplate(data: {
    name: string;
    description: string;
    product_type: string;
    criteria: Omit<QCCriterion, 'id' | 'result' | 'actual_value' | 'notes'>[];
  }): Promise<any> {
    const response = await tenantApiClient.post(`${this.baseUrl}/templates`, data);
    return response.data;
  }

  /**
   * Get pending inspections for production items
   */
  async getPendingInspections(): Promise<QCInspection[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/inspections/pending`);
    return response.data;
  }

  /**
   * Get quality dashboard summary
   */
  async getDashboardSummary(): Promise<{
    today: {
      scheduled_inspections: number;
      completed_inspections: number;
      pending_inspections: number;
      failed_inspections: number;
    };
    weekly: {
      pass_rate: number;
      quality_score: number;
      defect_rate: number;
      rework_rate: number;
    };
    alerts: {
      critical_defects: number;
      overdue_inspections: number;
      quality_issues: number;
      certification_expires: number;
    };
  }> {
    const response = await tenantApiClient.get(`${this.baseUrl}/dashboard`);
    return response.data;
  }

  /**
   * Upload inspection photos
   */
  async uploadInspectionPhotos(inspectionId: string, files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('photos', file);
    });

    const response = await tenantApiClient.post(
      `${this.baseUrl}/inspections/${inspectionId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Delete inspection photo
   */
  async deleteInspectionPhoto(inspectionId: string, photoUrl: string): Promise<void> {
    await tenantApiClient.delete(`${this.baseUrl}/inspections/${inspectionId}/photos`, {
      data: { photo_url: photoUrl }
    });
  }
}

export const qcService = new QCService();
export default qcService;