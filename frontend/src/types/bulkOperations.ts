export type BulkActionType =
  | 'update_status'
  | 'update_price'
  | 'update_category'
  | 'update_tags'
  | 'update_stock'
  | 'update_featured'
  | 'update_production_type'
  | 'update_lead_time'
  | 'update_business_type'
  | 'add_materials'
  | 'toggle_customizable'
  | 'duplicate'
  | 'delete';

export type BulkOperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';

export type PriceAdjustmentType = 'percentage' | 'fixed';

export type PriceAdjustmentOperation = 'increase' | 'decrease' | 'set';

export interface BulkStatusUpdate {
  status: 'draft' | 'published' | 'archived';
}

export interface BulkPriceUpdate {
  adjustmentType: PriceAdjustmentType;
  operation: PriceAdjustmentOperation;
  value: number;
}

export interface BulkCategoryUpdate {
  categoryId?: string;
  categorySlug?: string;
}

export interface BulkTagsUpdate {
  operation: 'add' | 'remove' | 'replace';
  tags: string[];
}

export interface BulkStockUpdate {
  operation: 'set' | 'increase' | 'decrease';
  quantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
}

export interface BulkFeaturedUpdate {
  featured: boolean;
}

export interface BulkDuplicateConfig {
  count: number;
  includeImages?: boolean;
  includeVariants?: boolean;
  nameSuffix?: string;
}

export interface BulkDeleteConfig {
  permanent?: boolean;
}

export interface BulkProductionTypeUpdate {
  production_type: 'internal' | 'vendor' | 'both';
}

export interface BulkLeadTimeUpdate {
  lead_time: string;
}

export interface BulkBusinessTypeUpdate {
  business_type: string;
}

export interface BulkMaterialsUpdate {
  operation: 'add' | 'remove' | 'replace';
  materials: string[];
}

export interface BulkCustomizableUpdate {
  customizable: boolean;
}

export type BulkActionData =
  | BulkStatusUpdate
  | BulkPriceUpdate
  | BulkCategoryUpdate
  | BulkTagsUpdate
  | BulkStockUpdate
  | BulkFeaturedUpdate
  | BulkProductionTypeUpdate
  | BulkLeadTimeUpdate
  | BulkBusinessTypeUpdate
  | BulkMaterialsUpdate
  | BulkCustomizableUpdate
  | BulkDuplicateConfig
  | BulkDeleteConfig;

export interface BulkOperationConfig {
  action: BulkActionType;
  productIds: string[];
  data: BulkActionData;
  dryRun?: boolean;
}

export interface BulkOperationItemResult {
  productId: string;
  productName?: string;
  success: boolean;
  error?: string;
  changes?: Record<string, { from: any; to: any }>;
}

export interface BulkOperationResult {
  jobId: string;
  status: BulkOperationStatus;
  action: BulkActionType;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  results: BulkOperationItemResult[];
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface BulkOperationJob {
  id: string;
  uuid: string;
  action: BulkActionType;
  status: BulkOperationStatus;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  dryRun: boolean;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface BulkOperationProgress {
  jobId: string;
  status: BulkOperationStatus;
  action: BulkActionType;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  percentage: number;
  currentItem?: string;
  estimatedTimeRemaining?: number;
}

export interface BulkValidationResult {
  valid: boolean;
  errors: Array<{
    productId: string;
    productName?: string;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    productId: string;
    productName?: string;
    field: string;
    message: string;
  }>;
}

export interface BulkOperationResponse {
  job: BulkOperationJob;
  message: string;
  validationResult?: BulkValidationResult;
}

export interface BulkOperationJobListResponse {
  jobs: BulkOperationJob[];
  total: number;
  page: number;
  perPage: number;
}

export interface BulkActionOption {
  value: BulkActionType;
  label: string;
  description: string;
  icon: any;
  requiresDialog?: boolean;
  dangerous?: boolean;
}
