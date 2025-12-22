import { QCInspection, QCCriterion, QCDefect, QCMeasurement, QCStats } from '@/services/tenant/qcService';

// Helper functions for date management
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const subtractDays = (date: Date, days: number) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60 * 1000);

const baseDate = new Date('2024-12-01T00:00:00Z');

// Quality Control Inspectors
const inspectors = [
  { id: '1', name: 'James Wilson', level: 'senior' as const, experience: 8 },
  { id: '2', name: 'Maria Santos', level: 'lead' as const, experience: 12 },
  { id: '3', name: 'Robert Chang', level: 'certified' as const, experience: 15 },
  { id: '4', name: 'Lisa Thompson', level: 'senior' as const, experience: 6 },
  { id: '5', name: 'Ahmed Hassan', level: 'junior' as const, experience: 2 },
  { id: '6', name: 'Sophie Mueller', level: 'senior' as const, experience: 9 },
  { id: '7', name: 'Carlos Rodriguez', level: 'lead' as const, experience: 11 },
];

// Product types and their typical inspection requirements
const productTypes = [
  {
    id: '1', name: 'Custom Etched Steel Plate', sku: 'CEP-001',
    criteria: ['dimensional', 'visual', 'material'],
    criticalDefects: ['dimension_tolerance', 'surface_defect']
  },
  {
    id: '2', name: 'Precision Machined Bracket', sku: 'PMB-002',
    criteria: ['dimensional', 'functional', 'material'],
    criticalDefects: ['dimension_tolerance', 'thread_defect']
  },
  {
    id: '3', name: 'Aluminum Housing Unit', sku: 'AHU-003',
    criteria: ['dimensional', 'visual', 'functional'],
    criticalDefects: ['assembly_defect', 'sealing_issue']
  },
  {
    id: '4', name: 'Stainless Steel Component', sku: 'SSC-004',
    criteria: ['material', 'visual', 'environmental'],
    criticalDefects: ['corrosion_resistance', 'surface_defect']
  },
  {
    id: '5', name: 'Polymer Injection Mold', sku: 'PIM-005',
    criteria: ['dimensional', 'material', 'functional'],
    criticalDefects: ['mold_defect', 'material_integrity']
  },
  {
    id: '6', name: 'Circuit Board Assembly', sku: 'CBA-006',
    criteria: ['functional', 'safety', 'environmental'],
    criticalDefects: ['electrical_fault', 'component_missing']
  },
  {
    id: '7', name: 'Titanium Aerospace Part', sku: 'TAP-007',
    criteria: ['dimensional', 'material', 'safety'],
    criticalDefects: ['material_defect', 'dimension_tolerance']
  },
  {
    id: '8', name: 'Medical Device Component', sku: 'MDC-008',
    criteria: ['safety', 'material', 'environmental'],
    criticalDefects: ['biocompatibility', 'sterilization_issue']
  },
];

// QC Defect types
const defectTypes = {
  critical: [
    { code: 'DIM-001', name: 'Dimension Tolerance Exceeded', description: 'Part dimensions outside acceptable tolerance' },
    { code: 'MAT-001', name: 'Material Defect', description: 'Material composition or properties not meeting specs' },
    { code: 'SAF-001', name: 'Safety Standard Violation', description: 'Part fails safety compliance requirements' },
    { code: 'FUN-001', name: 'Functional Failure', description: 'Part does not perform intended function' },
  ],
  major: [
    { code: 'SUR-001', name: 'Surface Finish Issue', description: 'Surface roughness or finish not meeting specifications' },
    { code: 'ASM-001', name: 'Assembly Defect', description: 'Components not properly assembled or aligned' },
    { code: 'THR-001', name: 'Thread Defect', description: 'Threading issues affecting functionality' },
    { code: 'SHP-001', name: 'Shape Deviation', description: 'Part shape deviates from design specifications' },
  ],
  minor: [
    { code: 'VIS-001', name: 'Visual Blemish', description: 'Minor visual imperfection not affecting function' },
    { code: 'MRK-001', name: 'Marking Issue', description: 'Part marking or labeling issues' },
    { code: 'PAK-001', name: 'Packaging Defect', description: 'Packaging not meeting standards' },
    { code: 'DOC-001', name: 'Documentation Missing', description: 'Required documentation incomplete' },
  ],
  cosmetic: [
    { code: 'COS-001', name: 'Color Variation', description: 'Minor color or finish variation' },
    { code: 'SCR-001', name: 'Minor Scratch', description: 'Superficial scratches not affecting function' },
    { code: 'FIN-001', name: 'Finish Uniformity', description: 'Minor finish uniformity issues' },
  ]
};

// Generate QC Criteria for each inspection
const generateCriteria = (productType: any, inspectionType: string): QCCriterion[] => {
  const baseCriteria = [
    {
      name: 'Dimensional Accuracy',
      description: 'Verify part dimensions meet drawing specifications',
      category: 'dimensional' as const,
      weight: 30,
      acceptable_range: { min: -0.1, max: 0.1, unit: 'mm' },
      inspection_method: 'measurement' as const,
      is_critical: true,
      reference_standard: 'ISO 2768-f'
    },
    {
      name: 'Surface Finish',
      description: 'Visual and tactile inspection of surface quality',
      category: 'visual' as const,
      weight: 20,
      acceptable_range: { max: 1.6, unit: 'Ra μm' },
      inspection_method: 'visual' as const,
      is_critical: false,
      reference_standard: 'ISO 1302'
    },
    {
      name: 'Material Verification',
      description: 'Verify material properties and composition',
      category: 'material' as const,
      weight: 25,
      inspection_method: 'test' as const,
      is_critical: true,
      reference_standard: 'ASTM Standards'
    },
    {
      name: 'Functional Test',
      description: 'Test part functionality under specified conditions',
      category: 'functional' as const,
      weight: 20,
      inspection_method: 'test' as const,
      is_critical: true,
      reference_standard: 'Customer Specification'
    },
    {
      name: 'Safety Compliance',
      description: 'Verify compliance with safety standards',
      category: 'safety' as const,
      weight: 25,
      inspection_method: 'test' as const,
      is_critical: true,
      reference_standard: inspectionType === 'final' ? 'CE/UL Standards' : 'Internal Safety'
    }
  ];
  
  // Filter criteria based on product type requirements
  return baseCriteria
    .filter(criterion => productType.criteria.includes(criterion.category))
    .map((criterion, index) => ({
      ...criterion,
      id: `crit-${index + 1}`,
      result: Math.random() > 0.15 ? 'pass' : (Math.random() > 0.5 ? 'conditional' : 'fail') as QCCriterion['result'],
      actual_value: criterion.category === 'dimensional' ? 
        ((Math.random() - 0.5) * 0.2).toFixed(3) : // -0.1 to +0.1 mm
        criterion.category === 'visual' ? 
        (0.8 + Math.random() * 1.6).toFixed(1) : // 0.8 to 2.4 Ra
        'Pass',
      notes: Math.random() > 0.7 ? 'Minor deviation noted but within acceptable range' : undefined
    }));
};

// Generate QC Defects
const generateDefects = (hasDefects: boolean, productType: any): QCDefect[] => {
  if (!hasDefects || Math.random() > 0.3) return [];
  
  const defectCount = Math.floor(Math.random() * 3) + 1; // 1-3 defects
  const allDefects = [
    ...defectTypes.critical,
    ...defectTypes.major,
    ...defectTypes.minor,
    ...defectTypes.cosmetic
  ];
  
  return Array.from({ length: defectCount }, (_, index) => {
    const defectType = Math.random() < 0.1 ? 'critical' : 
                     Math.random() < 0.3 ? 'major' : 
                     Math.random() < 0.7 ? 'minor' : 'cosmetic';
    const defectList = defectTypes[defectType as keyof typeof defectTypes];
    const defect = defectList[Math.floor(Math.random() * defectList.length)];
    
    return {
      id: `def-${index + 1}`,
      defect_type: defectType as QCDefect['defect_type'],
      defect_code: defect.code,
      defect_name: defect.name,
      description: defect.description,
      location: ['Front face', 'Back face', 'Edge', 'Internal', 'Surface', 'Thread area'][Math.floor(Math.random() * 6)],
      quantity: Math.floor(Math.random() * 5) + 1,
      severity_score: defectType === 'critical' ? 8 + Math.floor(Math.random() * 3) :
                     defectType === 'major' ? 5 + Math.floor(Math.random() * 3) :
                     defectType === 'minor' ? 2 + Math.floor(Math.random() * 3) : 1,
      corrective_action: defectType === 'critical' ? 'Reject and rework' :
                        defectType === 'major' ? 'Rework required' :
                        defectType === 'minor' ? 'Accept with note' : 'Accept',
      root_cause: ['Material quality', 'Process variation', 'Tool wear', 'Operator error', 'Environmental'][Math.floor(Math.random() * 5)],
      preventive_measures: ['Process adjustment', 'Tool replacement', 'Training', 'Equipment calibration'][Math.floor(Math.random() * 4)],
      photos: Math.random() > 0.5 ? [`defect-photo-${index + 1}.jpg`] : [],
      inspector_notes: 'Defect documented and corrective action assigned',
    };
  });
};

// Generate QC Measurements
const generateMeasurements = (productType: any): QCMeasurement[] => {
  const measurements = [
    { name: 'Length', unit: 'mm', target: 100.0, tolerance: 0.1 },
    { name: 'Width', unit: 'mm', target: 50.0, tolerance: 0.1 },
    { name: 'Height', unit: 'mm', target: 25.0, tolerance: 0.05 },
    { name: 'Surface Roughness', unit: 'Ra μm', target: 1.6, tolerance: 0.4 },
    { name: 'Hardness', unit: 'HRC', target: 45, tolerance: 2 },
    { name: 'Weight', unit: 'g', target: 150, tolerance: 5 },
  ];
  
  return measurements.slice(0, 3 + Math.floor(Math.random() * 3)).map((measurement, index) => ({
    id: `meas-${index + 1}`,
    measurement_name: measurement.name,
    measurement_type: measurement.name.includes('Surface') ? 'surface' : 
                     measurement.name.includes('Hardness') ? 'material' : 'dimensional',
    target_value: measurement.target,
    actual_value: measurement.target + ((Math.random() - 0.5) * measurement.tolerance * 1.5),
    unit: measurement.unit,
    tolerance_min: measurement.target - measurement.tolerance,
    tolerance_max: measurement.target + measurement.tolerance,
    result: 'pass', // Will be calculated based on actual vs tolerance
    measuring_equipment: measurement.name.includes('Surface') ? 'Surface Roughness Tester' :
                        measurement.name.includes('Hardness') ? 'Rockwell Hardness Tester' :
                        'Digital Caliper',
    calibration_date: subtractDays(new Date(), Math.floor(Math.random() * 90)).toISOString(),
    operator: inspectors[Math.floor(Math.random() * inspectors.length)].name,
    measurement_notes: Math.random() > 0.8 ? 'Multiple readings taken for accuracy' : undefined,
  })).map(measurement => ({
    ...measurement,
    result: (measurement.actual_value >= measurement.tolerance_min && 
             measurement.actual_value <= measurement.tolerance_max) ? 'pass' : 'fail' as QCMeasurement['result']
  }));
};

// Generate 45 realistic QC Inspections
export const mockQCInspections: QCInspection[] = Array.from({ length: 45 }, (_, index) => {
  const inspector = inspectors[index % inspectors.length];
  const productType = productTypes[index % productTypes.length];
  const daysOffset = Math.floor(index / 6) - 7; // Spread over time
  
  const inspectionTypes: QCInspection['inspection_type'][] = 
    ['incoming', 'in_process', 'final', 'customer_return', 'supplier_audit'];
  const inspectionType = inspectionTypes[index % inspectionTypes.length];
  
  // Status distribution - realistic QC workflow
  const statusWeights = ['pending', 'in_progress', 'passed', 'failed', 'conditional_pass', 'rework_required'];
  const statusIndex = index % statusWeights.length;
  const status = statusWeights[statusIndex] as QCInspection['status'];
  
  const inspectionDate = addDays(baseDate, daysOffset);
  const isCompleted = ['passed', 'failed', 'conditional_pass', 'rejected'].includes(status);
  const hasDefects = status === 'failed' || status === 'rework_required' || Math.random() < 0.25;
  
  // Generate criteria, defects, and measurements
  const criteria = generateCriteria(productType, inspectionType);
  const defects = generateDefects(hasDefects, productType);
  const measurements = generateMeasurements(productType);
  
  // Calculate overall score based on criteria results
  const passedCriteria = criteria.filter(c => c.result === 'pass').length;
  const conditionalCriteria = criteria.filter(c => c.result === 'conditional').length;
  const baseScore = (passedCriteria * 100 + conditionalCriteria * 70) / criteria.length;
  const defectPenalty = defects.reduce((penalty, defect) => 
    penalty + (defect.defect_type === 'critical' ? 20 : 
              defect.defect_type === 'major' ? 10 : 
              defect.defect_type === 'minor' ? 3 : 1), 0);
  const overall_score = Math.max(0, Math.round(baseScore - defectPenalty));
  
  const sample_size = 5 + Math.floor(Math.random() * 15); // 5-20 samples
  const total_quantity = sample_size * (2 + Math.floor(Math.random() * 8)); // 2-10x sample size
  const passedSamples = Math.floor(sample_size * (overall_score / 100));
  const pass_rate = Math.round((passedSamples / sample_size) * 100);
  
  const inspection_duration = 30 + Math.floor(Math.random() * 90); // 30-120 minutes
  
  return {
    id: `qc-${String(index + 1).padStart(3, '0')}`,
    inspection_uuid: `insp-uuid-${String(index + 1).padStart(3, '0')}`,
    production_item_id: `prod-${String((index % 30) + 1).padStart(3, '0')}`, // Link to production items
    order_id: `order-${String((index % 15) + 1).padStart(3, '0')}`,
    product_id: productType.id,
    
    // Inspection Details
    inspection_type: inspectionType,
    inspection_date: inspectionDate.toISOString(),
    inspection_number: `QC-2024-${String(index + 1).padStart(3, '0')}`,
    batch_number: `B2024${String(index + 100).padStart(3, '0')}`,
    lot_number: `L${String(index + 1000).padStart(4, '0')}`,
    
    // Quality Metrics
    status,
    overall_score,
    pass_rate,
    
    // Inspector Information
    inspector_id: inspector.id,
    inspector_name: inspector.name,
    inspector_level: inspector.level,
    inspection_duration_minutes: inspection_duration,
    
    // Sample Information
    sample_size,
    total_quantity,
    sample_method: ['random', 'systematic', 'stratified', 'full_inspection'][Math.floor(Math.random() * 4)] as QCInspection['sample_method'],
    
    // Inspection Results
    criteria,
    defects,
    measurements,
    
    // Results & Notes
    inspection_notes: status === 'passed' ? `All inspection criteria met. Quality standards maintained at ${overall_score}% score.` :
                     status === 'failed' ? `Failed inspection due to ${defects.filter(d => d.defect_type === 'critical').length} critical defects.` :
                     status === 'conditional_pass' ? `Conditional pass with minor issues noted. Monitor for next batch.` :
                     status === 'rework_required' ? `Rework required to address identified defects before approval.` :
                     status === 'in_progress' ? `Inspection in progress. ${Math.floor(Math.random() * 60) + 20}% complete.` :
                     'Inspection scheduled and awaiting start.',
    
    recommendations: overall_score >= 95 ? 'Excellent quality. Continue current process parameters.' :
                    overall_score >= 85 ? 'Good quality with minor optimization opportunities.' :
                    overall_score >= 75 ? 'Acceptable quality. Monitor process closely and consider improvements.' :
                    overall_score >= 60 ? 'Below standard. Process review and corrective action required.' :
                    'Significant quality issues. Immediate process shutdown and investigation required.',
    
    corrective_actions: defects.length > 0 ? [
      ...defects.filter(d => d.defect_type === 'critical').map(d => `Address critical defect: ${d.defect_name}`),
      ...defects.filter(d => d.defect_type === 'major').map(d => `Resolve major issue: ${d.defect_name}`),
      ...(defects.some(d => d.defect_type === 'critical') ? ['Process review and validation', 'Supervisor approval required'] : [])
    ] : [],
    
    next_inspection_date: isCompleted && status === 'passed' ? 
      addDays(inspectionDate, 7 + Math.floor(Math.random() * 14)).toISOString() : undefined,
    
    // Certification & Approval
    certification_required: inspectionType === 'final' || productType.name.includes('Aerospace') || productType.name.includes('Medical'),
    certification_status: (inspectionType === 'final' && status === 'passed') ? 'certified' :
                          (inspectionType === 'final' && status === 'failed') ? 'rejected' :
                          inspectionType === 'final' ? 'pending' : undefined,
    certified_by: (inspectionType === 'final' && status === 'passed') ? 
      inspectors.find(i => i.level === 'certified' || i.level === 'lead')?.name : undefined,
    certified_at: (inspectionType === 'final' && status === 'passed') ? 
      addMinutes(inspectionDate, inspection_duration + 30).toISOString() : undefined,
    certificate_number: (inspectionType === 'final' && status === 'passed') ? 
      `CERT-2024-${String(index + 1).padStart(3, '0')}` : undefined,
    
    // Photos & Documentation
    photos: hasDefects && defects.length > 0 ? [
      `inspection-${index + 1}-overview.jpg`,
      ...defects.filter(d => d.photos.length > 0).flatMap(d => d.photos)
    ] : (Math.random() > 0.7 ? [`inspection-${index + 1}-overview.jpg`] : []),
    
    documents: [
      `inspection-report-${index + 1}.pdf`,
      ...(inspectionType === 'final' ? [`final-inspection-${index + 1}.pdf`] : []),
      ...(Math.random() > 0.8 ? [`customer-spec-${productType.sku}.pdf`] : [])
    ],
    
    test_reports: measurements.length > 0 ? [`test-report-${index + 1}.pdf`] : [],
    
    // Metadata
    created_by: `qc_${inspector.id}`,
    updated_by: `qc_${inspector.id}`,
    created_at: subtractDays(inspectionDate, 1).toISOString(),
    updated_at: isCompleted ? 
      addMinutes(inspectionDate, inspection_duration).toISOString() : 
      addDays(inspectionDate, Math.random() > 0.5 ? 0 : 1).toISOString(),
    
    // Relationships
    production_item: {
      id: `prod-${String((index % 30) + 1).padStart(3, '0')}`,
      product_name: productType.name,
      product_sku: productType.sku,
      quantity: total_quantity,
    },
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
    },
  };
});

// Generate QC Statistics
export const mockQCStats: QCStats = {
  total_inspections: mockQCInspections.length,
  pending_inspections: mockQCInspections.filter(i => i.status === 'pending').length,
  in_progress_inspections: mockQCInspections.filter(i => i.status === 'in_progress').length,
  completed_inspections: mockQCInspections.filter(i => 
    ['passed', 'failed', 'conditional_pass', 'rejected'].includes(i.status)).length,
  
  // Pass rates
  overall_pass_rate: Math.round((mockQCInspections.filter(i => i.status === 'passed').length / 
                                mockQCInspections.filter(i => i.status !== 'pending').length) * 100),
  final_inspection_pass_rate: (() => {
    const finals = mockQCInspections.filter(i => i.inspection_type === 'final' && i.status !== 'pending');
    return Math.round((finals.filter(i => i.status === 'passed').length / finals.length) * 100);
  })(),
  
  // Defect statistics
  total_defects: mockQCInspections.reduce((sum, i) => sum + i.defects.length, 0),
  critical_defects: mockQCInspections.reduce((sum, i) => 
    sum + i.defects.filter(d => d.defect_type === 'critical').length, 0),
  major_defects: mockQCInspections.reduce((sum, i) => 
    sum + i.defects.filter(d => d.defect_type === 'major').length, 0),
  
  // Inspector performance
  inspector_stats: inspectors.map(inspector => {
    const inspectorInspections = mockQCInspections.filter(i => i.inspector_id === inspector.id);
    const completedInspections = inspectorInspections.filter(i => 
      ['passed', 'failed', 'conditional_pass', 'rejected'].includes(i.status));
    
    return {
      inspector_id: inspector.id,
      inspector_name: inspector.name,
      total_inspections: inspectorInspections.length,
      completed_inspections: completedInspections.length,
      pass_rate: completedInspections.length > 0 ? 
        Math.round((completedInspections.filter(i => i.status === 'passed').length / completedInspections.length) * 100) : 0,
      avg_inspection_time: completedInspections.length > 0 ? 
        Math.round(completedInspections.reduce((sum, i) => sum + i.inspection_duration_minutes, 0) / completedInspections.length) : 0,
      defects_found: inspectorInspections.reduce((sum, i) => sum + i.defects.length, 0),
    };
  }),
  
  // Monthly trends (last 12 months)
  monthly_trends: Array.from({ length: 12 }, (_, i) => {
    const month = subtractDays(new Date(), (11 - i) * 30);
    const monthInspections = mockQCInspections.filter(inspection => {
      const inspectionMonth = new Date(inspection.inspection_date);
      return inspectionMonth.getMonth() === month.getMonth() && 
             inspectionMonth.getFullYear() === month.getFullYear();
    });
    
    return {
      month: month.toISOString().substring(0, 7), // YYYY-MM format
      total_inspections: monthInspections.length,
      passed: monthInspections.filter(i => i.status === 'passed').length,
      failed: monthInspections.filter(i => i.status === 'failed').length,
      pass_rate: monthInspections.length > 0 ? 
        Math.round((monthInspections.filter(i => i.status === 'passed').length / monthInspections.length) * 100) : 0,
      avg_score: monthInspections.length > 0 ? 
        Math.round(monthInspections.reduce((sum, i) => sum + i.overall_score, 0) / monthInspections.length) : 0,
    };
  }),
  
  // Defect trends by category
  defect_categories: Object.entries(defectTypes).map(([category, defects]) => ({
    category,
    count: mockQCInspections.reduce((sum, i) => 
      sum + i.defects.filter(d => d.defect_type === category).length, 0),
    percentage: Math.round((mockQCInspections.reduce((sum, i) => 
      sum + i.defects.filter(d => d.defect_type === category).length, 0) / 
      mockQCInspections.reduce((sum, i) => sum + i.defects.length, 0)) * 100),
  })),
  
  // Average metrics
  avg_inspection_duration: Math.round(
    mockQCInspections.reduce((sum, i) => sum + i.inspection_duration_minutes, 0) / mockQCInspections.length
  ),
  avg_overall_score: Math.round(
    mockQCInspections.reduce((sum, i) => sum + i.overall_score, 0) / mockQCInspections.length
  ),
  avg_sample_size: Math.round(
    mockQCInspections.reduce((sum, i) => sum + i.sample_size, 0) / mockQCInspections.length
  ),
  
  // Certification stats
  certifications_issued: mockQCInspections.filter(i => i.certification_status === 'certified').length,
  certifications_pending: mockQCInspections.filter(i => i.certification_status === 'pending').length,
  certifications_rejected: mockQCInspections.filter(i => i.certification_status === 'rejected').length,
};

// Mock QC Service functions
export const mockQCService = {
  async getInspections(filters?: any) {
    let inspections = [...mockQCInspections];
    
    // Apply filters
    if (filters?.status) {
      inspections = inspections.filter(inspection => inspection.status === filters.status);
    }
    if (filters?.inspection_type) {
      inspections = inspections.filter(inspection => inspection.inspection_type === filters.inspection_type);
    }
    if (filters?.inspector_id) {
      inspections = inspections.filter(inspection => inspection.inspector_id === filters.inspector_id);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      inspections = inspections.filter(inspection => 
        inspection.inspection_number.toLowerCase().includes(search) ||
        inspection.production_item.product_name.toLowerCase().includes(search) ||
        inspection.production_item.product_sku.toLowerCase().includes(search) ||
        inspection.order.order_code.toLowerCase().includes(search)
      );
    }
    
    // Sort by inspection date (newest first)
    inspections.sort((a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime());
    
    // Pagination
    const page = filters?.page || 1;
    const perPage = filters?.per_page || 10;
    const start = (page - 1) * perPage;
    const paginatedInspections = inspections.slice(start, start + perPage);
    
    return {
      data: paginatedInspections,
      meta: {
        total: inspections.length,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(inspections.length / perPage),
      }
    };
  },

  async getInspection(id: string) {
    const inspection = mockQCInspections.find(inspection => inspection.id === id);
    if (!inspection) throw new Error('QC Inspection not found');
    return inspection;
  },

  async getQCStats() {
    return mockQCStats;
  },

  async getDefectAnalysis(filters?: any) {
    let inspections = mockQCInspections;
    
    if (filters?.date_from) {
      inspections = inspections.filter(i => new Date(i.inspection_date) >= new Date(filters.date_from));
    }
    if (filters?.date_to) {
      inspections = inspections.filter(i => new Date(i.inspection_date) <= new Date(filters.date_to));
    }
    
    const allDefects = inspections.flatMap(i => i.defects);
    
    return {
      total_defects: allDefects.length,
      defect_breakdown: Object.entries(defectTypes).map(([category, defects]) => ({
        category,
        count: allDefects.filter(d => d.defect_type === category).length,
        defects: allDefects.filter(d => d.defect_type === category)
      })),
      most_common_defects: Object.values(defectTypes)
        .flat()
        .map(defectType => ({
          ...defectType,
          count: allDefects.filter(d => d.defect_code === defectType.code).length
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  },

  async getInspectorPerformance(inspectorId?: string) {
    const targetInspectors = inspectorId ? 
      inspectors.filter(i => i.id === inspectorId) : 
      inspectors;
    
    return targetInspectors.map(inspector => {
      const inspectorInspections = mockQCInspections.filter(i => i.inspector_id === inspector.id);
      const completedInspections = inspectorInspections.filter(i => 
        ['passed', 'failed', 'conditional_pass', 'rejected'].includes(i.status));
      
      return {
        inspector,
        performance: {
          total_inspections: inspectorInspections.length,
          completed_inspections: completedInspections.length,
          pass_rate: completedInspections.length > 0 ? 
            (completedInspections.filter(i => i.status === 'passed').length / completedInspections.length) * 100 : 0,
          avg_inspection_time: completedInspections.length > 0 ? 
            completedInspections.reduce((sum, i) => sum + i.inspection_duration_minutes, 0) / completedInspections.length : 0,
          defects_found: inspectorInspections.reduce((sum, i) => sum + i.defects.length, 0),
          avg_score: completedInspections.length > 0 ? 
            completedInspections.reduce((sum, i) => sum + i.overall_score, 0) / completedInspections.length : 0,
        }
      };
    });
  },
};