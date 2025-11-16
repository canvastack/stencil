<?php

namespace App\Domain\Vendor\ValueObjects;

use InvalidArgumentException;

class VendorEmail
{
    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = strtolower(trim($value));
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function equals(VendorEmail $other): bool
    {
        return $this->value === $other->getValue();
    }

    public function __toString(): string
    {
        return $this->value;
    }

    private function validate(string $value): void
    {
        $value = trim($value);
        
        if (empty($value)) {
            throw new InvalidArgumentException('Vendor email cannot be empty');
        }

        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid vendor email address format');
        }
    }
}