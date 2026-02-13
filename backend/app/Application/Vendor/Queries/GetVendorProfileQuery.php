<?php

declare(strict_types=1);

namespace App\Application\Vendor\Queries;

/**
 * Query: Get Vendor Profile
 * 
 * Represents the intent to retrieve vendor profile information.
 */
final class GetVendorProfileQuery
{
    public function __construct(
        public readonly int $vendorId,
        public readonly int $tenantId
    ) {
    }
}
