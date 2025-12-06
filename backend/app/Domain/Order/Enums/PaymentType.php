<?php

namespace App\Domain\Order\Enums;

enum PaymentType: string
{
    case DP50 = 'dp_50';
    case FULL100 = 'full_100';

    public function label(): string
    {
        return match ($this) {
            self::DP50 => 'DP 50%',
            self::FULL100 => 'Full Payment 100%',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::DP50 => 'Down Payment 50% - customer pays 50% upfront, 50% remaining',
            self::FULL100 => 'Full Payment 100% - customer pays full amount upfront',
        };
    }

    public function percentage(): int
    {
        return match ($this) {
            self::DP50 => 50,
            self::FULL100 => 100,
        };
    }
}