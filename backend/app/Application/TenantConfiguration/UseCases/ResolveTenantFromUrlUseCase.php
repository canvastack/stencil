<?php

namespace App\Application\TenantConfiguration\UseCases;

use App\Domain\Tenant\Services\UrlPatternMatcher;
use App\Domain\Tenant\Services\TenantResolver;
use App\Domain\Tenant\Exceptions\TenantNotFoundException;
use App\Domain\Tenant\Exceptions\InvalidUrlPatternException;
use Illuminate\Support\Facades\Log;

class ResolveTenantFromUrlUseCase
{
    public function __construct(
        private UrlPatternMatcher $urlPatternMatcher,
        private TenantResolver $tenantResolver
    ) {}

    public function execute(string $host, string $path): array
    {
        try {
            $pattern = $this->urlPatternMatcher->detect($host, $path);
            
            $identifier = $this->urlPatternMatcher->extractIdentifier($pattern, $host, $path);

            $tenantData = $this->tenantResolver->resolveTenantData($pattern, $identifier);

            Log::info('[TenantUrlResolution] Tenant resolved successfully', [
                'host' => $host,
                'path' => $path,
                'pattern' => $pattern->value,
                'identifier' => $identifier,
                'tenant_id' => $tenantData['id'],
                'tenant_uuid' => $tenantData['uuid'],
            ]);

            return [
                'success' => true,
                'tenant' => $tenantData,
                'pattern' => $pattern->value,
                'identifier' => $identifier,
            ];

        } catch (InvalidUrlPatternException $e) {
            Log::warning('[TenantUrlResolution] Invalid URL pattern', [
                'host' => $host,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            throw $e;

        } catch (TenantNotFoundException $e) {
            Log::warning('[TenantUrlResolution] Tenant not found', [
                'host' => $host,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function executeWithCache(string $host, string $path, int $ttl = 3600): array
    {
        $cacheKey = $this->generateCacheKey($host, $path);

        return cache()->remember($cacheKey, $ttl, function () use ($host, $path) {
            return $this->execute($host, $path);
        });
    }

    private function generateCacheKey(string $host, string $path): string
    {
        return 'tenant_url_resolution:' . md5($host . ':' . $path);
    }

    public function clearCache(string $host, string $path): void
    {
        $cacheKey = $this->generateCacheKey($host, $path);
        cache()->forget($cacheKey);
    }
}
