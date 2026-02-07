<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

/**
 * Command to accept a quote
 */
final class AcceptQuoteCommand
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $vendorUserId,
        public readonly int $tenantId,
        public readonly ?string $notes = null,
        public readonly ?int $estimatedDeliveryDays = null
    ) {}
}
