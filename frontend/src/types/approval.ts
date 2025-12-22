export interface ApprovalRule {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  condition: 'always' | 'price_change' | 'status_change' | 'custom';
  conditionConfig?: Record<string, any>;
  requiredApprovals: number;
  approvers: string[];
  approverRoles?: string[];
  isActive: boolean;
  priority: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApprovalRequest {
  id: string;
  uuid: string;
  productId: string;
  productName: string;
  requestType: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  changes?: Record<string, any>;
  requestedBy: string;
  requestedByName: string;
  requestedByAvatar?: string;
  requestedAt: string;
  notes?: string;
  approvals: Approval[];
  requiredApprovals: number;
  deadline?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface Approval {
  id: string;
  uuid: string;
  requestId: string;
  approverId: string;
  approverName: string;
  approverAvatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  rejectedAt?: string;
  comments?: string;
  metadata?: Record<string, any>;
}

export interface CreateApprovalRequestData {
  productId: string;
  requestType: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  changes?: Record<string, any>;
  notes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  approvers?: string[];
}

export interface ApprovalAction {
  requestId: string;
  status: 'approved' | 'rejected';
  comments?: string;
}

export interface ApprovalListResponse {
  requests: ApprovalRequest[];
  total: number;
  page: number;
  perPage: number;
}

export interface ApprovalStatsResponse {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  myPendingApprovals: number;
  recentRequests: ApprovalRequest[];
  averageApprovalTime: number;
}

export interface ApprovalRuleListResponse {
  rules: ApprovalRule[];
  total: number;
  page: number;
  perPage: number;
}

export interface ApprovalFilterOptions {
  status?: string[];
  requestType?: string[];
  requestedBy?: string[];
  priority?: string[];
  dateFrom?: string;
  dateTo?: string;
}
