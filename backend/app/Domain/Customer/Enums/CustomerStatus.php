<?php

namespace App\Domain\Customer\Enums;

enum CustomerStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case INACTIVE = 'inactive';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Active',
            self::SUSPENDED => 'Suspended',
            self::INACTIVE => 'Inactive',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ACTIVE => 'Customer account is active and can place orders',
            self::SUSPENDED => 'Customer account is suspended due to policy violation',
            self::INACTIVE => 'Customer account is inactive and cannot place orders',
        };
    }

    public function canPlaceOrder(): bool
    {
        return $this === self::ACTIVE;
    }

    public function canBeActivated(): bool
    {
        return in_array($this, [self::SUSPENDED, self::INACTIVE]);
    }

    public function canBeSuspended(): bool
    {
        return $this === self::ACTIVE;
    }

    public static function availableStatuses(): array
    {
        return [
            self::ACTIVE,
            self::SUSPENDED,
            self::INACTIVE,
        ];
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'active' => self::ACTIVE,
            'suspended' => self::SUSPENDED,
            'inactive' => self::INACTIVE,
            default => throw new \InvalidArgumentException("Invalid customer status: {$status}"),
        };
    }
}