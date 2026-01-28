<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Order Status Changed Domain Event
 * 
 * Fired when an order status transitions to a new state.
 * Triggers workflow updates and notifications.
 * 
 * Database Integration:
 * - Updates order status and related timestamps
 * - Triggers milestone completion in timeline
 * - Updates business metrics and KPIs
 */
class OrderStatusChanged implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder|Order $order,
        private OrderStatus $previousStatus,
        private OrderStatus $newStatus,
        private ?string $reason = null
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder|Order
    {
        return $this->order;
    }

    // Add magic getter for backward compatibility
    public function __get(string $name)
    {
        return match ($name) {
            'order' => $this->order,
            'previousStatus' => $this->previousStatus,
            'newStatus' => $this->newStatus,
            'reason' => $this->reason,
            'occurredAt' => $this->occurredAt,
            default => throw new \InvalidArgumentException("Property {$name} does not exist"),
        };
    }

    public function getPreviousStatus(): OrderStatus
    {
        return $this->previousStatus;
    }

    public function getNewStatus(): OrderStatus
    {
        return $this->newStatus;
    }

    public function getReason(): ?string
    {
        return $this->reason;
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
        if ($this->order instanceof PurchaseOrder) {
            return $this->order->getId()->getValue();
        }
        // For Eloquent Order model
        return $this->order->uuid;
    }

    /**
     * Get event payload for serialization
     */
    public function getPayload(): array
    {
        if ($this->order instanceof PurchaseOrder) {
            return [
                'order_id' => $this->order->getId()->getValue(),
                'tenant_id' => $this->order->getTenantId()->getValue(),
                'customer_id' => $this->order->getCustomerId()->getValue(),
                'vendor_id' => $this->order->getVendorId()?->getValue(),
                'order_number' => $this->order->getOrderNumber(),
                'previous_status' => $this->previousStatus->value,
                'new_status' => $this->newStatus->value,
                'reason' => $this->reason,
                'is_terminal_status' => $this->newStatus->isTerminal(),
                'is_production_phase' => $this->newStatus->isProductionPhase(),
                'is_payment_phase' => $this->newStatus->isPaymentPhase(),
                'changed_at' => $this->occurredAt->format('Y-m-d H:i:s'),
            ];
        }
        
        // For Eloquent Order model
        return [
            'order_id' => $this->order->uuid,
            'tenant_id' => $this->order->tenant_id,
            'customer_id' => $this->order->customer_id,
            'vendor_id' => $this->order->vendor_id,
            'order_number' => $this->order->order_number,
            'previous_status' => $this->previousStatus->value,
            'new_status' => $this->newStatus->value,
            'reason' => $this->reason,
            'is_terminal_status' => $this->newStatus->isTerminal(),
            'is_production_phase' => $this->newStatus->isProductionPhase(),
            'is_payment_phase' => $this->newStatus->isPaymentPhase(),
            'changed_at' => $this->occurredAt->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get notification recipients
     */
    public function getNotificationRecipients(): array
    {
        $customerId = $this->order instanceof PurchaseOrder 
            ? $this->order->getCustomerId()->getValue()
            : $this->order->customer_id;
            
        $vendorId = $this->order instanceof PurchaseOrder 
            ? $this->order->getVendorId()?->getValue()
            : $this->order->vendor_id;

        $recipients = [
            'customer' => $customerId,
            'admin' => 'all',
        ];

        // Add vendor if assigned
        if ($vendorId) {
            $recipients['vendor'] = $vendorId;
        }

        // Add specific teams based on status
        if ($this->newStatus->isProductionPhase()) {
            $recipients['production_team'] = 'all';
        }

        if ($this->newStatus->isPaymentPhase()) {
            $recipients['finance_team'] = 'all';
        }

        if ($this->newStatus === OrderStatus::SHIPPING) {
            $recipients['logistics_team'] = 'all';
        }

        return $recipients;
    }

    /**
     * Check if this is a forward progression
     */
    public function isForwardProgression(): bool
    {
        $statusOrder = [
            OrderStatus::DRAFT->value => 1,
            OrderStatus::PENDING->value => 2,
            OrderStatus::VENDOR_SOURCING->value => 3,
            OrderStatus::VENDOR_NEGOTIATION->value => 4,
            OrderStatus::CUSTOMER_QUOTE->value => 5,
            OrderStatus::AWAITING_PAYMENT->value => 6,
            OrderStatus::PARTIAL_PAYMENT->value => 7,
            OrderStatus::FULL_PAYMENT->value => 8,
            OrderStatus::IN_PRODUCTION->value => 9,
            OrderStatus::QUALITY_CONTROL->value => 10,
            OrderStatus::SHIPPING->value => 11,
            OrderStatus::COMPLETED->value => 12,
        ];

        $previousOrder = $statusOrder[$this->previousStatus->value] ?? 0;
        $newOrder = $statusOrder[$this->newStatus->value] ?? 0;

        return $newOrder > $previousOrder;
    }

    /**
     * Check if this is a cancellation
     */
    public function isCancellation(): bool
    {
        return $this->newStatus === OrderStatus::CANCELLED;
    }

    /**
     * Check if this is a completion
     */
    public function isCompletion(): bool
    {
        return $this->newStatus === OrderStatus::COMPLETED;
    }

    /**
     * Check if order is overdue (temporary implementation for Eloquent compatibility)
     */
    private function isOrderOverdue(): bool
    {
        if ($this->order instanceof PurchaseOrder) {
            return $this->order->isOverdue();
        }
        
        // For Eloquent Order model - simple implementation
        if (!$this->order->estimated_delivery) {
            return false;
        }
        
        return now()->gt($this->order->estimated_delivery);
    }

    /**
     * Get business impact
     */
    public function getBusinessImpact(): array
    {
        return [
            'workflow_stage' => $this->getWorkflowStage(),
            'sla_impact' => $this->getSlaImpact(),
            'resource_allocation' => $this->getResourceAllocation(),
            'customer_communication' => $this->getCustomerCommunication(),
            'vendor_action_required' => $this->getVendorActionRequired(),
        ];
    }

    /**
     * Get workflow stage
     */
    private function getWorkflowStage(): string
    {
        return match ($this->newStatus) {
            OrderStatus::PENDING => 'order_review',
            OrderStatus::VENDOR_SOURCING => 'vendor_selection',
            OrderStatus::VENDOR_NEGOTIATION => 'price_negotiation',
            OrderStatus::CUSTOMER_QUOTE => 'customer_approval',
            OrderStatus::AWAITING_PAYMENT, OrderStatus::PARTIAL_PAYMENT => 'payment_collection',
            OrderStatus::FULL_PAYMENT => 'production_ready',
            OrderStatus::IN_PRODUCTION => 'manufacturing',
            OrderStatus::QUALITY_CONTROL => 'quality_assurance',
            OrderStatus::SHIPPING => 'logistics',
            OrderStatus::COMPLETED => 'order_fulfilled',
            OrderStatus::CANCELLED => 'order_cancelled',
            OrderStatus::REFUNDED => 'order_refunded',
            default => 'unknown',
        };
    }

    /**
     * Get SLA impact
     */
    private function getSlaImpact(): string
    {
        if ($this->isCancellation()) {
            return 'sla_void';
        }

        if ($this->isCompletion()) {
            return $this->isOrderOverdue() ? 'sla_missed' : 'sla_met';
        }

        return $this->isOrderOverdue() ? 'sla_at_risk' : 'sla_on_track';
    }

    /**
     * Get resource allocation needs
     */
    private function getResourceAllocation(): array
    {
        return match ($this->newStatus) {
            OrderStatus::VENDOR_SOURCING => ['procurement_team'],
            OrderStatus::VENDOR_NEGOTIATION => ['procurement_team', 'finance_team'],
            OrderStatus::IN_PRODUCTION => ['production_team', 'vendor_management'],
            OrderStatus::QUALITY_CONTROL => ['quality_team'],
            OrderStatus::SHIPPING => ['logistics_team'],
            default => [],
        };
    }

    /**
     * Get customer communication type
     */
    private function getCustomerCommunication(): string
    {
        return match ($this->newStatus) {
            OrderStatus::CUSTOMER_QUOTE => 'quote_approval_required',
            OrderStatus::AWAITING_PAYMENT => 'payment_request',
            OrderStatus::IN_PRODUCTION => 'production_started',
            OrderStatus::SHIPPING => 'shipment_notification',
            OrderStatus::COMPLETED => 'delivery_confirmation',
            OrderStatus::CANCELLED => 'cancellation_notice',
            default => 'status_update',
        };
    }

    /**
     * Get vendor action required
     */
    private function getVendorActionRequired(): ?string
    {
        $vendorId = $this->order instanceof PurchaseOrder 
            ? $this->order->getVendorId()
            : $this->order->vendor_id;
            
        if (!$vendorId) {
            return null;
        }

        return match ($this->newStatus) {
            OrderStatus::VENDOR_NEGOTIATION => 'quote_submission',
            OrderStatus::FULL_PAYMENT => 'production_start',
            OrderStatus::IN_PRODUCTION => 'production_updates',
            OrderStatus::QUALITY_CONTROL => 'quality_documentation',
            OrderStatus::SHIPPING => 'shipment_preparation',
            default => null,
        };
    }
}