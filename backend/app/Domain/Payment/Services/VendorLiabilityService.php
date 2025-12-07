<?php

namespace App\Domain\Payment\Services;

use App\Infrastructure\Persistence\Eloquent\Models\VendorLiability;
use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Domain\Payment\Events\VendorLiabilityCreated;
use App\Domain\Payment\Events\VendorClaimFiled;
use App\Domain\Payment\Events\VendorRecoveryCompleted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

/**
 * VendorLiabilityService
 * 
 * Manages vendor liability tracking and recovery workflow
 * Handles claim filing, recovery tracking, and vendor performance analysis
 */
class VendorLiabilityService
{
    public function __construct(
        private RefundNotificationService $notificationService
    ) {}

    /**
     * Create vendor liability from refund request
     */
    public function createLiabilityFromRefund(
        PaymentRefund $refund,
        string $reason,
        float $liabilityAmount = null,
        User $createdBy = null
    ): VendorLiability {
        return DB::transaction(function () use ($refund, $reason, $liabilityAmount, $createdBy) {
            
            $order = $refund->order;
            if (!$order || !$order->vendor_id) {
                throw new \InvalidArgumentException('Order must have a vendor assigned');
            }

            // Default to refund amount if not specified
            $liabilityAmount = $liabilityAmount ?? $refund->refund_amount;

            // Check for existing liability for this refund
            $existingLiability = VendorLiability::where('refund_request_id', $refund->id)->first();
            if ($existingLiability) {
                throw new \InvalidArgumentException('Liability already exists for this refund request');
            }

            $liability = VendorLiability::create([
                'tenant_id' => $refund->tenant_id,
                'vendor_id' => $order->vendor_id,
                'order_id' => $order->id,
                'refund_request_id' => $refund->id,
                'liability_amount' => $liabilityAmount,
                'reason' => $reason,
                'status' => VendorLiability::STATUS_PENDING_CLAIM,
            ]);

            // Fire event for notifications
            event(new VendorLiabilityCreated($liability, $refund, $createdBy));

            Log::info('Vendor liability created', [
                'liability_id' => $liability->id,
                'vendor_id' => $order->vendor_id,
                'refund_id' => $refund->id,
                'liability_amount' => $liabilityAmount,
                'reason' => $reason,
                'created_by' => $createdBy ? $createdBy->id : 'system',
            ]);

            return $liability;
        });
    }

    /**
     * Create standalone vendor liability (not from refund)
     */
    public function createStandaloneLiability(
        int $tenantId,
        int $vendorId,
        int $orderId,
        float $liabilityAmount,
        string $reason,
        User $createdBy
    ): VendorLiability {
        return DB::transaction(function () use ($tenantId, $vendorId, $orderId, $liabilityAmount, $reason, $createdBy) {
            
            $liability = VendorLiability::create([
                'tenant_id' => $tenantId,
                'vendor_id' => $vendorId,
                'order_id' => $orderId,
                'liability_amount' => $liabilityAmount,
                'reason' => $reason,
                'status' => VendorLiability::STATUS_PENDING_CLAIM,
            ]);

            // Fire event for notifications
            event(new VendorLiabilityCreated($liability, null, $createdBy));

            Log::info('Standalone vendor liability created', [
                'liability_id' => $liability->id,
                'vendor_id' => $vendorId,
                'order_id' => $orderId,
                'liability_amount' => $liabilityAmount,
                'reason' => $reason,
                'created_by' => $createdBy->id,
            ]);

            return $liability;
        });
    }

    /**
     * File claim with vendor
     */
    public function fileClaim(
        VendorLiability $liability,
        string $claimNotes,
        User $filedBy
    ): VendorLiability {
        return DB::transaction(function () use ($liability, $claimNotes, $filedBy) {
            
            if ($liability->isClaimed()) {
                throw new \InvalidArgumentException('Claim has already been filed for this liability');
            }

            $liability->fileClaim($claimNotes);

            // Fire event for notifications
            event(new VendorClaimFiled($liability, $claimNotes, $filedBy));

            Log::info('Vendor claim filed', [
                'liability_id' => $liability->id,
                'vendor_id' => $liability->vendor_id,
                'liability_amount' => $liability->liability_amount,
                'filed_by' => $filedBy->id,
            ]);

            return $liability->fresh();
        });
    }

    /**
     * Record recovery payment from vendor
     */
    public function recordRecovery(
        VendorLiability $liability,
        float $recoveredAmount,
        string $recoveryNotes,
        User $recordedBy
    ): VendorLiability {
        return DB::transaction(function () use ($liability, $recoveredAmount, $recoveryNotes, $recordedBy) {
            
            if ($recoveredAmount <= 0) {
                throw new \InvalidArgumentException('Recovery amount must be greater than zero');
            }

            if ($recoveredAmount > $liability->liability_amount) {
                throw new \InvalidArgumentException('Recovery amount cannot exceed liability amount');
            }

            $liability->recordRecovery($recoveredAmount, $recoveryNotes);

            // Fire event for notifications
            event(new VendorRecoveryCompleted($liability, $recoveredAmount, $recordedBy));

            Log::info('Vendor recovery recorded', [
                'liability_id' => $liability->id,
                'vendor_id' => $liability->vendor_id,
                'recovered_amount' => $recoveredAmount,
                'recovery_rate' => $liability->getRecoveryRate(),
                'recorded_by' => $recordedBy->id,
            ]);

            return $liability->fresh();
        });
    }

    /**
     * Mark liability as disputed by vendor
     */
    public function markAsDisputed(
        VendorLiability $liability,
        string $disputeNotes,
        User $reportedBy
    ): VendorLiability {
        return DB::transaction(function () use ($liability, $disputeNotes, $reportedBy) {
            
            $liability->markAsDisputed($disputeNotes);

            Log::info('Vendor liability disputed', [
                'liability_id' => $liability->id,
                'vendor_id' => $liability->vendor_id,
                'dispute_notes' => $disputeNotes,
                'reported_by' => $reportedBy->id,
            ]);

            return $liability->fresh();
        });
    }

    /**
     * Write off uncollectable liability
     */
    public function writeOffLiability(
        VendorLiability $liability,
        string $writeOffReason,
        User $authorizedBy
    ): VendorLiability {
        return DB::transaction(function () use ($liability, $writeOffReason, $authorizedBy) {
            
            $liability->writeOff($writeOffReason);

            Log::info('Vendor liability written off', [
                'liability_id' => $liability->id,
                'vendor_id' => $liability->vendor_id,
                'liability_amount' => $liability->liability_amount,
                'write_off_reason' => $writeOffReason,
                'authorized_by' => $authorizedBy->id,
            ]);

            return $liability->fresh();
        });
    }

    /**
     * Get liabilities requiring attention
     */
    public function getLiabilitiesRequiringAttention(int $tenantId): Collection
    {
        return VendorLiability::where('tenant_id', $tenantId)
            ->whereIn('status', [
                VendorLiability::STATUS_PENDING_CLAIM,
                VendorLiability::STATUS_CLAIMED,
                VendorLiability::STATUS_DISPUTED,
                VendorLiability::STATUS_PARTIAL_RECOVERY
            ])
            ->with(['vendor', 'order'])
            ->get()
            ->filter(function (VendorLiability $liability) {
                return $liability->isOverdue() || $liability->getPriority() === 'high';
            })
            ->sortBy(function (VendorLiability $liability) {
                // Sort by priority and age
                $priority = match ($liability->getPriority()) {
                    'high' => 1,
                    'medium' => 2,
                    'low' => 3,
                };
                return [$priority, $liability->created_at->timestamp];
            });
    }

    /**
     * Get vendor performance analysis
     */
    public function getVendorPerformanceAnalysis(int $tenantId, int $vendorId, int $days = 365): array
    {
        $fromDate = now()->subDays($days);

        $liabilities = VendorLiability::where('tenant_id', $tenantId)
            ->where('vendor_id', $vendorId)
            ->where('created_at', '>=', $fromDate)
            ->get();

        $totalLiabilities = $liabilities->count();
        $totalLiabilityAmount = $liabilities->sum('liability_amount');
        $totalRecoveredAmount = $liabilities->sum('recovered_amount');
        $totalWrittenOff = $liabilities->where('status', VendorLiability::STATUS_WRITTEN_OFF)->count();

        $liabilitiesByReason = $liabilities->groupBy('reason')->map->count()->toArray();
        $avgDaysToRecover = $liabilities
            ->where('status', VendorLiability::STATUS_RECOVERED)
            ->filter(function ($liability) {
                return $liability->claim_date && $liability->recovery_date;
            })
            ->average(function ($liability) {
                return $liability->claim_date->diffInDays($liability->recovery_date);
            }) ?: 0;

        $recoveryRate = $totalLiabilityAmount > 0 ? 
            ($totalRecoveredAmount / $totalLiabilityAmount) * 100 : 0;

        return [
            'vendor_id' => $vendorId,
            'analysis_period_days' => $days,
            'total_liabilities' => $totalLiabilities,
            'total_liability_amount' => $totalLiabilityAmount,
            'total_recovered_amount' => $totalRecoveredAmount,
            'recovery_rate_percentage' => round($recoveryRate, 2),
            'total_written_off' => $totalWrittenOff,
            'avg_days_to_recover' => round($avgDaysToRecover, 1),
            'liabilities_by_reason' => $liabilitiesByReason,
            'risk_score' => $this->calculateVendorRiskScore($liabilities),
        ];
    }

    /**
     * Get liability statistics for tenant
     */
    public function getLiabilityStatistics(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        $liabilities = VendorLiability::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->get();

        $activeLiabilities = VendorLiability::where('tenant_id', $tenantId)
            ->whereIn('status', [
                VendorLiability::STATUS_PENDING_CLAIM,
                VendorLiability::STATUS_CLAIMED,
                VendorLiability::STATUS_DISPUTED,
                VendorLiability::STATUS_PARTIAL_RECOVERY
            ])
            ->count();

        $totalAmount = $liabilities->sum('liability_amount');
        $recoveredAmount = $liabilities->sum('recovered_amount');
        $pendingAmount = $liabilities
            ->whereIn('status', [
                VendorLiability::STATUS_PENDING_CLAIM,
                VendorLiability::STATUS_CLAIMED,
                VendorLiability::STATUS_DISPUTED
            ])
            ->sum('liability_amount');

        $overdueLiabilities = VendorLiability::where('tenant_id', $tenantId)
            ->whereIn('status', [
                VendorLiability::STATUS_PENDING_CLAIM,
                VendorLiability::STATUS_CLAIMED
            ])
            ->get()
            ->filter(function (VendorLiability $liability) {
                return $liability->isOverdue();
            })
            ->count();

        $recoveryRate = $totalAmount > 0 ? ($recoveredAmount / $totalAmount) * 100 : 0;

        return [
            'period_days' => $days,
            'total_liabilities' => $liabilities->count(),
            'active_liabilities' => $activeLiabilities,
            'overdue_liabilities' => $overdueLiabilities,
            'total_amount' => $totalAmount,
            'recovered_amount' => $recoveredAmount,
            'pending_amount' => $pendingAmount,
            'recovery_rate_percentage' => round($recoveryRate, 2),
        ];
    }

    /**
     * Auto-process overdue liabilities
     */
    public function autoProcessOverdueLiabilities(): array
    {
        $overdueForClaim = VendorLiability::where('status', VendorLiability::STATUS_PENDING_CLAIM)
            ->get()
            ->filter(function (VendorLiability $liability) {
                return $liability->isOverdue();
            });

        $overdueForFollowUp = VendorLiability::where('status', VendorLiability::STATUS_CLAIMED)
            ->get()
            ->filter(function (VendorLiability $liability) {
                return $liability->getDaysSinceClaim() > 45; // 45 days for follow-up
            });

        $results = [
            'claims_flagged' => $overdueForClaim->count(),
            'follow_ups_flagged' => $overdueForFollowUp->count(),
            'notifications_sent' => 0,
        ];

        // Send notifications for overdue items
        foreach ($overdueForClaim as $liability) {
            try {
                $this->notificationService->sendLiabilityClaimOverdueNotification($liability);
                $results['notifications_sent']++;
            } catch (\Exception $e) {
                Log::error('Failed to send liability notification', [
                    'liability_id' => $liability->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Calculate vendor risk score based on liability history
     */
    private function calculateVendorRiskScore(Collection $liabilities): float
    {
        if ($liabilities->isEmpty()) {
            return 0;
        }

        $totalAmount = $liabilities->sum('liability_amount');
        $recoveredAmount = $liabilities->sum('recovered_amount');
        $liabilityCount = $liabilities->count();
        $writtenOffCount = $liabilities->where('status', VendorLiability::STATUS_WRITTEN_OFF)->count();
        
        // Base score from recovery rate (0-40 points)
        $recoveryRate = $totalAmount > 0 ? ($recoveredAmount / $totalAmount) : 1;
        $recoveryScore = (1 - $recoveryRate) * 40;
        
        // Frequency score (0-30 points)
        $frequencyScore = min($liabilityCount * 5, 30);
        
        // Written-off penalty (0-30 points)
        $writeOffScore = $writtenOffCount * 10;
        
        $riskScore = $recoveryScore + $frequencyScore + $writeOffScore;
        
        return min($riskScore, 100); // Cap at 100
    }

    /**
     * Get recommended vendors based on liability history
     */
    public function getVendorRecommendations(int $tenantId): array
    {
        $vendors = VendorLiability::where('tenant_id', $tenantId)
            ->selectRaw('vendor_id, COUNT(*) as liability_count, SUM(liability_amount) as total_liability, SUM(recovered_amount) as total_recovered')
            ->groupBy('vendor_id')
            ->havingRaw('COUNT(*) >= 2') // At least 2 liabilities for meaningful analysis
            ->get()
            ->map(function ($record) use ($tenantId) {
                $vendorLiabilities = VendorLiability::where('tenant_id', $tenantId)
                    ->where('vendor_id', $record->vendor_id)
                    ->get();
                
                $riskScore = $this->calculateVendorRiskScore($vendorLiabilities);
                $recoveryRate = $record->total_liability > 0 ? 
                    ($record->total_recovered / $record->total_liability) * 100 : 100;
                
                return [
                    'vendor_id' => $record->vendor_id,
                    'risk_score' => $riskScore,
                    'recovery_rate' => $recoveryRate,
                    'liability_count' => $record->liability_count,
                    'total_liability' => $record->total_liability,
                ];
            })
            ->sortBy('risk_score');

        $lowRisk = $vendors->where('risk_score', '<', 25)->take(5);
        $highRisk = $vendors->where('risk_score', '>', 70)->take(5);

        return [
            'recommended_vendors' => $lowRisk->values()->toArray(),
            'high_risk_vendors' => $highRisk->values()->toArray(),
        ];
    }
}