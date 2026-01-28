<?php

namespace App\Domain\Analytics\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Revenue Metrics Value Object
 * 
 * Represents comprehensive revenue analytics including total revenue,
 * growth rates, customer segmentation, and forecasting.
 */
final class RevenueMetrics
{
    /**
     * @param array<string, int> $monthlyRevenue
     * @param array<string, int> $revenueByCustomer
     * @param array<int> $revenueForecast
     */
    public function __construct(
        private Money $totalRevenue,
        private array $monthlyRevenue,
        private array $revenueByCustomer,
        private float $revenueGrowthRate,
        private Money $averageRevenuePerOrder,
        private int $recurringRevenue,
        private array $revenueForecast
    ) {}

    public function getTotalRevenue(): Money
    {
        return $this->totalRevenue;
    }

    public function getMonthlyRevenue(): array
    {
        return $this->monthlyRevenue;
    }

    public function getRevenueByCustomer(): array
    {
        return $this->revenueByCustomer;
    }

    public function getRevenueGrowthRate(): float
    {
        return $this->revenueGrowthRate;
    }

    public function getAverageRevenuePerOrder(): Money
    {
        return $this->averageRevenuePerOrder;
    }

    public function getRecurringRevenue(): int
    {
        return $this->recurringRevenue;
    }

    public function getRevenueForecast(): array
    {
        return $this->revenueForecast;
    }

    /**
     * Get revenue growth rate as percentage
     */
    public function getGrowthRatePercentage(): int
    {
        return (int) round($this->revenueGrowthRate * 100);
    }

    /**
     * Get recurring revenue percentage
     */
    public function getRecurringRevenuePercentage(): float
    {
        return $this->totalRevenue->getAmount() > 0 ? 
            $this->recurringRevenue / $this->totalRevenue->getAmount() : 0;
    }

    /**
     * Check if revenue is growing
     */
    public function isGrowing(): bool
    {
        return $this->revenueGrowthRate > 0;
    }

    /**
     * Get revenue health status
     */
    public function getHealthStatus(): string
    {
        if ($this->revenueGrowthRate >= 0.2) {
            return 'excellent'; // 20%+ growth
        }
        
        if ($this->revenueGrowthRate >= 0.1) {
            return 'good'; // 10%+ growth
        }
        
        if ($this->revenueGrowthRate >= 0) {
            return 'stable'; // Positive or flat
        }
        
        if ($this->revenueGrowthRate >= -0.05) {
            return 'concerning'; // Small decline
        }
        
        return 'critical'; // Significant decline
    }

    /**
     * Get top revenue customers
     */
    public function getTopCustomers(int $limit = 5): array
    {
        $sorted = $this->revenueByCustomer;
        arsort($sorted);
        return array_slice($sorted, 0, $limit, true);
    }

    /**
     * Calculate revenue concentration (what % comes from top 20% customers)
     */
    public function getRevenueConcentration(): float
    {
        $sorted = $this->revenueByCustomer;
        arsort($sorted);
        
        $totalCustomers = count($sorted);
        $top20PercentCount = max(1, (int) ceil($totalCustomers * 0.2));
        $top20PercentRevenue = array_sum(array_slice($sorted, 0, $top20PercentCount));
        
        return $this->totalRevenue->getAmount() > 0 ? 
            $top20PercentRevenue / $this->totalRevenue->getAmount() : 0;
    }

    /**
     * Get monthly revenue trend
     */
    public function getMonthlyTrend(): string
    {
        if (count($this->monthlyRevenue) < 2) {
            return 'insufficient_data';
        }
        
        $values = array_values($this->monthlyRevenue);
        $recent = array_slice($values, -3); // Last 3 months
        
        if (count($recent) < 2) {
            return 'stable';
        }
        
        $trend = (end($recent) - reset($recent)) / count($recent);
        
        if ($trend > 0) {
            return 'increasing';
        } elseif ($trend < 0) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    /**
     * Get forecasted revenue for next period
     */
    public function getNextPeriodForecast(): ?int
    {
        return !empty($this->revenueForecast) ? $this->revenueForecast[0] : null;
    }

    public function toArray(): array
    {
        return [
            'total_revenue' => [
                'amount' => $this->totalRevenue->getAmount(),
                'currency' => $this->totalRevenue->getCurrency()
            ],
            'monthly_revenue' => $this->monthlyRevenue,
            'revenue_by_customer' => $this->revenueByCustomer,
            'revenue_growth_rate' => $this->revenueGrowthRate,
            'growth_rate_percentage' => $this->getGrowthRatePercentage(),
            'average_revenue_per_order' => [
                'amount' => $this->averageRevenuePerOrder->getAmount(),
                'currency' => $this->averageRevenuePerOrder->getCurrency()
            ],
            'recurring_revenue' => $this->recurringRevenue,
            'recurring_revenue_percentage' => $this->getRecurringRevenuePercentage(),
            'revenue_forecast' => $this->revenueForecast,
            'is_growing' => $this->isGrowing(),
            'health_status' => $this->getHealthStatus(),
            'top_customers' => $this->getTopCustomers(),
            'revenue_concentration' => $this->getRevenueConcentration(),
            'monthly_trend' => $this->getMonthlyTrend(),
            'next_period_forecast' => $this->getNextPeriodForecast()
        ];
    }
}