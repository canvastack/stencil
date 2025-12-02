import { ProductionItem, ProductionCheckpoint, ProductionIssue, ProductionSchedule, ProductionStats } from '@/services/tenant/productionService';

// Helper function for realistic date generation
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const subtractDays = (date: Date, days: number) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000);

const baseDate = new Date('2024-12-01T00:00:00Z');

// Realistic product names and SKUs for manufacturing business
const products = [
  { id: '1', name: 'Custom Etched Steel Plate', sku: 'CEP-001', category: 'Custom Fabrication' },
  { id: '2', name: 'Precision Machined Bracket', sku: 'PMB-002', category: 'Machining' },
  { id: '3', name: 'Aluminum Housing Unit', sku: 'AHU-003', category: 'Assembly' },
  { id: '4', name: 'Stainless Steel Component', sku: 'SSC-004', category: 'Fabrication' },
  { id: '5', name: 'Polymer Injection Mold', sku: 'PIM-005', category: 'Molding' },
  { id: '6', name: 'Circuit Board Assembly', sku: 'CBA-006', category: 'Electronics' },
  { id: '7', name: 'Titanium Aerospace Part', sku: 'TAP-007', category: 'Aerospace' },
  { id: '8', name: 'Medical Device Component', sku: 'MDC-008', category: 'Medical' },
  { id: '9', name: 'Automotive Transmission Gear', sku: 'ATG-009', category: 'Automotive' },
  { id: '10', name: 'Industrial Valve Body', sku: 'IVB-010', category: 'Industrial' },
];

// Manufacturing teams and supervisors
const supervisors = [
  { id: '1', name: 'Ahmad Sudarto', level: 'senior' },
  { id: '2', name: 'Lisa Chen', level: 'lead' },
  { id: '3', name: 'Roberto Silva', level: 'senior' },
  { id: '4', name: 'Maria Gonzalez', level: 'lead' },
  { id: '5', name: 'David Kim', level: 'senior' },
];

const workers = [
  'John Smith', 'Sarah Wilson', 'Mike Johnson', 'Anna Rodriguez', 'Tom Brown',
  'Emily Davis', 'Chris Lee', 'Jessica Taylor', 'Ryan Martinez', 'Ashley White',
  'Daniel Garcia', 'Jennifer Miller', 'Kevin Anderson', 'Nicole Thompson', 'Brandon Jones'
];

const productionLines = ['Line A1', 'Line A2', 'Line B1', 'Line B2', 'Line C1', 'QC Station 1', 'QC Station 2'];
const workstations = ['Station-001', 'Station-002', 'Station-003', 'Station-004', 'Station-005', 'QC-001', 'QC-002', 'Assembly-001'];

// Generate realistic production items (45 items for good test coverage)
export const mockProductionItems: ProductionItem[] = Array.from({ length: 45 }, (_, index) => {
  const id = `prod-${String(index + 1).padStart(3, '0')}`;
  const product = products[index % products.length];
  const supervisor = supervisors[index % supervisors.length];
  const daysOffset = Math.floor(index / 5) - 5; // Spread over time range
  
  // Status distribution: realistic production workflow
  const statusWeights = ['scheduled', 'material_preparation', 'in_progress', 'quality_check', 'completed', 'on_hold'];
  const statusIndex = index % statusWeights.length;
  const status = statusWeights[statusIndex] as ProductionItem['status'];
  
  // Priority distribution
  const priorities: ProductionItem['priority'][] = ['low', 'normal', 'normal', 'normal', 'high', 'urgent'];
  const priority = priorities[index % priorities.length];
  
  // QC Status based on production status
  const qcStatus: ProductionItem['qc_status'] = 
    status === 'completed' ? 'passed' :
    status === 'quality_check' ? 'in_progress' :
    status === 'on_hold' ? 'failed' : 'pending';
  
  const baseQuantity = 10 + (index % 90); // 10-100 units
  const progressPercentage = 
    status === 'scheduled' ? 0 :
    status === 'material_preparation' ? 15 + (index % 20) :
    status === 'in_progress' ? 30 + (index % 40) :
    status === 'quality_check' ? 80 + (index % 15) :
    status === 'completed' ? 100 :
    status === 'on_hold' ? 25 + (index % 30) : 0;

  const scheduledStart = addDays(baseDate, daysOffset);
  const scheduledCompletion = addDays(scheduledStart, 3 + (index % 7));
  const actualStart = status !== 'scheduled' ? addDays(scheduledStart, -1 + (index % 2)) : undefined;
  
  const estimatedHours = 8 + (index % 32); // 8-40 hours
  const actualHours = actualStart && status !== 'scheduled' ? 
    Math.floor(estimatedHours * (0.8 + (index % 5) * 0.1)) : undefined;

  return {
    id,
    production_item_uuid: `prod-uuid-${id}`,
    order_id: `order-${String((index % 15) + 1).padStart(3, '0')}`,
    product_id: product.id,
    product_name: product.name,
    product_sku: product.sku,
    
    // Production Details
    quantity: baseQuantity,
    unit_of_measure: 'pcs',
    batch_number: `B2024${String(index + 100).padStart(3, '0')}`,
    lot_number: `L${String(index + 1000).padStart(4, '0')}`,
    
    // Production Schedule
    scheduled_start_date: scheduledStart.toISOString(),
    scheduled_completion_date: scheduledCompletion.toISOString(),
    actual_start_date: actualStart?.toISOString(),
    actual_completion_date: status === 'completed' ? 
      addDays(actualStart || scheduledStart, 2 + (index % 4)).toISOString() : undefined,
    estimated_duration_hours: estimatedHours,
    actual_duration_hours: actualHours,
    
    // Production Status
    status,
    progress_percentage: progressPercentage,
    current_stage: status === 'scheduled' ? 'Waiting for Materials' :
                   status === 'material_preparation' ? 'Preparing Materials' :
                   status === 'in_progress' ? ['Machining', 'Assembly', 'Welding', 'Finishing'][index % 4] :
                   status === 'quality_check' ? 'Quality Inspection' :
                   status === 'completed' ? 'Ready for Shipping' :
                   'On Hold - Material Shortage',
    
    // Quality & Specifications
    quality_requirements: [
      'Dimensional Tolerance: ±0.1mm',
      'Surface Finish: Ra 1.6',
      product.category === 'Aerospace' ? 'AS9100 Compliance' : 'ISO 9001 Compliance',
      index % 3 === 0 ? 'Heat Treatment Required' : 'Visual Inspection',
    ],
    specifications: {
      material: product.category === 'Aerospace' ? 'Titanium Ti-6Al-4V' :
                product.category === 'Medical' ? 'Medical Grade Stainless Steel' :
                product.category === 'Automotive' ? 'Carbon Steel AISI 1045' : 'Aluminum 6061-T6',
      finish: ['Anodized', 'Powder Coated', 'Passivated', 'Raw'][index % 4],
      hardness: `${45 + (index % 20)} HRC`,
      weight: `${(0.5 + (index % 5) * 0.3).toFixed(1)} kg`,
    },
    material_requirements: [
      {
        material_type: product.category === 'Electronics' ? 'PCB Substrate' : 'Raw Material Stock',
        quantity: Math.ceil(baseQuantity * 1.1), // 10% waste allowance
        unit: product.category === 'Electronics' ? 'pcs' : 'kg',
        supplier: ['Supplier A Corp', 'Precision Materials Inc', 'Industrial Supply Co'][index % 3],
      },
      ...(index % 3 === 0 ? [{
        material_type: 'Consumables',
        quantity: 2 + (index % 5),
        unit: 'set',
        supplier: 'Tooling Solutions Ltd',
      }] : [])
    ],
    
    // Production Assignment
    assigned_to: [
      workers[index % workers.length],
      ...(index % 2 === 0 ? [workers[(index + 1) % workers.length]] : [])
    ],
    production_line: productionLines[index % productionLines.length],
    workstation: workstations[index % workstations.length],
    shift: ['morning', 'afternoon', 'night'][index % 3] as ProductionItem['shift'],
    supervisor_id: supervisor.id,
    supervisor_name: supervisor.name,
    
    // Progress Tracking (will be populated separately)
    checkpoints: [], // Populated by mockProductionCheckpoints
    issues: [], // Populated by mockProductionIssues
    
    // Quality Control
    qc_status,
    qc_inspector_id: qcStatus !== 'pending' ? `inspector-${(index % 3) + 1}` : undefined,
    qc_inspector_name: qcStatus !== 'pending' ? 
      ['James Wilson', 'Maria Santos', 'Robert Chang'][index % 3] : undefined,
    qc_date: qcStatus !== 'pending' ? 
      addDays(scheduledStart, 1 + (index % 3)).toISOString() : undefined,
    qc_notes: qcStatus === 'passed' ? 'All specifications met' :
              qcStatus === 'failed' ? 'Dimensional tolerance exceeded' :
              qcStatus === 'in_progress' ? 'Inspection in progress' : undefined,
    
    // Metadata
    notes: index % 4 === 0 ? `Special handling required for ${product.category} standards` : undefined,
    internal_notes: index % 6 === 0 ? 'Customer requested expedited delivery' : undefined,
    priority,
    created_by: 'production_manager',
    updated_by: 'production_manager',
    created_at: subtractDays(baseDate, 10 - daysOffset).toISOString(),
    updated_at: subtractDays(baseDate, Math.max(0, 5 - daysOffset)).toISOString(),
    
    // Relationships
    order: {
      id: `order-${String((index % 15) + 1).padStart(3, '0')}`,
      order_code: `ORD-2024-${String((index % 15) + 1).padStart(3, '0')}`,
      customer_name: [
        'ABC Manufacturing Corp', 'Precision Industries Ltd', 'Global Tech Solutions',
        'Advanced Systems Inc', 'Quality Components Co', 'Industrial Partners LLC',
        'Aerospace Dynamics', 'Medical Device Corp', 'Automotive Specialists',
        'Marine Engineering', 'Defense Contractors', 'Energy Solutions Inc',
        'Construction Materials', 'Transportation Systems', 'Electronics Assembly'
      ][index % 15],
      due_date: scheduledCompletion.toISOString(),
    },
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
    },
  };
});

// Generate realistic production checkpoints
export const mockProductionCheckpoints: ProductionCheckpoint[] = mockProductionItems.flatMap((item, itemIndex) => {
  const stages = [
    'Material Inspection',
    'Setup & Preparation', 
    'Initial Processing',
    'Intermediate Check',
    'Final Processing',
    'Quality Inspection',
    'Packaging'
  ];
  
  return stages.map((stage, stageIndex) => {
    const checkpointId = `checkpoint-${itemIndex}-${stageIndex}`;
    const isCompleted = item.progress_percentage > (stageIndex * 15);
    const isCurrent = !isCompleted && item.progress_percentage > ((stageIndex - 1) * 15);
    
    return {
      id: checkpointId,
      production_item_id: item.id,
      stage,
      description: `${stage} for ${item.product_name}`,
      status: isCompleted ? 'completed' : 
               isCurrent ? 'in_progress' : 
               'pending' as ProductionCheckpoint['status'],
      start_date: isCompleted || isCurrent ? 
        addDays(new Date(item.actual_start_date || item.scheduled_start_date!), stageIndex * 0.5).toISOString() : 
        undefined,
      completion_date: isCompleted ? 
        addDays(new Date(item.actual_start_date || item.scheduled_start_date!), stageIndex * 0.5 + 0.3).toISOString() : 
        undefined,
      duration_hours: isCompleted ? Math.round(2 + stageIndex * 1.5) : undefined,
      assigned_to: item.assigned_to[0],
      notes: isCompleted && stageIndex % 3 === 0 ? 
        `${stage} completed successfully with no issues` : undefined,
      quality_check_required: stage.includes('Inspection') || stage.includes('Check'),
      quality_check_status: (stage.includes('Inspection') || stage.includes('Check')) && isCompleted ? 'passed' : undefined,
      created_at: subtractDays(new Date(item.created_at), 1).toISOString(),
      updated_at: isCompleted ? 
        addDays(new Date(item.actual_start_date || item.scheduled_start_date!), stageIndex * 0.5 + 0.3).toISOString() : 
        new Date(item.updated_at).toISOString(),
    };
  });
});

// Generate realistic production issues
export const mockProductionIssues: ProductionIssue[] = mockProductionItems.flatMap((item, itemIndex) => {
  // Not all production items have issues
  if (itemIndex % 4 !== 0) return [];
  
  const issueTypes = [
    'Material Shortage',
    'Equipment Malfunction', 
    'Quality Defect',
    'Tool Wear',
    'Dimension Out of Tolerance',
    'Surface Finish Issue',
    'Assembly Problem'
  ];
  
  const severities: ProductionIssue['severity'][] = ['low', 'medium', 'high', 'critical'];
  const issueIndex = itemIndex % issueTypes.length;
  const severity = severities[itemIndex % severities.length];
  
  const isResolved = item.status === 'completed' || (itemIndex % 3 === 0);
  
  return [{
    id: `issue-${itemIndex}`,
    production_item_id: item.id,
    issue_type: issueTypes[issueIndex],
    title: `${issueTypes[issueIndex]} - ${item.product_sku}`,
    description: `${issueTypes[issueIndex]} detected during production of ${item.product_name}. ` +
                `${severity === 'critical' ? 'Immediate attention required.' : 
                  severity === 'high' ? 'Priority resolution needed.' : 
                  'Standard resolution process.'}`,
    severity,
    status: isResolved ? 'resolved' : 
            (itemIndex % 2 === 0 ? 'in_progress' : 'open') as ProductionIssue['status'],
    priority: severity === 'critical' ? 'urgent' :
             severity === 'high' ? 'high' :
             severity === 'medium' ? 'normal' : 'low' as ProductionIssue['priority'],
    reported_by: item.assigned_to[0],
    assigned_to: item.supervisor_name,
    reported_at: addDays(new Date(item.actual_start_date || item.scheduled_start_date!), 1).toISOString(),
    acknowledged_at: addDays(new Date(item.actual_start_date || item.scheduled_start_date!), 1.1).toISOString(),
    resolved_at: isResolved ? 
      addDays(new Date(item.actual_start_date || item.scheduled_start_date!), 1.5 + (itemIndex % 3)).toISOString() : 
      undefined,
    resolution_notes: isResolved ? 
      `Issue resolved by ${['replacing equipment', 'adjusting parameters', 'material replacement', 'tool maintenance'][itemIndex % 4]}` : 
      undefined,
    downtime_minutes: severity === 'critical' ? 120 + (itemIndex % 60) :
                     severity === 'high' ? 60 + (itemIndex % 30) :
                     severity === 'medium' ? 30 + (itemIndex % 20) : itemIndex % 15,
    cost_impact: severity === 'critical' ? 5000 + (itemIndex % 3000) :
                severity === 'high' ? 2000 + (itemIndex % 1500) :
                severity === 'medium' ? 500 + (itemIndex % 800) : itemIndex % 300,
    root_cause_analysis: isResolved ? 
      `Root cause identified: ${['Equipment wear', 'Material quality', 'Process variation', 'Environmental factors'][itemIndex % 4]}` : 
      undefined,
    preventive_actions: isResolved ? [
      'Schedule preventive maintenance',
      'Update quality control procedures', 
      'Implement additional training',
      'Review supplier quality standards'
    ].slice(0, 1 + (itemIndex % 3)) : [],
    created_at: addDays(new Date(item.actual_start_date || item.scheduled_start_date!), 1).toISOString(),
    updated_at: isResolved ? 
      addDays(new Date(item.actual_start_date || item.scheduled_start_date!), 1.5 + (itemIndex % 3)).toISOString() : 
      addDays(new Date(), -(itemIndex % 5)).toISOString(),
  }];
});

// Generate production schedules
export const mockProductionSchedules: ProductionSchedule[] = Array.from({ length: 20 }, (_, index) => {
  const scheduleDate = addDays(baseDate, index - 5);
  const relatedItems = mockProductionItems.filter(item => 
    new Date(item.scheduled_start_date!).toDateString() === scheduleDate.toDateString()
  );
  
  return {
    id: `schedule-${index + 1}`,
    schedule_uuid: `sched-uuid-${index + 1}`,
    schedule_date: scheduleDate.toISOString().split('T')[0],
    shift: ['morning', 'afternoon', 'night'][index % 3] as ProductionSchedule['shift'],
    production_line: productionLines[index % productionLines.length],
    capacity_hours: 8,
    allocated_hours: Math.min(8, relatedItems.reduce((sum, item) => sum + item.estimated_duration_hours, 0)),
    efficiency_target: 85 + (index % 15), // 85-100%
    actual_efficiency: relatedItems.length > 0 ? 80 + (index % 20) : undefined,
    production_items: relatedItems.map(item => item.id),
    supervisor_id: supervisors[index % supervisors.length].id,
    supervisor_name: supervisors[index % supervisors.length].name,
    notes: index % 5 === 0 ? 'Maintenance window scheduled for end of shift' : undefined,
    status: scheduleDate < new Date() ? 'completed' : 
            scheduleDate.toDateString() === new Date().toDateString() ? 'active' : 'scheduled',
    created_at: subtractDays(scheduleDate, 7).toISOString(),
    updated_at: scheduleDate < new Date() ? addDays(scheduleDate, 1).toISOString() : 
                new Date().toISOString(),
  };
});

// Generate production statistics
export const mockProductionStats: ProductionStats = {
  total_items: mockProductionItems.length,
  active_items: mockProductionItems.filter(item => 
    ['material_preparation', 'in_progress', 'quality_check'].includes(item.status)
  ).length,
  completed_items: mockProductionItems.filter(item => item.status === 'completed').length,
  overdue_items: mockProductionItems.filter(item => {
    if (!item.scheduled_completion_date || item.status === 'completed') return false;
    return new Date(item.scheduled_completion_date) < new Date();
  }).length,
  
  // Status breakdown
  items_by_status: {
    scheduled: mockProductionItems.filter(item => item.status === 'scheduled').length,
    material_preparation: mockProductionItems.filter(item => item.status === 'material_preparation').length,
    in_progress: mockProductionItems.filter(item => item.status === 'in_progress').length,
    quality_check: mockProductionItems.filter(item => item.status === 'quality_check').length,
    completed: mockProductionItems.filter(item => item.status === 'completed').length,
    on_hold: mockProductionItems.filter(item => item.status === 'on_hold').length,
    cancelled: mockProductionItems.filter(item => item.status === 'cancelled').length,
    rejected: mockProductionItems.filter(item => item.status === 'rejected').length,
  },
  
  // Priority breakdown
  items_by_priority: {
    low: mockProductionItems.filter(item => item.priority === 'low').length,
    normal: mockProductionItems.filter(item => item.priority === 'normal').length,
    high: mockProductionItems.filter(item => item.priority === 'high').length,
    urgent: mockProductionItems.filter(item => item.priority === 'urgent').length,
  },
  
  // Quality control stats
  qc_stats: {
    pending: mockProductionItems.filter(item => item.qc_status === 'pending').length,
    in_progress: mockProductionItems.filter(item => item.qc_status === 'in_progress').length,
    passed: mockProductionItems.filter(item => item.qc_status === 'passed').length,
    failed: mockProductionItems.filter(item => item.qc_status === 'failed').length,
    rework_required: mockProductionItems.filter(item => item.qc_status === 'rework_required').length,
    pass_rate: Math.round((mockProductionItems.filter(item => item.qc_status === 'passed').length / 
                          mockProductionItems.filter(item => item.qc_status !== 'pending').length) * 100),
  },
  
  // Performance metrics
  avg_completion_time_hours: 24.5,
  on_time_delivery_rate: 87.3,
  capacity_utilization: 78.9,
  efficiency_rate: 82.4,
  
  // Financial impact
  total_production_value: 1250000,
  completed_value: 890000,
  pending_value: 360000,
  
  // Trend data (last 30 days)
  daily_completed: Array.from({ length: 30 }, (_, i) => ({
    date: subtractDays(new Date(), 29 - i).toISOString().split('T')[0],
    completed: 1 + Math.floor(Math.random() * 4),
    target: 3,
  })),
  
  // Issues summary
  total_issues: mockProductionIssues.length,
  open_issues: mockProductionIssues.filter(issue => issue.status === 'open').length,
  critical_issues: mockProductionIssues.filter(issue => issue.severity === 'critical').length,
  avg_resolution_time_hours: 18.2,
};

// Mock service functions
export const mockProductionService = {
  async getProductionItems(filters?: any) {
    let items = [...mockProductionItems];
    
    // Apply filters
    if (filters?.status) {
      items = items.filter(item => item.status === filters.status);
    }
    if (filters?.priority) {
      items = items.filter(item => item.priority === filters.priority);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(item => 
        item.product_name.toLowerCase().includes(search) ||
        item.product_sku.toLowerCase().includes(search) ||
        item.order.order_code.toLowerCase().includes(search)
      );
    }
    
    // Sort by created date (newest first)
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Pagination
    const page = filters?.page || 1;
    const perPage = filters?.per_page || 10;
    const start = (page - 1) * perPage;
    const paginatedItems = items.slice(start, start + perPage);
    
    return {
      data: paginatedItems,
      meta: {
        total: items.length,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(items.length / perPage),
      }
    };
  },

  async getProductionItem(id: string) {
    const item = mockProductionItems.find(item => item.id === id);
    if (!item) throw new Error('Production item not found');
    
    // Add checkpoints and issues
    return {
      ...item,
      checkpoints: mockProductionCheckpoints.filter(cp => cp.production_item_id === id),
      issues: mockProductionIssues.filter(issue => issue.production_item_id === id),
    };
  },

  async getProductionStats() {
    return mockProductionStats;
  },

  async getProductionSchedules(filters?: any) {
    let schedules = [...mockProductionSchedules];
    
    if (filters?.date) {
      schedules = schedules.filter(schedule => schedule.schedule_date === filters.date);
    }
    if (filters?.shift) {
      schedules = schedules.filter(schedule => schedule.shift === filters.shift);
    }
    
    return schedules.sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
  },

  async getProductionIssues(filters?: any) {
    let issues = [...mockProductionIssues];
    
    if (filters?.status) {
      issues = issues.filter(issue => issue.status === filters.status);
    }
    if (filters?.severity) {
      issues = issues.filter(issue => issue.severity === filters.severity);
    }
    
    return issues.sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());
  },
};