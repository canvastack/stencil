<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Command: Expire Quotes
 * 
 * Represents the intent to expire quotes that have passed their expiration date.
 * This is typically executed by a scheduled job.
 */
final class ExpireQuotesCommand
{
    public function __construct(
        public readonly ?int $tenantId = null, // Optional: expire for specific tenant only
        public readonly ?int $limit = null // Optional: limit number of quotes to expire per run
    ) {
    }
}
