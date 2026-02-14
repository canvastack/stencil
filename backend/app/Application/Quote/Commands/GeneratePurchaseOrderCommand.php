<?php

namespace App\Application\Quote\Commands;

/**
 * Generate Purchase Order Command
 * 
 * Command DTO for generating purchase orders from accepted vendor quotes.
 * This creates a formal PO document to be sent to the vendor.
 */
class GeneratePurchaseOrderCommand
{
    /**
     * @param string $quoteUuid Quote UUID
     * @param string $tenantId Tenant UUID
     * @param string $userId User ID generating the PO
     * @param string|null $deliveryAddress Custom delivery address (optional)
     * @param string|null $paymentMethod Payment method (optional, defaults to bank_transfer)
     * @param array|null $paymentSchedule Custom payment schedule (optional)
     * @param string|null $specialInstructions Special delivery/production instructions (optional)
     * @param string $ipAddress User IP address
     * @param string $userAgent User agent string
     */
    public function __construct(
        public readonly string $quoteUuid,
        public readonly string $tenantId,
        public readonly string $userId,
        public readonly ?string $deliveryAddress = null,
        public readonly ?string $paymentMethod = 'bank_transfer',
        public readonly ?array $paymentSchedule = null,
        public readonly ?string $specialInstructions = null,
        public readonly string $ipAddress = '127.0.0.1',
        public readonly string $userAgent = 'Unknown'
    ) {}

    /**
     * Validate command data
     */
    public function validate(): array
    {
        $errors = [];

        if (empty($this->quoteUuid)) {
            $errors[] = 'Quote UUID is required';
        }

        if (empty($this->tenantId)) {
            $errors[] = 'Tenant ID is required';
        }

        if (empty($this->userId)) {
            $errors[] = 'User ID is required';
        }

        if ($this->paymentMethod && !in_array($this->paymentMethod, ['bank_transfer', 'cash', 'other'])) {
            $errors[] = 'Invalid payment method';
        }

        if ($this->specialInstructions && strlen($this->specialInstructions) > 1000) {
            $errors[] = 'Special instructions must not exceed 1000 characters';
        }

        return $errors;
    }

    /**
     * Get default payment schedule
     */
    public function getPaymentSchedule(): array
    {
        if ($this->paymentSchedule) {
            return $this->paymentSchedule;
        }

        // Default: 50% down payment, 50% on delivery
        return [
            'down_payment_percentage' => 50,
            'balance_on_delivery' => true,
        ];
    }

    /**
     * Convert to array for logging/debugging
     */
    public function toArray(): array
    {
        return [
            'quote_uuid' => $this->quoteUuid,
            'tenant_id' => $this->tenantId,
            'user_id' => $this->userId,
            'has_custom_delivery_address' => $this->deliveryAddress !== null,
            'payment_method' => $this->paymentMethod,
            'has_custom_payment_schedule' => $this->paymentSchedule !== null,
            'has_special_instructions' => $this->specialInstructions !== null,
            'ip_address' => $this->ipAddress,
        ];
    }
}
