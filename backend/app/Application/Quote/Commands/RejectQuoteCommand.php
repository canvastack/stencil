<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

/**
 * RejectQuoteCommand
 * 
 * Command DTO for rejecting a quote with reason.
 * 
 * Requirements: 6.5, 6.6, 6.7
 */
final class RejectQuoteCommand
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly string $rejectionReason,
        public readonly ?int $userId = null,
        public readonly ?string $ipAddress = null,
        public readonly ?string $userAgent = null
    ) {}
}
