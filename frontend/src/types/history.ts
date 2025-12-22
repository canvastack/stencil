export interface HistoryFieldChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  valueType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
}

export interface ProductHistory {
  id: string;
  uuid: string;
  productId: string;
  action: 'created' | 'updated' | 'deleted' | 'published' | 'unpublished' | 'archived' | 'restored';
  changes: HistoryFieldChange[];
  changeCount: number;
  performedBy: string;
  performedByName: string;
  performedByAvatar?: string;
  performedAt: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ProductVersion {
  id: string;
  uuid: string;
  productId: string;
  versionNumber: number;
  snapshot: any;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  label?: string;
  description?: string;
  isCurrent: boolean;
}

export interface HistoryDiffView {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  isDifferent: boolean;
  diffType: 'added' | 'removed' | 'modified' | 'unchanged';
}

export interface RestoreVersionRequest {
  versionId: string;
  productId: string;
  createBackup?: boolean;
}

export interface HistoryListResponse {
  history: ProductHistory[];
  total: number;
  page: number;
  perPage: number;
}

export interface VersionListResponse {
  versions: ProductVersion[];
  total: number;
  page: number;
  perPage: number;
}

export interface HistoryStatsResponse {
  totalChanges: number;
  totalVersions: number;
  recentActivity: ProductHistory[];
  topContributors: Array<{
    userId: string;
    userName: string;
    changeCount: number;
  }>;
  changesByAction: Record<string, number>;
}

export interface HistoryFilterOptions {
  action?: string[];
  performedBy?: string[];
  dateFrom?: string;
  dateTo?: string;
  fields?: string[];
}
