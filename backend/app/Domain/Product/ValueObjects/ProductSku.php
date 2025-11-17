<?php

namespace App\Domain\Product\ValueObjects;

use InvalidArgumentException;

class ProductSku
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

    public function equals(ProductSku $other): bool
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
            throw new InvalidArgumentException('Product SKU cannot be empty');
        }

        if (strlen($value) < 2) {
            throw new InvalidArgumentException('Product SKU must be at least 2 characters long');
        }

        if (strlen($value) > 50) {
            throw new InvalidArgumentException('Product SKU cannot exceed 50 characters');
        }

        if (!preg_match('/^[A-Z0-9\-_]+$/', strtoupper($value))) {
            throw new InvalidArgumentException('Product SKU must contain only alphanumeric characters, hyphens, and underscores');
        }
    }
}