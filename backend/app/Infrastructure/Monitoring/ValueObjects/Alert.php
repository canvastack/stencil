<?php

namespace App\Infrastructure\Monitoring\ValueObjects;

use Carbon\Carbon;

/**
 * Alert Value Object
 * 
 * Represents a system alert with all necessary information
 * for notification and escalation.
 */
class Alert
{
    public function __construct(
        private string $metric,
        private float $value,
        private MetricThreshold $threshold,
        private AlertSeverity $severity,
        private Carbon $timestamp,
        private string $description
    ) {}

    public function getMetric(): string
    {
        return $this->metric;
    }

    public function getValue(): float
    {
        return $this->value;
    }

    public function getThreshold(): MetricThreshold
    {
        return $this->threshold;
    }

    public function getSeverity(): AlertSeverity
    {
        return $this->severity;
    }

    public function getTimestamp(): Carbon
    {
        return $this->timestamp;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    /**
     * Get alert as array for serialization
     */
    public function toArray(): array
    {
        return [
            'metric' => $this->metric,
            'value' => $this->value,
            'threshold' => [
                'warning' => $this->threshold->getWarningThreshold(),
                'critical' => $this->threshold->getCriticalThreshold(),
                'unit' => $this->threshold->getUnit()
            ],
            'severity' => $this->severity->value,
            'timestamp' => $this->timestamp->toISOString(),
            'description' => $this->description
        ];
    }

    /**
     * Get formatted alert message
     */
    public function getFormattedMessage(): string
    {
        return sprintf(
            "[%s] %s: %s is %.2f %s (threshold: %.2f %s) - %s",
            strtoupper($this->severity->value),
            $this->timestamp->format('Y-m-d H:i:s'),
            $this->threshold->getDescription(),
            $this->value,
            $this->threshold->getUnit(),
            $this->severity === AlertSeverity::CRITICAL 
                ? $this->threshold->getCriticalThreshold() 
                : $this->threshold->getWarningThreshold(),
            $this->threshold->getUnit(),
            $this->description
        );
    }

    /**
     * Get alert priority for sorting
     */
    public function getPriority(): int
    {
        return match($this->severity) {
            AlertSeverity::CRITICAL => 1,
            AlertSeverity::WARNING => 2,
            AlertSeverity::INFO => 3
        };
    }

    /**
     * Check if alert is critical
     */
    public function isCritical(): bool
    {
        return $this->severity === AlertSeverity::CRITICAL;
    }

    /**
     * Check if alert is warning
     */
    public function isWarning(): bool
    {
        return $this->severity === AlertSeverity::WARNING;
    }

    /**
     * Check if alert is info
     */
    public function isInfo(): bool
    {
        return $this->severity === AlertSeverity::INFO;
    }
}