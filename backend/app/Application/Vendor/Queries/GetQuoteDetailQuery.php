<?php

declare(strict_types=1);

namespace App\Application\Vendor\Queries;

/**
 * Query: Get Quote Detail
 * 
 * Represents the intent to retrieve detailed information about a specific quote.
 */
final class GetQuoteDetailQuery
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $vendorId,
        public readonly int $tenantId
    ) {
    }
}
