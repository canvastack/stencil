<?php

namespace App\Domain\Analytics\ValueObjects;

/**
 * Customer Metrics Value Object
 * 
 * Represents comprehensive customer analytics.
 */
final class CustomerMetrics
{
    public function __construct(
        private int $totalCustomers,
        private int $activeCustomers,
        private int $newCustomers,
        private array $customerAnalysis,
        private array $topCustomers,
        private float $customerRetentionRate,
        private int $averageCustomerLifetimeValue
    ) {}

    public function getTotalCustomers(): int { return $this->totalCustomers; }
    public function getActiveCustomers(): int { return $this->activeCustomers; }
    public function getNewCustomers(): int { return $this->newCustomers; }
    public function getCustomerAnalysis(): array { return $this->customerAnalysis; }
    public function getTopCustomers(): array { return $this->topCustomers; }
    public function getCustomerRetentionRate(): float { return $this->customerRetentionRate; }
    public function getAverageCustomerLifetimeValue(): int { return $this->averageCustomerLifetimeValue; }

    public function toArray(): array
    {
        return [
            'total_customers' => $this->totalCustomers,
            'active_customers' => $this->activeCustomers,
            'new_customers' => $this->newCustomers,
            'customer_analysis' => $this->customerAnalysis,
            'top_customers' => $this->topCustomers,
            'customer_retention_rate' => $this->customerRetentionRate,
            'average_customer_lifetime_value' => $this->averageCustomerLifetimeValue
        ];
    }
}