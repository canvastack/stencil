<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * AuthenticateVendorCommand
 * 
 * Command DTO for vendor authentication.
 * Contains credentials and metadata for login attempt.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */
final class AuthenticateVendorCommand
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
        public readonly string $ipAddress,
        public readonly string $userAgent,
        public readonly int $tenantId
    ) {}
}
