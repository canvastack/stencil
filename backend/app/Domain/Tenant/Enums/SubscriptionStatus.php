<?php

namespace App\Domain\Tenant\Enums;

enum SubscriptionStatus: string
{
    case ACTIVE = 'active';
    case EXPIRED = 'expired';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::ACTIVE => 'Active',
            self::EXPIRED => 'Expired',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::ACTIVE => 'green',
            self::EXPIRED => 'yellow',
            self::CANCELLED => 'red',
        };
    }

    public function isValid(): bool
    {
        return $this === self::ACTIVE;
    }
}