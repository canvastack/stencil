<?php

namespace App\Domain\Security\ValueObjects;

/**
 * Two-Factor Authentication Verification Result Value Object
 * 
 * Contains the result of a 2FA verification attempt.
 */
class TwoFactorVerification
{
    public function __construct(
        private bool $success,
        private string $message,
        private bool $usedBackupCode = false,
        private ?array $metadata = null
    ) {}

    public function isSuccess(): bool
    {
        return $this->success;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function usedBackupCode(): bool
    {
        return $this->usedBackupCode;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'used_backup_code' => $this->usedBackupCode,
            'metadata' => $this->metadata
        ];
    }
}