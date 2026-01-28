<?php

namespace App\Domain\Order\Enums;

/**
 * Payment Status Enum
 * 
 * Defines all possible payment statuses for orders.
 * Matches existing database enum values.
 * 
 * Database Integration:
 * - Maps to orders.payment_status field
 * - Provides business logic for payment validation
 * - Supports payment workflow transitions
 */
enum PaymentStatus: string
{
    case UNPAID = 'unpaid';
    case PARTIALLY_PAID = 'partially_paid';
    case PAID = 'paid';
    case REFUNDED = 'refunded';

    /**
     * Get human-readable label
     */
    public function getLabel(): string
    {
        return match ($this) {
            self::UNPAID => 'Unpaid',
            self::PARTIALLY_PAID => 'Partially Paid',
            self::PAID => 'Paid',
            self::REFUNDED => 'Refunded',
        };
    }

    /**
     * Get status description
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::UNPAID => 'No payment received',
            self::PARTIALLY_PAID => 'Partial payment received',
            self::PAID => 'Full payment received',
            self::REFUNDED => 'Payment has been refunded',
        };
    }

    /**
     * Get valid next payment statuses
     */
    public function getValidTransitions(): array
    {
        return match ($this) {
            self::UNPAID => [self::PARTIALLY_PAID, self::PAID],
            self::PARTIALLY_PAID => [self::PAID, self::REFUNDED],
            self::PAID => [self::REFUNDED],
            self::REFUNDED => [],
        };
    }

    /**
     * Check if can transition to another payment status
     */
    public function canTransitionTo(PaymentStatus $newStatus): bool
    {
        return in_array($newStatus, $this->getValidTransitions());
    }

    /**
     * Check if payment is complete
     */
    public function isComplete(): bool
    {
        return $this === self::PAID;
    }

    /**
     * Check if payment allows refunds
     */
    public function allowsRefund(): bool
    {
        return in_array($this, [self::PARTIALLY_PAID, self::PAID]);
    }

    /**
     * Check if payment allows additional payments
     */
    public function allowsAdditionalPayment(): bool
    {
        return in_array($this, [self::UNPAID, self::PARTIALLY_PAID]);
    }

    /**
     * Get status color for UI
     */
    public function getColor(): string
    {
        return match ($this) {
            self::UNPAID => 'red',
            self::PARTIALLY_PAID => 'yellow',
            self::PAID => 'green',
            self::REFUNDED => 'gray',
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