<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

/**
 * Command for sending a quote to a vendor
 * 
 * Triggers the quote sending workflow including status update
 * and notification dispatch.
 */
final class SendQuoteToVendorCommand
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $tenantId,
        public readonly ?string $customMessage = null
    ) {}
}
