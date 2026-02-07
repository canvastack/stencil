<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Queries\ListQuotesQuery;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;

/**
 * List Quotes Use Case
 * 
 * Handles the business logic for listing quotes with filtering, searching, and pagination.
 * Implements CQRS pattern for read operations.
 * 
 * Requirements: 8.1, 8.3, 8.4, 8.5
 */
final class ListQuotesUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository
    ) {}

    /**
     * Execute the use case
     * 
     * @param ListQuotesQuery $query Query parameters
     * @return array{data: array, meta: array} Paginated quotes with metadata
     */
    public function execute(ListQuotesQuery $query): array
    {
        // Build filters array from query parameters
        $filters = [];
        
        // Status filter
        if ($query->status !== null) {
            $filters['status'] = $query->status;
        }
        
        // Date range filters
        if ($query->dateFrom !== null) {
            $filters['date_from'] = $query->dateFrom;
        }
        
        if ($query->dateTo !== null) {
            $filters['date_to'] = $query->dateTo;
        }
        
        // Vendor filter
        if ($query->vendorId !== null) {
            $filters['vendor_id'] = $query->vendorId;
        }
        
        // Order filter
        if ($query->orderId !== null) {
            $filters['order_id'] = $query->orderId;
        }
        
        // Search filter
        // Searches across: quote_number, order_number, vendor_name, customer_name
        if ($query->search !== null && trim($query->search) !== '') {
            $filters['search'] = trim($query->search);
        }
        
        // Execute repository query with filters
        $result = $this->quoteRepository->list(
            tenantId: $query->tenantId,
            filters: $filters,
            sortBy: $query->sortBy,
            sortOrder: $query->sortOrder,
            page: $query->page,
            perPage: $query->perPage
        );
        
        return [
            'data' => $result['data'],
            'meta' => [
                'current_page' => $result['page'],
                'last_page' => (int) ceil($result['total'] / $result['per_page']),
                'per_page' => $result['per_page'],
                'total' => $result['total'],
                'from' => ($result['page'] - 1) * $result['per_page'] + 1,
                'to' => min($result['page'] * $result['per_page'], $result['total']),
            ],
        ];
    }
}
