<?php

namespace App\Domain\Vendor\Enums;

enum VendorStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case SUSPENDED = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Active',
            self::INACTIVE => 'Inactive',
            self::SUSPENDED => 'Suspended',
        };
    }

    public function canReceiveOrders(): bool
    {
        return $this === self::ACTIVE;
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'active' => self::ACTIVE,
            'inactive' => self::INACTIVE,
            'suspended' => self::SUSPENDED,
            default => throw new \InvalidArgumentException("Invalid vendor status: {$status}"),
        };
    }
}