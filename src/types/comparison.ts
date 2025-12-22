export interface ComparisonNote {
  id: string;
  uuid: string;
  productId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ComparisonConfig {
  productIds: string[];
  name?: string;
  description?: string;
  highlightDifferences?: boolean;
  showOnlyDifferences?: boolean;
  fields?: string[];
  notes?: ComparisonNote[];
}

export interface SavedComparison {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  config: ComparisonConfig;
  productCount: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  lastAccessedAt?: string;
  accessCount: number;
}

export interface ComparisonShareLink {
  id: string;
  uuid: string;
  comparisonId?: string;
  token: string;
  url: string;
  config: ComparisonConfig;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
  accessCount: number;
  maxAccess?: number;
  isActive: boolean;
}

export interface ComparisonExportConfig {
  format: 'pdf' | 'excel';
  includeImages?: boolean;
  includeNotes?: boolean;
  includeMetadata?: boolean;
  fields?: string[];
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'a4' | 'letter';
}

export interface ComparisonExportJob {
  id: string;
  uuid: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'pdf' | 'excel';
  fileUrl?: string;
  fileName: string;
  fileSize?: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface ComparisonDifference {
  field: string;
  label: string;
  values: Array<{
    productId: string;
    value: any;
    isDifferent: boolean;
  }>;
  hasDifference: boolean;
}

export interface SavedComparisonListResponse {
  comparisons: SavedComparison[];
  total: number;
  page: number;
  perPage: number;
}

export interface ComparisonShareResponse {
  shareLink: ComparisonShareLink;
  message: string;
}

export interface ComparisonExportResponse {
  job: ComparisonExportJob;
  message: string;
}

export interface ComparisonStatsResponse {
  totalComparisons: number;
  totalShares: number;
  mostComparedProducts: Array<{
    productId: string;
    productName: string;
    count: number;
  }>;
  recentComparisons: SavedComparison[];
}
