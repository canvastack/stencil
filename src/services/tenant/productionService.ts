import { tenantApiClient } from './tenantApiClient';

export interface ProductionItem {
  id: string;
  production_item_uuid: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  
  // Production Details
  quantity: number;
  unit_of_measure: string;
  batch_number?: string;
  lot_number?: string;
  
  // Production Schedule
  scheduled_start_date?: string;
  scheduled_completion_date?: string;
  actual_start_date?: string;
  actual_completion_date?: string;
  estimated_duration_hours: number;
  actual_duration_hours?: number;
  
  // Production Status
  status: 'scheduled' | 'material_preparation' | 'in_progress' | 'quality_check' | 'completed' | 'on_hold' | 'cancelled' | 'rejected';
  progress_percentage: number;
  current_stage: string;
  
  // Quality & Specifications
  quality_requirements: string[];
  specifications: Record<string, any>;
  material_requirements: {
    material_type: string;
    quantity: number;
    unit: string;
    supplier?: string;
  }[];
  
  // Production Assignment
  assigned_to: string[];
  production_line?: string;
  workstation?: string;
  shift?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  
  // Progress Tracking
  checkpoints: ProductionCheckpoint[];
  issues: ProductionIssue[];
  
  // Quality Control
  qc_status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'rework_required';
  qc_inspector_id?: string;
  qc_inspector_name?: string;
  qc_date?: string;
  qc_notes?: string;
  
  // Metadata
  notes?: string;
  internal_notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  order: {
    id: string;
    order_code: string;
    customer_name: string;
    due_date?: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
    category?: string;
  };
}

export interface ProductionCheckpoint {
  id: string;
  production_item_id: string;
  stage: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  start_date?: string;
  completion_date?: string;
  duration_hours?: number;
  assigned_to?: string;
  notes?: string;
  quality_check_required: boolean;
  quality_check_status?: 'passed' | 'failed' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface ProductionIssue {
  id: string;
  production_item_id: string;
  issue_type: 'quality_defect' | 'material_shortage' | 'equipment_failure' | 'delay' | 'safety_incident' | 'other';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  
  // Issue Resolution
  resolution?: string;
  resolution_date?: string;
  resolved_by?: string;
  estimated_resolution_time?: number; // hours
  
  // Impact Assessment
  impact_on_schedule: boolean;
  delay_hours?: number;
  cost_impact?: number;
  quality_impact: boolean;
  
  // Assignment & Tracking
  assigned_to?: string;
  reported_by: string;
  escalated_to?: string;
  tags: string[];
  
  created_at: string;
  updated_at: string;
}

export interface ProductionSchedule {
  id: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'night' | 'overtime';
  production_line: string;
  capacity_hours: number;
  available_hours: number;
  scheduled_items: ProductionScheduleItem[];
  
  // Resource Allocation
  staff_assigned: {
    employee_id: string;
    employee_name: string;
    role: string;
    hours_allocated: number;
  }[];
  equipment_allocated: {
    equipment_id: string;
    equipment_name: string;
    hours_allocated: number;
  }[];
  
  created_at: string;
  updated_at: string;
}

export interface ProductionScheduleItem {
  production_item_id: string;
  scheduled_start: string;
  scheduled_duration: number;
  priority: number;
  dependencies: string[];
}

export interface ProductionReport {
  id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  date_from: string;
  date_to: string;
  
  // Production Metrics
  total_items_scheduled: number;
  total_items_completed: number;
  completion_rate: number;
  average_cycle_time: number;
  on_time_delivery_rate: number;
  
  // Quality Metrics
  quality_pass_rate: number;
  defect_rate: number;
  rework_rate: number;
  
  // Resource Utilization
  labor_utilization: number;
  equipment_utilization: number;
  material_waste_percentage: number;
  
  // Issue Summary
  total_issues: number;
  critical_issues: number;
  resolved_issues: number;
  average_resolution_time: number;
  
  // Detailed Data
  production_items: ProductionItem[];
  issues_summary: {
    issue_type: string;
    count: number;
    avg_resolution_time: number;
  }[];
  
  generated_by: string;
  generated_at: string;
}

export interface CreateProductionItemRequest {
  order_id: string;
  product_id: string;
  quantity: number;
  unit_of_measure: string;
  
  // Schedule
  scheduled_start_date?: string;
  scheduled_completion_date?: string;
  estimated_duration_hours: number;
  
  // Assignment
  assigned_to?: string[];
  production_line?: string;
  workstation?: string;
  shift?: string;
  supervisor_id?: string;
  
  // Requirements
  quality_requirements?: string[];
  specifications?: Record<string, any>;
  material_requirements?: {
    material_type: string;
    quantity: number;
    unit: string;
    supplier?: string;
  }[];
  
  notes?: string;
  priority?: ProductionItem['priority'];
}

export interface UpdateProductionItemRequest {
  // Status Updates
  status?: ProductionItem['status'];
  progress_percentage?: number;
  current_stage?: string;
  
  // Schedule Updates
  actual_start_date?: string;
  actual_completion_date?: string;
  actual_duration_hours?: number;
  
  // Assignment Updates
  assigned_to?: string[];
  production_line?: string;
  workstation?: string;
  shift?: string;
  supervisor_id?: string;
  
  // Quality Updates
  qc_status?: ProductionItem['qc_status'];
  qc_inspector_id?: string;
  qc_notes?: string;
  
  notes?: string;
  internal_notes?: string;
  priority?: ProductionItem['priority'];
}

export interface CreateProductionIssueRequest {
  production_item_id: string;
  issue_type: ProductionIssue['issue_type'];
  title: string;
  description: string;
  severity: ProductionIssue['severity'];
  
  // Impact Assessment
  impact_on_schedule?: boolean;
  delay_hours?: number;
  cost_impact?: number;
  quality_impact?: boolean;
  
  // Assignment
  assigned_to?: string;
  tags?: string[];
}

export interface UpdateProductionIssueRequest {
  status?: ProductionIssue['status'];
  resolution?: string;
  assigned_to?: string;
  escalated_to?: string;
  
  // Impact Updates
  delay_hours?: number;
  cost_impact?: number;
  quality_impact?: boolean;
  
  tags?: string[];
}

export interface ProductionListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: ProductionItem['status'];
  qc_status?: ProductionItem['qc_status'];
  priority?: ProductionItem['priority'];
  
  // Date Filters
  scheduled_start_from?: string;
  scheduled_start_to?: string;
  scheduled_completion_from?: string;
  scheduled_completion_to?: string;
  
  // Assignment Filters
  assigned_to?: string;
  production_line?: string;
  supervisor_id?: string;
  
  // Order Filters
  order_id?: string;
  customer_name?: string;
  
  // Progress Filters
  progress_min?: number;
  progress_max?: number;
  overdue_only?: boolean;
  
  sort_by?: 'created_at' | 'scheduled_start_date' | 'scheduled_completion_date' | 'priority' | 'progress_percentage';
  sort_order?: 'asc' | 'desc';
}

export interface ProductionListResponse {
  data: ProductionItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    summary?: {
      total_items: number;
      completed_items: number;
      in_progress_items: number;
      overdue_items: number;
      completion_rate: number;
      on_time_rate: number;
    };
  };
}

export interface ProductionStats {
  total_production_items: number;
  completed_items: number;
  in_progress_items: number;
  scheduled_items: number;
  overdue_items: number;
  
  // Performance Metrics
  completion_rate: number;
  on_time_delivery_rate: number;
  average_cycle_time: number;
  efficiency_rate: number;
  
  // Quality Metrics
  quality_pass_rate: number;
  defect_rate: number;
  rework_rate: number;
  
  // Resource Utilization
  labor_utilization: number;
  equipment_utilization: number;
  
  // Issue Analytics
  total_issues: number;
  open_issues: number;
  critical_issues: number;
  average_resolution_time: number;
  
  // Status Distribution
  status_distribution: Array<{
    status: ProductionItem['status'];
    count: number;
    percentage: number;
  }>;
  
  // Production Line Performance
  production_line_stats: Array<{
    line: string;
    items_completed: number;
    efficiency: number;
    quality_rate: number;
  }>;
  
  // Timeline Data
  daily_production: Array<{
    date: string;
    items_scheduled: number;
    items_completed: number;
    completion_rate: number;
  }>;
}

class ProductionService {
  private baseUrl = '/production';

  /**
   * Get paginated list of production items with filtering
   */
  async getProductionItems(params: ProductionListParams = {}): Promise<ProductionListResponse> {
    const response = await tenantApiClient.get(`${this.baseUrl}/items`, { params });
    return response;
  }

  /**
   * Get a specific production item by ID
   */
  async getProductionItem(id: string): Promise<ProductionItem> {
    const response = await tenantApiClient.get(`${this.baseUrl}/items/${id}`);
    return response.data;
  }

  /**
   * Create a new production item
   */
  async createProductionItem(data: CreateProductionItemRequest): Promise<ProductionItem> {
    const response = await tenantApiClient.post(`${this.baseUrl}/items`, data);
    return response.data;
  }

  /**
   * Update an existing production item
   */
  async updateProductionItem(id: string, data: UpdateProductionItemRequest): Promise<ProductionItem> {
    const response = await tenantApiClient.put(`${this.baseUrl}/items/${id}`, data);
    return response.data;
  }

  /**
   * Delete a production item (only if scheduled status)
   */
  async deleteProductionItem(id: string): Promise<void> {
    await tenantApiClient.delete(`${this.baseUrl}/items/${id}`);
  }

  /**
   * Start production for an item
   */
  async startProduction(id: string, data: {
    actual_start_date?: string;
    assigned_to?: string[];
    production_line?: string;
    notes?: string;
  }): Promise<ProductionItem> {
    const response = await tenantApiClient.post(`${this.baseUrl}/items/${id}/start`, data);
    return response.data;
  }

  /**
   * Complete production for an item
   */
  async completeProduction(id: string, data: {
    actual_completion_date?: string;
    actual_duration_hours?: number;
    quality_check_required?: boolean;
    notes?: string;
  }): Promise<ProductionItem> {
    const response = await tenantApiClient.post(`${this.baseUrl}/items/${id}/complete`, data);
    return response.data;
  }

  /**
   * Update progress for a production item
   */
  async updateProgress(id: string, data: {
    progress_percentage: number;
    current_stage?: string;
    notes?: string;
  }): Promise<ProductionItem> {
    const response = await tenantApiClient.post(`${this.baseUrl}/items/${id}/progress`, data);
    return response.data;
  }

  /**
   * Get production checkpoints for an item
   */
  async getProductionCheckpoints(id: string): Promise<ProductionCheckpoint[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/items/${id}/checkpoints`);
    return response.data;
  }

  /**
   * Update checkpoint status
   */
  async updateCheckpoint(itemId: string, checkpointId: string, data: {
    status: ProductionCheckpoint['status'];
    completion_date?: string;
    duration_hours?: number;
    notes?: string;
    quality_check_status?: 'passed' | 'failed' | 'pending';
  }): Promise<ProductionCheckpoint> {
    const response = await tenantApiClient.put(`${this.baseUrl}/items/${itemId}/checkpoints/${checkpointId}`, data);
    return response.data;
  }

  /**
   * Get production issues
   */
  async getProductionIssues(params?: {
    production_item_id?: string;
    status?: ProductionIssue['status'];
    severity?: ProductionIssue['severity'];
    issue_type?: ProductionIssue['issue_type'];
    assigned_to?: string;
  }): Promise<ProductionIssue[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/issues`, { params });
    return response.data;
  }

  /**
   * Create a new production issue
   */
  async createProductionIssue(data: CreateProductionIssueRequest): Promise<ProductionIssue> {
    const response = await tenantApiClient.post(`${this.baseUrl}/issues`, data);
    return response.data;
  }

  /**
   * Update a production issue
   */
  async updateProductionIssue(id: string, data: UpdateProductionIssueRequest): Promise<ProductionIssue> {
    const response = await tenantApiClient.put(`${this.baseUrl}/issues/${id}`, data);
    return response.data;
  }

  /**
   * Resolve a production issue
   */
  async resolveProductionIssue(id: string, data: {
    resolution: string;
    resolution_date?: string;
  }): Promise<ProductionIssue> {
    const response = await tenantApiClient.post(`${this.baseUrl}/issues/${id}/resolve`, data);
    return response.data;
  }

  /**
   * Escalate a production issue
   */
  async escalateProductionIssue(id: string, data: {
    escalated_to: string;
    escalation_reason: string;
  }): Promise<ProductionIssue> {
    const response = await tenantApiClient.post(`${this.baseUrl}/issues/${id}/escalate`, data);
    return response.data;
  }

  /**
   * Get production schedule for a date range
   */
  async getProductionSchedule(params: {
    date_from: string;
    date_to: string;
    production_line?: string;
    shift?: string;
  }): Promise<ProductionSchedule[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/schedule`, { params });
    return response.data;
  }

  /**
   * Update production schedule
   */
  async updateProductionSchedule(date: string, data: {
    shift: string;
    production_line: string;
    scheduled_items: ProductionScheduleItem[];
  }): Promise<ProductionSchedule> {
    const response = await tenantApiClient.put(`${this.baseUrl}/schedule/${date}`, data);
    return response.data;
  }

  /**
   * Get production statistics
   */
  async getProductionStats(params?: {
    date_from?: string;
    date_to?: string;
    production_line?: string;
  }): Promise<ProductionStats> {
    const response = await tenantApiClient.get(`${this.baseUrl}/stats`, { params });
    return response.data;
  }

  /**
   * Generate production report
   */
  async generateProductionReport(data: {
    report_type: ProductionReport['report_type'];
    date_from: string;
    date_to: string;
    production_line?: string;
    include_issues?: boolean;
    include_quality_data?: boolean;
  }): Promise<ProductionReport> {
    const response = await tenantApiClient.post(`${this.baseUrl}/reports/generate`, data);
    return response.data;
  }

  /**
   * Get production report by ID
   */
  async getProductionReport(id: string): Promise<ProductionReport> {
    const response = await tenantApiClient.get(`${this.baseUrl}/reports/${id}`);
    return response.data;
  }

  /**
   * Export production report
   */
  async exportProductionReport(id: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    const response = await tenantApiClient.get(`${this.baseUrl}/reports/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get overdue production items
   */
  async getOverdueItems(): Promise<ProductionItem[]> {
    const response = await tenantApiClient.get(`${this.baseUrl}/items/overdue`);
    return response.data;
  }

  /**
   * Get production dashboard summary
   */
  async getDashboardSummary(): Promise<{
    today: {
      scheduled: number;
      in_progress: number;
      completed: number;
      overdue: number;
    };
    weekly: {
      completion_rate: number;
      quality_rate: number;
      on_time_rate: number;
      efficiency: number;
    };
    alerts: {
      critical_issues: number;
      overdue_items: number;
      quality_failures: number;
      resource_shortages: number;
    };
  }> {
    const response = await tenantApiClient.get(`${this.baseUrl}/dashboard`);
    return response.data;
  }

  /**
   * Bulk update production items
   */
  async bulkUpdateProductionItems(ids: string[], data: {
    status?: ProductionItem['status'];
    assigned_to?: string[];
    production_line?: string;
    priority?: ProductionItem['priority'];
    notes?: string;
  }): Promise<{ success: ProductionItem[]; failed: Array<{ id: string; error: string }> }> {
    const response = await tenantApiClient.post(`${this.baseUrl}/items/bulk-update`, { ids, ...data });
    return response.data;
  }

  /**
   * Get production capacity analysis
   */
  async getCapacityAnalysis(params: {
    date_from: string;
    date_to: string;
    production_line?: string;
  }): Promise<{
    total_capacity_hours: number;
    scheduled_hours: number;
    utilization_rate: number;
    available_slots: Array<{
      date: string;
      shift: string;
      available_hours: number;
    }>;
    bottlenecks: Array<{
      resource: string;
      utilization: number;
      impact: 'low' | 'medium' | 'high';
    }>;
  }> {
    const response = await tenantApiClient.get(`${this.baseUrl}/capacity`, { params });
    return response.data;
  }
}

export const productionService = new ProductionService();
export default productionService;