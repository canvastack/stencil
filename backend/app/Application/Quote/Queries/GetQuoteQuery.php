<?php

declare(strict_types=1);

namespace App\Application\Quote\Queries;

/**
 * Query for retrieving a single quote by UUID
 * 
 * Follows CQRS pattern for read operations.
 */
final class GetQuoteQuery
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $tenantId
    ) {}
}
