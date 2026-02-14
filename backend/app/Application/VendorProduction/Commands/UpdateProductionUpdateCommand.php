<?php

namespace App\Application\VendorProduction\Commands;

/**
 * Command to update an existing production update
 */
class UpdateProductionUpdateCommand
{
    public function __construct(
        public readonly string $updateUuid,
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly ?string $status,
        public readonly ?int $progressPercentage,
        public readonly ?string $notes,
        public readonly ?string $estimatedCompletionDate,
        public readonly ?array $photosToAdd,
        public readonly ?array $photosToRemove,
        public readonly ?bool $isMilestone
    ) {}
}
