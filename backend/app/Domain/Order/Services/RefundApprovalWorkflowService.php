<?php

namespace App\Domain\Order\Services;

use App\Infrastructure\Persistence\Eloquent\Models\{
    RefundRequest,
    RefundApproval,
    User
};
use App\Domain\Order\ValueObjects\RefundCalculation;
use App\Domain\Order\Events\{
    RefundRequestCreated,
    RefundApprovalGranted,
    RefundApprovalRejected,
    RefundRequestCompleted
};
use Illuminate\Support\Facades\{DB, Event, Log};
use Carbon\Carbon;

/**
 * Multi-level Refund Approval Workflow Service
 * 
 * Handles the complete approval workflow for refund requests including:
 * - Approval level determination based on business rules
 * - Automatic approver assignment
 * - Workflow progression logic
 * - Status transitions
 * - Notification triggers
 */
class RefundApprovalWorkflowService
{
    /**
     * Approval levels configuration
     */
    private const APPROVAL_LEVELS = [
        1 => 'finance_review',
        2 => 'manager_approval', 
        3 => 'executive_approval'
    ];

    /**
     * Business rules for approval requirements
     */
    private const APPROVAL_RULES = [
        // High-value refunds require executive approval
        'high_value_threshold' => 5000000, // 5M IDR
        
        // Critical impact requires executive approval  
        'critical_impact_threshold' => 2000000, // 2M IDR company loss
        
        // Company fault always needs manager approval
        'company_fault_manager_approval' => true,
        
        // Quality issues above 80% need manager approval
        'quality_issue_threshold' => 80,
        
        // Vendor failure above certain amount needs executive approval
        'vendor_failure_executive_threshold' => 10000000 // 10M IDR
    ];

    /**
     * Initialize workflow for a new refund request.
     */
    public static function initializeWorkflow(RefundRequest $refundRequest): void
    {
        DB::transaction(function () use ($refundRequest) {
            $calculation = RefundCalculation::fromArray($refundRequest->calculation);
            $requiredLevels = static::determineRequiredApprovalLevels($calculation, $refundRequest);
            
            // Set initial status and approver
            $initialStatus = static::getInitialStatus($requiredLevels);
            $initialApprover = static::getInitialApprover($refundRequest->tenant_id, $requiredLevels[0] ?? 1);
            
            $refundRequest->update([
                'status' => $initialStatus,
                'current_approver_id' => $initialApprover?->id
            ]);

            // Log workflow initialization
            Log::info('Refund approval workflow initialized', [
                'refund_request_id' => $refundRequest->id,
                'required_levels' => $requiredLevels,
                'initial_approver' => $initialApprover?->id,
                'calculation_summary' => $calculation->getApprovalSummary()
            ]);

            // Dispatch workflow started event
            Event::dispatch(new RefundRequestCreated($refundRequest, $calculation));
        });
    }

    /**
     * Process approval decision and advance workflow.
     */
    public static function processApproval(
        RefundRequest $refundRequest, 
        User $approver, 
        array $approvalData
    ): RefundApproval {
        return DB::transaction(function () use ($refundRequest, $approver, $approvalData) {
            // Create approval record
            $approval = RefundApproval::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => $refundRequest->tenant_id,
                'refund_request_id' => $refundRequest->id,
                'approver_id' => $approver->id,
                'approval_level' => $approvalData['approval_level'],
                'decision' => $approvalData['decision'],
                'decision_notes' => $approvalData['decision_notes'] ?? null,
                'reviewed_calculation' => $approvalData['reviewed_calculation'] ?? null,
                'adjusted_amount' => $approvalData['adjusted_amount'] ?? null,
                'decided_at' => now()
            ]);

            // Process decision
            match($approvalData['decision']) {
                'approved' => static::processApprovalGranted($refundRequest, $approval),
                'rejected' => static::processApprovalRejected($refundRequest, $approval),
                'needs_info' => static::processNeedsMoreInfo($refundRequest, $approval),
                default => throw new \InvalidArgumentException("Invalid approval decision: {$approvalData['decision']}")
            };

            return $approval;
        });
    }

    /**
     * Handle approved decision.
     */
    private static function processApprovalGranted(RefundRequest $refundRequest, RefundApproval $approval): void
    {
        $calculation = RefundCalculation::fromArray($refundRequest->calculation);
        $requiredLevels = static::determineRequiredApprovalLevels($calculation, $refundRequest);
        $currentLevel = $approval->approval_level;

        // Check if this is the final approval level
        if ($currentLevel >= max($requiredLevels)) {
            // Workflow complete - final approval
            $refundRequest->update([
                'status' => 'approved',
                'approved_at' => now(),
                'current_approver_id' => null
            ]);

            Event::dispatch(new RefundRequestCompleted($refundRequest, $approval));
            
            Log::info('Refund request fully approved', [
                'refund_request_id' => $refundRequest->id,
                'final_approver' => $approval->approver_id,
                'approval_level' => $currentLevel
            ]);
        } else {
            // Move to next approval level
            $nextLevel = static::getNextApprovalLevel($requiredLevels, $currentLevel);
            $nextApprover = static::getApproverForLevel($refundRequest->tenant_id, $nextLevel);
            $nextStatus = static::getStatusForLevel($nextLevel);

            $refundRequest->update([
                'status' => $nextStatus,
                'current_approver_id' => $nextApprover?->id
            ]);

            Event::dispatch(new RefundApprovalGranted($refundRequest, $approval, $nextLevel));
            
            Log::info('Refund approval granted, moving to next level', [
                'refund_request_id' => $refundRequest->id,
                'current_level' => $currentLevel,
                'next_level' => $nextLevel,
                'next_approver' => $nextApprover?->id
            ]);
        }
    }

    /**
     * Handle rejected decision.
     */
    private static function processApprovalRejected(RefundRequest $refundRequest, RefundApproval $approval): void
    {
        $refundRequest->update([
            'status' => 'rejected',
            'current_approver_id' => null
        ]);

        Event::dispatch(new RefundApprovalRejected($refundRequest, $approval));
        
        Log::info('Refund request rejected', [
            'refund_request_id' => $refundRequest->id,
            'rejected_by' => $approval->approver_id,
            'approval_level' => $approval->approval_level,
            'reason' => $approval->decision_notes
        ]);
    }

    /**
     * Handle needs more information decision.
     */
    private static function processNeedsMoreInfo(RefundRequest $refundRequest, RefundApproval $approval): void
    {
        $refundRequest->update([
            'status' => 'needs_information',
            'current_approver_id' => null // Customer needs to provide more info
        ]);

        // TODO: Send notification to customer
        
        Log::info('Refund request needs more information', [
            'refund_request_id' => $refundRequest->id,
            'requested_by' => $approval->approver_id,
            'info_needed' => $approval->decision_notes
        ]);
    }

    /**
     * Determine required approval levels based on business rules.
     */
    public static function determineRequiredApprovalLevels(
        RefundCalculation $calculation, 
        RefundRequest $refundRequest
    ): array {
        $levels = [1]; // Finance review is always required

        // Check for manager approval requirements
        if (static::requiresManagerApproval($calculation, $refundRequest)) {
            $levels[] = 2;
        }

        // Check for executive approval requirements
        if (static::requiresExecutiveApproval($calculation, $refundRequest)) {
            $levels[] = 3;
        }

        return $levels;
    }

    /**
     * Check if manager approval is required.
     */
    private static function requiresManagerApproval(RefundCalculation $calculation, RefundRequest $refundRequest): bool
    {
        // Company fault always requires manager approval
        if ($calculation->faultParty === 'company') {
            return true;
        }

        // High company impact requires manager approval
        if ($calculation->getNetCompanyImpact() > 1000000) {
            return true;
        }

        // High quality issue percentage requires manager approval
        if ($refundRequest->refund_reason === 'quality_issue' && 
            $calculation->qualityIssuePercentage >= static::APPROVAL_RULES['quality_issue_threshold']) {
            return true;
        }

        // High refund amount requires manager approval
        if ($calculation->refundableToCustomer > 3000000) {
            return true;
        }

        return false;
    }

    /**
     * Check if executive approval is required.
     */
    private static function requiresExecutiveApproval(RefundCalculation $calculation, RefundRequest $refundRequest): bool
    {
        // Very high value refunds require executive approval
        if ($calculation->refundableToCustomer > static::APPROVAL_RULES['high_value_threshold']) {
            return true;
        }

        // Critical company impact requires executive approval
        if ($calculation->getNetCompanyImpact() > static::APPROVAL_RULES['critical_impact_threshold']) {
            return true;
        }

        // Large vendor failures require executive approval
        if ($refundRequest->refund_reason === 'vendor_failure' && 
            $calculation->vendorRecoverable > static::APPROVAL_RULES['vendor_failure_executive_threshold']) {
            return true;
        }

        return false;
    }

    /**
     * Get initial workflow status based on required levels.
     */
    private static function getInitialStatus(array $requiredLevels): string
    {
        return match($requiredLevels[0]) {
            1 => 'pending_finance',
            2 => 'pending_manager',
            3 => 'pending_executive',
            default => 'pending_review'
        };
    }

    /**
     * Get status for approval level.
     */
    private static function getStatusForLevel(int $level): string
    {
        return match($level) {
            1 => 'pending_finance',
            2 => 'pending_manager',
            3 => 'pending_executive',
            default => 'pending_review'
        };
    }

    /**
     * Get next approval level in sequence.
     */
    private static function getNextApprovalLevel(array $requiredLevels, int $currentLevel): int
    {
        $currentIndex = array_search($currentLevel, $requiredLevels);
        
        if ($currentIndex === false || $currentIndex >= count($requiredLevels) - 1) {
            throw new \InvalidArgumentException("No next approval level available");
        }
        
        return $requiredLevels[$currentIndex + 1];
    }

    /**
     * Get initial approver based on first required level.
     */
    private static function getInitialApprover(string $tenantId, int $level): ?User
    {
        return static::getApproverForLevel($tenantId, $level);
    }

    /**
     * Get appropriate approver for specific level.
     */
    private static function getApproverForLevel(string $tenantId, int $level): ?User
    {
        // TODO: Implement role-based approver selection
        // For now, return any user from tenant (to be improved with RBAC)
        return User::where('tenant_id', $tenantId)
                   ->where('status', 'active')
                   ->first();
    }

    /**
     * Get workflow status for refund request.
     */
    public static function getWorkflowStatus(RefundRequest $refundRequest): array
    {
        $calculation = RefundCalculation::fromArray($refundRequest->calculation);
        $requiredLevels = static::determineRequiredApprovalLevels($calculation, $refundRequest);
        $completedApprovals = $refundRequest->approvals()->approved()->get();
        
        $workflow = [];
        foreach ($requiredLevels as $level) {
            $approval = $completedApprovals->firstWhere('approval_level', $level);
            
            $workflow[] = [
                'level' => $level,
                'level_name' => static::APPROVAL_LEVELS[$level] ?? 'unknown',
                'required' => true,
                'completed' => !is_null($approval),
                'approver' => $approval?->approver?->name,
                'decided_at' => $approval?->decided_at?->toISOString(),
                'decision' => $approval?->decision,
                'notes' => $approval?->decision_notes
            ];
        }

        return [
            'current_status' => $refundRequest->status,
            'current_approver' => $refundRequest->currentApprover?->name,
            'completion_percentage' => (count($completedApprovals) / count($requiredLevels)) * 100,
            'workflow_steps' => $workflow,
            'next_action' => static::getNextActionDescription($refundRequest, $requiredLevels, $completedApprovals)
        ];
    }

    /**
     * Get description of next required action.
     */
    private static function getNextActionDescription(
        RefundRequest $refundRequest, 
        array $requiredLevels, 
        $completedApprovals
    ): string {
        if ($refundRequest->status === 'approved') {
            return 'Approved - Ready for processing';
        }
        
        if ($refundRequest->status === 'rejected') {
            return 'Rejected - No further action required';
        }
        
        if ($refundRequest->status === 'needs_information') {
            return 'Waiting for customer to provide additional information';
        }
        
        $nextLevel = null;
        foreach ($requiredLevels as $level) {
            if (!$completedApprovals->contains('approval_level', $level)) {
                $nextLevel = $level;
                break;
            }
        }
        
        if ($nextLevel) {
            $levelName = static::APPROVAL_LEVELS[$nextLevel] ?? 'unknown';
            $approverName = $refundRequest->currentApprover?->name ?? 'Unknown';
            return "Waiting for {$levelName} approval from {$approverName}";
        }
        
        return 'Workflow in progress';
    }

    /**
     * Check if user can approve refund request.
     */
    public static function canUserApprove(RefundRequest $refundRequest, User $user): bool
    {
        // User must be the current approver
        if ($refundRequest->current_approver_id !== $user->id) {
            return false;
        }

        // Request must be in pending status
        if (!in_array($refundRequest->status, ['pending_finance', 'pending_manager', 'pending_executive'])) {
            return false;
        }

        // User must be from same tenant
        if ($refundRequest->tenant_id !== $user->tenant_id) {
            return false;
        }

        return true;
    }

    /**
     * Get approval statistics for dashboard.
     */
    public static function getApprovalStatistics(string $tenantId, ?Carbon $fromDate = null, ?Carbon $toDate = null): array
    {
        $fromDate = $fromDate ?? now()->startOfMonth();
        $toDate = $toDate ?? now()->endOfMonth();

        $baseQuery = RefundRequest::where('tenant_id', $tenantId)
                                 ->whereBetween('created_at', [$fromDate, $toDate]);

        return [
            'total_requests' => $baseQuery->count(),
            'pending_requests' => $baseQuery->where('status', 'like', 'pending_%')->count(),
            'approved_requests' => $baseQuery->where('status', 'approved')->count(),
            'rejected_requests' => $baseQuery->where('status', 'rejected')->count(),
            'average_approval_time_hours' => static::getAverageApprovalTime($tenantId, $fromDate, $toDate),
            'approval_rate_percentage' => static::getApprovalRate($tenantId, $fromDate, $toDate),
            'by_approval_level' => static::getApprovalsByLevel($tenantId, $fromDate, $toDate),
            'bottleneck_level' => static::identifyBottleneckLevel($tenantId, $fromDate, $toDate)
        ];
    }

    /**
     * Calculate average approval time.
     */
    private static function getAverageApprovalTime(string $tenantId, Carbon $fromDate, Carbon $toDate): float
    {
        $completedRequests = RefundRequest::where('tenant_id', $tenantId)
                                         ->whereNotNull('approved_at')
                                         ->whereBetween('created_at', [$fromDate, $toDate])
                                         ->get();

        if ($completedRequests->isEmpty()) {
            return 0;
        }

        $totalHours = $completedRequests->sum(function ($request) {
            return $request->requested_at->diffInHours($request->approved_at);
        });

        return round($totalHours / $completedRequests->count(), 2);
    }

    /**
     * Calculate approval rate percentage.
     */
    private static function getApprovalRate(string $tenantId, Carbon $fromDate, Carbon $toDate): float
    {
        $totalDecided = RefundRequest::where('tenant_id', $tenantId)
                                   ->whereIn('status', ['approved', 'rejected'])
                                   ->whereBetween('created_at', [$fromDate, $toDate])
                                   ->count();

        if ($totalDecided === 0) {
            return 0;
        }

        $approved = RefundRequest::where('tenant_id', $tenantId)
                                ->where('status', 'approved')
                                ->whereBetween('created_at', [$fromDate, $toDate])
                                ->count();

        return round(($approved / $totalDecided) * 100, 2);
    }

    /**
     * Get approvals breakdown by level.
     */
    private static function getApprovalsByLevel(string $tenantId, Carbon $fromDate, Carbon $toDate): array
    {
        $approvals = RefundApproval::join('refund_requests', 'refund_approvals.refund_request_id', '=', 'refund_requests.id')
                                  ->where('refund_requests.tenant_id', $tenantId)
                                  ->whereBetween('refund_approvals.decided_at', [$fromDate, $toDate])
                                  ->selectRaw('approval_level, decision, COUNT(*) as count')
                                  ->groupBy(['approval_level', 'decision'])
                                  ->get();

        $result = [];
        foreach (static::APPROVAL_LEVELS as $level => $levelName) {
            $levelApprovals = $approvals->where('approval_level', $level);
            $result[] = [
                'level' => $level,
                'level_name' => $levelName,
                'approved' => $levelApprovals->where('decision', 'approved')->sum('count'),
                'rejected' => $levelApprovals->where('decision', 'rejected')->sum('count'),
                'needs_info' => $levelApprovals->where('decision', 'needs_info')->sum('count')
            ];
        }

        return $result;
    }

    /**
     * Identify workflow bottleneck level.
     */
    private static function identifyBottleneckLevel(string $tenantId, Carbon $fromDate, Carbon $toDate): ?array
    {
        $pendingRequests = RefundRequest::where('tenant_id', $tenantId)
                                       ->where('status', 'like', 'pending_%')
                                       ->whereBetween('created_at', [$fromDate, $toDate])
                                       ->get();

        $bottlenecks = [];
        foreach ($pendingRequests as $request) {
            $status = $request->status;
            $waitingDays = $request->requested_at->diffInDays(now());
            
            if (!isset($bottlenecks[$status])) {
                $bottlenecks[$status] = ['count' => 0, 'avg_waiting_days' => 0, 'total_days' => 0];
            }
            
            $bottlenecks[$status]['count']++;
            $bottlenecks[$status]['total_days'] += $waitingDays;
        }

        foreach ($bottlenecks as $status => &$data) {
            $data['avg_waiting_days'] = round($data['total_days'] / $data['count'], 1);
        }

        if (empty($bottlenecks)) {
            return null;
        }

        // Find status with highest average waiting days
        $maxWaitingStatus = array_keys($bottlenecks, max($bottlenecks))[0];

        return [
            'status' => $maxWaitingStatus,
            'count' => $bottlenecks[$maxWaitingStatus]['count'],
            'avg_waiting_days' => $bottlenecks[$maxWaitingStatus]['avg_waiting_days']
        ];
    }
}