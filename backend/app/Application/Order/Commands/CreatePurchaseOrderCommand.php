<?php

namespace App\Application\Order\Commands;

/**
 * Create Purchase Order Command
 * 
 * Command DTO for creating new purchase orders.
 * Follows CQRS pattern for write operations.
 * 
 * Database Integration:
 * - Maps to orders table fields
 * - Uses existing JSON structures for items and metadata
 * - Follows existing foreign key patterns
 */
class CreatePurchaseOrderCommand
{
    /**
     * @param string $tenantId Tenant UUID (maps to tenants.uuid)
     * @param string $customerId Customer UUID (maps to customers.uuid)
     * @param float $totalAmount Total order amount
     * @param string $currency Currency code (e.g., 'IDR')
     * @param array $items Order items with product details
     * @param array $specifications Custom specifications and requirements (optional)
     * @param string|null $deliveryAddress Shipping address JSON (optional)
     * @param string|null $requiredDeliveryDate ISO date string (optional)
     * @param string|null $billingAddress Billing address JSON (optional)
     * @param string|null $customerNotes Customer provided notes (optional)
     * @param array $metadata Additional order metadata (optional)
     */
    public function __construct(
        public readonly string $tenantId,
        public readonly string $customerId,
        public readonly float $totalAmount,
        public readonly string $currency,
        public readonly array $items,
        public readonly array $specifications = [],
        public readonly ?string $deliveryAddress = null,
        public readonly ?string $requiredDeliveryDate = null,
        public readonly ?string $billingAddress = null,
        public readonly ?string $customerNotes = null,
        public readonly array $metadata = []
    ) {}

    /**
     * Validate command data
     */
    public function validate(): array
    {
        $errors = [];

        if (empty($this->tenantId)) {
            $errors[] = 'Tenant ID is required';
        }

        if (empty($this->customerId)) {
            $errors[] = 'Customer ID is required';
        }

        if ($this->totalAmount <= 0) {
            $errors[] = 'Total amount must be greater than 0';
        }

        if (empty($this->currency)) {
            $errors[] = 'Currency is required';
        }

        if (empty($this->items)) {
            $errors[] = 'Order items are required';
        }

        foreach ($this->items as $index => $item) {
            if (!isset($item['product_id'])) {
                $errors[] = "Item {$index}: product_id is required";
            }

            if (!isset($item['quantity']) || $item['quantity'] <= 0) {
                $errors[] = "Item {$index}: quantity must be greater than 0";
            }

            // Allow both 'price' and 'unit_price' for backward compatibility
            $price = $item['price'] ?? $item['unit_price'] ?? null;
            if ($price === null || $price < 0) {
                $errors[] = "Item {$index}: price/unit_price must be non-negative";
            }
        }

        return $errors;
    }

    /**
     * Get total amount in cents (for database storage)
     */
    public function getTotalAmountInCents(): int
    {
        return (int) ($this->totalAmount * 100);
    }

    /**
     * Calculate total amount from items (for validation)
     */
    public function calculateTotalFromItems(): float
    {
        $total = 0.0;

        foreach ($this->items as $item) {
            $price = $item['price'] ?? $item['unit_price'] ?? 0;
            $quantity = $item['quantity'] ?? 0;
            $total += $price * $quantity;
        }

        return $total;
    }

    /**
     * Get order items with validation
     */
    public function getValidatedItems(): array
    {
        $validatedItems = [];

        foreach ($this->items as $item) {
            $price = $item['price'] ?? $item['unit_price'] ?? 0;
            
            $validatedItems[] = [
                'product_id' => $item['product_id'],
                'quantity' => (int) $item['quantity'],
                'price' => (int) ($price * 100), // Convert to cents
                'customization' => $item['customization'] ?? [],
                'specifications' => $item['specifications'] ?? [],
                'notes' => $item['notes'] ?? null,
            ];
        }

        return $validatedItems;
    }

    /**
     * Get delivery address with default if not provided
     */
    public function getDeliveryAddress(): string
    {
        if ($this->deliveryAddress) {
            return $this->deliveryAddress;
        }

        // Default address structure
        return json_encode([
            'street' => '123 Default Street',
            'city' => 'Jakarta',
            'state' => 'DKI Jakarta',
            'postal_code' => '12345',
            'country' => 'ID'
        ]);
    }

    /**
     * Get required delivery date with default if not provided
     */
    public function getRequiredDeliveryDate(): string
    {
        if ($this->requiredDeliveryDate) {
            return $this->requiredDeliveryDate;
        }

        // Default to 30 days from now
        return now()->addDays(30)->toISOString();
    }

    /**
     * Convert to array for logging/debugging
     */
    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenantId,
            'customer_id' => $this->customerId,
            'total_amount' => $this->totalAmount,
            'currency' => $this->currency,
            'items_count' => count($this->items),
            'calculated_total' => $this->calculateTotalFromItems(),
            'delivery_address' => $this->deliveryAddress !== null,
            'required_delivery_date' => $this->requiredDeliveryDate,
            'has_billing_address' => $this->billingAddress !== null,
            'has_customer_notes' => $this->customerNotes !== null,
            'metadata_keys' => array_keys($this->metadata),
        ];
    }
}