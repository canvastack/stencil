<?php

namespace App\Application\Order\Commands;

/**
 * Process Payment Command
 * 
 * Command DTO for processing order payments.
 * Handles both down payments and final payments.
 * 
 * Database Integration:
 * - Creates record in order_payment_transactions table
 * - Updates orders.total_paid_amount field
 * - Updates orders.payment_status based on amount paid
 */
class ProcessPaymentCommand
{
    /**
     * @param string $orderUuid Order UUID (maps to orders.uuid)
     * @param int $amount Payment amount in cents
     * @param string $method Payment method (bank_transfer, cash, etc.)
     * @param string $reference Payment reference/transaction ID
     * @param string $type Payment type (customer_payment, down_payment, final_payment)
     * @param string|null $notes Additional payment notes
     * @param array $metadata Additional payment metadata
     */
    public function __construct(
        public readonly string $orderUuid,
        public readonly int $amount,
        public readonly string $method,
        public readonly string $reference,
        public readonly string $type = 'customer_payment',
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

        if ($this->amount <= 0) {
            $errors[] = 'Payment amount must be greater than 0';
        }

        if (empty($this->method)) {
            $errors[] = 'Payment method is required';
        }

        if (empty($this->reference)) {
            $errors[] = 'Payment reference is required';
        }

        $validTypes = [
            'customer_payment',
            'down_payment', 
            'final_payment',
            'partial_payment',
            'refund',
            'adjustment'
        ];

        if (!in_array($this->type, $validTypes)) {
            $errors[] = 'Invalid payment type';
        }

        $validMethods = [
            'bank_transfer',
            'cash',
            'credit_card',
            'debit_card',
            'e_wallet',
            'check',
            'wire_transfer'
        ];

        if (!in_array($this->method, $validMethods)) {
            $errors[] = 'Invalid payment method';
        }

        return $errors;
    }

    /**
     * Check if this is a down payment
     */
    public function isDownPayment(): bool
    {
        return $this->type === 'down_payment';
    }

    /**
     * Check if this is a final payment
     */
    public function isFinalPayment(): bool
    {
        return $this->type === 'final_payment';
    }

    /**
     * Check if this is a refund
     */
    public function isRefund(): bool
    {
        return $this->type === 'refund';
    }

    /**
     * Get payment direction based on type
     */
    public function getDirection(): string
    {
        return $this->isRefund() ? 'outgoing' : 'incoming';
    }

    /**
     * Convert to transaction array for database storage
     */
    public function toTransactionArray(string $tenantId, string $customerId): array
    {
        return [
            'tenant_id' => $tenantId,
            'customer_id' => $customerId,
            'direction' => $this->getDirection(),
            'type' => $this->type,
            'status' => 'completed',
            'amount' => $this->amount,
            'currency' => 'IDR',
            'method' => $this->method,
            'reference' => $this->reference,
            'paid_at' => now(),
            'metadata' => array_merge([
                'processed_at' => now()->toISOString(),
                'payment_source' => 'manual_entry',
            ], $this->metadata),
        ];
    }

    /**
     * Get payment status description
     */
    public function getStatusDescription(): string
    {
        return match ($this->type) {
            'down_payment' => 'Down payment received',
            'final_payment' => 'Final payment completed',
            'partial_payment' => 'Partial payment received',
            'refund' => 'Payment refunded',
            'adjustment' => 'Payment adjustment',
            default => 'Payment received',
        };
    }

    /**
     * Convert to array for logging/debugging
     */
    public function toArray(): array
    {
        return [
            'order_uuid' => $this->orderUuid,
            'amount' => $this->amount,
            'method' => $this->method,
            'reference' => $this->reference,
            'type' => $this->type,
            'direction' => $this->getDirection(),
            'is_down_payment' => $this->isDownPayment(),
            'is_final_payment' => $this->isFinalPayment(),
            'is_refund' => $this->isRefund(),
            'has_notes' => $this->notes !== null,
            'metadata_keys' => array_keys($this->metadata),
        ];
    }
}