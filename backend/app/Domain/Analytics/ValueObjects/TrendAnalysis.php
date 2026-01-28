<?php

namespace App\Domain\Analytics\ValueObjects;

/**
 * Trend Analysis Value Object
 * 
 * Represents comprehensive trend analysis across different business dimensions.
 */
final class TrendAnalysis
{
    public function __construct(
        private array $orderTrends,
        private array $revenueTrends,
        private array $customerTrends,
        private array $seasonalPatterns,
        private array $growthIndicators,
        private array $marketInsights
    ) {}

    public function getOrderTrends(): array { return $this->orderTrends; }
    public function getRevenueTrends(): array { return $this->revenueTrends; }
    public function getCustomerTrends(): array { return $this->customerTrends; }
    public function getSeasonalPatterns(): array { return $this->seasonalPatterns; }
    public function getGrowthIndicators(): array { return $this->growthIndicators; }
    public function getMarketInsights(): array { return $this->marketInsights; }

    public function toArray(): array
    {
        return [
            'order_trends' => $this->orderTrends,
            'revenue_trends' => $this->revenueTrends,
            'customer_trends' => $this->customerTrends,
            'seasonal_patterns' => $this->seasonalPatterns,
            'growth_indicators' => $this->growthIndicators,
            'market_insights' => $this->marketInsights
        ];
    }
}