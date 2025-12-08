<?php

namespace App\Domain\Payment\Services;

use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\RefundDispute;
use App\Infrastructure\Persistence\Eloquent\Models\VendorLiability;
use App\Infrastructure\Persistence\Eloquent\Models\InsuranceFundTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

/**
 * RefundAnalyticsService
 * 
 * Provides comprehensive analytics and insights for refund management
 * Generates reports for business intelligence and decision making
 */
class RefundAnalyticsService
{
    /**
     * Get comprehensive refund dashboard data
     */
    public function getDashboardData(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        return [
            'overview' => $this->getRefundOverview($tenantId, $days),
            'trends' => $this->getRefundTrends($tenantId, $days),
            'financial_impact' => $this->getFinancialImpact($tenantId, $days),
            'vendor_analysis' => $this->getVendorAnalysis($tenantId, $days),
            'dispute_summary' => $this->getDisputeSummary($tenantId, $days),
            'insurance_fund' => $this->getInsuranceFundStatus($tenantId),
            'performance_metrics' => $this->getPerformanceMetrics($tenantId, $days),
        ];
    }

    /**
     * Get refund overview statistics
     */
    public function getRefundOverview(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        $refunds = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->get();

        $totalRefunds = $refunds->count();
        $totalAmount = $refunds->sum('refund_amount');
        $avgRefundAmount = $totalRefunds > 0 ? $totalAmount / $totalRefunds : 0;

        $statusBreakdown = $refunds->groupBy('status')->map->count();
        $reasonBreakdown = $refunds->groupBy('refund_reason')->map->count();
        $methodBreakdown = $refunds->groupBy('refund_method')->map->count();

        $pendingRefunds = $refunds->whereIn('status', [
            'pending_review', 'under_investigation', 'pending_finance', 'pending_manager'
        ])->count();

        $completedRefunds = $refunds->where('status', 'completed')->count();
        $rejectedRefunds = $refunds->where('status', 'rejected')->count();

        $completionRate = $totalRefunds > 0 ? ($completedRefunds / $totalRefunds) * 100 : 0;

        return [
            'total_refunds' => $totalRefunds,
            'total_amount' => $totalAmount,
            'avg_refund_amount' => round($avgRefundAmount, 2),
            'pending_refunds' => $pendingRefunds,
            'completed_refunds' => $completedRefunds,
            'rejected_refunds' => $rejectedRefunds,
            'completion_rate' => round($completionRate, 2),
            'status_breakdown' => $statusBreakdown->toArray(),
            'reason_breakdown' => $reasonBreakdown->toArray(),
            'method_breakdown' => $methodBreakdown->toArray(),
        ];
    }

    /**
     * Get refund trends over time
     */
    public function getRefundTrends(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        // Daily refund volume and amount
        $dailyTrends = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(refund_amount) as amount')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => $item->count,
                    'amount' => $item->amount,
                ];
            });

        // Weekly comparison
        $thisWeek = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->startOfWeek())
            ->count();

        $lastWeek = PaymentRefund::where('tenant_id', $tenantId)
            ->whereBetween('created_at', [
                now()->subWeek()->startOfWeek(),
                now()->subWeek()->endOfWeek()
            ])
            ->count();

        $weeklyChange = $lastWeek > 0 ? (($thisWeek - $lastWeek) / $lastWeek) * 100 : 0;

        // Monthly comparison
        $thisMonth = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $lastMonth = PaymentRefund::where('tenant_id', $tenantId)
            ->whereBetween('created_at', [
                now()->subMonth()->startOfMonth(),
                now()->subMonth()->endOfMonth()
            ])
            ->count();

        $monthlyChange = $lastMonth > 0 ? (($thisMonth - $lastMonth) / $lastMonth) * 100 : 0;

        return [
            'daily_trends' => $dailyTrends,
            'weekly_change' => round($weeklyChange, 2),
            'monthly_change' => round($monthlyChange, 2),
        ];
    }

    /**
     * Get financial impact analysis
     */
    public function getFinancialImpact(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        $refunds = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->get();

        $totalRefunded = $refunds->where('status', 'completed')->sum('refund_amount');
        $pendingRefunds = $refunds->whereIn('status', [
            'pending_review', 'under_investigation', 'pending_finance', 'pending_manager', 'approved', 'processing'
        ])->sum('refund_amount');

        // Company loss analysis
        $totalLoss = $refunds->sum(function ($refund) {
            // Simplified loss calculation - in reality would use RefundCalculation
            return $refund->refund_amount * 0.1; // Assume 10% average loss
        });

        // Vendor recoverable amounts
        $vendorRecoverable = VendorLiability::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->sum('liability_amount');

        $vendorRecovered = VendorLiability::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->sum('recovered_amount');

        // Insurance fund impact
        $insuranceUsed = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->where('transaction_type', 'withdrawal')
            ->where('created_at', '>=', $fromDate)
            ->sum('amount');

        $insuranceContributed = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->where('transaction_type', 'contribution')
            ->where('created_at', '>=', $fromDate)
            ->sum('amount');

        return [
            'total_refunded' => $totalRefunded,
            'pending_refunds_amount' => $pendingRefunds,
            'estimated_total_loss' => $totalLoss,
            'vendor_recoverable' => $vendorRecoverable,
            'vendor_recovered' => $vendorRecovered,
            'vendor_recovery_rate' => $vendorRecoverable > 0 ? 
                ($vendorRecovered / $vendorRecoverable) * 100 : 0,
            'insurance_fund_used' => $insuranceUsed,
            'insurance_fund_contributed' => $insuranceContributed,
            'net_insurance_impact' => $insuranceContributed - $insuranceUsed,
        ];
    }

    /**
     * Get vendor-related analysis
     */
    public function getVendorAnalysis(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        // Refunds by vendor
        $refundsByVendor = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->join('orders', 'payment_refunds.order_id', '=', 'orders.id')
            ->join('vendors', 'orders.vendor_id', '=', 'vendors.id')
            ->selectRaw('vendors.id, vendors.name, COUNT(*) as refund_count, SUM(payment_refunds.refund_amount) as total_refund_amount')
            ->groupBy('vendors.id', 'vendors.name')
            ->orderByDesc('total_refund_amount')
            ->limit(10)
            ->get();

        // Vendor liability summary
        $liabilityByVendor = VendorLiability::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->join('vendors', 'vendor_liabilities.vendor_id', '=', 'vendors.id')
            ->selectRaw('vendors.id, vendors.name, COUNT(*) as liability_count, SUM(liability_amount) as total_liability, SUM(recovered_amount) as total_recovered')
            ->groupBy('vendors.id', 'vendors.name')
            ->orderByDesc('total_liability')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $recoveryRate = $item->total_liability > 0 ? 
                    ($item->total_recovered / $item->total_liability) * 100 : 0;
                
                return [
                    'vendor_id' => $item->id,
                    'vendor_name' => $item->name,
                    'liability_count' => $item->liability_count,
                    'total_liability' => $item->total_liability,
                    'total_recovered' => $item->total_recovered,
                    'recovery_rate' => round($recoveryRate, 2),
                ];
            });

        return [
            'refunds_by_vendor' => $refundsByVendor,
            'liability_by_vendor' => $liabilityByVendor,
        ];
    }

    /**
     * Get dispute analysis summary
     */
    public function getDisputeSummary(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        $disputes = RefundDispute::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->get();

        $totalDisputes = $disputes->count();
        $activeDisputes = $disputes->whereIn('status', [
            RefundDispute::STATUS_OPEN,
            RefundDispute::STATUS_UNDER_REVIEW,
            RefundDispute::STATUS_MEDIATION
        ])->count();

        $resolvedDisputes = $disputes->where('status', RefundDispute::STATUS_RESOLVED)->count();
        $escalatedDisputes = $disputes->where('status', RefundDispute::STATUS_ESCALATED)->count();

        $avgResolutionDays = $disputes
            ->where('status', RefundDispute::STATUS_RESOLVED)
            ->filter(function ($dispute) {
                return $dispute->resolved_at;
            })
            ->average(function ($dispute) {
                return $dispute->created_at->diffInDays($dispute->resolved_at);
            }) ?: 0;

        $disputesByReason = $disputes->groupBy('dispute_reason')->map->count();

        return [
            'total_disputes' => $totalDisputes,
            'active_disputes' => $activeDisputes,
            'resolved_disputes' => $resolvedDisputes,
            'escalated_disputes' => $escalatedDisputes,
            'resolution_rate' => $totalDisputes > 0 ? ($resolvedDisputes / $totalDisputes) * 100 : 0,
            'avg_resolution_days' => round($avgResolutionDays, 1),
            'disputes_by_reason' => $disputesByReason->toArray(),
        ];
    }

    /**
     * Get insurance fund status
     */
    public function getInsuranceFundStatus(int $tenantId): array
    {
        $currentBalance = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->value('balance_after') ?: 0;

        $totalContributions = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->where('transaction_type', 'contribution')
            ->sum('amount');

        $totalWithdrawals = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->where('transaction_type', 'withdrawal')
            ->sum('amount');

        // Get recent transactions
        $recentTransactions = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->transaction_type,
                    'amount' => $transaction->amount,
                    'description' => $transaction->description,
                    'balance_after' => $transaction->balance_after,
                    'created_at' => $transaction->created_at,
                ];
            });

        $utilizationRate = $totalContributions > 0 ? ($totalWithdrawals / $totalContributions) * 100 : 0;

        return [
            'current_balance' => $currentBalance,
            'total_contributions' => $totalContributions,
            'total_withdrawals' => $totalWithdrawals,
            'utilization_rate' => round($utilizationRate, 2),
            'recent_transactions' => $recentTransactions,
        ];
    }

    /**
     * Get performance metrics
     */
    public function getPerformanceMetrics(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        // Average processing time
        $completedRefunds = PaymentRefund::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $fromDate)
            ->whereNotNull('processed_at')
            ->get();

        $avgProcessingDays = $completedRefunds->average(function ($refund) {
            return $refund->created_at->diffInDays($refund->processed_at);
        }) ?: 0;

        // SLA compliance
        $slaTarget = 7; // 7 days SLA
        $slaCompliantRefunds = $completedRefunds->filter(function ($refund) use ($slaTarget) {
            return $refund->created_at->diffInDays($refund->processed_at) <= $slaTarget;
        })->count();

        $slaComplianceRate = $completedRefunds->count() > 0 ? 
            ($slaCompliantRefunds / $completedRefunds->count()) * 100 : 0;

        // Customer satisfaction (simulated - would be from surveys)
        $satisfactionScore = 4.2; // Out of 5

        // First-time resolution rate
        $totalRefunds = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->count();

        $disputedRefunds = RefundDispute::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->count();

        $firstTimeResolutionRate = $totalRefunds > 0 ? 
            (($totalRefunds - $disputedRefunds) / $totalRefunds) * 100 : 0;

        return [
            'avg_processing_days' => round($avgProcessingDays, 1),
            'sla_compliance_rate' => round($slaComplianceRate, 2),
            'customer_satisfaction_score' => $satisfactionScore,
            'first_time_resolution_rate' => round($firstTimeResolutionRate, 2),
        ];
    }

    /**
     * Generate predictive insights
     */
    public function getPredictiveInsights(int $tenantId): array
    {
        // Get historical data for predictions
        $monthlyData = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subMonths(12))
            ->selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count, SUM(refund_amount) as amount')
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->orderByRaw('year, month')
            ->get();

        // Simple trend analysis
        $recentMonths = $monthlyData->takeLast(3);
        $avgMonthlyRefunds = $recentMonths->avg('count');
        $avgMonthlyAmount = $recentMonths->avg('amount');

        // Trend direction
        $trend = 'stable';
        if ($recentMonths->count() >= 2) {
            $firstMonth = $recentMonths->first();
            $lastMonth = $recentMonths->last();
            
            if ($lastMonth->count > $firstMonth->count * 1.1) {
                $trend = 'increasing';
            } elseif ($lastMonth->count < $firstMonth->count * 0.9) {
                $trend = 'decreasing';
            }
        }

        // Risk indicators
        $riskIndicators = [];
        
        // High refund rate indicator
        $recentRefundRate = $this->calculateRefundRate($tenantId, 30);
        if ($recentRefundRate > 10) { // More than 10% refund rate
            $riskIndicators[] = [
                'type' => 'high_refund_rate',
                'severity' => 'medium',
                'message' => "Refund rate is {$recentRefundRate}%, consider reviewing processes",
            ];
        }

        // Insurance fund depletion risk
        $fundBalance = $this->getInsuranceFundStatus($tenantId)['current_balance'];
        $avgMonthlyUsage = $avgMonthlyAmount * 0.1; // Assume 10% company loss
        
        if ($fundBalance < $avgMonthlyUsage * 2) {
            $riskIndicators[] = [
                'type' => 'low_insurance_fund',
                'severity' => 'high',
                'message' => 'Insurance fund may be insufficient for upcoming refunds',
            ];
        }

        return [
            'trend_direction' => $trend,
            'predicted_monthly_refunds' => round($avgMonthlyRefunds),
            'predicted_monthly_amount' => round($avgMonthlyAmount),
            'risk_indicators' => $riskIndicators,
            'recommendations' => $this->generateRecommendations($tenantId, $riskIndicators),
        ];
    }

    /**
     * Calculate refund rate
     */
    private function calculateRefundRate(int $tenantId, int $days = 30): float
    {
        $fromDate = now()->subDays($days);

        // This would ideally use order data, but simplified for now
        $refundCount = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->count();

        // Assume 100 orders per refund as baseline
        $estimatedOrders = $refundCount * 100;
        
        return $estimatedOrders > 0 ? ($refundCount / $estimatedOrders) * 100 : 0;
    }

    /**
     * Generate actionable recommendations
     */
    private function generateRecommendations(int $tenantId, array $riskIndicators): array
    {
        $recommendations = [];

        foreach ($riskIndicators as $indicator) {
            switch ($indicator['type']) {
                case 'high_refund_rate':
                    $recommendations[] = [
                        'title' => 'Review Quality Control',
                        'description' => 'Consider implementing stricter quality control measures to reduce refund requests',
                        'priority' => 'medium',
                        'category' => 'process_improvement',
                    ];
                    break;
                    
                case 'low_insurance_fund':
                    $recommendations[] = [
                        'title' => 'Increase Insurance Fund Contributions',
                        'description' => 'Consider increasing the insurance fund contribution rate from each order',
                        'priority' => 'high',
                        'category' => 'financial',
                    ];
                    break;
            }
        }

        // Add general recommendations
        $recommendations[] = [
            'title' => 'Vendor Performance Review',
            'description' => 'Regularly review vendor performance and liability trends to identify improvement opportunities',
            'priority' => 'low',
            'category' => 'vendor_management',
        ];

        return $recommendations;
    }

    /**
     * Get insurance fund analytics with historical data
     */
    public function getInsuranceFundAnalytics(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        // Get daily balance changes
        $dailyBalances = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->orderBy('created_at')
            ->get()
            ->groupBy(fn($t) => $t->created_at->format('Y-m-d'))
            ->map(function ($dayTransactions) {
                $lastTransaction = $dayTransactions->last();
                return [
                    'date' => $lastTransaction->created_at->format('Y-m-d'),
                    'balance' => $lastTransaction->balance_after,
                    'contributions' => $dayTransactions->where('transaction_type', 'contribution')->sum('amount'),
                    'withdrawals' => $dayTransactions->where('transaction_type', 'withdrawal')->sum('amount'),
                ];
            })->values();

        // Get transaction type breakdown
        $transactionsByType = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->selectRaw('transaction_type, COUNT(*) as count, SUM(amount) as total_amount')
            ->groupBy('transaction_type')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->transaction_type => [
                    'count' => $item->count,
                    'total_amount' => $item->total_amount,
                ]];
            });

        // Calculate trends
        $currentPeriodBalance = $dailyBalances->last()['balance'] ?? 0;
        $previousPeriodBalance = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->where('created_at', '<', $fromDate)
            ->orderBy('created_at', 'desc')
            ->value('balance_after') ?: 0;

        $balanceChange = $currentPeriodBalance - $previousPeriodBalance;
        $balanceChangePercent = $previousPeriodBalance > 0 ? 
            ($balanceChange / $previousPeriodBalance) * 100 : 0;

        return [
            'period_days' => $days,
            'current_balance' => $currentPeriodBalance,
            'balance_change' => $balanceChange,
            'balance_change_percent' => round($balanceChangePercent, 2),
            'daily_balances' => $dailyBalances,
            'transactions_by_type' => $transactionsByType,
            'period_summary' => [
                'total_contributions' => $transactionsByType['contribution']['total_amount'] ?? 0,
                'total_withdrawals' => $transactionsByType['withdrawal']['total_amount'] ?? 0,
                'transaction_count' => array_sum(array_column($transactionsByType->toArray(), 'count')),
            ],
        ];
    }
}