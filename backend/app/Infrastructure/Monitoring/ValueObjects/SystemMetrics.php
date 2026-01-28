<?php

namespace App\Infrastructure\Monitoring\ValueObjects;

use Carbon\Carbon;

/**
 * System Metrics Value Object
 * 
 * Collects and stores system performance metrics.
 */
class SystemMetrics
{
    private array $metrics = [];
    private Carbon $collectedAt;

    public function __construct()
    {
        $this->collectedAt = now();
    }

    /**
     * Add a metric value
     */
    public function addMetric(string $name, float $value): void
    {
        $this->metrics[$name] = $value;
    }

    /**
     * Get a specific metric value
     */
    public function getMetric(string $name): ?float
    {
        return $this->metrics[$name] ?? null;
    }

    /**
     * Get all metrics
     */
    public function getAllMetrics(): array
    {
        return $this->metrics;
    }

    /**
     * Get collection timestamp
     */
    public function getCollectedAt(): Carbon
    {
        return $this->collectedAt;
    }

    /**
     * Check if metric exists
     */
    public function hasMetric(string $name): bool
    {
        return isset($this->metrics[$name]);
    }

    /**
     * Get metrics count
     */
    public function getMetricsCount(): int
    {
        return count($this->metrics);
    }

    /**
     * Get metrics as array for serialization
     */
    public function toArray(): array
    {
        return [
            'metrics' => $this->metrics,
            'collected_at' => $this->collectedAt->toISOString(),
            'metrics_count' => $this->getMetricsCount()
        ];
    }

    /**
     * Get metrics grouped by category
     */
    public function getMetricsByCategory(): array
    {
        $categories = [
            'apm' => [],
            'business' => [],
            'infrastructure' => [],
            'security' => []
        ];

        foreach ($this->metrics as $name => $value) {
            $category = $this->categorizeMetric($name);
            $categories[$category][$name] = $value;
        }

        return $categories;
    }

    /**
     * Categorize metric by name
     */
    private function categorizeMetric(string $name): string
    {
        if (str_starts_with($name, 'api.') || str_starts_with($name, 'application.') || str_starts_with($name, 'database.')) {
            return 'apm';
        }

        if (str_starts_with($name, 'order.') || str_starts_with($name, 'revenue.') || 
            str_starts_with($name, 'quality.') || str_starts_with($name, 'vendor.') || 
            str_starts_with($name, 'customer.') || str_starts_with($name, 'production.')) {
            return 'business';
        }

        if (str_starts_with($name, 'system.') || str_starts_with($name, 'queue.')) {
            return 'infrastructure';
        }

        if (str_starts_with($name, 'security.')) {
            return 'security';
        }

        return 'other';
    }
}