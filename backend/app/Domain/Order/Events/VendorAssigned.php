<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Vendor Assigned Domain Event
 * 
 * Fired when a vendor is assigned to an order.
 * Triggers vendor notifications and negotiation workflows.
 * 
 * Database Integration:
 * - Creates record in order_vendor_negotiations table
 * - Updates vendor performance metrics
 * - Triggers vendor notification workflows
 */
class VendorAssigned implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder $order,
        private UuidValueObject $vendorId,
        private array $vendorQuote
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder
    {
        return $this->order;
    }

    public function getVendorId(): UuidValueObject
    {
        return $this->vendorId;
    }

    public function getVendorQuote(): array
    {
        return $this->vendorQuote;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.vendor_assigned';
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
            'vendor_id' => $this->vendorId->getValue(),
            'order_number' => $this->order->getOrderNumber(),
            'vendor_quote' => $this->vendorQuote,
            'quoted_price' => $this->vendorQuote['quoted_price'] ?? 0,
            'lead_time_days' => $this->vendorQuote['lead_time_days'] ?? 0,
            'estimated_delivery' => $this->vendorQuote['estimated_delivery'] ?? null,
            'assigned_at' => $this->occurredAt->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get notification recipients
     */
    public function getNotificationRecipients(): array
    {
        return [
            'vendor' => $this->vendorId->getValue(),
            'customer' => $this->order->getCustomerId()->getValue(),
            'admin' => 'all',
            'procurement_team' => 'all',
        ];
    }

    /**
     * Get negotiation data for database storage
     */
    public function getNegotiationData(): array
    {
        return [
            'order_id' => $this->order->getId()->getValue(),
            'vendor_id' => $this->vendorId->getValue(),
            'tenant_id' => $this->order->getTenantId()->getValue(),
            'status' => 'open',
            'initial_offer' => $this->vendorQuote['quoted_price'] ?? 0,
            'latest_offer' => $this->vendorQuote['quoted_price'] ?? 0,
            'currency' => $this->vendorQuote['currency'] ?? 'IDR',
            'terms' => $this->vendorQuote['terms'] ?? [],
            'history' => [
                [
                    'action' => 'vendor_assigned',
                    'timestamp' => $this->occurredAt->format('Y-m-d H:i:s'),
                    'data' => $this->vendorQuote,
                ]
            ],
            'round' => 1,
            'expires_at' => $this->calculateExpirationDate(),
        ];
    }

    /**
     * Get business impact
     */
    public function getBusinessImpact(): array
    {
        return [
            'vendor_engagement' => 'new_assignment',
            'negotiation_start' => $this->occurredAt->format('Y-m-d H:i:s'),
            'expected_margin' => $this->calculateExpectedMargin(),
            'delivery_commitment' => $this->vendorQuote['estimated_delivery'] ?? null,
        ];
    }

    /**
     * Calculate negotiation expiration date
     */
    private function calculateExpirationDate(): string
    {
        // PT CEX business rule: 5 days for vendor negotiation
        return $this->occurredAt->modify('+5 days')->format('Y-m-d H:i:s');
    }

    /**
     * Calculate expected profit margin
     */
    private function calculateExpectedMargin(): ?float
    {
        $orderTotal = $this->order->getTotalAmount()->getAmountInCents();
        $vendorCost = $this->vendorQuote['quoted_price'] ?? 0;

        if ($orderTotal > 0 && $vendorCost > 0) {
            return (($orderTotal - $vendorCost) / $orderTotal) * 100;
        }

        return null;
    }
}