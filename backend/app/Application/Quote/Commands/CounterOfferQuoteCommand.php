<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

/**
 * CounterOfferQuoteCommand
 * 
 * Command DTO for submitting a counter offer on a quote.
 * Supports item-by-item pricing with detailed breakdown.
 * 
 * Requirements: 6.8, 6.9, 6.10
 */
final class CounterOfferQuoteCommand
{
    /**
     * @param array<int, array{product_id: string, counter_unit_price: float, notes?: string}> $items
     */
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly array $items,
        public readonly ?string $notes = null,
        public readonly ?int $estimatedDeliveryDays = null,
        public readonly ?int $userId = null,
        public readonly ?string $ipAddress = null,
        public readonly ?string $userAgent = null
    ) {}
}
