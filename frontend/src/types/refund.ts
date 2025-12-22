// Refund System TypeScript Interfaces
// Based on backend schema from REFUND_SYSTEM_ROADMAP.md

export enum RefundReason {
  CustomerRequest = 'customer_request',
  QualityIssue = 'quality_issue',
  TimelineDelay = 'timeline_delay',
  VendorFailure = 'vendor_failure',
  ProductionError = 'production_error',
  ShippingDamage = 'shipping_damage',
  Other = 'other',
}

export enum RefundType {
  FullRefund = 'full_refund',
  PartialRefund = 'partial_refund',
  ReplacementOrder = 'replacement_order',
  CreditNote = 'credit_note',
}

export enum RefundStatus {
  PendingReview = 'pending_review',
  UnderInvestigation = 'under_investigation',
  PendingFinance = 'pending_finance',
  PendingManager = 'pending_manager',
  Approved = 'approved',
  Processing = 'processing',
  Completed = 'completed',
  Rejected = 'rejected',
  Disputed = 'disputed',
  Cancelled = 'cancelled',
}

export enum ApprovalDecision {
  Approved = 'approved',
  Rejected = 'rejected',
  NeedsInfo = 'needs_info',
}

export enum DisputeStatus {
  Open = 'open',
  UnderReview = 'under_review',
  Mediation = 'mediation',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum DisputeReason {
  IncorrectAmount = 'incorrect_amount',
  QualityDispute = 'quality_dispute',
  ServiceIssue = 'service_issue',
  ProcessingDelay = 'processing_delay',
  Other = 'other',
}

export enum FundTransactionType {
  Contribution = 'contribution',
  Withdrawal = 'withdrawal',
}

// Core refund calculation interface
export interface RefundCalculation {
  orderTotal: number;
  customerPaidAmount: number;
  vendorCostPaid: number;
  productionProgress: number;
  refundReason: RefundReason;
  qualityIssuePercentage?: number;
  faultParty: 'customer' | 'vendor' | 'company' | 'external';
  refundableToCustomer: number;
  companyLoss: number;
  vendorRecoverable: number;
  insuranceCover: number;
  appliedRules: string[];
  calculatedAt: string;
  calculatedBy: string;
}

// Main refund request interface
export interface RefundRequest {
  id: string;
  tenantId: string;
  orderId: string;
  requestNumber: string;
  refundReason: RefundReason;
  refundType: RefundType;
  customerRequestAmount?: number;
  qualityIssuePercentage?: number;
  delayDays?: number;
  evidenceDocuments?: Record<string, any>;
  customerNotes?: string;
  status: RefundStatus;
  currentApproverId?: string;
  calculation?: RefundCalculation;
  requestedBy: string;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  timeline?: Array<{
    id: string;
    event: string;
    description: string;
    createdAt: string;
    createdBy: string;
  }>;
  
  // Relations
  order?: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
  };
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  currentApprover?: {
    id: string;
    name: string;
    role: string;
  };
  approvals?: RefundApproval[];
}

// Approval workflow interface
export interface RefundApproval {
  id: string;
  refundRequestId: string;
  approverId: string;
  approvalLevel: number;
  decision: ApprovalDecision;
  decisionNotes?: string;
  decidedAt?: string;
  reviewedCalculation?: RefundCalculation;
  adjustedAmount?: number;
  createdAt: string;
  
  // Relations
  approver?: {
    id: string;
    name: string;
    role: string;
  };
}

// Insurance fund transaction interface
export interface InsuranceFundTransaction {
  id: string;
  tenantId: string;
  orderId?: string;
  refundRequestId?: string;
  transactionType: FundTransactionType;
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  updatedAt: string;
  refundRequest?: RefundRequest;
}

// Dispute resolution interface
export interface RefundDispute {
  id: string;
  refundRequestId: string;
  tenantId: string;
  disputeReason: DisputeReason;
  customerClaim: string;
  evidenceCustomer?: Record<string, any>;
  companyResponse?: string;
  evidenceCompany?: Record<string, any>;
  status: DisputeStatus;
  resolutionNotes?: string;
  finalRefundAmount?: number;
  mediatorContact?: string;
  mediationCost?: number;
  createdAt: string;
  resolvedAt?: string;
}

// Vendor liability interface
export interface VendorLiability {
  id: string;
  vendorId: string;
  orderId: string;
  refundRequestId: string;
  liabilityAmount: number;
  reason: string;
  status: 'pending_claim' | 'claimed' | 'recovered' | 'written_off';
  claimDate?: string;
  recoveredDate?: string;
  recoveredAmount?: number;
  createdAt: string;
  updatedAt: string;
}

// API request/response interfaces
export interface CreateRefundRequestData {
  orderId: string;
  refundReason: RefundReason;
  refundType: RefundType;
  customerRequestAmount?: number;
  evidenceDocuments?: Record<string, any>;
  customerNotes?: string;
}

export interface UpdateRefundRequestData {
  refundReason?: RefundReason;
  refundType?: RefundType;
  customerRequestAmount?: number;
  evidenceDocuments?: Record<string, any>;
  customerNotes?: string;
}

export interface ApproveRefundData {
  decision: ApprovalDecision;
  decisionNotes?: string;
  adjustedAmount?: number;
}

export interface RefundRequestFilters {
  search?: string;
  status?: RefundStatus;
  refundReason?: RefundReason;
  dateFrom?: string;
  dateTo?: string;
  approverId?: string;
}

// Insurance fund analytics interface
export interface InsuranceFundAnalytics {
  currentBalance: number;
  totalContributions: number;
  totalWithdrawals: number;
  monthlyTrend: Array<{
    month: string;
    contributions: number;
    withdrawals: number;
    balance: number;
  }>;
  utilizationRate: number;
  averageWithdrawalAmount: number;
  coverage: {
    targetAmount: number;
    currentPercentage: number;
    coverageRatio: number;
  };
}

// Refund analytics interface
export interface RefundAnalytics {
  totalRefunds: number;
  totalRefundAmount: number;
  refundsByStatus: Record<RefundStatus, number>;
  refundsByReason: Record<RefundReason, number>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  averageProcessingTime: number;
  approvalRate: number;
  topRefundReasons: Array<{
    reason: RefundReason;
    count: number;
    percentage: number;
  }>;
}