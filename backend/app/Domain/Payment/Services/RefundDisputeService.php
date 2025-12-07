<?php

namespace App\Domain\Payment\Services;

use App\Infrastructure\Persistence\Eloquent\Models\RefundDispute;
use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Domain\Payment\Events\RefundDisputeCreated;
use App\Domain\Payment\Events\RefundDisputeResolved;
use App\Domain\Payment\Events\RefundDisputeEscalated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

/**
 * RefundDisputeService
 * 
 * Manages dispute resolution workflow for refund requests
 * Provides mediation support and escalation procedures
 */
class RefundDisputeService
{
    public function __construct(
        private RefundNotificationService $notificationService
    ) {}

    /**
     * Create a new dispute for a refund request
     */
    public function createDispute(
        PaymentRefund $refund,
        string $disputeReason,
        string $customerClaim,
        array $customerEvidence = []
    ): RefundDispute {
        return DB::transaction(function () use ($refund, $disputeReason, $customerClaim, $customerEvidence) {
            
            // Check if dispute already exists for this refund
            $existingDispute = RefundDispute::where('refund_request_id', $refund->id)
                ->where('status', '!=', RefundDispute::STATUS_RESOLVED)
                ->first();

            if ($existingDispute) {
                throw new \InvalidArgumentException('Active dispute already exists for this refund request');
            }

            // Create dispute record
            $dispute = RefundDispute::create([
                'refund_request_id' => $refund->id,
                'tenant_id' => $refund->tenant_id,
                'dispute_reason' => $disputeReason,
                'customer_claim' => $customerClaim,
                'evidence_customer' => $customerEvidence,
                'status' => RefundDispute::STATUS_OPEN,
            ]);

            // Update refund status to disputed
            $refund->update(['status' => 'disputed']);

            // Fire event for notifications
            event(new RefundDisputeCreated($dispute, $refund));

            Log::info('Refund dispute created', [
                'dispute_id' => $dispute->id,
                'refund_id' => $refund->id,
                'tenant_id' => $refund->tenant_id,
                'dispute_reason' => $disputeReason,
            ]);

            return $dispute;
        });
    }

    /**
     * Add company response to dispute
     */
    public function addCompanyResponse(
        RefundDispute $dispute,
        string $response,
        array $evidence = [],
        User $respondedBy = null
    ): RefundDispute {
        return DB::transaction(function () use ($dispute, $response, $evidence, $respondedBy) {
            
            $dispute->addCompanyResponse($response, $evidence);

            Log::info('Company response added to dispute', [
                'dispute_id' => $dispute->id,
                'refund_id' => $dispute->refund_request_id,
                'responded_by' => $respondedBy ? $respondedBy->id : 'system',
            ]);

            // Notify customer about company response
            $this->notificationService->sendDisputeResponseNotification($dispute);

            return $dispute->fresh();
        });
    }

    /**
     * Resolve dispute with final decision
     */
    public function resolveDispute(
        RefundDispute $dispute,
        float $finalRefundAmount,
        string $resolutionNotes,
        User $resolvedBy
    ): RefundDispute {
        return DB::transaction(function () use ($dispute, $finalRefundAmount, $resolutionNotes, $resolvedBy) {
            
            // Mark dispute as resolved
            $dispute->markAsResolved($finalRefundAmount, $resolutionNotes);

            // Update refund request with final amount
            $refund = $dispute->refundRequest;
            $refund->update([
                'refund_amount' => $finalRefundAmount,
                'status' => 'approved', // Ready for processing
            ]);

            // Fire resolution event
            event(new RefundDisputeResolved($dispute, $refund, $resolvedBy));

            Log::info('Dispute resolved', [
                'dispute_id' => $dispute->id,
                'refund_id' => $dispute->refund_request_id,
                'final_amount' => $finalRefundAmount,
                'resolved_by' => $resolvedBy->id,
            ]);

            return $dispute->fresh();
        });
    }

    /**
     * Escalate dispute to external mediation
     */
    public function escalateToMediation(
        RefundDispute $dispute,
        string $mediatorContact,
        float $mediationCost,
        User $escalatedBy
    ): RefundDispute {
        return DB::transaction(function () use ($dispute, $mediatorContact, $mediationCost, $escalatedBy) {
            
            $dispute->escalateToMediation($mediatorContact, $mediationCost);

            // Fire escalation event
            event(new RefundDisputeEscalated($dispute, $escalatedBy));

            Log::info('Dispute escalated to mediation', [
                'dispute_id' => $dispute->id,
                'refund_id' => $dispute->refund_request_id,
                'mediator_contact' => $mediatorContact,
                'mediation_cost' => $mediationCost,
                'escalated_by' => $escalatedBy->id,
            ]);

            return $dispute->fresh();
        });
    }

    /**
     * Get disputes requiring attention (overdue or high priority)
     */
    public function getDisputesRequiringAttention(int $tenantId): Collection
    {
        return RefundDispute::where('tenant_id', $tenantId)
            ->whereIn('status', [
                RefundDispute::STATUS_OPEN,
                RefundDispute::STATUS_UNDER_REVIEW,
                RefundDispute::STATUS_MEDIATION
            ])
            ->with(['refundRequest'])
            ->get()
            ->filter(function (RefundDispute $dispute) {
                return $dispute->isOverdue() || $dispute->getPriority() === 'high';
            })
            ->sortBy(function (RefundDispute $dispute) {
                // Sort by priority and age
                $priority = match ($dispute->getPriority()) {
                    'high' => 1,
                    'medium' => 2,
                    'low' => 3,
                };
                return [$priority, $dispute->created_at->timestamp];
            });
    }

    /**
     * Get dispute statistics for dashboard
     */
    public function getDisputeStatistics(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        $totalDisputes = RefundDispute::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->count();

        $resolvedDisputes = RefundDispute::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->where('status', RefundDispute::STATUS_RESOLVED)
            ->count();

        $activeDisputes = RefundDispute::where('tenant_id', $tenantId)
            ->whereIn('status', [
                RefundDispute::STATUS_OPEN,
                RefundDispute::STATUS_UNDER_REVIEW,
                RefundDispute::STATUS_MEDIATION
            ])
            ->count();

        $overdueDisputes = RefundDispute::where('tenant_id', $tenantId)
            ->whereIn('status', [
                RefundDispute::STATUS_OPEN,
                RefundDispute::STATUS_UNDER_REVIEW
            ])
            ->with(['refundRequest'])
            ->get()
            ->filter(function (RefundDispute $dispute) {
                return $dispute->isOverdue();
            })
            ->count();

        $avgResolutionDays = RefundDispute::where('tenant_id', $tenantId)
            ->where('status', RefundDispute::STATUS_RESOLVED)
            ->where('created_at', '>=', $fromDate)
            ->whereNotNull('resolved_at')
            ->get()
            ->average(function (RefundDispute $dispute) {
                return $dispute->created_at->diffInDays($dispute->resolved_at);
            }) ?: 0;

        $resolutionRate = $totalDisputes > 0 ? ($resolvedDisputes / $totalDisputes) * 100 : 0;

        return [
            'total_disputes' => $totalDisputes,
            'resolved_disputes' => $resolvedDisputes,
            'active_disputes' => $activeDisputes,
            'overdue_disputes' => $overdueDisputes,
            'avg_resolution_days' => round($avgResolutionDays, 1),
            'resolution_rate' => round($resolutionRate, 1),
            'period_days' => $days,
        ];
    }

    /**
     * Get disputes by reason for analytics
     */
    public function getDisputesByReason(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        return RefundDispute::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->selectRaw('dispute_reason, COUNT(*) as count')
            ->groupBy('dispute_reason')
            ->orderByDesc('count')
            ->pluck('count', 'dispute_reason')
            ->toArray();
    }

    /**
     * Auto-escalate disputes based on business rules
     */
    public function autoEscalateOverdueDisputes(): int
    {
        $overdueDisputes = RefundDispute::whereIn('status', [
                RefundDispute::STATUS_OPEN,
                RefundDispute::STATUS_UNDER_REVIEW
            ])
            ->with(['refundRequest'])
            ->get()
            ->filter(function (RefundDispute $dispute) {
                return $dispute->isOverdue() && 
                       $dispute->created_at->diffInDays(now()) > 10; // 10 days overdue
            });

        $escalatedCount = 0;

        foreach ($overdueDisputes as $dispute) {
            try {
                $dispute->update(['status' => RefundDispute::STATUS_ESCALATED]);
                
                // Notify management about escalation
                $this->notificationService->sendDisputeEscalationNotification($dispute);
                
                $escalatedCount++;
                
                Log::info('Auto-escalated overdue dispute', [
                    'dispute_id' => $dispute->id,
                    'days_overdue' => $dispute->created_at->diffInDays(now()),
                ]);
                
            } catch (\Exception $e) {
                Log::error('Failed to auto-escalate dispute', [
                    'dispute_id' => $dispute->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $escalatedCount;
    }

    /**
     * Get recommended resolution based on dispute analysis
     */
    public function getRecommendedResolution(RefundDispute $dispute): array
    {
        $refund = $dispute->refundRequest;
        
        if (!$refund) {
            return [
                'recommended_action' => 'investigate_further',
                'confidence' => 0,
                'reasoning' => 'Unable to access refund request data',
            ];
        }

        $recommendation = match ($dispute->dispute_reason) {
            RefundDispute::REASON_CALCULATION_ERROR => [
                'recommended_action' => 'recalculate_refund',
                'confidence' => 90,
                'reasoning' => 'Mathematical errors should be corrected immediately',
            ],
            RefundDispute::REASON_REFUND_AMOUNT => [
                'recommended_action' => 'partial_adjustment',
                'confidence' => 70,
                'reasoning' => 'Consider negotiated settlement between disputed amounts',
            ],
            RefundDispute::REASON_EVIDENCE_DISPUTE => [
                'recommended_action' => 'evidence_review',
                'confidence' => 60,
                'reasoning' => 'Requires thorough evidence evaluation by qualified assessor',
            ],
            RefundDispute::REASON_SERVICE_QUALITY => [
                'recommended_action' => 'quality_investigation',
                'confidence' => 80,
                'reasoning' => 'Service quality issues require comprehensive review',
            ],
            default => [
                'recommended_action' => 'mediation',
                'confidence' => 50,
                'reasoning' => 'Complex dispute may benefit from neutral mediation',
            ],
        };

        // Adjust confidence based on refund amount
        if ($refund->refund_amount > 2000000) {
            $recommendation['confidence'] = max($recommendation['confidence'] - 20, 30);
        }

        return $recommendation;
    }
}