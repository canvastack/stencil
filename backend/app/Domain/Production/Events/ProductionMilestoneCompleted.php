<?php

namespace App\Domain\Production\Events;

use App\Domain\Shared\Events\DomainEvent;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use DateTimeImmutable;

/**
 * Production Milestone Completed Event
 * 
 * Fired when a production milestone is completed.
 */
final class ProductionMilestoneCompleted implements DomainEvent
{
    public function __construct(
        private UuidValueObject $orderId,
        private string $milestoneId,
        private string $milestoneName,
        private DateTimeImmutable $completedAt
    ) {}

    public function getOrderId(): UuidValueObject
    {
        return $this->orderId;
    }

    public function getMilestoneId(): string
    {
        return $this->milestoneId;
    }

    public function getMilestoneName(): string
    {
        return $this->milestoneName;
    }

    public function getCompletedAt(): DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function getEventName(): string
    {
        return 'production.milestone.completed';
    }

    public function getAggregateId(): string
    {
        return $this->orderId->getValue();
    }

    public function getOccurredOn(): DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function toArray(): array
    {
        return [
            'order_id' => $this->orderId->getValue(),
            'milestone_id' => $this->milestoneId,
            'milestone_name' => $this->milestoneName,
            'completed_at' => $this->completedAt->format('Y-m-d H:i:s'),
            'event_name' => $this->getEventName()
        ];
    }
}