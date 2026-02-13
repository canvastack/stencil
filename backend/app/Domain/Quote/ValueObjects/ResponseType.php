<?php

declare(strict_types=1);

namespace App\Domain\Quote\ValueObjects;

use InvalidArgumentException;

/**
 * ResponseType Value Object
 * 
 * Represents the type of response a vendor gives to a quote.
 * Requirements: 6.12
 */
final class ResponseType
{
    private const ACCEPT = 'accept';
    private const REJECT = 'reject';
    private const COUNTER = 'counter';

    private const VALID_TYPES = [
        self::ACCEPT,
        self::REJECT,
        self::COUNTER,
    ];

    private string $value;

    private function __construct(string $value)
    {
        if (!in_array($value, self::VALID_TYPES, true)) {
            throw new InvalidArgumentException(
                sprintf('Invalid response type: %s. Valid types are: %s', 
                    $value, 
                    implode(', ', self::VALID_TYPES)
                )
            );
        }

        $this->value = $value;
    }

    public static function accept(): self
    {
        return new self(self::ACCEPT);
    }

    public static function reject(): self
    {
        return new self(self::REJECT);
    }

    public static function counter(): self
    {
        return new self(self::COUNTER);
    }

    public static function fromString(string $value): self
    {
        return new self($value);
    }

    public function isAccept(): bool
    {
        return $this->value === self::ACCEPT;
    }

    public function isReject(): bool
    {
        return $this->value === self::REJECT;
    }

    public function isCounter(): bool
    {
        return $this->value === self::COUNTER;
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
