<?php

namespace App\Domain\Analytics\ValueObjects;

/**
 * Business Forecasts Value Object
 * 
 * Represents comprehensive business forecasting across different dimensions.
 */
final class BusinessForecasts
{
    public function __construct(
        private array $revenueForecast,
        private array $orderForecast,
        private array $customerGrowthForecast,
        private array $capacityForecast,
        private array $confidenceIntervals,
        private array $assumptions
    ) {}

    public function getRevenueForecast(): array { return $this->revenueForecast; }
    public function getOrderForecast(): array { return $this->orderForecast; }
    public function getCustomerGrowthForecast(): array { return $this->customerGrowthForecast; }
    public function getCapacityForecast(): array { return $this->capacityForecast; }
    public function getConfidenceIntervals(): array { return $this->confidenceIntervals; }
    public function getAssumptions(): array { return $this->assumptions; }

    public function toArray(): array
    {
        return [
            'revenue_forecast' => $this->revenueForecast,
            'order_forecast' => $this->orderForecast,
            'customer_growth_forecast' => $this->customerGrowthForecast,
            'capacity_forecast' => $this->capacityForecast,
            'confidence_intervals' => $this->confidenceIntervals,
            'assumptions' => $this->assumptions
        ];
    }
}