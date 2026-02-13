<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Command: Update Vendor Profile
 * 
 * Represents the intent to update vendor profile information.
 */
final class UpdateVendorProfileCommand
{
    public function __construct(
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly ?string $email = null,
        public readonly ?string $phone = null,
        public readonly ?string $contactPerson = null,
        public readonly ?string $address = null,
        public readonly ?array $location = null
    ) {
    }
}
