<?php

declare(strict_types=1);

namespace App\Application\Vendor\Queries;

/**
 * Query: Get Vendor Quotes
 * 
 * Represents the intent to retrieve all quotes for a specific vendor.
 */
final class GetVendorQuotesQuery
{
    public function __construct(
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly ?string $status = null,
        public readonly int $page = 1,
        public readonly int $perPage = 15
    ) {
    }
}
