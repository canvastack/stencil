<?php

namespace App\Application\Order\Queries;

/**
 * Get Order Query
 * 
 * Query DTO for retrieving single order details.
 * Follows CQRS pattern for read operations.
 * 
 * Database Integration:
 * - Queries orders table by UUID
 * - Includes related data (customer, vendor, items)
 * - Respects tenant isolation
 */
class GetOrderQuery
{
    /**
     * @param string $orderUuid Order UUID (maps to orders.uuid)
     * @param string $tenantId Tenant UUID for isolation
     * @param bool $includeCustomer Include customer details
     * @param bool $includeVendor Include vendor details
     * @param bool $includeItems Include order items
     * @param bool $includePayments Include payment transactions
     * @param bool $includeNegotiations Include vendor negotiations
     */
    public function __construct(
        public readonly string $orderUuid,
        public readonly string $tenantId,
        public readonly bool $includeCustomer = true,
        public readonly bool $includeVendor = true,
        public readonly bool $includeItems = true,
        public readonly bool $includePayments = false,
        public readonly bool $includeNegotiations = false
    ) {}

    /**
     * Validate query parameters
     */
    public function validate(): array
    {
        $errors = [];

        if (empty($this->orderUuid)) {
            $errors[] = 'Order UUID is required';
        }

        if (empty($this->tenantId)) {
            $errors[] = 'Tenant ID is required';
        }

        return $errors;
    }

    /**
     * Get relations to include in query
     */
    public function getRelations(): array
    {
        $relations = [];

        if ($this->includeCustomer) {
            $relations[] = 'customer';
        }

        if ($this->includeVendor) {
            $relations[] = 'vendor';
        }

        if ($this->includePayments) {
            $relations[] = 'paymentTransactions';
        }

        if ($this->includeNegotiations) {
            $relations[] = 'vendorNegotiations';
        }

        return $relations;
    }

    /**
     * Check if should include financial data
     */
    public function includesFinancialData(): bool
    {
        return $this->includePayments;
    }

    /**
     * Check if should include vendor data
     */
    public function includesVendorData(): bool
    {
        return $this->includeVendor || $this->includeNegotiations;
    }

    /**
     * Convert to array for logging/debugging
     */
    public function toArray(): array
    {
        return [
            'order_uuid' => $this->orderUuid,
            'tenant_id' => $this->tenantId,
            'include_customer' => $this->includeCustomer,
            'include_vendor' => $this->includeVendor,
            'include_items' => $this->includeItems,
            'include_payments' => $this->includePayments,
            'include_negotiations' => $this->includeNegotiations,
            'relations' => $this->getRelations(),
            'includes_financial' => $this->includesFinancialData(),
            'includes_vendor' => $this->includesVendorData(),
        ];
    }
}