export type ExportFormat = 'csv' | 'excel' | 'json' | 'xml';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ImportStatus = 'pending' | 'validating' | 'processing' | 'completed' | 'failed' | 'partial';

export interface ExportFieldConfig {
  field: string;
  label: string;
  enabled: boolean;
  group?: 'basic' | 'pricing' | 'inventory' | 'seo' | 'media' | 'metadata';
}

export interface ExportConfig {
  format: ExportFormat;
  fields: string[];
  includeRelations?: {
    categories?: boolean;
    variants?: boolean;
    images?: boolean;
    specifications?: boolean;
  };
  filters?: Record<string, any>;
  fileName?: string;
  encrypt?: boolean;
  encryptionPassword?: string;
}

export interface ExportJob {
  id: string;
  uuid: string;
  status: ExportStatus;
  format: ExportFormat;
  totalRecords: number;
  processedRecords: number;
  fileUrl?: string;
  fileName: string;
  fileSize?: number;
  filters?: Record<string, any>;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  errorMessage?: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  summary: {
    duplicates?: number;
    missingRequired?: number;
    invalidFormat?: number;
    outOfRange?: number;
  };
}

export interface ImportMapping {
  sourceField: string;
  targetField: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'number' | 'boolean' | 'date';
  defaultValue?: any;
  required?: boolean;
}

export interface ImportConfig {
  file: File;
  format: 'csv' | 'excel' | 'json';
  mapping?: ImportMapping[];
  dryRun?: boolean;
  updateExisting?: boolean;
  skipErrors?: boolean;
  batchSize?: number;
}

export interface ImportJob {
  id: string;
  uuid: string;
  status: ImportStatus;
  fileName: string;
  fileSize: number;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  validationResult?: ImportValidationResult;
  dryRun: boolean;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  errorLogUrl?: string;
}

export interface ImportProgress {
  jobId: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  currentRow?: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  errors?: ImportValidationError[];
}

export interface ExportFieldGroup {
  group: string;
  label: string;
  fields: ExportFieldConfig[];
}

export interface ImportPreview {
  headers: string[];
  rows: any[][];
  totalRows: number;
  sampleSize: number;
  detectedFormat: 'csv' | 'excel' | 'json';
  suggestedMapping?: ImportMapping[];
}

export interface ExportResponse {
  job: ExportJob;
  message: string;
}

export interface ImportResponse {
  job: ImportJob;
  message: string;
  validationResult?: ImportValidationResult;
}

export interface ImportJobListResponse {
  jobs: ImportJob[];
  total: number;
  page: number;
  perPage: number;
}

export interface ExportJobListResponse {
  jobs: ExportJob[];
  total: number;
  page: number;
  perPage: number;
}
