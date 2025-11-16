<?php

namespace App\Domain\Vendor\ValueObjects;

use InvalidArgumentException;

class VendorName
{
    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = trim($value);
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function equals(VendorName $other): bool
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
            throw new InvalidArgumentException('Vendor name cannot be empty');
        }

        if (strlen($value) < 2) {
            throw new InvalidArgumentException('Vendor name must be at least 2 characters long');
        }

        if (strlen($value) > 255) {
            throw new InvalidArgumentException('Vendor name cannot exceed 255 characters');
        }
    }
}