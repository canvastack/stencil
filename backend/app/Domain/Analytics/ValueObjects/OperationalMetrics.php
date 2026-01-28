<?php

namespace App\Domain\Analytics\ValueObjects;

/**
 * Operational Metrics Value Object
 * 
 * Represents comprehensive operational performance analytics.
 */
final class OperationalMetrics
{
    public function __construct(
        private int $totalOrders,
        private float $averageProcessingTime,
        private float $productionEfficiency,
        private float $resourceUtilization,
        private float $capacityUtilization,
        private array $bottleneckAnalysis,
        private array $performanceIndicators
    ) {}

    public function getTotalOrders(): int { return $this->totalOrders; }
    public function getAverageProcessingTime(): float { return $this->averageProcessingTime; }
    public function getProductionEfficiency(): float { return $this->productionEfficiency; }
    public function getResourceUtilization(): float { return $this->resourceUtilization; }
    public function getCapacityUtilization(): float { return $this->capacityUtilization; }
    public function getBottleneckAnalysis(): array { return $this->bottleneckAnalysis; }
    public function getPerformanceIndicators(): array { return $this->performanceIndicators; }

    public function toArray(): array
    {
        return [
            'total_orders' => $this->totalOrders,
            'average_processing_time' => $this->averageProcessingTime,
            'production_efficiency' => $this->productionEfficiency,
            'resource_utilization' => $this->resourceUtilization,
            'capacity_utilization' => $this->capacityUtilization,
            'bottleneck_analysis' => $this->bottleneckAnalysis,
            'performance_indicators' => $this->performanceIndicators
        ];
    }
}