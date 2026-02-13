<?php

declare(strict_types=1);

namespace App\Domain\Quote\ValueObjects;

use InvalidArgumentException;

/**
 * SenderType Value Object
 * 
 * Represents the type of sender for a quote message (admin or vendor).
 * Requirements: 13.3, 13.4, 13.5
 */
final class SenderType
{
    private const ADMIN = 'admin';
    private const VENDOR = 'vendor';

    private const VALID_TYPES = [
        self::ADMIN,
        self::VENDOR,
    ];

    private string $value;

    private function __construct(string $value)
    {
        if (!in_array($value, self::VALID_TYPES, true)) {
            throw new InvalidArgumentException(
                sprintf('Invalid sender type: %s. Valid types are: %s', 
                    $value, 
                    implode(', ', self::VALID_TYPES)
                )
            );
        }

        $this->value = $value;
    }

    public static function admin(): self
    {
        return new self(self::ADMIN);
    }

    public static function vendor(): self
    {
        return new self(self::VENDOR);
    }

    public static function fromString(string $value): self
    {
        return new self($value);
    }

    public function isAdmin(): bool
    {
        return $this->value === self::ADMIN;
    }

    public function isVendor(): bool
    {
        return $this->value === self::VENDOR;
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
