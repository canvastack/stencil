<?php

namespace App\Domain\Product\Enums;

enum ProductType: string
{
    case PHYSICAL = 'physical';
    case DIGITAL = 'digital';
    case SERVICE = 'service';

    public function label(): string
    {
        return match ($this) {
            self::PHYSICAL => 'Physical Product',
            self::DIGITAL => 'Digital Product',
            self::SERVICE => 'Service',
        };
    }

    public function requiresShipping(): bool
    {
        return $this === self::PHYSICAL;
    }

    public function requiresStock(): bool
    {
        return in_array($this, [self::PHYSICAL, self::DIGITAL]);
    }

    public static function fromString(string $type): self
    {
        return match (strtolower($type)) {
            'physical' => self::PHYSICAL,
            'digital' => self::DIGITAL,
            'service' => self::SERVICE,
            default => throw new \InvalidArgumentException("Invalid product type: {$type}"),
        };
    }
}