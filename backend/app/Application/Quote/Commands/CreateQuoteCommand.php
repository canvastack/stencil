<?php

declare(strict_types=1);

namespace App\Application\Quote\Commands;

/**
 * Command for creating a new quote
 * 
 * Encapsulates all data needed to create a quote in the system.
 * Follows CQRS pattern for write operations.
 */
final class CreateQuoteCommand
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $orderId,
        public readonly int $vendorId,
        public readonly int $productId,
        public readonly int $quantity,
        public readonly array $specifications,
        public readonly ?string $notes,
        public readonly ?int $customerId = null,
        public readonly ?string $type = 'vendor_to_company'
    ) {}
}
