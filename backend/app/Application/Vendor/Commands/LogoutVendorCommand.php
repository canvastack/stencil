<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Command for vendor logout
 * 
 * Represents the intent to logout a vendor user by revoking their authentication token.
 */
final class LogoutVendorCommand
{
    public function __construct(
        public readonly int $tenantId,
        public readonly string $userId,
        public readonly string $tokenId
    ) {
    }
}
