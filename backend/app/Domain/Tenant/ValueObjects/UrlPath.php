<?php

namespace App\Domain\Tenant\ValueObjects;

use InvalidArgumentException;

class UrlPath
{
    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = strtolower(trim($value, '/'));
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getWithLeadingSlash(): string
    {
        return '/' . $this->value;
    }

    public function equals(UrlPath $other): bool
    {
        return $this->value === $other->getValue();
    }

    public function __toString(): string
    {
        return $this->value;
    }

    private function validate(string $value): void
    {
        $cleanValue = trim($value, '/');

        if (empty($cleanValue)) {
            throw new InvalidArgumentException('URL path cannot be empty');
        }

        if (strlen($cleanValue) > 100) {
            throw new InvalidArgumentException('URL path cannot exceed 100 characters');
        }

        if (!preg_match('/^[a-z0-9\-_]+$/', $cleanValue)) {
            throw new InvalidArgumentException('URL path can only contain lowercase letters, numbers, hyphens, and underscores');
        }

        if (preg_match('/^[0-9]/', $cleanValue)) {
            throw new InvalidArgumentException('URL path cannot start with a number');
        }

        if ($this->isReservedPath($cleanValue)) {
            throw new InvalidArgumentException('URL path is reserved and cannot be used');
        }
    }

    private function isReservedPath(string $value): bool
    {
        $reservedPaths = [
            'api',
            'admin',
            'dashboard',
            'login',
            'logout',
            'register',
            'auth',
            'user',
            'users',
            'account',
            'accounts',
            'settings',
            'config',
            'system',
            'public',
            'private',
            'assets',
            'static',
            'media',
            'files',
            'uploads',
            'downloads',
            'docs',
            'documentation',
            'help',
            'support',
            'about',
            'contact',
            'terms',
            'privacy',
            'legal',
        ];

        return in_array(strtolower($value), $reservedPaths);
    }
}
