<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Command for resetting password
 * 
 * Represents the intent to reset a vendor user's password using a reset token.
 */
final class ResetPasswordCommand
{
    public function __construct(
        public readonly string $email,
        public readonly string $token,
        public readonly string $password,
        public readonly string $passwordConfirmation,
        public readonly string $tenantId
    ) {
    }
}
