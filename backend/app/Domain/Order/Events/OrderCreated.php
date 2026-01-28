<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Order Created Domain Event
 * 
 * Fired when a new purchase order is created.
 * Triggers notifications and business processes.
 * 
 * Database Integration:
 * - Triggers activity logging
 * - Initiates notification workflows
 * - Updates customer last_order_at field
 */
class OrderCreated implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder $order
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder
    {
        return $this->order;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.created';
    }

    public function getAggregateId(): string
    {
        return $this->order->getId()->getValue();
    }

    /**
     * Get event payload for serialization
     */
    public function getPayload(): array
    {
        return [
            'order_id' => $this->order->getId()->getValue(),
            'tenant_id' => $this->order->getTenantId()->getValue(),
            'customer_id' => $this->order->getCustomerId()->getValue(),
            'order_number' => $this->order->getOrderNumber(),
            'total_amount' => $this->order->getTotalAmount()->getAmountInCents(),
            'currency' => $this->order->getTotalAmount()->getCurrency(),
            'status' => $this->order->getStatus()->value,
            'payment_status' => $this->order->getPaymentStatus()->value,
            'required_delivery_date' => $this->order->getRequiredDeliveryDate()->format('Y-m-d H:i:s'),
            'items_count' => count($this->order->getItems()),
            'created_at' => $this->order->getCreatedAt()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get notification recipients
     */
    public function getNotificationRecipients(): array
    {
        return [
            'customer' => $this->order->getCustomerId()->getValue(),
            'admin' => 'all', // Notify all admin users
            'sales_team' => 'all', // Notify sales team
        ];
    }

    /**
     * Get business impact
     */
    public function getBusinessImpact(): array
    {
        return [
            'revenue_potential' => $this->order->getTotalAmount()->getAmountInCents(),
            'customer_engagement' => 'new_order',
            'workflow_trigger' => 'order_processing',
            'sla_start' => $this->order->getRequiredDeliveryDate()->format('Y-m-d H:i:s'),
        ];
    }
}