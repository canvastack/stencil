<?php

namespace App\Domain\Shipping\Enums;

enum ShipmentStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case SHIPPED = 'shipped';
    case IN_TRANSIT = 'in_transit';
    case DELIVERED = 'delivered';
    case FAILED = 'failed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'Pending',
            self::PROCESSING => 'Processing',
            self::SHIPPED => 'Shipped',
            self::IN_TRANSIT => 'In Transit',
            self::DELIVERED => 'Delivered',
            self::FAILED => 'Failed',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PENDING => 'gray',
            self::PROCESSING => 'blue',
            self::SHIPPED => 'indigo',
            self::IN_TRANSIT => 'cyan',
            self::DELIVERED => 'green',
            self::FAILED => 'red',
            self::CANCELLED => 'slate',
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::DELIVERED, self::FAILED, self::CANCELLED]);
    }
}
