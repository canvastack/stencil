<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Order Cancelled Domain Event
 * 
 * Fired when an order is cancelled by customer or admin.
 * Triggers refund workflows and inventory adjustments.
 */
class OrderCancelled implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder|\App\Infrastructure\Persistence\Eloquent\Models\Order $order,
        private string $reason
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder|\App\Infrastructure\Persistence\Eloquent\Models\Order
    {
        return $this->order;
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.cancelled';
    }

    public function getAggregateId(): string
    {
        if ($this->order instanceof PurchaseOrder) {
            return $this->order->getId()->getValue();
        }
        // For Eloquent Order model
        return $this->order->uuid;
    }

    public function getPayload(): array
    {
        if ($this->order instanceof PurchaseOrder) {
            return [
                'order_id' => $this->order->getId()->getValue(),
                'tenant_id' => $this->order->getTenantId()->getValue(),
                'reason' => $this->reason,
                'cancelled_at' => $this->occurredAt->format('Y-m-d H:i:s'),
            ];
        }
        
        // For Eloquent Order model
        return [
            'order_id' => $this->order->uuid,
            'tenant_id' => $this->order->tenant_id,
            'reason' => $this->reason,
            'cancelled_at' => $this->occurredAt->format('Y-m-d H:i:s'),
        ];
    }
}