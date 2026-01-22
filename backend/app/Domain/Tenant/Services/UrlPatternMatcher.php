<?php

namespace App\Domain\Tenant\Services;

use App\Domain\Tenant\Enums\UrlPattern;
use App\Domain\Tenant\Exceptions\InvalidUrlPatternException;

class UrlPatternMatcher
{
    public function __construct(
        private string $baseDomain = 'stencil.canvastack.com',
        private array $excludedSubdomains = ['www', 'api', 'admin', 'platform', 'mail'],
        private string $pathPrefix = 't'
    ) {}

    public function detect(string $host, string $path): UrlPattern
    {
        if ($this->isCustomDomain($host)) {
            return UrlPattern::CUSTOM_DOMAIN;
        }

        if ($this->isSubdomainPattern($host)) {
            return UrlPattern::SUBDOMAIN;
        }

        if ($this->isPathPattern($path)) {
            return UrlPattern::PATH;
        }

        throw new InvalidUrlPatternException(
            "Unable to detect URL pattern from host: {$host}, path: {$path}"
        );
    }

    public function extractIdentifier(UrlPattern $pattern, string $host, string $path): string
    {
        return match ($pattern) {
            UrlPattern::SUBDOMAIN => $this->extractSubdomain($host),
            UrlPattern::PATH => $this->extractTenantSlugFromPath($path),
            UrlPattern::CUSTOM_DOMAIN => $host,
        };
    }

    private function isCustomDomain(string $host): bool
    {
        return !str_ends_with($host, $this->baseDomain);
    }

    private function isSubdomainPattern(string $host): bool
    {
        if (!str_ends_with($host, $this->baseDomain)) {
            return false;
        }

        if ($host === $this->baseDomain || $host === 'www.' . $this->baseDomain) {
            return false;
        }

        $subdomain = $this->extractSubdomain($host);
        
        return $subdomain !== null && !in_array($subdomain, $this->excludedSubdomains, true);
    }

    private function isPathPattern(string $path): bool
    {
        return str_starts_with($path, $this->pathPrefix . '/');
    }

    private function extractSubdomain(string $host): ?string
    {
        if (!str_ends_with($host, $this->baseDomain)) {
            return null;
        }

        $subdomain = str_replace('.' . $this->baseDomain, '', $host);

        return $subdomain !== $host ? $subdomain : null;
    }

    private function extractTenantSlugFromPath(string $path): string
    {
        $pattern = "/^{$this->pathPrefix}\/([a-z0-9-]+)/";

        if (preg_match($pattern, $path, $matches)) {
            return $matches[1];
        }

        throw new InvalidUrlPatternException("Invalid path-based tenant URL: {$path}");
    }

    public function setBaseDomain(string $baseDomain): self
    {
        $this->baseDomain = $baseDomain;
        return $this;
    }

    public function setExcludedSubdomains(array $excludedSubdomains): self
    {
        $this->excludedSubdomains = $excludedSubdomains;
        return $this;
    }

    public function setPathPrefix(string $pathPrefix): self
    {
        $this->pathPrefix = $pathPrefix;
        return $this;
    }

    public function getBaseDomain(): string
    {
        return $this->baseDomain;
    }

    public function getExcludedSubdomains(): array
    {
        return $this->excludedSubdomains;
    }

    public function getPathPrefix(): string
    {
        return $this->pathPrefix;
    }
}
