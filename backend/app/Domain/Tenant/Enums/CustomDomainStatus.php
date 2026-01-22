<?php

namespace App\Domain\Tenant\Enums;

enum CustomDomainStatus: string
{
    case PENDING_VERIFICATION = 'pending_verification';
    case VERIFIED = 'verified';
    case ACTIVE = 'active';
    case FAILED = 'failed';
    case SUSPENDED = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::PENDING_VERIFICATION => 'Pending Verification',
            self::VERIFIED => 'Verified',
            self::ACTIVE => 'Active',
            self::FAILED => 'Failed',
            self::SUSPENDED => 'Suspended',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PENDING_VERIFICATION => 'Domain is pending DNS/ownership verification',
            self::VERIFIED => 'Domain ownership verified, awaiting activation',
            self::ACTIVE => 'Domain is active and serving traffic',
            self::FAILED => 'Domain verification or configuration failed',
            self::SUSPENDED => 'Domain has been temporarily suspended',
        };
    }

    public function isVerified(): bool
    {
        return in_array($this, [self::VERIFIED, self::ACTIVE]);
    }

    public function isOperational(): bool
    {
        return $this === self::ACTIVE;
    }

    public function canBeActivated(): bool
    {
        return $this === self::VERIFIED;
    }

    public function canBeVerified(): bool
    {
        return in_array($this, [self::PENDING_VERIFICATION, self::FAILED]);
    }

    public function canBeSuspended(): bool
    {
        return in_array($this, [self::VERIFIED, self::ACTIVE]);
    }

    public static function availableStatuses(): array
    {
        return [
            self::PENDING_VERIFICATION,
            self::VERIFIED,
            self::ACTIVE,
            self::FAILED,
            self::SUSPENDED,
        ];
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'pending_verification' => self::PENDING_VERIFICATION,
            'verified' => self::VERIFIED,
            'active' => self::ACTIVE,
            'failed' => self::FAILED,
            'suspended' => self::SUSPENDED,
            default => throw new \InvalidArgumentException("Invalid custom domain status: {$status}"),
        };
    }
}
