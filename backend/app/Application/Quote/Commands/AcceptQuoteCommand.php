<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

/**
 * AcceptQuoteCommand
 * 
 * Command DTO for accepting a quote with delivery estimate.
 * 
 * Requirements: 6.2, 6.3, 6.4
 */
final class AcceptQuoteCommand
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly int $estimatedDeliveryDays,
        public readonly ?string $notes = null,
        public readonly ?int $userId = null,
        public readonly ?string $ipAddress = null,
        public readonly ?string $userAgent = null
    ) {}
}
