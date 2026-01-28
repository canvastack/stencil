<?php

namespace App\Domain\Intelligence\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use Carbon\Carbon;

/**
 * Inventory Optimization Value Object
 * 
 * Contains AI-generated inventory optimization recommendations including
 * stock levels, reorder points, and cost savings analysis.
 */
class InventoryOptimization
{
    public function __construct(
        private UuidValueObject $tenantId,
        private array $recommendedStockLevels,
        private array $reorderPoints,
        private array $economicOrderQuantities,
        private float $costSavings,
        private float $serviceLevel,
        private array $riskAssessment,
        private array $implementationPlan,
        private float $forecastAccuracy,
        private Carbon $generatedAt
    ) {
        $this->validateOptimization();
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getRecommendedStockLevels(): array
    {
        return $this->recommendedStockLevels;
    }

    public function getReorderPoints(): array
    {
        return $this->reorderPoints;
    }

    public function getEconomicOrderQuantities(): array
    {
        return $this->economicOrderQuantities;
    }

    public function getCostSavings(): float
    {
        return $this->costSavings;
    }

    public function getServiceLevel(): float
    {
        return $this->serviceLevel;
    }

    public function getRiskAssessment(): array
    {
        return $this->riskAssessment;
    }

    public function getImplementationPlan(): array
    {
        return $this->implementationPlan;
    }

    public function getForecastAccuracy(): float
    {
        return $this->forecastAccuracy;
    }

    public function getGeneratedAt(): Carbon
    {
        return $this->generatedAt;
    }

    /**
     * Check if optimization provides significant cost savings
     */
    public function hasSignificantSavings(): bool
    {
        return $this->costSavings > 5000; // $5,000 threshold
    }

    /**
     * Check if service level is acceptable
     */
    public function hasAcceptableServiceLevel(): bool
    {
        return $this->serviceLevel >= 0.95; // 95% service level
    }

    /**
     * Check if forecast accuracy is reliable
     */
    public function hasReliableForecast(): bool
    {
        return $this->forecastAccuracy >= 0.8; // 80% accuracy threshold
    }

    /**
     * Get optimization summary
     */
    public function getOptimizationSummary(): array
    {
        $totalProducts = count($this->recommendedStockLevels);
        $productsWithChanges = $this->countProductsWithChanges();
        
        return [
            'total_products' => $totalProducts,
            'products_optimized' => $productsWithChanges,
            'optimization_rate' => $totalProducts > 0 ? $productsWithChanges / $totalProducts : 0,
            'projected_savings' => $this->costSavings,
            'service_level' => $this->serviceLevel,
            'forecast_reliability' => $this->forecastAccuracy,
            'implementation_complexity' => $this->assessImplementationComplexity()
        ];
    }

    /**
     * Get products requiring immediate attention
     */
    public function getHighPriorityProducts(): array
    {
        $highPriority = [];
        
        foreach ($this->recommendedStockLevels as $productId => $recommendedLevel) {
            $reorderPoint = $this->reorderPoints[$productId] ?? 0;
            
            // High priority if recommended level is significantly different from reorder point
            if ($recommendedLevel > $reorderPoint * 2 || $recommendedLevel < $reorderPoint * 0.5) {
                $highPriority[] = [
                    'product_id' => $productId,
                    'recommended_stock' => $recommendedLevel,
                    'reorder_point' => $reorderPoint,
                    'eoq' => $this->economicOrderQuantities[$productId] ?? 0,
                    'priority_reason' => $this->determinePriorityReason($recommendedLevel, $reorderPoint)
                ];
            }
        }
        
        return $highPriority;
    }

    /**
     * Get inventory investment analysis
     */
    public function getInvestmentAnalysis(): array
    {
        $totalInvestment = $this->calculateTotalInvestment();
        $currentInvestment = $this->estimateCurrentInvestment();
        
        return [
            'current_investment' => $currentInvestment,
            'recommended_investment' => $totalInvestment,
            'investment_change' => $totalInvestment - $currentInvestment,
            'investment_change_percentage' => $currentInvestment > 0 ? 
                (($totalInvestment - $currentInvestment) / $currentInvestment) * 100 : 0,
            'payback_period_months' => $this->calculatePaybackPeriod(),
            'roi_annual' => $this->calculateROI()
        ];
    }

    /**
     * Get risk mitigation strategies
     */
    public function getRiskMitigationStrategies(): array
    {
        $strategies = [];
        
        // Stockout risk mitigation
        if ($this->riskAssessment['stockout_risk'] === 'high') {
            $strategies[] = [
                'risk' => 'stockout',
                'strategy' => 'Increase safety stock for high-demand products',
                'implementation' => 'Adjust reorder points upward by 20%'
            ];
        }
        
        // Overstock risk mitigation
        if ($this->riskAssessment['overstock_risk'] === 'high') {
            $strategies[] = [
                'risk' => 'overstock',
                'strategy' => 'Implement just-in-time ordering for slow-moving items',
                'implementation' => 'Reduce order quantities and increase order frequency'
            ];
        }
        
        // Supplier risk mitigation
        if ($this->riskAssessment['supplier_risk'] === 'high') {
            $strategies[] = [
                'risk' => 'supplier',
                'strategy' => 'Diversify supplier base for critical materials',
                'implementation' => 'Identify and qualify alternative suppliers'
            ];
        }
        
        return $strategies;
    }

    /**
     * Get performance metrics
     */
    public function getPerformanceMetrics(): array
    {
        return [
            'inventory_turnover_improvement' => $this->calculateTurnoverImprovement(),
            'carrying_cost_reduction' => $this->calculateCarryingCostReduction(),
            'stockout_probability_reduction' => $this->calculateStockoutReduction(),
            'order_frequency_optimization' => $this->calculateOrderFrequencyOptimization(),
            'working_capital_impact' => $this->calculateWorkingCapitalImpact()
        ];
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenantId->getValue(),
            'recommended_stock_levels' => $this->recommendedStockLevels,
            'reorder_points' => $this->reorderPoints,
            'economic_order_quantities' => $this->economicOrderQuantities,
            'cost_savings' => $this->costSavings,
            'service_level' => $this->serviceLevel,
            'risk_assessment' => $this->riskAssessment,
            'implementation_plan' => $this->implementationPlan,
            'forecast_accuracy' => $this->forecastAccuracy,
            'generated_at' => $this->generatedAt->toISOString(),
            'optimization_summary' => $this->getOptimizationSummary(),
            'high_priority_products' => $this->getHighPriorityProducts(),
            'investment_analysis' => $this->getInvestmentAnalysis(),
            'risk_mitigation_strategies' => $this->getRiskMitigationStrategies(),
            'performance_metrics' => $this->getPerformanceMetrics(),
            'indicators' => [
                'significant_savings' => $this->hasSignificantSavings(),
                'acceptable_service_level' => $this->hasAcceptableServiceLevel(),
                'reliable_forecast' => $this->hasReliableForecast(),
                'low_risk' => $this->isLowRisk(),
                'ready_for_implementation' => $this->isReadyForImplementation()
            ]
        ];
    }

    private function validateOptimization(): void
    {
        if ($this->costSavings < 0) {
            throw new \InvalidArgumentException('Cost savings cannot be negative');
        }

        if ($this->serviceLevel < 0 || $this->serviceLevel > 1) {
            throw new \InvalidArgumentException('Service level must be between 0 and 1');
        }

        if ($this->forecastAccuracy < 0 || $this->forecastAccuracy > 1) {
            throw new \InvalidArgumentException('Forecast accuracy must be between 0 and 1');
        }

        if (!is_array($this->recommendedStockLevels)) {
            throw new \InvalidArgumentException('Recommended stock levels must be an array');
        }

        if (!is_array($this->reorderPoints)) {
            throw new \InvalidArgumentException('Reorder points must be an array');
        }

        if (!is_array($this->economicOrderQuantities)) {
            throw new \InvalidArgumentException('Economic order quantities must be an array');
        }

        if (!is_array($this->riskAssessment)) {
            throw new \InvalidArgumentException('Risk assessment must be an array');
        }

        if (!is_array($this->implementationPlan)) {
            throw new \InvalidArgumentException('Implementation plan must be an array');
        }
    }

    private function countProductsWithChanges(): int
    {
        // Assume all products in the recommendation have changes
        // In real implementation, this would compare against current levels
        return count($this->recommendedStockLevels);
    }

    private function assessImplementationComplexity(): string
    {
        $productCount = count($this->recommendedStockLevels);
        $highPriorityCount = count($this->getHighPriorityProducts());
        
        if ($highPriorityCount > $productCount * 0.5) {
            return 'high';
        } elseif ($highPriorityCount > $productCount * 0.2) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    private function determinePriorityReason(int $recommended, int $reorder): string
    {
        if ($recommended > $reorder * 2) {
            return 'Significant stock increase needed to prevent stockouts';
        } elseif ($recommended < $reorder * 0.5) {
            return 'Substantial stock reduction possible to reduce carrying costs';
        } else {
            return 'Moderate adjustment required for optimization';
        }
    }

    private function calculateTotalInvestment(): float
    {
        // Placeholder calculation - would use actual product prices
        return array_sum($this->recommendedStockLevels) * 50; // Assume $50 average cost per unit
    }

    private function estimateCurrentInvestment(): float
    {
        // Placeholder - would calculate based on current stock levels
        return $this->calculateTotalInvestment() * 1.2; // Assume current is 20% higher
    }

    private function calculatePaybackPeriod(): float
    {
        if ($this->costSavings <= 0) {
            return 0;
        }
        
        $monthlyImplementationCost = 2000; // Placeholder
        return $monthlyImplementationCost / ($this->costSavings / 12);
    }

    private function calculateROI(): float
    {
        $investment = $this->calculateTotalInvestment();
        return $investment > 0 ? ($this->costSavings / $investment) * 100 : 0;
    }

    private function isLowRisk(): bool
    {
        $riskLevels = array_values($this->riskAssessment);
        return !in_array('high', $riskLevels) && !in_array('very_high', $riskLevels);
    }

    private function isReadyForImplementation(): bool
    {
        return $this->hasReliableForecast() && 
               $this->hasAcceptableServiceLevel() && 
               $this->isLowRisk();
    }

    // Placeholder methods for performance metrics
    private function calculateTurnoverImprovement(): float
    {
        return 15.5; // 15.5% improvement
    }

    private function calculateCarryingCostReduction(): float
    {
        return 12.3; // 12.3% reduction
    }

    private function calculateStockoutReduction(): float
    {
        return 8.7; // 8.7% reduction in stockout probability
    }

    private function calculateOrderFrequencyOptimization(): float
    {
        return 20.1; // 20.1% optimization in order frequency
    }

    private function calculateWorkingCapitalImpact(): float
    {
        return -5.2; // 5.2% reduction in working capital requirements
    }
}