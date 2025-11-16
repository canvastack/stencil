<?php

namespace App\Domain\Tenant\Enums;

enum DomainStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case FAILED = 'failed';
    case SUSPENDED = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending Verification',
            self::ACTIVE => 'Active',
            self::FAILED => 'Failed Verification',
            self::SUSPENDED => 'Suspended',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PENDING => 'Domain mapping is pending DNS verification',
            self::ACTIVE => 'Domain mapping is active and working',
            self::FAILED => 'Domain mapping failed DNS verification',
            self::SUSPENDED => 'Domain mapping has been suspended',
        };
    }

    public function canBeActivated(): bool
    {
        return in_array($this, [self::PENDING, self::FAILED]);
    }

    public function canBeSuspended(): bool
    {
        return $this === self::ACTIVE;
    }

    public function isOperational(): bool
    {
        return $this === self::ACTIVE;
    }

    public static function availableStatuses(): array
    {
        return [
            self::PENDING,
            self::ACTIVE,
            self::FAILED,
            self::SUSPENDED,
        ];
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'pending' => self::PENDING,
            'active' => self::ACTIVE,
            'failed' => self::FAILED,
            'suspended' => self::SUSPENDED,
            default => throw new \InvalidArgumentException("Invalid domain status: {$status}"),
        };
    }
}