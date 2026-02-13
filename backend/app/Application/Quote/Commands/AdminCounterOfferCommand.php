<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

/**
 * AdminCounterOfferCommand
 * 
 * Command for admin to counter vendor's counter offer.
 * Enables two-way negotiation between admin and vendor.
 */
final class AdminCounterOfferCommand
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $tenantId,
        public readonly int $adminCounterOffer,
        public readonly array $items,
        public readonly ?string $notes,
        public readonly int $userId,
        public readonly string $ipAddress,
        public readonly string $userAgent
    ) {}
}
