<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Command for requesting password reset
 * 
 * Represents the intent to request a password reset for a vendor user.
 */
final class RequestPasswordResetCommand
{
    public function __construct(
        public readonly string $email,
        public readonly string $tenantId
    ) {
    }
}
