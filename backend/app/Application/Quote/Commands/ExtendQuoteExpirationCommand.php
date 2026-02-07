<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

use DateTimeImmutable;

/**
 * Command for extending a quote's expiration date
 * 
 * Allows admins to extend the expiration date of quotes
 * that are expired or near expiration.
 */
final class ExtendQuoteExpirationCommand
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $tenantId,
        public readonly DateTimeImmutable $newExpiresAt,
        public readonly ?int $userId = null
    ) {}
}
