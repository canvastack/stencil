<?php

namespace App\Domain\Tenant\ValueObjects;

use InvalidArgumentException;

class DomainName
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

    public function equals(DomainName $other): bool
    {
        return $this->value === $other->getValue();
    }

    public function isSubdomain(): bool
    {
        return substr_count($this->value, '.') > 1;
    }

    public function getTopLevelDomain(): string
    {
        $parts = explode('.', $this->value);
        return end($parts);
    }

    public function getDomainWithoutTld(): string
    {
        $parts = explode('.', $this->value);
        array_pop($parts); // Remove TLD
        return implode('.', $parts);
    }

    public function __toString(): string
    {
        return $this->value;
    }

    private function validate(string $value): void
    {
        if (empty(trim($value))) {
            throw new InvalidArgumentException('Domain name cannot be empty');
        }

        if (strlen($value) > 253) {
            throw new InvalidArgumentException('Domain name cannot exceed 253 characters');
        }

        if (!$this->isValidDomainFormat($value)) {
            throw new InvalidArgumentException('Invalid domain name format');
        }

        if ($this->hasInvalidCharacters($value)) {
            throw new InvalidArgumentException('Domain name contains invalid characters');
        }

        if ($this->isReservedDomain($value)) {
            throw new InvalidArgumentException('Domain name is reserved and cannot be used');
        }
    }

    private function isValidDomainFormat(string $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) !== false;
    }

    private function hasInvalidCharacters(string $value): bool
    {
        return !preg_match('/^[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]$/', $value);
    }

    private function isReservedDomain(string $value): bool
    {
        $reservedDomains = [
            'localhost',
            'example.com',
            'example.org',
            'example.net',
            'test.com',
            'canvastencil.com', // Platform domain
            'admin.canvastencil.com',
            'api.canvastencil.com',
            'www.canvastencil.com'
        ];

        return in_array(strtolower($value), $reservedDomains);
    }
}