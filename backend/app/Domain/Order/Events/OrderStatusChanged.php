<?php

namespace App\Domain\Order\Events;

use App\Domain\Shared\Events\DomainEvent;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use DateTimeImmutable;

/**
 * Order Status Changed Event
 * 
 * Domain event fired when an order's status changes.
 * Used for triggering notifications, audit logging, and real-time updates.
 */
class OrderStatusChanged implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private UuidValueObject $orderId,
        private UuidValueObject $tenantId,
        private string $oldStatus,
        private string $newStatus,
        private ?string $changedBy = null,
        private ?string $reason = null,
        ?DateTimeImmutable $occurredAt = null
    ) {
        $this->occurredAt = $occurredAt ?? new DateTimeImmutable();
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.status_changed';
    }

    public function getAggregateId(): string
    {
        return $this->orderId->getValue();
    }

    public function getTenantId(): string
    {
        return $this->tenantId->getValue();
    }

    public function getOldStatus(): string
    {
        return $this->oldStatus;
    }

    public function getNewStatus(): string
    {
        return $this->newStatus;
    }

    public function getChangedBy(): ?string
    {
        return $this->changedBy;
    }

    public function getReason(): ?string
    {
        return $this->reason;
    }

    public function getPayload(): array
    {
        return [
            'event_name' => $this->getEventName(),
            'occurred_at' => $this->occurredAt->format('c'),
            'aggregate_id' => $this->getAggregateId(),
            'tenant_id' => $this->getTenantId(),
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'changed_by' => $this->changedBy,
            'reason' => $this->reason,
        ];
    }

    /**
     * Check if this status change is critical and requires immediate notification
     */
    public function isCriticalChange(): bool
    {
        $criticalStatuses = [
            'cancelled',
            'shipped',
            'delivered',
            'completed',
            'refunded',
            'failed'
        ];

        return in_array($this->newStatus, $criticalStatuses, true);
    }

    /**
     * Check if this status change should trigger email notifications
     */
    public function shouldNotifyByEmail(): bool
    {
        // Email notifications for major status changes
        $emailStatuses = [
            'confirmed',
            'in_production',
            'shipped',
            'delivered',
            'completed',
            'cancelled',
            'refunded'
        ];

        return in_array($this->newStatus, $emailStatuses, true);
    }

    /**
     * Check if this status change should trigger real-time notifications
     */
    public function shouldBroadcast(): bool
    {
        // All status changes should be broadcast for real-time updates
        return true;
    }
}