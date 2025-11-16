<?php

namespace App\Domain\Product\ValueObjects;

use InvalidArgumentException;

class ProductName
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

    public function equals(ProductName $other): bool
    {
        return $this->value === $other->getValue();
    }

    public function getSlug(): string
    {
        return strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', trim($this->value, '-')));
    }

    public function __toString(): string
    {
        return $this->value;
    }

    private function validate(string $value): void
    {
        $value = trim($value);
        
        if (empty($value)) {
            throw new InvalidArgumentException('Product name cannot be empty');
        }

        if (strlen($value) < 2) {
            throw new InvalidArgumentException('Product name must be at least 2 characters long');
        }

        if (strlen($value) > 255) {
            throw new InvalidArgumentException('Product name cannot exceed 255 characters');
        }
    }
}