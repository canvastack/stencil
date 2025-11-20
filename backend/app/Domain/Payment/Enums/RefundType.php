<?php

namespace App\Domain\Payment\Enums;

enum RefundType: string
{
    case FULL = 'full';
    case PARTIAL = 'partial';

    public function label(): string
    {
        return match ($this) {
            self::FULL => 'Full Refund',
            self::PARTIAL => 'Partial Refund',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::FULL => 'Complete refund of the original transaction amount',
            self::PARTIAL => 'Refund of a portion of the original transaction amount',
        };
    }

    public function getColorClass(): string
    {
        return match ($this) {
            self::FULL => 'bg-red-100 text-red-800',
            self::PARTIAL => 'bg-orange-100 text-orange-800',
        };
    }

    public function getIconClass(): string
    {
        return match ($this) {
            self::FULL => 'fas fa-undo-alt',
            self::PARTIAL => 'fas fa-percentage',
        };
    }

    public static function fromString(string $type): self
    {
        return match (strtolower($type)) {
            'full' => self::FULL,
            'partial' => self::PARTIAL,
            default => throw new \ValueError("Invalid refund type: {$type}"),
        };
    }
}