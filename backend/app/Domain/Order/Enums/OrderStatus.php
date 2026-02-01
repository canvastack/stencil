<?php

namespace App\Domain\Order\Enums;

/**
 * Order Status Enum
 * 
 * Defines all possible order statuses and their transitions.
 * Matches existing database enum values.
 * 
 * Database Integration:
 * - Maps to orders.status field
 * - Validates status transitions
 * - Provides business logic for status changes
 */
enum OrderStatus: string
{
    case NEW = 'new';
    case DRAFT = 'draft';
    case PENDING = 'pending';
    case VENDOR_SOURCING = 'vendor_sourcing';
    case VENDOR_NEGOTIATION = 'vendor_negotiation';
    case CUSTOMER_QUOTE = 'customer_quote';
    case AWAITING_PAYMENT = 'awaiting_payment';
    case PARTIAL_PAYMENT = 'partial_payment';
    case FULL_PAYMENT = 'full_payment';
    case PROCESSING = 'processing'; // Legacy status - maps to IN_PRODUCTION
    case IN_PRODUCTION = 'in_production';
    case QUALITY_CONTROL = 'quality_control';
    case SHIPPING = 'shipping';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case REFUNDED = 'refunded';

    /**
     * Get human-readable label
     */
    public function getLabel(): string
    {
        return match ($this) {
            self::NEW => 'New Order',
            self::DRAFT => 'Draft',
            self::PENDING => 'Pending Review',
            self::VENDOR_SOURCING => 'Sourcing Vendor',
            self::VENDOR_NEGOTIATION => 'Vendor Negotiation',
            self::CUSTOMER_QUOTE => 'Customer Quote',
            self::AWAITING_PAYMENT => 'Awaiting Payment',
            self::PARTIAL_PAYMENT => 'Partial Payment',
            self::FULL_PAYMENT => 'Payment Complete',
            self::PROCESSING => 'Processing', // Legacy - same as IN_PRODUCTION
            self::IN_PRODUCTION => 'In Production',
            self::QUALITY_CONTROL => 'Quality Control',
            self::SHIPPING => 'Shipping',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
            self::REFUNDED => 'Refunded',
        };
    }

    /**
     * Alias for getLabel() for backward compatibility
     */
    public function label(): string
    {
        return $this->getLabel();
    }

    /**
     * Create from string value (alias for from() method)
     */
    public static function fromString(string $value): self
    {
        return self::from($value);
    }

    /**
     * Get status description
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::NEW => 'New order received, awaiting initial review',
            self::DRAFT => 'Order is being prepared',
            self::PENDING => 'Order is pending review and approval',
            self::PROCESSING => 'Order is being processed', // Legacy status
            self::VENDOR_SOURCING => 'Finding suitable vendor for production',
            self::VENDOR_NEGOTIATION => 'Negotiating terms with vendor',
            self::CUSTOMER_QUOTE => 'Waiting for customer quote approval',
            self::AWAITING_PAYMENT => 'Waiting for customer payment',
            self::PARTIAL_PAYMENT => 'Partial payment received',
            self::FULL_PAYMENT => 'Full payment received, ready for production',
            self::IN_PRODUCTION => 'Order is being produced by vendor',
            self::QUALITY_CONTROL => 'Order is undergoing quality inspection',
            self::SHIPPING => 'Order is being shipped to customer',
            self::COMPLETED => 'Order has been completed and delivered',
            self::CANCELLED => 'Order has been cancelled',
            self::REFUNDED => 'Order has been refunded',
        };
    }

    /**
     * Alias for getDescription() for backward compatibility
     */
    public function description(): string
    {
        return $this->getDescription();
    }

    /**
     * Get valid next statuses
     */
    public function getValidTransitions(): array
    {
        return match ($this) {
            self::NEW => [self::DRAFT, self::PENDING, self::VENDOR_SOURCING, self::CANCELLED],
            self::DRAFT => [self::PENDING, self::VENDOR_SOURCING, self::CANCELLED],
            self::PENDING => [self::VENDOR_SOURCING, self::CUSTOMER_QUOTE, self::CANCELLED],
            self::PROCESSING => [self::VENDOR_SOURCING, self::VENDOR_NEGOTIATION, self::CUSTOMER_QUOTE, self::AWAITING_PAYMENT, self::IN_PRODUCTION, self::CANCELLED], // Legacy status - flexible transitions
            self::VENDOR_SOURCING => [self::VENDOR_NEGOTIATION, self::CUSTOMER_QUOTE, self::CANCELLED],
            self::VENDOR_NEGOTIATION => [self::CUSTOMER_QUOTE, self::VENDOR_SOURCING, self::CANCELLED],
            self::CUSTOMER_QUOTE => [self::AWAITING_PAYMENT, self::VENDOR_NEGOTIATION, self::CANCELLED],
            self::AWAITING_PAYMENT => [self::PARTIAL_PAYMENT, self::FULL_PAYMENT, self::CANCELLED],
            self::PARTIAL_PAYMENT => [self::FULL_PAYMENT, self::CANCELLED],
            self::FULL_PAYMENT => [self::IN_PRODUCTION, self::CANCELLED],
            self::IN_PRODUCTION => [self::QUALITY_CONTROL, self::CANCELLED],
            self::QUALITY_CONTROL => [self::SHIPPING, self::IN_PRODUCTION, self::CANCELLED],
            self::SHIPPING => [self::COMPLETED, self::CANCELLED],
            self::COMPLETED => [self::REFUNDED],
            self::CANCELLED => [],
            self::REFUNDED => [],
        };
    }

    /**
     * Get valid next statuses (alias for getValidTransitions)
     */
    public function getAllowedTransitions(): array
    {
        return $this->getValidTransitions();
    }

    /**
     * Check if can transition to another status
     */
    public function canTransitionTo(OrderStatus $newStatus): bool
    {
        return in_array($newStatus, $this->getValidTransitions());
    }

    /**
     * Check if status is terminal (no further transitions)
     */
    public function isTerminal(): bool
    {
        return in_array($this, [self::COMPLETED, self::CANCELLED, self::REFUNDED]);
    }

    /**
     * Check if status allows vendor assignment
     */
    public function allowsVendorAssignment(): bool
    {
        return in_array($this, [
            self::PENDING,
            self::PROCESSING, // Legacy status
            self::VENDOR_SOURCING,
            self::VENDOR_NEGOTIATION
        ]);
    }

    /**
     * Check if status allows payment processing
     */
    public function allowsPayment(): bool
    {
        return in_array($this, [
            self::AWAITING_PAYMENT,
            self::PARTIAL_PAYMENT
        ]);
    }

    /**
     * Check if order can be cancelled from this status
     */
    public function canBeCancelled(): bool
    {
        return !in_array($this, [
            self::COMPLETED,
            self::CANCELLED,
            self::REFUNDED,
            self::SHIPPING // Cannot cancel once shipped
        ]);
    }

    /**
     * Check if status indicates production phase
     */
    public function isProductionPhase(): bool
    {
        return in_array($this, [
            self::IN_PRODUCTION,
            self::QUALITY_CONTROL,
            self::SHIPPING
        ]);
    }

    /**
     * Check if status indicates payment phase
     */
    public function isPaymentPhase(): bool
    {
        return in_array($this, [
            self::AWAITING_PAYMENT,
            self::PARTIAL_PAYMENT,
            self::FULL_PAYMENT
        ]);
    }

    /**
     * Get status color for UI
     */
    public function getColor(): string
    {
        return match ($this) {
            self::NEW => 'blue',
            self::DRAFT => 'gray',
            self::PENDING => 'yellow',
            self::PROCESSING => 'yellow', // Legacy status, same as PENDING
            self::VENDOR_SOURCING => 'blue',
            self::VENDOR_NEGOTIATION => 'indigo',
            self::CUSTOMER_QUOTE => 'purple',
            self::AWAITING_PAYMENT => 'orange',
            self::PARTIAL_PAYMENT => 'amber',
            self::FULL_PAYMENT => 'green',
            self::IN_PRODUCTION => 'blue',
            self::QUALITY_CONTROL => 'indigo',
            self::SHIPPING => 'cyan',
            self::COMPLETED => 'green',
            self::CANCELLED => 'red',
            self::REFUNDED => 'pink',
        };
    }

    /**
     * Get all statuses as array
     */
    public static function toArray(): array
    {
        return array_map(fn($case) => $case->value, self::cases());
    }

    /**
     * Get statuses with labels
     */
    public static function getOptions(): array
    {
        $options = [];
        foreach (self::cases() as $case) {
            $options[$case->value] = $case->getLabel();
        }
        return $options;
    }
}