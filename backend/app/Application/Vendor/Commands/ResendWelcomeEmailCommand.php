<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Resend Welcome Email Command
 * 
 * Command to resend the welcome email to a vendor.
 * Requirements: 17.8
 */
class ResendWelcomeEmailCommand
{
    public function __construct(
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly int $adminUserId
    ) {
    }
}
