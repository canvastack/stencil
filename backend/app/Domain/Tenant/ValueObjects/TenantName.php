<?php

namespace App\Domain\Tenant\ValueObjects;

use InvalidArgumentException;

class TenantName
{
    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = trim($value);
    }

    private function validate(string $value): void
    {
        $value = trim($value);
        
        if (empty($value)) {
            throw new InvalidArgumentException('Tenant name cannot be empty');
        }

        if (strlen($value) < 2) {
            throw new InvalidArgumentException('Tenant name must be at least 2 characters long');
        }

        if (strlen($value) > 100) {
            throw new InvalidArgumentException('Tenant name cannot exceed 100 characters');
        }

        // Check for invalid characters (basic validation)
        if (!preg_match('/^[a-zA-Z0-9\s\-_.,&()]+$/', $value)) {
            throw new InvalidArgumentException('Tenant name contains invalid characters');
        }
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function equals(TenantName $other): bool
    {
        return $this->value === $other->value;
    }
}