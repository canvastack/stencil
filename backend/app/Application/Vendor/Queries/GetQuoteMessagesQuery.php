<?php

declare(strict_types=1);

namespace App\Application\Vendor\Queries;

/**
 * Query: Get Quote Messages
 * 
 * Represents the intent to retrieve all messages for a specific quote.
 */
final class GetQuoteMessagesQuery
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly int $page = 1,
        public readonly int $perPage = 50
    ) {
    }
}
