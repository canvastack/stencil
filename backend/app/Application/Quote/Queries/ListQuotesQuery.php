<?php

declare(strict_types=1);

namespace App\Application\Quote\Queries;

/**
 * Query for listing quotes with filtering and pagination
 * 
 * Follows CQRS pattern for read operations.
 * Supports filtering by status, date range, vendor, and search.
 */
final class ListQuotesQuery
{
    public function __construct(
        public readonly int $tenantId,
        public readonly ?string $status = null,
        public readonly ?string $dateFrom = null,
        public readonly ?string $dateTo = null,
        public readonly ?int $vendorId = null,
        public readonly ?int $orderId = null,
        public readonly ?string $search = null,
        public readonly string $sortBy = 'created_at',
        public readonly string $sortOrder = 'desc',
        public readonly int $page = 1,
        public readonly int $perPage = 20
    ) {}
}
