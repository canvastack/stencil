<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Command: Onboard Vendor
 * 
 * Represents the intent to onboard a new vendor to the portal.
 */
final class OnboardVendorCommand
{
    public function __construct(
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly int $adminUserId,
        public readonly bool $sendWelcomeEmail = true
    ) {
    }
}
