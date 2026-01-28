<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Quote Requested Domain Event
 * 
 * Fired when a quote is requested from a vendor.
 * Triggers vendor notification and quote tracking workflows.
 */
class QuoteRequested implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder $order,
        private string $vendorId,
        private float $quotedPrice,
        private int $leadTimeDays
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder
    {
        return $this->order;
    }

    public function getVendorId(): string
    {
        return $this->vendorId;
    }

    public function getQuotedPrice(): float
    {
        return $this->quotedPrice;
    }

    public function getLeadTimeDays(): int
    {
        return $this->leadTimeDays;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.quote_requested';
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
            'vendor_id' => $this->vendorId,
            'quoted_price' => $this->quotedPrice,
            'lead_time_days' => $this->leadTimeDays,
            'requested_at' => $this->occurredAt->format('Y-m-d H:i:s'),
        ];
    }
}
