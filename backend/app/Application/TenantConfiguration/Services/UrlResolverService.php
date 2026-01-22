<?php

namespace App\Application\TenantConfiguration\Services;

use App\Application\TenantConfiguration\UseCases\ResolveTenantFromUrlUseCase;
use App\Domain\Tenant\Exceptions\TenantNotFoundException;
use App\Domain\Tenant\Exceptions\InvalidUrlPatternException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class UrlResolverService
{
    private bool $cacheEnabled;
    private int $cacheTtl;
    private string $cachePrefix;

    public function __construct(
        private ResolveTenantFromUrlUseCase $resolveTenantUseCase
    ) {
        $this->cacheEnabled = config('tenant-url.cache.enabled', true);
        $this->cacheTtl = config('tenant-url.cache.ttl', 3600);
        $this->cachePrefix = config('tenant-url.cache.prefix', 'tenant_url:');
    }

    public function resolveTenant(string $urlPattern, string $identifier): array
    {
        $host = $this->buildHostFromPattern($urlPattern, $identifier);
        $path = $this->buildPathFromPattern($urlPattern, $identifier);

        if ($this->cacheEnabled) {
            return $this->resolveTenantWithCache($host, $path);
        }

        return $this->resolveTenantDirect($host, $path);
    }

    public function resolveTenantFromRequest(string $host, string $path): array
    {
        if ($this->cacheEnabled) {
            return $this->resolveTenantWithCache($host, $path);
        }

        return $this->resolveTenantDirect($host, $path);
    }

    private function resolveTenantWithCache(string $host, string $path): array
    {
        $cacheKey = $this->getCacheKey($host, $path);

        try {
            return Cache::remember(
                $cacheKey,
                $this->cacheTtl,
                fn() => $this->resolveTenantDirect($host, $path)
            );
        } catch (\Throwable $e) {
            Log::error('[UrlResolverService] Cache resolution failed', [
                'host' => $host,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            Cache::forget($cacheKey);

            throw $e;
        }
    }

    private function resolveTenantDirect(string $host, string $path): array
    {
        $result = $this->resolveTenantUseCase->execute($host, $path);

        if (!$result['success']) {
            throw new TenantNotFoundException("Tenant resolution failed for host: {$host}, path: {$path}");
        }

        return $result['tenant'];
    }

    private function getCacheKey(string $host, string $path): string
    {
        return $this->cachePrefix . md5($host . ':' . $path);
    }

    private function buildHostFromPattern(string $urlPattern, string $identifier): string
    {
        $baseDomain = config('tenant-url.detection.subdomain.base_domain', 'stencil.canvastack.com');

        return match ($urlPattern) {
            'subdomain' => $identifier . '.' . $baseDomain,
            'path' => $baseDomain,
            'custom_domain' => $identifier,
            default => $baseDomain,
        };
    }

    private function buildPathFromPattern(string $urlPattern, string $identifier): string
    {
        $pathPrefix = config('tenant-url.detection.path.prefix', 't');

        return match ($urlPattern) {
            'path' => $pathPrefix . '/' . $identifier,
            default => '/',
        };
    }

    public function clearCache(string $host, string $path): void
    {
        $cacheKey = $this->getCacheKey($host, $path);
        Cache::forget($cacheKey);

        Log::info('[UrlResolverService] Cache cleared', [
            'host' => $host,
            'path' => $path,
            'cache_key' => $cacheKey,
        ]);
    }

    public function clearAllCache(): void
    {
        $pattern = $this->cachePrefix . '*';
        
        if (Cache::getStore() instanceof \Illuminate\Cache\RedisStore) {
            $redis = Cache::getStore()->connection();
            $keys = $redis->keys($pattern);
            
            if (!empty($keys)) {
                $redis->del($keys);
            }

            Log::info('[UrlResolverService] All cache cleared', [
                'pattern' => $pattern,
                'keys_deleted' => count($keys ?? []),
            ]);
        } else {
            Cache::flush();

            Log::warning('[UrlResolverService] Full cache flush executed (non-Redis store)', [
                'pattern' => $pattern,
            ]);
        }
    }

    public function warmCache(array $tenants): void
    {
        foreach ($tenants as $tenant) {
            if (isset($tenant['subdomain'])) {
                $host = $tenant['subdomain'] . '.' . config('tenant-url.detection.subdomain.base_domain');
                $this->resolveTenantWithCache($host, '/');
            }

            if (isset($tenant['custom_domain'])) {
                $this->resolveTenantWithCache($tenant['custom_domain'], '/');
            }
        }

        Log::info('[UrlResolverService] Cache warmed', [
            'tenants_count' => count($tenants),
        ]);
    }
}
