<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

/**
 * Command to reject a quote
 */
final class RejectQuoteCommand
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $vendorUserId,
        public readonly int $tenantId,
        public readonly string $reason
    ) {}
}
