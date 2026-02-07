<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

/**
 * Command to submit a counter offer for a quote
 */
final class CounterQuoteCommand
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $vendorUserId,
        public readonly int $tenantId,
        public readonly int $counterOffer,
        public readonly ?string $notes = null,
        public readonly ?int $estimatedDeliveryDays = null
    ) {}
}
