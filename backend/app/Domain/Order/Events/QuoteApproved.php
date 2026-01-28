<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Quote Approved Domain Event
 * 
 * Fired when a customer approves a vendor quote.
 * Triggers production workflow and vendor confirmation.
 */
class QuoteApproved implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder $order,
        private float $approvedPrice,
        private ?string $approvalNotes = null
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder
    {
        return $this->order;
    }

    public function getApprovedPrice(): float
    {
        return $this->approvedPrice;
    }

    public function getApprovalNotes(): ?string
    {
        return $this->approvalNotes;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.quote_approved';
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
            'approved_price' => $this->approvedPrice,
            'approval_notes' => $this->approvalNotes,
            'approved_at' => $this->occurredAt->format('Y-m-d H:i:s'),
        ];
    }
}
