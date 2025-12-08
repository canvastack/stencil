<?php

namespace App\Domain\Order\Services;

use App\Infrastructure\Persistence\Eloquent\Models\InsuranceFundTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Insurance Fund Service for PT Custom Etching Xenial
 * 
 * Manages the insurance fund that protects the company from financial losses
 * due to quality issues, vendor failures, and other business risks.
 * 
 * Business Rules:
 * - 2-3% contribution from each order goes to insurance fund
 * - Fund covers quality issues and vendor failures
 * - Automatic contribution on order completion
 * - Withdrawal requires refund request approval
 */
class InsuranceFundService
{
    /**
     * Default contribution rate (2.5% of order value).
     */
    private const DEFAULT_CONTRIBUTION_RATE = 0.025;

    /**
     * Minimum fund balance threshold (in IDR).
     */
    private const MINIMUM_BALANCE_THRESHOLD = 5000000; // 5M IDR

    /**
     * Get current insurance fund balance for a tenant.
     */
    public static function getBalance(string $tenantId): float
    {
        try {
            \Log::info('InsuranceFundService::getBalance called for tenant: ' . $tenantId);
            
            $latestTransaction = InsuranceFundTransaction::where('tenant_id', $tenantId)
                ->orderBy('created_at', 'desc')
                ->first();

            \Log::info('Latest transaction found: ' . ($latestTransaction ? $latestTransaction->id : 'none'));
            
            $balance = $latestTransaction ? floatval($latestTransaction->balance_after) : 0.0;
            \Log::info('Returning balance: ' . $balance);
            
            return $balance;
        } catch (\Exception $e) {
            \Log::error('InsuranceFundService::getBalance error: ' . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Get contribution rate for a tenant (can be customized per tenant).
     */
    public static function getContributionRate(string $tenantId): float
    {
        // TODO: Implement tenant-specific rates from TenantConfig
        // For now, return default rate
        return self::DEFAULT_CONTRIBUTION_RATE;
    }

    /**
     * Contribute to insurance fund from an order.
     */
    public static function contributeFromOrder(Order $order): InsuranceFundTransaction
    {
        $contributionRate = self::getContributionRate($order->tenant_id);
        $amount = $order->total_amount * $contributionRate;
        
        return self::addTransaction([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'refund_request_id' => null,
            'transaction_type' => 'contribution',
            'amount' => $amount,
            'description' => "Insurance fund contribution from order {$order->order_number} ({$contributionRate}%)"
        ]);
    }

    /**
     * Withdraw from insurance fund for a refund.
     */
    public static function withdrawForRefund(RefundRequest $refundRequest, float $amount, string $reason = null): InsuranceFundTransaction
    {
        $currentBalance = self::getBalance($refundRequest->tenant_id);
        
        if ($amount > $currentBalance) {
            throw new \InvalidArgumentException(
                "Insufficient insurance fund balance. Requested: {$amount}, Available: {$currentBalance}"
            );
        }

        $description = $reason ?? "Insurance fund withdrawal for refund {$refundRequest->request_number}";

        return self::addTransaction([
            'tenant_id' => $refundRequest->tenant_id,
            'order_id' => null,
            'refund_request_id' => $refundRequest->id,
            'transaction_type' => 'withdrawal',
            'amount' => $amount,
            'description' => $description
        ]);
    }

    /**
     * Add a transaction to the insurance fund.
     */
    private static function addTransaction(array $data): InsuranceFundTransaction
    {
        return DB::transaction(function () use ($data) {
            $currentBalance = self::getBalance($data['tenant_id']);
            
            // Calculate new balance
            $balanceBefore = $currentBalance;
            $balanceAfter = match($data['transaction_type']) {
                'contribution' => $currentBalance + $data['amount'],
                'withdrawal' => $currentBalance - $data['amount'],
                default => throw new \InvalidArgumentException("Invalid transaction type: {$data['transaction_type']}")
            };

            // Create transaction record (UUID generated automatically in model boot method)
            $transaction = InsuranceFundTransaction::create([
                'tenant_id' => $data['tenant_id'],
                'order_id' => $data['order_id'],
                'refund_request_id' => $data['refund_request_id'],
                'transaction_type' => $data['transaction_type'],
                'amount' => $data['amount'],
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => $data['description'],
                'created_at' => now()
            ]);

            // Log the transaction for audit trail
            Log::info('Insurance fund transaction recorded', [
                'transaction_id' => $transaction->id,
                'tenant_id' => $data['tenant_id'],
                'type' => $data['transaction_type'],
                'amount' => $data['amount'],
                'balance_after' => $balanceAfter
            ]);

            // Check if balance is below threshold and alert
            if ($balanceAfter < self::MINIMUM_BALANCE_THRESHOLD) {
                self::alertLowBalance($data['tenant_id'], $balanceAfter);
            }

            return $transaction;
        });
    }

    /**
     * Get insurance fund statistics for a tenant.
     */
    public static function getStatistics(string $tenantId, Carbon $startDate = null, Carbon $endDate = null): array
    {
        try {
            \Log::info('InsuranceFundService::getStatistics called for tenant: ' . $tenantId);
            
            $startDate = $startDate ?? Carbon::now()->subYear();
            $endDate = $endDate ?? Carbon::now();

            $transactions = InsuranceFundTransaction::where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            \Log::info('Found ' . $transactions->count() . ' transactions for statistics');

            $contributions = $transactions->where('transaction_type', 'contribution');
            $withdrawals = $transactions->where('transaction_type', 'withdrawal');

            $result = [
                'current_balance' => self::getBalance($tenantId),
                'total_contributions' => $contributions->sum('amount'),
                'total_withdrawals' => $withdrawals->sum('amount'),
                'net_change' => $contributions->sum('amount') - $withdrawals->sum('amount'),
                'transaction_count' => $transactions->count(),
                'contribution_count' => $contributions->count(),
                'withdrawal_count' => $withdrawals->count(),
                'average_contribution' => $contributions->avg('amount') ?? 0,
                'largest_withdrawal' => $withdrawals->max('amount') ?? 0,
                'contribution_rate' => self::getContributionRate($tenantId),
                'period_start' => $startDate,
                'period_end' => $endDate
            ];
            
            \Log::info('Statistics result: ' . json_encode($result));
            return $result;
        } catch (\Exception $e) {
            \Log::error('InsuranceFundService::getStatistics error: ' . $e->getMessage());
            return [
                'current_balance' => 0,
                'total_contributions' => 0,
                'total_withdrawals' => 0,
                'net_change' => 0,
                'transaction_count' => 0,
                'contribution_count' => 0,
                'withdrawal_count' => 0,
                'average_contribution' => 0,
                'largest_withdrawal' => 0,
                'contribution_rate' => 0,
                'period_start' => Carbon::now()->subYear(),
                'period_end' => Carbon::now()
            ];
        }
    }

    /**
     * Get recent transactions for a tenant.
     */
    public static function getRecentTransactions(string $tenantId, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->with(['order', 'refundRequest'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Check if withdrawal amount is available.
     */
    public static function canWithdraw(string $tenantId, float $amount): bool
    {
        $currentBalance = self::getBalance($tenantId);
        return $amount <= $currentBalance;
    }

    /**
     * Get monthly contribution trend for analytics.
     */
    public static function getMonthlyTrend(string $tenantId, int $months = 12): array
    {
        $startDate = Carbon::now()->subMonths($months)->startOfMonth();
        
        $transactions = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $startDate)
            ->orderBy('created_at')
            ->get();

        $monthlyData = [];
        $currentDate = $startDate->copy();
        
        while ($currentDate <= Carbon::now()) {
            $monthKey = $currentDate->format('Y-m');
            $monthTransactions = $transactions->filter(function ($transaction) use ($currentDate) {
                return Carbon::parse($transaction->created_at)->format('Y-m') === $currentDate->format('Y-m');
            });

            $monthlyData[] = [
                'month' => $monthKey,
                'month_name' => $currentDate->format('M Y'),
                'contributions' => $monthTransactions->where('transaction_type', 'contribution')->sum('amount'),
                'withdrawals' => $monthTransactions->where('transaction_type', 'withdrawal')->sum('amount'),
                'net_change' => $monthTransactions->where('transaction_type', 'contribution')->sum('amount') - 
                               $monthTransactions->where('transaction_type', 'withdrawal')->sum('amount'),
                'transaction_count' => $monthTransactions->count()
            ];

            $currentDate->addMonth();
        }

        return $monthlyData;
    }

    /**
     * Simulate future balance based on projected orders and refunds.
     */
    public static function projectFutureBalance(string $tenantId, array $projections): array
    {
        $currentBalance = self::getBalance($tenantId);
        $contributionRate = self::getContributionRate($tenantId);
        
        $projectedBalance = $currentBalance;
        $results = [];

        foreach ($projections as $projection) {
            $expectedContributions = ($projection['expected_orders'] ?? 0) * 
                                   ($projection['average_order_value'] ?? 0) * 
                                   $contributionRate;
            
            $expectedWithdrawals = $projection['expected_refund_amount'] ?? 0;
            
            $projectedBalance += $expectedContributions - $expectedWithdrawals;
            
            $results[] = [
                'period' => $projection['period'],
                'starting_balance' => $currentBalance,
                'expected_contributions' => $expectedContributions,
                'expected_withdrawals' => $expectedWithdrawals,
                'projected_balance' => $projectedBalance,
                'risk_level' => $projectedBalance < self::MINIMUM_BALANCE_THRESHOLD ? 'high' : 'normal'
            ];
            
            $currentBalance = $projectedBalance;
        }

        return $results;
    }

    /**
     * Alert when insurance fund balance is low.
     */
    private static function alertLowBalance(string $tenantId, float $currentBalance): void
    {
        Log::warning('Insurance fund balance below threshold', [
            'tenant_id' => $tenantId,
            'current_balance' => $currentBalance,
            'threshold' => self::MINIMUM_BALANCE_THRESHOLD
        ]);

        // TODO: Send notification to finance team
        // This could trigger email/Slack notifications
    }

    /**
     * Get fund health assessment.
     */
    public static function getHealthAssessment(string $tenantId): array
    {
        $balance = self::getBalance($tenantId);
        $stats = self::getStatistics($tenantId, Carbon::now()->subMonths(6));
        
        // Calculate burn rate (average monthly withdrawals)
        $monthlyWithdrawals = $stats['total_withdrawals'] / 6;
        $monthsUntilDepletion = $monthlyWithdrawals > 0 ? $balance / $monthlyWithdrawals : null;
        
        // Determine health status
        $healthStatus = 'healthy';
        if ($balance < self::MINIMUM_BALANCE_THRESHOLD) {
            $healthStatus = 'critical';
        } elseif ($monthsUntilDepletion && $monthsUntilDepletion < 6) {
            $healthStatus = 'warning';
        } elseif ($monthsUntilDepletion && $monthsUntilDepletion < 12) {
            $healthStatus = 'caution';
        }

        return [
            'health_status' => $healthStatus,
            'current_balance' => $balance,
            'monthly_burn_rate' => $monthlyWithdrawals,
            'months_until_depletion' => $monthsUntilDepletion,
            'contribution_vs_withdrawal_ratio' => $stats['total_withdrawals'] > 0 ? 
                $stats['total_contributions'] / $stats['total_withdrawals'] : null,
            'recommendations' => self::getRecommendations($healthStatus, $stats)
        ];
    }

    /**
     * Get recommendations based on fund health.
     */
    private static function getRecommendations(string $healthStatus, array $stats): array
    {
        $recommendations = [];

        switch ($healthStatus) {
            case 'critical':
                $recommendations[] = 'Immediate action required: Fund balance below minimum threshold';
                $recommendations[] = 'Consider increasing contribution rate temporarily';
                $recommendations[] = 'Review recent withdrawals for any unusual patterns';
                break;
                
            case 'warning':
                $recommendations[] = 'Monitor fund closely - depletion risk within 6 months';
                $recommendations[] = 'Consider adjusting contribution rate';
                $recommendations[] = 'Review refund policies to reduce unnecessary withdrawals';
                break;
                
            case 'caution':
                $recommendations[] = 'Fund is stable but trending downward';
                $recommendations[] = 'Consider optimizing vendor quality to reduce quality-related refunds';
                break;
                
            case 'healthy':
                $recommendations[] = 'Fund is in good health';
                if ($stats['total_contributions'] > $stats['total_withdrawals'] * 2) {
                    $recommendations[] = 'Consider reducing contribution rate to optimize cash flow';
                }
                break;
        }

        return $recommendations;
    }
}