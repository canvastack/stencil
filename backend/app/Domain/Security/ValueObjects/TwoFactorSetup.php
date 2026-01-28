<?php

namespace App\Domain\Security\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;

/**
 * Two-Factor Authentication Setup Value Object
 * 
 * Contains all information needed for setting up 2FA for a user.
 */
class TwoFactorSetup
{
    public function __construct(
        private UuidValueObject $userId,
        private string $secret,
        private string $qrCode,
        private array $backupCodes,
        private array $setupInstructions,
        private string $appName
    ) {}

    public function getUserId(): UuidValueObject
    {
        return $this->userId;
    }

    public function getSecret(): string
    {
        return $this->secret;
    }

    public function getQrCode(): string
    {
        return $this->qrCode;
    }

    public function getBackupCodes(): array
    {
        return $this->backupCodes;
    }

    public function getSetupInstructions(): array
    {
        return $this->setupInstructions;
    }

    public function getAppName(): string
    {
        return $this->appName;
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId->getValue(),
            'secret' => $this->secret,
            'qr_code' => $this->qrCode,
            'backup_codes' => $this->backupCodes,
            'setup_instructions' => $this->setupInstructions,
            'app_name' => $this->appName
        ];
    }
}