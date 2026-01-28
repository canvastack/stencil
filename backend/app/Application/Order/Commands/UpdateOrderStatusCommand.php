<?php

namespace App\Application\Order\Commands;

/**
 * Update Order Status Command
 * 
 * Command DTO for updating order status transitions.
 * Handles business rule validation for status changes.
 * 
 * Database Integration:
 * - Updates orders.status field
 * - Validates status transitions per business rules
 * - Updates related timestamp fields based on status
 */
class UpdateOrderStatusCommand
{
    /**
     * @param string $orderUuid Order UUID (maps to orders.uuid)
     * @param string $newStatus New order status
     * @param string|null $reason Reason for status change
     * @param string|null $notes Additional notes
     * @param array $metadata Additional status metadata
     */
    public function __construct(
        public readonly string $orderUuid,
        public readonly string $newStatus,
        public readonly ?string $reason = null,
        public readonly ?string $notes = null,
        public readonly array $metadata = []
    ) {}

    /**
     * Validate command data
     */
    public function validate(): array
    {
        $errors = [];

        if (empty($this->orderUuid)) {
            $errors[] = 'Order UUID is required';
        }

        if (empty($this->newStatus)) {
            $errors[] = 'New status is required';
        }

        $validStatuses = [
            'draft',
            'pending',
            'vendor_sourcing',
            'vendor_negotiation',
            'customer_quote',
            'awaiting_payment',
            'partial_payment',
            'full_payment',
            'in_production',
            'quality_control',
            'shipping',
            'completed',
            'cancelled',
            'refunded'
        ];

        if (!in_array($this->newStatus, $validStatuses)) {
            $errors[] = 'Invalid order status';
        }

        return $errors;
    }

    /**
     * Check if status requires reason
     */
    public function requiresReason(): bool
    {
        $statusesRequiringReason = [
            'cancelled',
            'refunded',
            'quality_control' // When moving back from later stages
        ];

        return in_array($this->newStatus, $statusesRequiringReason);
    }

    /**
     * Check if this is a terminal status
     */
    public function isTerminalStatus(): bool
    {
        $terminalStatuses = ['completed', 'cancelled', 'refunded'];
        return in_array($this->newStatus, $terminalStatuses);
    }

    /**
     * Check if this is a payment-related status
     */
    public function isPaymentStatus(): bool
    {
        $paymentStatuses = ['awaiting_payment', 'partial_payment', 'full_payment'];
        return in_array($this->newStatus, $paymentStatuses);
    }

    /**
     * Check if this is a production status
     */
    public function isProductionStatus(): bool
    {
        $productionStatuses = ['in_production', 'quality_control'];
        return in_array($this->newStatus, $productionStatuses);
    }

    /**
     * Get valid next statuses from current status
     */
    public static function getValidTransitions(string $currentStatus): array
    {
        return match ($currentStatus) {
            'draft' => ['pending', 'cancelled'],
            'pending' => ['vendor_sourcing', 'customer_quote', 'cancelled'],
            'vendor_sourcing' => ['vendor_negotiation', 'customer_quote', 'cancelled'],
            'vendor_negotiation' => ['customer_quote', 'vendor_sourcing', 'cancelled'],
            'customer_quote' => ['awaiting_payment', 'vendor_negotiation', 'cancelled'],
            'awaiting_payment' => ['partial_payment', 'full_payment', 'cancelled'],
            'partial_payment' => ['full_payment', 'cancelled'],
            'full_payment' => ['in_production', 'cancelled'],
            'in_production' => ['quality_control', 'cancelled'],
            'quality_control' => ['shipping', 'in_production', 'cancelled'],
            'shipping' => ['completed', 'cancelled'],
            'completed' => ['refunded'], // Only refund allowed after completion
            'cancelled' => [], // Terminal state
            'refunded' => [], // Terminal state
            default => [],
        };
    }

    /**
     * Validate status transition
     */
    public function isValidTransition(string $currentStatus): bool
    {
        $validTransitions = self::getValidTransitions($currentStatus);
        return in_array($this->newStatus, $validTransitions);
    }

    /**
     * Get timestamp field to update based on status
     */
    public function getTimestampField(): ?string
    {
        return match ($this->newStatus) {
            'shipping' => 'shipped_at',
            'completed' => 'delivered_at',
            'full_payment' => 'payment_date',
            default => null,
        };
    }

    /**
     * Get status change metadata
     */
    public function getStatusMetadata(): array
    {
        return array_merge([
            'changed_at' => now()->toISOString(),
            'requires_reason' => $this->requiresReason(),
            'is_terminal' => $this->isTerminalStatus(),
            'is_payment_status' => $this->isPaymentStatus(),
            'is_production_status' => $this->isProductionStatus(),
        ], $this->metadata);
    }

    /**
     * Convert to array for logging/debugging
     */
    public function toArray(): array
    {
        return [
            'order_uuid' => $this->orderUuid,
            'new_status' => $this->newStatus,
            'reason' => $this->reason,
            'requires_reason' => $this->requiresReason(),
            'is_terminal' => $this->isTerminalStatus(),
            'is_payment_status' => $this->isPaymentStatus(),
            'is_production_status' => $this->isProductionStatus(),
            'timestamp_field' => $this->getTimestampField(),
            'has_notes' => $this->notes !== null,
            'metadata_keys' => array_keys($this->metadata),
        ];
    }
}