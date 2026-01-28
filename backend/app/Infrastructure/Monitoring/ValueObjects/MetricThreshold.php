<?php

namespace App\Infrastructure\Monitoring\ValueObjects;

/**
 * Metric Threshold Value Object
 * 
 * Defines warning and critical thresholds for system metrics.
 */
class MetricThreshold
{
    public function __construct(
        private string $metric,
        private float $warningThreshold,
        private float $criticalThreshold,
        private string $unit,
        private string $description
    ) {
        if ($criticalThreshold < $warningThreshold) {
            throw new \InvalidArgumentException('Critical threshold must be greater than or equal to warning threshold');
        }
    }

    public function getMetric(): string
    {
        return $this->metric;
    }

    public function getWarningThreshold(): float
    {
        return $this->warningThreshold;
    }

    public function getCriticalThreshold(): float
    {
        return $this->criticalThreshold;
    }

    public function getUnit(): string
    {
        return $this->unit;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    /**
     * Evaluate value against thresholds
     */
    public function evaluate(float $value): ?AlertSeverity
    {
        if ($value >= $this->criticalThreshold) {
            return AlertSeverity::CRITICAL;
        }
        
        if ($value >= $this->warningThreshold) {
            return AlertSeverity::WARNING;
        }
        
        return null;
    }

    /**
     * Get threshold as array
     */
    public function toArray(): array
    {
        return [
            'metric' => $this->metric,
            'warning_threshold' => $this->warningThreshold,
            'critical_threshold' => $this->criticalThreshold,
            'unit' => $this->unit,
            'description' => $this->description
        ];
    }
}