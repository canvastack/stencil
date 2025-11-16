<?php

namespace App\Domain\Order\Enums;

enum OrderStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case SHIPPED = 'shipped';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::PROCESSING => 'Processing',
            self::SHIPPED => 'Shipped',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function canBeUpdated(): bool
    {
        return in_array($this, [self::PENDING, self::PROCESSING]);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this, [self::PENDING, self::PROCESSING]);
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'pending' => self::PENDING,
            'processing' => self::PROCESSING,
            'shipped' => self::SHIPPED,
            'completed' => self::COMPLETED,
            'cancelled' => self::CANCELLED,
            default => throw new \InvalidArgumentException("Invalid order status: {$status}"),
        };
    }
}