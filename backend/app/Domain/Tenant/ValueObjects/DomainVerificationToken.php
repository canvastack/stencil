<?php

namespace App\Domain\Tenant\ValueObjects;

use InvalidArgumentException;
use Illuminate\Support\Str;

class DomainVerificationToken
{
    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = $value;
    }

    public static function generate(): self
    {
        return new self(Str::random(64));
    }

    public static function fromString(string $value): self
    {
        return new self($value);
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function equals(DomainVerificationToken $other): bool
    {
        return $this->value === $other->getValue();
    }

    public function __toString(): string
    {
        return $this->value;
    }

    private function validate(string $value): void
    {
        if (empty(trim($value))) {
            throw new InvalidArgumentException('Domain verification token cannot be empty');
        }

        if (strlen($value) < 32) {
            throw new InvalidArgumentException('Domain verification token must be at least 32 characters');
        }

        if (strlen($value) > 255) {
            throw new InvalidArgumentException('Domain verification token cannot exceed 255 characters');
        }

        if (!preg_match('/^[a-zA-Z0-9]+$/', $value)) {
            throw new InvalidArgumentException('Domain verification token must contain only alphanumeric characters');
        }
    }
}
