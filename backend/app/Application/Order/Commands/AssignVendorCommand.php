<?php

namespace App\Application\Order\Commands;

/**
 * Assign Vendor Command
 * 
 * Command DTO for assigning vendor to purchase order.
 * Handles vendor selection and quote acceptance.
 * 
 * Database Integration:
 * - Updates orders.vendor_id field
 * - Creates record in order_vendor_negotiations table
 * - Updates orders.status to vendor_negotiation
 */
class AssignVendorCommand
{
    /**
     * @param string $orderUuid Order UUID (maps to orders.uuid)
     * @param string $vendorUuid Vendor UUID (maps to vendors.uuid)
     * @param int $quotedPrice Vendor quoted price in cents
     * @param int $leadTimeDays Lead time in days
     * @param array $terms Negotiation terms and conditions
     * @param string|null $notes Additional notes about assignment
     */
    public function __construct(
        public readonly string $orderUuid,
        public readonly string $vendorUuid,
        public readonly int $quotedPrice,
        public readonly int $leadTimeDays,
        public readonly array $terms = [],
        public readonly ?string $notes = null
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

        if (empty($this->vendorUuid)) {
            $errors[] = 'Vendor UUID is required';
        }

        if ($this->quotedPrice < 0) {
            $errors[] = 'Quoted price cannot be negative';
        }

        if ($this->leadTimeDays <= 0) {
            $errors[] = 'Lead time must be greater than 0 days';
        }

        if ($this->leadTimeDays > 365) {
            $errors[] = 'Lead time cannot exceed 365 days';
        }

        return $errors;
    }

    /**
     * Get negotiation terms with defaults
     */
    public function getNegotiationTerms(): array
    {
        return array_merge([
            'payment_terms' => '50% down payment, 50% on completion',
            'quality_standards' => 'Standard PT CEX quality requirements',
            'delivery_method' => 'Pickup at vendor location',
            'warranty_period' => '30 days',
            'revision_limit' => 2,
        ], $this->terms);
    }

    /**
     * Calculate estimated delivery date
     */
    public function getEstimatedDeliveryDate(): string
    {
        $deliveryDate = new \DateTime();
        $deliveryDate->modify("+{$this->leadTimeDays} days");
        
        return $deliveryDate->format('Y-m-d H:i:s');
    }

    /**
     * Convert to array for database storage
     */
    public function toNegotiationArray(): array
    {
        return [
            'initial_offer' => $this->quotedPrice,
            'latest_offer' => $this->quotedPrice,
            'lead_time_days' => $this->leadTimeDays,
            'terms' => $this->getNegotiationTerms(),
            'status' => 'open',
            'round' => 1,
            'notes' => $this->notes,
            'estimated_delivery' => $this->getEstimatedDeliveryDate(),
        ];
    }

    /**
     * Convert to array for logging/debugging
     */
    public function toArray(): array
    {
        return [
            'order_uuid' => $this->orderUuid,
            'vendor_uuid' => $this->vendorUuid,
            'quoted_price' => $this->quotedPrice,
            'lead_time_days' => $this->leadTimeDays,
            'estimated_delivery' => $this->getEstimatedDeliveryDate(),
            'terms_count' => count($this->terms),
            'has_notes' => $this->notes !== null,
        ];
    }
}