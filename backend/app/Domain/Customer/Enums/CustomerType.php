<?php

namespace App\Domain\Customer\Enums;

enum CustomerType: string
{
    case INDIVIDUAL = 'individual';
    case BUSINESS = 'business';

    public function label(): string
    {
        return match ($this) {
            self::INDIVIDUAL => 'Individual',
            self::BUSINESS => 'Business',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::INDIVIDUAL => 'Individual customer for personal purchases',
            self::BUSINESS => 'Business customer for corporate purchases',
        };
    }

    public function requiresCompanyInfo(): bool
    {
        return $this === self::BUSINESS;
    }

    public function requiresTaxNumber(): bool
    {
        return $this === self::BUSINESS;
    }

    public static function availableTypes(): array
    {
        return [
            self::INDIVIDUAL,
            self::BUSINESS,
        ];
    }

    public static function fromString(string $type): self
    {
        return match (strtolower($type)) {
            'individual' => self::INDIVIDUAL,
            'business' => self::BUSINESS,
            default => throw new \InvalidArgumentException("Invalid customer type: {$type}"),
        };
    }
}