<?php

namespace App\Domain\Tenant\Enums;

enum DnsProvider: string
{
    case CLOUDFLARE = 'cloudflare';
    case ROUTE53 = 'route53';
    case MANUAL = 'manual';

    public function label(): string
    {
        return match ($this) {
            self::CLOUDFLARE => 'Cloudflare',
            self::ROUTE53 => 'AWS Route 53',
            self::MANUAL => 'Manual Configuration',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::CLOUDFLARE => 'Cloudflare DNS management with API integration',
            self::ROUTE53 => 'AWS Route 53 DNS management with API integration',
            self::MANUAL => 'Manually configured DNS without API integration',
        };
    }

    public function supportsApiIntegration(): bool
    {
        return in_array($this, [self::CLOUDFLARE, self::ROUTE53]);
    }

    public function requiresManualSetup(): bool
    {
        return $this === self::MANUAL;
    }

    public static function availableProviders(): array
    {
        return [
            self::CLOUDFLARE,
            self::ROUTE53,
            self::MANUAL,
        ];
    }

    public static function fromString(string $provider): self
    {
        return match (strtolower($provider)) {
            'cloudflare' => self::CLOUDFLARE,
            'route53' => self::ROUTE53,
            'manual' => self::MANUAL,
            default => throw new \InvalidArgumentException("Invalid DNS provider: {$provider}"),
        };
    }
}
