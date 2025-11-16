<?php

namespace App\Domain\Product\ValueObjects;

use InvalidArgumentException;

class ProductDescription
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

    public function equals(ProductDescription $other): bool
    {
        return $this->value === $other->getValue();
    }

    public function getExcerpt(int $length = 150): string
    {
        if (strlen($this->value) <= $length) {
            return $this->value;
        }

        return substr($this->value, 0, $length) . '...';
    }

    public function __toString(): string
    {
        return $this->value;
    }

    private function validate(string $value): void
    {
        $value = trim($value);
        
        if (empty($value)) {
            throw new InvalidArgumentException('Product description cannot be empty');
        }

        if (strlen($value) > 5000) {
            throw new InvalidArgumentException('Product description cannot exceed 5000 characters');
        }
    }
}