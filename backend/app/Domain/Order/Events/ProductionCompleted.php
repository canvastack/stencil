<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Production Completed Domain Event
 * 
 * Fired when production is completed for an order.
 * Triggers quality control and shipping workflows.
 */
class ProductionCompleted implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder $order,
        private int $qualityScore = 100,
        private ?string $qualityNotes = null
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder
    {
        return $this->order;
    }

    public function getQualityScore(): int
    {
        return $this->qualityScore;
    }

    public function getQualityNotes(): ?string
    {
        return $this->qualityNotes;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.production_completed';
    }

    public function getAggregateId(): string
    {
        return $this->order->getId()->getValue();
    }

    public function getPayload(): array
    {
        return [
            'order_id' => $this->order->getId()->getValue(),
            'tenant_id' => $this->order->getTenantId()->getValue(),
            'quality_score' => $this->qualityScore,
            'quality_notes' => $this->qualityNotes,
            'completed_at' => $this->occurredAt->format('Y-m-d H:i:s'),
        ];
    }
}
