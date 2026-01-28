<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Order Shipped Domain Event
 * 
 * Fired when an order is shipped to the customer.
 * Triggers tracking notifications and delivery workflows.
 */
class OrderShipped implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder|\App\Infrastructure\Persistence\Eloquent\Models\Order $order,
        private string $trackingNumber
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder|\App\Infrastructure\Persistence\Eloquent\Models\Order
    {
        return $this->order;
    }

    public function getTrackingNumber(): string
    {
        return $this->trackingNumber;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.shipped';
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
                'tracking_number' => $this->trackingNumber,
                'shipped_at' => $this->occurredAt->format('Y-m-d H:i:s'),
            ];
        }
        
        // For Eloquent Order model
        return [
            'order_id' => $this->order->uuid,
            'tenant_id' => $this->order->tenant_id,
            'tracking_number' => $this->trackingNumber,
            'shipped_at' => $this->occurredAt->format('Y-m-d H:i:s'),
        ];
    }
}
