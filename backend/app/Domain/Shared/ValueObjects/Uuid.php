<?php

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;
use Ramsey\Uuid\Uuid as RamseyUuid;

class Uuid
{
    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = $value;
    }

    public static function generate(): self
    {
        return new self(RamseyUuid::uuid4()->toString());
    }

    public static function fromString(string $uuid): self
    {
        return new self($uuid);
    }

    private function validate(string $value): void
    {
        if (!RamseyUuid::isValid($value)) {
            throw new InvalidArgumentException("Invalid UUID format: {$value}");
        }
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function equals(Uuid $other): bool
    {
        return $this->value === $other->value;
    }
}