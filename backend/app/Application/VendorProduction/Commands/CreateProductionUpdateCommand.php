<?php

namespace App\Application\VendorProduction\Commands;

/**
 * Command to create a new production update
 */
class CreateProductionUpdateCommand
{
    public function __construct(
        public readonly string $purchaseOrderUuid,
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly string $status,
        public readonly int $progressPercentage,
        public readonly ?string $notes,
        public readonly ?string $estimatedCompletionDate,
        public readonly array $photos,
        public readonly bool $isMilestone,
        public readonly int $createdBy
    ) {}
}
