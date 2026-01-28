<?php

namespace App\Application\Order\Queries;

/**
 * List Orders Query
 * 
 * Query DTO for retrieving paginated order lists.
 * Supports filtering, sorting, and search functionality.
 * 
 * Database Integration:
 * - Queries orders table with filters
 * - Supports pagination and sorting
 * - Respects tenant isolation
 */
class ListOrdersQuery
{
    /**
     * @param string $tenantId Tenant UUID for isolation
     * @param int $page Page number (1-based)
     * @param int $perPage Items per page
     * @param string|null $status Filter by order status
     * @param string|null $paymentStatus Filter by payment status
     * @param string|null $customerId Filter by customer UUID
     * @param string|null $vendorId Filter by vendor UUID
     * @param string|null $search Search in order number, customer name
     * @param string|null $sortBy Sort field (created_at, total_amount, etc.)
     * @param string $sortDirection Sort direction (asc, desc)
     * @param string|null $dateFrom Filter orders from date (Y-m-d)
     * @param string|null $dateTo Filter orders to date (Y-m-d)
     * @param array $metadata Additional query metadata
     */
    public function __construct(
        public readonly string $tenantId,
        public readonly int $page = 1,
        public readonly int $perPage = 15,
        public readonly ?string $status = null,
        public readonly ?string $paymentStatus = null,
        public readonly ?string $customerId = null,
        public readonly ?string $vendorId = null,
        public readonly ?string $search = null,
        public readonly ?string $sortBy = 'created_at',
        public readonly string $sortDirection = 'desc',
        public readonly ?string $dateFrom = null,
        public readonly ?string $dateTo = null,
        public readonly array $metadata = []
    ) {}

    /**
     * Validate query parameters
     */
    public function validate(): array
    {
        $errors = [];

        if (empty($this->tenantId)) {
            $errors[] = 'Tenant ID is required';
        }

        if ($this->page < 1) {
            $errors[] = 'Page must be greater than 0';
        }

        if ($this->perPage < 1 || $this->perPage > 100) {
            $errors[] = 'Per page must be between 1 and 100';
        }

        if ($this->status && !$this->isValidStatus($this->status)) {
            $errors[] = 'Invalid order status';
        }

        if ($this->paymentStatus && !$this->isValidPaymentStatus($this->paymentStatus)) {
            $errors[] = 'Invalid payment status';
        }

        if ($this->sortBy && !$this->isValidSortField($this->sortBy)) {
            $errors[] = 'Invalid sort field';
        }

        if (!in_array($this->sortDirection, ['asc', 'desc'])) {
            $errors[] = 'Sort direction must be asc or desc';
        }

        if ($this->dateFrom && !$this->isValidDate($this->dateFrom)) {
            $errors[] = 'Invalid date from format (use Y-m-d)';
        }

        if ($this->dateTo && !$this->isValidDate($this->dateTo)) {
            $errors[] = 'Invalid date to format (use Y-m-d)';
        }

        return $errors;
    }

    /**
     * Check if has filters applied
     */
    public function hasFilters(): bool
    {
        return $this->status !== null ||
               $this->paymentStatus !== null ||
               $this->customerId !== null ||
               $this->vendorId !== null ||
               $this->search !== null ||
               $this->dateFrom !== null ||
               $this->dateTo !== null;
    }

    /**
     * Check if has search term
     */
    public function hasSearch(): bool
    {
        return !empty($this->search);
    }

    /**
     * Check if has date range filter
     */
    public function hasDateRange(): bool
    {
        return $this->dateFrom !== null || $this->dateTo !== null;
    }

    /**
     * Get offset for pagination
     */
    public function getOffset(): int
    {
        return ($this->page - 1) * $this->perPage;
    }

    /**
     * Get active filters as array
     */
    public function getActiveFilters(): array
    {
        $filters = [];

        if ($this->status) {
            $filters['status'] = $this->status;
        }

        if ($this->paymentStatus) {
            $filters['payment_status'] = $this->paymentStatus;
        }

        if ($this->customerId) {
            $filters['customer_id'] = $this->customerId;
        }

        if ($this->vendorId) {
            $filters['vendor_id'] = $this->vendorId;
        }

        if ($this->dateFrom) {
            $filters['date_from'] = $this->dateFrom;
        }

        if ($this->dateTo) {
            $filters['date_to'] = $this->dateTo;
        }

        return $filters;
    }

    /**
     * Convert to array for logging/debugging
     */
    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenantId,
            'page' => $this->page,
            'per_page' => $this->perPage,
            'offset' => $this->getOffset(),
            'status' => $this->status,
            'payment_status' => $this->paymentStatus,
            'customer_id' => $this->customerId,
            'vendor_id' => $this->vendorId,
            'search' => $this->search,
            'sort_by' => $this->sortBy,
            'sort_direction' => $this->sortDirection,
            'date_from' => $this->dateFrom,
            'date_to' => $this->dateTo,
            'has_filters' => $this->hasFilters(),
            'has_search' => $this->hasSearch(),
            'has_date_range' => $this->hasDateRange(),
            'active_filters' => $this->getActiveFilters(),
            'metadata_keys' => array_keys($this->metadata),
        ];
    }

    private function isValidStatus(string $status): bool
    {
        $validStatuses = [
            'draft', 'pending', 'vendor_sourcing', 'vendor_negotiation',
            'customer_quote', 'awaiting_payment', 'partial_payment', 'full_payment',
            'in_production', 'quality_control', 'shipping', 'completed',
            'cancelled', 'refunded'
        ];

        return in_array($status, $validStatuses);
    }

    private function isValidPaymentStatus(string $paymentStatus): bool
    {
        $validStatuses = ['unpaid', 'partially_paid', 'paid', 'refunded'];
        return in_array($paymentStatus, $validStatuses);
    }

    private function isValidSortField(string $sortBy): bool
    {
        $validFields = [
            'created_at', 'updated_at', 'order_number', 'total_amount',
            'status', 'payment_status', 'customer_id', 'vendor_id',
            'estimated_delivery', 'shipped_at', 'delivered_at'
        ];

        return in_array($sortBy, $validFields);
    }

    private function isValidDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
}