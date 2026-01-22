<?php

namespace App\Domain\Tenant\Enums;

enum UrlPattern: string
{
    case SUBDOMAIN = 'subdomain';
    case PATH = 'path';
    case CUSTOM_DOMAIN = 'custom_domain';

    public function label(): string
    {
        return match ($this) {
            self::SUBDOMAIN => 'Subdomain',
            self::PATH => 'Path-based',
            self::CUSTOM_DOMAIN => 'Custom Domain',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::SUBDOMAIN => 'Access via subdomain (e.g., tenant.stencil.canvastack.com)',
            self::PATH => 'Access via path (e.g., stencil.canvastack.com/tenant)',
            self::CUSTOM_DOMAIN => 'Access via custom domain (e.g., tenant.com)',
        };
    }

    public function example(string $identifier = 'tenant'): string
    {
        return match ($this) {
            self::SUBDOMAIN => "{$identifier}.stencil.canvastack.com",
            self::PATH => "stencil.canvastack.com/{$identifier}",
            self::CUSTOM_DOMAIN => "{$identifier}.com",
        };
    }

    public function requiresCustomDomain(): bool
    {
        return $this === self::CUSTOM_DOMAIN;
    }

    public static function availablePatterns(): array
    {
        return [
            self::SUBDOMAIN,
            self::PATH,
            self::CUSTOM_DOMAIN,
        ];
    }

    public static function fromString(string $pattern): self
    {
        return match (strtolower($pattern)) {
            'subdomain' => self::SUBDOMAIN,
            'path' => self::PATH,
            'custom_domain' => self::CUSTOM_DOMAIN,
            default => throw new \InvalidArgumentException("Invalid URL pattern: {$pattern}"),
        };
    }
}
