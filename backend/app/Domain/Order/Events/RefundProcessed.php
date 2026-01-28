<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Refund Processed Domain Event
 * 
 * Fired when a refund is processed for an order.
 * Triggers financial reconciliation and customer notification workflows.
 */
class RefundProcessed implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder $order,
        private Money $refundAmount,
        private string $refundReason,
        private ?string $transactionReference = null
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder
    {
        return $this->order;
    }

    public function getRefundAmount(): Money
    {
        return $this->refundAmount;
    }

    public function getRefundReason(): string
    {
        return $this->refundReason;
    }

    public function getTransactionReference(): ?string
    {
        return $this->transactionReference;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.refund_processed';
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
            'refund_amount' => $this->refundAmount->getAmountInCents(),
            'currency' => $this->refundAmount->getCurrency(),
            'refund_reason' => $this->refundReason,
            'transaction_reference' => $this->transactionReference,
            'processed_at' => $this->occurredAt->format('Y-m-d H:i:s'),
        ];
    }
}
