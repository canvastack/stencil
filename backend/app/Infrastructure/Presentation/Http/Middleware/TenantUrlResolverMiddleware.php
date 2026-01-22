<?php

namespace App\Infrastructure\Presentation\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use App\Application\TenantConfiguration\Services\UrlResolverService;
use App\Application\TenantConfiguration\Services\UrlAccessAnalyticsService;
use App\Domain\Tenant\Exceptions\TenantNotFoundException;
use App\Domain\Tenant\Exceptions\InvalidUrlPatternException;

class TenantUrlResolverMiddleware
{
    private ?array $tenantData = null;
    private ?string $urlPattern = null;
    private ?string $urlConfigUuid = null;
    private float $startTime;

    public function __construct(
        private UrlResolverService $urlResolver,
        private UrlAccessAnalyticsService $analyticsService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->isPlatformRoute($request)) {
            return $next($request);
        }

        $this->startTime = microtime(true);

        try {
            $host = $request->getHost();
            $path = $request->path();

            $this->tenantData = $this->urlResolver->resolveTenantFromRequest($host, $path);

            $this->setTenantContext($request, $this->tenantData);

            $this->logResolutionMetrics($this->startTime, $host, $path);

            return $next($request);

        } catch (TenantNotFoundException $e) {
            return $this->handleTenantNotFound($request, $e);
        } catch (InvalidUrlPatternException $e) {
            return $this->handleInvalidUrlPattern($request, $e);
        } catch (\Throwable $e) {
            return $this->handleResolutionError($request, $e);
        }
    }

    public function terminate(Request $request, Response $response): void
    {
        if (!config('tenant-url.analytics.enabled', true)) {
            return;
        }

        if (!$this->tenantData) {
            return;
        }

        try {
            $responseTime = (microtime(true) - $this->startTime) * 1000;

            $analyticsData = [
                'tenant_uuid' => $this->tenantData['uuid'],
                'url_config_uuid' => $this->urlConfigUuid,
                'accessed_url' => $request->fullUrl(),
                'url_pattern_used' => $this->urlPattern ?? 'unknown',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'referrer' => $request->header('referer'),
                'http_status_code' => $response->getStatusCode(),
                'response_time_ms' => round($responseTime, 2),
                'accessed_at' => now(),
            ];

            $this->analyticsService->trackAccess($analyticsData);

        } catch (\Exception $e) {
            Log::debug('[TenantUrlResolver] Analytics tracking failed', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function isPlatformRoute(Request $request): bool
    {
        $path = $request->path();

        $platformPrefixes = [
            'api/v1/platform',
            'platform',
            'admin/platform',
        ];

        foreach ($platformPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function setTenantContext(Request $request, array $tenantData): void
    {
        $request->attributes->set('tenant_id', $tenantData['id']);
        $request->attributes->set('tenant_uuid', $tenantData['uuid']);
        $request->attributes->set('tenant_slug', $tenantData['slug']);
        $request->attributes->set('tenant_name', $tenantData['name']);

        app()->instance('tenant.id', $tenantData['id']);
        app()->instance('tenant.uuid', $tenantData['uuid']);

        config(['app.current_tenant_id' => $tenantData['id']]);
        config(['app.current_tenant_uuid' => $tenantData['uuid']]);

        if (isset($tenantData['url_pattern'])) {
            $this->urlPattern = $tenantData['url_pattern'];
        }

        if (isset($tenantData['url_config_uuid'])) {
            $this->urlConfigUuid = $tenantData['url_config_uuid'];
        }

        Log::debug('[TenantUrlResolver] Tenant context set', [
            'tenant_id' => $tenantData['id'],
            'tenant_uuid' => $tenantData['uuid'],
            'tenant_slug' => $tenantData['slug'],
        ]);
    }

    private function logResolutionMetrics(float $startTime, string $host, string $path): void
    {
        if (!config('tenant-url.monitoring.enabled')) {
            return;
        }

        $duration = (microtime(true) - $startTime) * 1000;

        if ($duration > config('tenant-url.monitoring.slow_threshold_ms')) {
            Log::warning('[TenantUrlResolver] Slow resolution detected', [
                'duration_ms' => $duration,
                'host' => $host,
                'path' => $path,
            ]);
        }
    }

    private function handleTenantNotFound(Request $request, TenantNotFoundException $e): Response
    {
        if (config('tenant-url.fallback.log_failures')) {
            Log::warning('[TenantUrlResolver] Tenant not found', [
                'host' => $request->getHost(),
                'path' => $request->path(),
                'error' => $e->getMessage(),
            ]);
        }

        if (config('tenant-url.fallback.show_404')) {
            return response()->json([
                'message' => 'Tenant not found',
                'error' => 'TENANT_NOT_FOUND',
            ], 404);
        }

        $fallbackUrl = config('tenant-url.fallback.redirect_to');
        return redirect($fallbackUrl);
    }

    private function handleInvalidUrlPattern(Request $request, InvalidUrlPatternException $e): Response
    {
        Log::warning('[TenantUrlResolver] Invalid URL pattern', [
            'host' => $request->getHost(),
            'path' => $request->path(),
            'error' => $e->getMessage(),
        ]);

        return response()->json([
            'message' => 'Invalid URL pattern',
            'error' => 'INVALID_URL_PATTERN',
        ], 400);
    }

    private function handleResolutionError(Request $request, \Throwable $e): Response
    {
        Log::error('[TenantUrlResolver] Resolution error', [
            'host' => $request->getHost(),
            'path' => $request->path(),
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'message' => 'Tenant resolution failed',
            'error' => 'RESOLUTION_ERROR',
        ], 500);
    }
}
