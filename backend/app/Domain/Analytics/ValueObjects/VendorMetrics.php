<?php

namespace App\Domain\Analytics\ValueObjects;

/**
 * Vendor Metrics Value Object
 * 
 * Represents comprehensive vendor performance analytics.
 */
final class VendorMetrics
{
    public function __construct(
        private int $totalVendors,
        private int $activeVendors,
        private array $vendorPerformance,
        private float $averageOnTimeDelivery,
        private array $topPerformingVendors,
        private array $vendorQualityScores,
        private array $vendorCostAnalysis
    ) {}

    public function getTotalVendors(): int { return $this->totalVendors; }
    public function getActiveVendors(): int { return $this->activeVendors; }
    public function getVendorPerformance(): array { return $this->vendorPerformance; }
    public function getAverageOnTimeDelivery(): float { return $this->averageOnTimeDelivery; }
    public function getTopPerformingVendors(): array { return $this->topPerformingVendors; }
    public function getVendorQualityScores(): array { return $this->vendorQualityScores; }
    public function getVendorCostAnalysis(): array { return $this->vendorCostAnalysis; }

    public function toArray(): array
    {
        return [
            'total_vendors' => $this->totalVendors,
            'active_vendors' => $this->activeVendors,
            'vendor_performance' => $this->vendorPerformance,
            'average_on_time_delivery' => $this->averageOnTimeDelivery,
            'top_performing_vendors' => $this->topPerformingVendors,
            'vendor_quality_scores' => $this->vendorQualityScores,
            'vendor_cost_analysis' => $this->vendorCostAnalysis
        ];
    }
}