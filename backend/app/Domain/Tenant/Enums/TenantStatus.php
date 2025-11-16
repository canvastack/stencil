<?php

namespace App\Domain\Tenant\Enums;

enum TenantStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case SUSPENDED = 'suspended';
    case TRIAL = 'trial';

    public function label(): string
    {
        return match($this) {
            self::ACTIVE => 'Active',
            self::INACTIVE => 'Inactive',
            self::SUSPENDED => 'Suspended',
            self::TRIAL => 'Trial',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::ACTIVE => 'green',
            self::INACTIVE => 'gray',
            self::SUSPENDED => 'red',
            self::TRIAL => 'blue',
        };
    }

    public function isOperational(): bool
    {
        return in_array($this, [self::ACTIVE, self::TRIAL]);
    }
}