<?php

namespace App\Domain\Analytics\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Profitability Metrics Value Object
 * 
 * Represents comprehensive profitability analytics including margins,
 * cost analysis, and profit distribution across different dimensions.
 */
final class ProfitabilityMetrics
{
    /**
     * @param array<string, int> $profitByCustomer
     * @param array<string, int> $profitByVendor
     * @param array<string, int> $profitByProduct
     * @param array<string, int> $profitTrend
     * @param array<string, mixed> $breakEvenAnalysis
     */
    public function __construct(
        private Money $totalRevenue,
        private Money $totalCosts,
        private Money $grossProfit,
        private float $grossProfitMargin,
        private array $profitByCustomer,
        private array $profitByVendor,
        private array $profitByProduct,
        private array $profitTrend,
        private array $breakEvenAnalysis
    ) {}

    public function getTotalRevenue(): Money
    {
        return $this->totalRevenue;
    }

    public function getTotalCosts(): Money
    {
        return $this->totalCosts;
    }

    public function getGrossProfit(): Money
    {
        return $this->grossProfit;
    }

    public function getGrossProfitMargin(): float
    {
        return $this->grossProfitMargin;
    }

    public function getProfitByCustomer(): array
    {
        return $this->profitByCustomer;
    }

    public function getProfitByVendor(): array
    {
        return $this->profitByVendor;
    }

    public function getProfitByProduct(): array
    {
        return $this->profitByProduct;
    }

    public function getProfitTrend(): array
    {
        return $this->profitTrend;
    }

    public function getBreakEvenAnalysis(): array
    {
        return $this->breakEvenAnalysis;
    }

    /**
     * Get gross profit margin as percentage
     */
    public function getGrossProfitMarginPercentage(): int
    {
        return (int) round($this->grossProfitMargin * 100);
    }

    /**
     * Check if profitability is healthy (>30% margin)
     */
    public function isHealthy(): bool
    {
        return $this->grossProfitMargin >= 0.30;
    }

    /**
     * Get profitability status
     */
    public function getProfitabilityStatus(): string
    {
        return match(true) {
            $this->grossProfitMargin >= 0.40 => 'excellent',
            $this->grossProfitMargin >= 0.30 => 'good',
            $this->grossProfitMargin >= 0.20 => 'fair',
            $this->grossProfitMargin >= 0.10 => 'poor',
            default => 'critical'
        };
    }

    /**
     * Get most profitable customers
     */
    public function getMostProfitableCustomers(int $limit = 5): array
    {
        $sorted = $this->profitByCustomer;
        arsort($sorted);
        return array_slice($sorted, 0, $limit, true);
    }

    /**
     * Get most profitable vendors
     */
    public function getMostProfitableVendors(int $limit = 5): array
    {
        $sorted = $this->profitByVendor;
        arsort($sorted);
        return array_slice($sorted, 0, $limit, true);
    }

    /**
     * Get most profitable products
     */
    public function getMostProfitableProducts(int $limit = 5): array
    {
        $sorted = $this->profitByProduct;
        arsort($sorted);
        return array_slice($sorted, 0, $limit, true);
    }

    /**
     * Calculate cost ratio
     */
    public function getCostRatio(): float
    {
        return $this->totalRevenue->getAmount() > 0 ? 
            $this->totalCosts->getAmount() / $this->totalRevenue->getAmount() : 0;
    }

    /**
     * Get profit trend direction
     */
    public function getProfitTrendDirection(): string
    {
        if (count($this->profitTrend) < 2) {
            return 'insufficient_data';
        }
        
        $values = array_values($this->profitTrend);
        $recent = array_slice($values, -3); // Last 3 periods
        
        if (count($recent) < 2) {
            return 'stable';
        }
        
        $trend = (end($recent) - reset($recent)) / count($recent);
        
        if ($trend > 0) {
            return 'improving';
        } elseif ($trend < 0) {
            return 'declining';
        } else {
            return 'stable';
        }
    }

    public function toArray(): array
    {
        return [
            'total_revenue' => [
                'amount' => $this->totalRevenue->getAmount(),
                'currency' => $this->totalRevenue->getCurrency()
            ],
            'total_costs' => [
                'amount' => $this->totalCosts->getAmount(),
                'currency' => $this->totalCosts->getCurrency()
            ],
            'gross_profit' => [
                'amount' => $this->grossProfit->getAmount(),
                'currency' => $this->grossProfit->getCurrency()
            ],
            'gross_profit_margin' => $this->grossProfitMargin,
            'gross_profit_margin_percentage' => $this->getGrossProfitMarginPercentage(),
            'cost_ratio' => $this->getCostRatio(),
            'profit_by_customer' => $this->profitByCustomer,
            'profit_by_vendor' => $this->profitByVendor,
            'profit_by_product' => $this->profitByProduct,
            'profit_trend' => $this->profitTrend,
            'break_even_analysis' => $this->breakEvenAnalysis,
            'is_healthy' => $this->isHealthy(),
            'profitability_status' => $this->getProfitabilityStatus(),
            'most_profitable_customers' => $this->getMostProfitableCustomers(),
            'most_profitable_vendors' => $this->getMostProfitableVendors(),
            'most_profitable_products' => $this->getMostProfitableProducts(),
            'profit_trend_direction' => $this->getProfitTrendDirection()
        ];
    }
}