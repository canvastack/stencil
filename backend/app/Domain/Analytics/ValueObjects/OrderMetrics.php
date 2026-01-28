<?php

namespace App\Domain\Analytics\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Order Metrics Value Object
 * 
 * Represents comprehensive order analytics including volume,
 * completion rates, processing times, and trends.
 */
final class OrderMetrics
{
    /**
     * @param array<string, int> $ordersByStatus
     * @param array<string, int> $ordersByComplexity
     * @param array<string, int> $orderTrend
     */
    public function __construct(
        private int $totalOrders,
        private int $completedOrders,
        private int $cancelledOrders,
        private int $inProgressOrders,
        private Money $averageOrderValue,
        private float $orderCompletionRate,
        private float $averageProcessingTimeDays,
        private array $ordersByStatus,
        private array $ordersByComplexity,
        private array $orderTrend
    ) {}

    public function getTotalOrders(): int
    {
        return $this->totalOrders;
    }

    public function getCompletedOrders(): int
    {
        return $this->completedOrders;
    }

    public function getCancelledOrders(): int
    {
        return $this->cancelledOrders;
    }

    public function getInProgressOrders(): int
    {
        return $this->inProgressOrders;
    }

    public function getAverageOrderValue(): Money
    {
        return $this->averageOrderValue;
    }

    public function getOrderCompletionRate(): float
    {
        return $this->orderCompletionRate;
    }

    public function getAverageProcessingTimeDays(): float
    {
        return $this->averageProcessingTimeDays;
    }

    public function getOrdersByStatus(): array
    {
        return $this->ordersByStatus;
    }

    public function getOrdersByComplexity(): array
    {
        return $this->ordersByComplexity;
    }

    public function getOrderTrend(): array
    {
        return $this->orderTrend;
    }

    /**
     * Get completion rate as percentage
     */
    public function getCompletionRatePercentage(): int
    {
        return (int) round($this->orderCompletionRate * 100);
    }

    /**
     * Get cancellation rate
     */
    public function getCancellationRate(): float
    {
        return $this->totalOrders > 0 ? $this->cancelledOrders / $this->totalOrders : 0;
    }

    /**
     * Get cancellation rate as percentage
     */
    public function getCancellationRatePercentage(): int
    {
        return (int) round($this->getCancellationRate() * 100);
    }

    /**
     * Get order velocity (orders per day)
     */
    public function getOrderVelocity(): float
    {
        // Assuming the trend covers 30 days
        return $this->totalOrders / 30;
    }

    /**
     * Check if order metrics are healthy
     */
    public function isHealthy(): bool
    {
        return $this->orderCompletionRate >= 0.9 && 
               $this->getCancellationRate() <= 0.05 &&
               $this->averageProcessingTimeDays <= 14;
    }

    /**
     * Get performance status
     */
    public function getPerformanceStatus(): string
    {
        if ($this->orderCompletionRate >= 0.95 && $this->getCancellationRate() <= 0.02) {
            return 'excellent';
        }
        
        if ($this->orderCompletionRate >= 0.9 && $this->getCancellationRate() <= 0.05) {
            return 'good';
        }
        
        if ($this->orderCompletionRate >= 0.8 && $this->getCancellationRate() <= 0.1) {
            return 'fair';
        }
        
        return 'poor';
    }

    public function toArray(): array
    {
        return [
            'total_orders' => $this->totalOrders,
            'completed_orders' => $this->completedOrders,
            'cancelled_orders' => $this->cancelledOrders,
            'in_progress_orders' => $this->inProgressOrders,
            'average_order_value' => [
                'amount' => $this->averageOrderValue->getAmount(),
                'currency' => $this->averageOrderValue->getCurrency()
            ],
            'order_completion_rate' => $this->orderCompletionRate,
            'completion_rate_percentage' => $this->getCompletionRatePercentage(),
            'cancellation_rate' => $this->getCancellationRate(),
            'cancellation_rate_percentage' => $this->getCancellationRatePercentage(),
            'average_processing_time_days' => $this->averageProcessingTimeDays,
            'order_velocity' => $this->getOrderVelocity(),
            'orders_by_status' => $this->ordersByStatus,
            'orders_by_complexity' => $this->ordersByComplexity,
            'order_trend' => $this->orderTrend,
            'is_healthy' => $this->isHealthy(),
            'performance_status' => $this->getPerformanceStatus()
        ];
    }
}