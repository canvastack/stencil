<?php

namespace App\Domain\Tenant\ValueObjects;

use InvalidArgumentException;
use Illuminate\Support\Str;

class TenantSlug
{
    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = $value;
    }

    public static function fromName(string $name): self
    {
        $slug = Str::slug($name);
        return new self($slug);
    }

    private function validate(string $value): void
    {
        if (empty($value)) {
            throw new InvalidArgumentException('Tenant slug cannot be empty');
        }

        if (strlen($value) < 2) {
            throw new InvalidArgumentException('Tenant slug must be at least 2 characters long');
        }

        if (strlen($value) > 50) {
            throw new InvalidArgumentException('Tenant slug cannot exceed 50 characters');
        }

        // Slug format validation
        if (!preg_match('/^[a-z0-9\-]+$/', $value)) {
            throw new InvalidArgumentException('Tenant slug must contain only lowercase letters, numbers, and hyphens');
        }

        // Cannot start or end with hyphen
        if (str_starts_with($value, '-') || str_ends_with($value, '-')) {
            throw new InvalidArgumentException('Tenant slug cannot start or end with a hyphen');
        }

        // Reserved slugs
        $reserved = ['admin', 'api', 'app', 'www', 'mail', 'ftp', 'root', 'system', 'platform'];
        if (in_array($value, $reserved)) {
            throw new InvalidArgumentException('Tenant slug is reserved and cannot be used');
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

    public function equals(TenantSlug $other): bool
    {
        return $this->value === $other->value;
    }
}