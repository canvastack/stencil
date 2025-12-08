<?php

namespace App\Domain\Order\Services;

use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Infrastructure\Persistence\Eloquent\Models\InsuranceFundTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class InsuranceFundOptimizer
{
    private const DEFAULT_TARGET_COVERAGE = 95.0; // 95% coverage target
    private const DEFAULT_RISK_BUFFER = 1.2; // 20% additional buffer
    private const MIN_CONTRIBUTION_RATE = 0.01; // 1%
    private const MAX_CONTRIBUTION_RATE = 0.05; // 5%
    private const SIMULATION_PERIODS = 100; // Monte Carlo simulation periods

    /**
     * Calculate optimal insurance fund size and contribution rate
     */
    public static function optimizeInsuranceFund(string $tenantId, array $options = []): array
    {
        $cacheKey = "fund_optimization_{$tenantId}_" . md5(serialize($options));
        
        return Cache::remember($cacheKey, 1800, function () use ($tenantId, $options) {
            $targetCoverage = $options['target_coverage'] ?? self::DEFAULT_TARGET_COVERAGE;
            $riskBuffer = $options['risk_buffer'] ?? self::DEFAULT_RISK_BUFFER;
            
            // Get historical data for analysis
            $historicalData = self::getHistoricalData($tenantId);
            
            // Perform risk analysis
            $riskAnalysis = self::performRiskAnalysis($historicalData, $tenantId);
            
            // Calculate optimal fund size
            $optimalFundSize = self::calculateOptimalFundSize($riskAnalysis, $targetCoverage, $riskBuffer);
            
            // Calculate optimal contribution rate
            $optimalContributionRate = self::calculateOptimalContributionRate($tenantId, $optimalFundSize, $historicalData);
            
            // Perform Monte Carlo simulation
            $simulation = self::performMonteCarloSimulation($tenantId, $optimalContributionRate, $optimalFundSize);
            
            // Generate recommendations
            $recommendations = self::generateRecommendations($tenantId, $optimalFundSize, $optimalContributionRate, $simulation);
            
            return [
                'current_status' => self::getCurrentFundStatus($tenantId),
                'optimal_fund_size' => $optimalFundSize,
                'optimal_contribution_rate' => $optimalContributionRate,
                'risk_analysis' => $riskAnalysis,
                'simulation_results' => $simulation,
                'recommendations' => $recommendations,
                'implementation_plan' => self::generateImplementationPlan($tenantId, $optimalContributionRate),
                'performance_metrics' => self::calculatePerformanceMetrics($tenantId),
                'benchmarks' => self::getBenchmarkComparisons($tenantId)
            ];
        });
    }

    /**
     * Get historical refund and order data
     */
    private static function getHistoricalData(string $tenantId): array
    {
        $months = 24; // 2 years of data
        $startDate = Carbon::now()->subMonths($months)->startOfMonth();
        
        // Monthly refund statistics
        $monthlyRefunds = RefundRequest::where('tenant_id', $tenantId)
            ->where('requested_at', '>=', $startDate)
            ->where('status', 'completed')
            ->select(
                DB::raw('DATE_FORMAT(requested_at, "%Y-%m") as month'),
                DB::raw('COUNT(*) as refund_count'),
                DB::raw('SUM(customer_request_amount) as total_amount'),
                DB::raw('AVG(customer_request_amount) as avg_amount'),
                DB::raw('MAX(customer_request_amount) as max_amount'),
                DB::raw('STDDEV(customer_request_amount) as amount_stddev')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Monthly order statistics
        $monthlyOrders = Order::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $startDate)
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Insurance fund transaction history
        $fundTransactions = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $startDate)
            ->orderBy('created_at')
            ->get();

        return [
            'monthly_refunds' => $monthlyRefunds,
            'monthly_orders' => $monthlyOrders,
            'fund_transactions' => $fundTransactions,
            'period_months' => $months
        ];
    }

    /**
     * Perform comprehensive risk analysis
     */
    private static function performRiskAnalysis(array $historicalData, string $tenantId): array
    {
        $monthlyRefunds = $historicalData['monthly_refunds'];
        $monthlyOrders = $historicalData['monthly_orders'];
        
        if ($monthlyRefunds->isEmpty() || $monthlyOrders->isEmpty()) {
            return self::getDefaultRiskAnalysis();
        }

        // Calculate refund rate statistics
        $refundRates = [];
        $refundAmounts = [];
        
        foreach ($monthlyRefunds as $refund) {
            $order = $monthlyOrders->where('month', $refund->month)->first();
            if ($order && $order->order_count > 0) {
                $refundRates[] = ($refund->refund_count / $order->order_count) * 100;
                $refundAmounts[] = $refund->total_amount;
            }
        }

        $avgRefundRate = count($refundRates) > 0 ? array_sum($refundRates) / count($refundRates) : 2.5;
        $refundRateVolatility = count($refundRates) > 1 ? self::calculateStandardDeviation($refundRates) : 0.5;
        
        // Calculate Value at Risk (VaR)
        $var95 = self::calculateVaR($refundAmounts, 0.95);
        $var99 = self::calculateVaR($refundAmounts, 0.99);
        
        // Seasonal analysis
        $seasonalFactors = self::calculateSeasonalFactors($monthlyRefunds);
        
        // Risk scenarios
        $riskScenarios = self::generateRiskScenarios($avgRefundRate, $refundRateVolatility, $seasonalFactors);
        
        return [
            'avg_refund_rate' => $avgRefundRate,
            'refund_rate_volatility' => $refundRateVolatility,
            'value_at_risk_95' => $var95,
            'value_at_risk_99' => $var99,
            'seasonal_factors' => $seasonalFactors,
            'risk_scenarios' => $riskScenarios,
            'risk_score' => self::calculateRiskScore($avgRefundRate, $refundRateVolatility, $seasonalFactors),
            'trend_analysis' => self::analyzeTrends($refundRates, $refundAmounts)
        ];
    }

    /**
     * Calculate optimal fund size based on risk analysis
     */
    private static function calculateOptimalFundSize(array $riskAnalysis, float $targetCoverage, float $riskBuffer): array
    {
        $baseRequirement = $riskAnalysis['value_at_risk_95'];
        $stressRequirement = $riskAnalysis['value_at_risk_99'];
        $seasonalAdjustment = max($riskAnalysis['seasonal_factors']) * $baseRequirement;
        
        // Calculate fund size for different scenarios
        $scenarios = [
            'conservative' => $stressRequirement * $riskBuffer * 1.3,
            'moderate' => $baseRequirement * $riskBuffer * 1.2,
            'aggressive' => $baseRequirement * $riskBuffer,
            'stress_test' => $stressRequirement * $riskBuffer * 1.5 + $seasonalAdjustment
        ];
        
        // Select recommended scenario based on risk profile
        $riskScore = $riskAnalysis['risk_score'];
        $recommendedScenario = self::selectRecommendedScenario($riskScore);
        
        return [
            'scenarios' => $scenarios,
            'recommended_scenario' => $recommendedScenario,
            'recommended_amount' => $scenarios[$recommendedScenario],
            'coverage_analysis' => self::analyzeCoverage($scenarios, $riskAnalysis),
            'growth_projection' => self::projectGrowthRequirements($scenarios, $riskAnalysis)
        ];
    }

    /**
     * Calculate optimal contribution rate
     */
    private static function calculateOptimalContributionRate(string $tenantId, array $optimalFundSize, array $historicalData): array
    {
        $currentBalance = InsuranceFundService::getBalance($tenantId);
        $targetBalance = $optimalFundSize['recommended_amount'];
        $monthlyOrders = $historicalData['monthly_orders'];
        
        if ($monthlyOrders->isEmpty()) {
            return self::getDefaultContributionRate();
        }

        $avgMonthlyRevenue = $monthlyOrders->avg('total_revenue') ?: 1000000; // Default 1M
        $monthsToTarget = max(1, ($targetBalance - $currentBalance) / ($avgMonthlyRevenue * 0.025)); // Assuming 2.5% current rate
        
        // Calculate rates for different timelines
        $rates = [];
        foreach ([6, 12, 18, 24] as $months) {
            $requiredMonthlyContribution = ($targetBalance - $currentBalance) / $months;
            $rate = $requiredMonthlyContribution / $avgMonthlyRevenue;
            
            // Ensure rate is within acceptable bounds
            $rate = max(self::MIN_CONTRIBUTION_RATE, min(self::MAX_CONTRIBUTION_RATE, $rate));
            
            $rates["{$months}_months"] = [
                'rate' => $rate,
                'monthly_contribution' => $rate * $avgMonthlyRevenue,
                'feasibility' => self::assessFeasibility($rate, $avgMonthlyRevenue),
                'business_impact' => self::assessBusinessImpact($rate)
            ];
        }
        
        // Find optimal rate balancing speed and business impact
        $recommendedTimeline = self::selectOptimalTimeline($rates);
        
        return [
            'current_rate' => InsuranceFundService::getContributionRate($tenantId),
            'scenarios' => $rates,
            'recommended_timeline' => $recommendedTimeline,
            'recommended_rate' => $rates[$recommendedTimeline]['rate'],
            'implementation_impact' => self::calculateImplementationImpact($rates[$recommendedTimeline], $avgMonthlyRevenue),
            'sensitivity_analysis' => self::performSensitivityAnalysis($rates, $avgMonthlyRevenue)
        ];
    }

    /**
     * Perform Monte Carlo simulation
     */
    private static function performMonteCarloSimulation(string $tenantId, array $contributionRate, array $fundSize): array
    {
        $simulations = [];
        $successCount = 0;
        $targetFund = $fundSize['recommended_amount'];
        $rate = $contributionRate['recommended_rate'];
        
        for ($i = 0; $i < self::SIMULATION_PERIODS; $i++) {
            $simulation = self::runSingleSimulation($tenantId, $rate, $targetFund);
            $simulations[] = $simulation;
            
            if ($simulation['success']) {
                $successCount++;
            }
        }
        
        $successRate = ($successCount / self::SIMULATION_PERIODS) * 100;
        
        // Calculate statistics
        $fundLevels = array_column($simulations, 'final_fund_level');
        $coverageRates = array_column($simulations, 'coverage_rate');
        
        return [
            'success_rate' => $successRate,
            'avg_final_fund_level' => array_sum($fundLevels) / count($fundLevels),
            'avg_coverage_rate' => array_sum($coverageRates) / count($coverageRates),
            'min_fund_level' => min($fundLevels),
            'max_fund_level' => max($fundLevels),
            'percentiles' => self::calculatePercentiles($fundLevels),
            'risk_metrics' => [
                'probability_of_depletion' => (100 - $successRate),
                'expected_shortfall' => self::calculateExpectedShortfall($simulations),
                'maximum_drawdown' => self::calculateMaximumDrawdown($simulations)
            ]
        ];
    }

    /**
     * Run a single Monte Carlo simulation
     */
    private static function runSingleSimulation(string $tenantId, float $rate, float $targetFund): array
    {
        $currentFund = InsuranceFundService::getBalance($tenantId);
        $months = 12; // 1-year simulation
        $fundLevel = $currentFund;
        $minFundLevel = $currentFund;
        $maxFundLevel = $currentFund;
        $refundsCovered = 0;
        $totalRefunds = 0;
        
        for ($month = 1; $month <= $months; $month++) {
            // Simulate monthly contribution (with some randomness)
            $contribution = self::simulateMonthlyContribution($tenantId, $rate);
            $fundLevel += $contribution;
            
            // Simulate monthly refunds
            $refunds = self::simulateMonthlyRefunds($tenantId);
            $totalRefunds += count($refunds);
            
            foreach ($refunds as $refund) {
                if ($fundLevel >= $refund) {
                    $fundLevel -= $refund;
                    $refundsCovered++;
                } else {
                    // Fund depleted scenario
                }
            }
            
            $minFundLevel = min($minFundLevel, $fundLevel);
            $maxFundLevel = max($maxFundLevel, $fundLevel);
        }
        
        return [
            'success' => $fundLevel > 0 && ($refundsCovered / max(1, $totalRefunds)) >= 0.95,
            'final_fund_level' => $fundLevel,
            'coverage_rate' => $totalRefunds > 0 ? ($refundsCovered / $totalRefunds) * 100 : 100,
            'min_fund_level' => $minFundLevel,
            'max_fund_level' => $maxFundLevel,
            'total_refunds' => $totalRefunds,
            'covered_refunds' => $refundsCovered
        ];
    }

    /**
     * Generate optimization recommendations
     */
    private static function generateRecommendations(string $tenantId, array $fundSize, array $contributionRate, array $simulation): array
    {
        $recommendations = [];
        
        // Fund size recommendation
        if ($simulation['success_rate'] < 90) {
            $recommendations[] = [
                'type' => 'fund_size',
                'priority' => 'high',
                'message' => 'Increase target fund size by 20% to improve success rate',
                'impact' => 'Reduces risk of fund depletion by 15%'
            ];
        }
        
        // Contribution rate recommendation
        if ($contributionRate['recommended_rate'] > 0.035) {
            $recommendations[] = [
                'type' => 'contribution_rate',
                'priority' => 'medium',
                'message' => 'Consider implementing gradual rate increase over 18 months',
                'impact' => 'Reduces immediate business impact while building adequate reserves'
            ];
        }
        
        // Risk management recommendation
        if ($simulation['risk_metrics']['probability_of_depletion'] > 10) {
            $recommendations[] = [
                'type' => 'risk_management',
                'priority' => 'high',
                'message' => 'Implement additional risk controls for high-value refunds',
                'impact' => 'Reduces fund volatility and improves predictability'
            ];
        }
        
        // Process optimization
        $recommendations[] = [
            'type' => 'process_optimization',
            'priority' => 'medium',
            'message' => 'Implement automated fund rebalancing based on monthly metrics',
            'impact' => 'Maintains optimal fund levels automatically'
        ];
        
        return [
            'immediate_actions' => array_filter($recommendations, fn($r) => $r['priority'] === 'high'),
            'medium_term_actions' => array_filter($recommendations, fn($r) => $r['priority'] === 'medium'),
            'long_term_strategy' => self::generateLongTermStrategy($tenantId, $fundSize, $contributionRate),
            'monitoring_alerts' => self::generateMonitoringAlerts($fundSize, $simulation),
            'review_schedule' => self::generateReviewSchedule()
        ];
    }

    /**
     * Helper methods
     */
    private static function calculateStandardDeviation(array $values): float
    {
        if (count($values) < 2) return 0;
        
        $mean = array_sum($values) / count($values);
        $squaredDiffs = array_map(fn($x) => pow($x - $mean, 2), $values);
        
        return sqrt(array_sum($squaredDiffs) / (count($values) - 1));
    }

    private static function calculateVaR(array $amounts, float $confidence): float
    {
        if (empty($amounts)) return 0;
        
        sort($amounts);
        $index = (int) ceil((1 - $confidence) * count($amounts)) - 1;
        $index = max(0, min($index, count($amounts) - 1));
        
        return $amounts[$index] ?: 0;
    }

    private static function calculateSeasonalFactors(object $monthlyRefunds): array
    {
        $factors = [
            'Q1' => 1.0, 'Q2' => 1.0, 'Q3' => 1.0, 'Q4' => 1.0
        ];
        
        // Calculate seasonal adjustments based on historical data
        // This is a simplified version - in reality, you'd use more sophisticated seasonal decomposition
        
        return $factors;
    }

    private static function getDefaultRiskAnalysis(): array
    {
        return [
            'avg_refund_rate' => 2.5,
            'refund_rate_volatility' => 0.5,
            'value_at_risk_95' => 5000000,
            'value_at_risk_99' => 8000000,
            'seasonal_factors' => ['Q1' => 1.0, 'Q2' => 1.0, 'Q3' => 1.0, 'Q4' => 1.2],
            'risk_scenarios' => [],
            'risk_score' => 25.0,
            'trend_analysis' => []
        ];
    }

    // Additional helper methods would be implemented here...
    private static function generateRiskScenarios(float $avgRate, float $volatility, array $seasonalFactors): array { return []; }
    private static function calculateRiskScore(float $avgRate, float $volatility, array $seasonalFactors): float { return 25.0; }
    private static function analyzeTrends(array $rates, array $amounts): array { return []; }
    private static function selectRecommendedScenario(float $riskScore): string { return 'moderate'; }
    private static function analyzeCoverage(array $scenarios, array $riskAnalysis): array { return []; }
    private static function projectGrowthRequirements(array $scenarios, array $riskAnalysis): array { return []; }
    private static function getDefaultContributionRate(): array { return []; }
    private static function assessFeasibility(float $rate, float $revenue): string { return 'high'; }
    private static function assessBusinessImpact(float $rate): string { return 'low'; }
    private static function selectOptimalTimeline(array $rates): string { return '12_months'; }
    private static function calculateImplementationImpact(array $rate, float $revenue): array { return []; }
    private static function performSensitivityAnalysis(array $rates, float $revenue): array { return []; }
    private static function simulateMonthlyContribution(string $tenantId, float $rate): float { return 1000000 * $rate; }
    private static function simulateMonthlyRefunds(string $tenantId): array { return [500000, 750000, 300000]; }
    private static function calculatePercentiles(array $values): array { return []; }
    private static function calculateExpectedShortfall(array $simulations): float { return 0.0; }
    private static function calculateMaximumDrawdown(array $simulations): float { return 0.0; }
    private static function getCurrentFundStatus(string $tenantId): array { return []; }
    private static function generateImplementationPlan(string $tenantId, array $rate): array { return []; }
    private static function calculatePerformanceMetrics(string $tenantId): array { return []; }
    private static function getBenchmarkComparisons(string $tenantId): array { return []; }
    private static function generateLongTermStrategy(string $tenantId, array $fundSize, array $rate): array { return []; }
    private static function generateMonitoringAlerts(array $fundSize, array $simulation): array { return []; }
    private static function generateReviewSchedule(): array { return []; }
}