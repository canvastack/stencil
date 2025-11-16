<?php

namespace App\Domain\Tenant\ValueObjects;

use InvalidArgumentException;

class SubdomainName
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

    public function equals(SubdomainName $other): bool
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
            throw new InvalidArgumentException('Subdomain name cannot be empty');
        }

        if (strlen($value) > 63) {
            throw new InvalidArgumentException('Subdomain name cannot exceed 63 characters');
        }

        if (!$this->isValidSubdomainFormat($value)) {
            throw new InvalidArgumentException('Invalid subdomain name format');
        }

        if ($this->isReservedSubdomain($value)) {
            throw new InvalidArgumentException('Subdomain name is reserved and cannot be used');
        }
    }

    private function isValidSubdomainFormat(string $value): bool
    {
        return preg_match('/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/', $value);
    }

    private function isReservedSubdomain(string $value): bool
    {
        $reservedSubdomains = [
            'www',
            'api',
            'admin',
            'mail',
            'email',
            'smtp',
            'pop',
            'imap',
            'ftp',
            'sftp',
            'ssh',
            'vpn',
            'cdn',
            'static',
            'assets',
            'img',
            'images',
            'css',
            'js',
            'app',
            'mobile',
            'm',
            'test',
            'dev',
            'staging',
            'preview',
            'demo'
        ];

        return in_array(strtolower($value), $reservedSubdomains);
    }
}