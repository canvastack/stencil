<?php

namespace App\Domain\Order\ValueObjects;

use InvalidArgumentException;

class OrderNumber
{
    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = strtoupper(trim($value));
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function equals(OrderNumber $other): bool
    {
        return $this->value === $other->getValue();
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public static function generate(string $prefix = 'ORD'): self
    {
        $timestamp = date('Ymd');
        $random = strtoupper(bin2hex(random_bytes(3)));
        
        return new self($prefix . '-' . $timestamp . '-' . $random);
    }

    private function validate(string $value): void
    {
        $value = trim($value);
        
        if (empty($value)) {
            throw new InvalidArgumentException('Order number cannot be empty');
        }

        if (strlen($value) > 50) {
            throw new InvalidArgumentException('Order number cannot exceed 50 characters');
        }

        if (!preg_match('/^[A-Z0-9\-]+$/', strtoupper($value))) {
            throw new InvalidArgumentException('Order number must contain only alphanumeric characters and hyphens');
        }
    }
}