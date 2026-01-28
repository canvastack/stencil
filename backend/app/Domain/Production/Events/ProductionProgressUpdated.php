<?php

namespace App\Domain\Production\Events;

use App\Domain\Shared\Events\DomainEvent;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use DateTimeImmutable;

/**
 * Production Progress Updated Event
 * 
 * Fired when production progress is updated for an order.
 */
final class ProductionProgressUpdated implements DomainEvent
{
    public function __construct(
        private UuidValueObject $orderId,
        private float $overallProgress,
        private string $currentPhase,
        private DateTimeImmutable $updatedAt
    ) {}

    public function getOrderId(): UuidValueObject
    {
        return $this->orderId;
    }

    public function getOverallProgress(): float
    {
        return $this->overallProgress;
    }

    public function getCurrentPhase(): string
    {
        return $this->currentPhase;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getEventName(): string
    {
        return 'production.progress.updated';
    }

    public function getAggregateId(): string
    {
        return $this->orderId->getValue();
    }

    public function getOccurredOn(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function toArray(): array
    {
        return [
            'order_id' => $this->orderId->getValue(),
            'overall_progress' => $this->overallProgress,
            'progress_percentage' => (int) round($this->overallProgress * 100),
            'current_phase' => $this->currentPhase,
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
            'event_name' => $this->getEventName()
        ];
    }
}