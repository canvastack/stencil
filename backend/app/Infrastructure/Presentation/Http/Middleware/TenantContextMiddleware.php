<?php

namespace App\Infrastructure\Presentation\Http\Middleware;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\DomainMappingEloquentModel;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Spatie\Multitenancy\Models\Concerns\UsesTenantConnection;

class TenantContextMiddleware
{
    use UsesTenantConnection;

    public function handle(Request $request, Closure $next)
    {
        $tenant = $this->identifyTenant($request);

        if (!$tenant) {
            $tenant = $this->resolveTenantFromAuthenticatedUser($request);
        }

        if (!$tenant) {
            return $this->handleTenantNotFound($request);
        }

        if (!$tenant->isActive()) {
            return $this->handleInactiveTenant($request, $tenant);
        }

        // Validate cross-tenant access for authenticated users
        $user = auth('tenant')->user();
        if ($user && $user->tenant_id !== $tenant->id) {
            return response()->json([
                'message' => 'User does not belong to this tenant',
                'error' => 'Cross-tenant access denied'
            ], 403);
        }

        // Set tenant context
        $this->setTenantContext($tenant, $request);

        return $next($request);
    }

    private function resolveTenantFromAuthenticatedUser(Request $request): ?TenantEloquentModel
    {
        $guards = ['tenant', 'api', config('auth.defaults.guard')];

        foreach (array_filter(array_unique($guards)) as $guard) {
            $tenant = $this->tenantFromUser(auth()->guard($guard)->user());

            if ($tenant) {
                return $tenant;
            }
        }

        return $this->tenantFromUser($request->user());
    }

    private function tenantFromUser($user): ?TenantEloquentModel
    {
        if (!$user || !isset($user->tenant_id)) {
            return null;
        }

        $relationTenant = $user->tenant;

        if ($relationTenant instanceof TenantEloquentModel) {
            return $relationTenant;
        }

        if (method_exists($user, 'tenant')) {
            $tenant = $user->tenant()->first();

            if ($tenant instanceof TenantEloquentModel) {
                return $tenant;
            }
        }

        return TenantEloquentModel::find($user->tenant_id);
    }

    private function identifyTenant(Request $request): ?TenantEloquentModel
    {
        $host = $request->getHost();
        $path = $request->path();

        // First check domain-based identification
        $tenant = $this->getTenantByDomain($host);
        if ($tenant) {
            return $tenant;
        }

        if ($this->isSubdomainPattern($host)) {
            $subdomain = $this->extractSubdomain($host);
            return TenantEloquentModel::where('slug', $subdomain)->first();
        }

        // Check headers for tenant identification (API clients)
        $tenantFromHeaders = $this->getTenantFromHeaders($request);
        if ($tenantFromHeaders) {
            return $tenantFromHeaders;
        }

        if ($this->isMainDomain($host)) {
            $tenantSlug = $this->extractTenantSlugFromPath($path);
            if ($tenantSlug) {
                return TenantEloquentModel::where('slug', $tenantSlug)->first();
            }
        }

        return null;
    }

    private function getTenantFromHeaders(Request $request): ?TenantEloquentModel
    {
        // Check for tenant identification via headers
        $tenantId = $request->header('X-Tenant-ID');
        $tenantSlug = $request->header('X-Tenant-Slug');
        
        if ($tenantId) {
            $tenant = TenantEloquentModel::where('uuid', $tenantId)->first();
            if ($tenant) {
                return $tenant;
            }
        }
        
        if ($tenantSlug) {
            return TenantEloquentModel::where('slug', $tenantSlug)->first();
        }
        
        return null;
    }

    private function getTenantByDomain(string $host): ?TenantEloquentModel
    {
        // Check direct domain mapping
        $domainMapping = DomainMappingEloquentModel::where('domain', $host)
            ->where('status', 'active')
            ->first();

        if ($domainMapping) {
            return $domainMapping->tenant;
        }

        // Check tenant's direct domain field
        return TenantEloquentModel::where('domain', $host)->first();
    }

    private function isSubdomainPattern(string $host): bool
    {
        return str_ends_with($host, '.canvastencil.com') && 
               $host !== 'canvastencil.com' && 
               $host !== 'www.canvastencil.com';
    }

    private function extractSubdomain(string $host): string
    {
        return str_replace('.canvastencil.com', '', $host);
    }

    private function isMainDomain(string $host): bool
    {
        return in_array($host, ['canvastencil.com', 'www.canvastencil.com', 'localhost']);
    }

    private function extractTenantSlugFromPath(string $path): ?string
    {
        $segments = explode('/', trim($path, '/'));
        
        // Handle /api/tenant/{tenant_slug} pattern (legacy)
        if (count($segments) >= 3 && $segments[0] === 'api' && $segments[1] === 'tenant') {
            return $segments[2];
        }

        // Handle /api/v1/tenant/{tenant_slug} pattern
        if (count($segments) >= 4 && $segments[0] === 'api' && $segments[1] === 'v1' && $segments[2] === 'tenant') {
            return $segments[3];
        }
        
        // Handle /{tenant_slug} pattern (for main domain)
        $firstSegment = $segments[0] ?? null;
        $platformRoutes = ['admin', 'api', 'platform', 'auth'];

        if (!$firstSegment || in_array($firstSegment, $platformRoutes)) {
            return null;
        }

        return $firstSegment;
    }

    private function setTenantContext(TenantEloquentModel $tenant, Request $request): void
    {
        // Set current tenant for Spatie Multitenancy
        $tenant->makeCurrent();

        // Store tenant in request attributes for middleware access
        $request->attributes->set('tenant', $tenant);

        // Store tenant in request for easy access
        $request->merge(['current_tenant' => $tenant]);

        // Set tenant in config for other services
        config(['multitenancy.current_tenant' => $tenant]);

        // Bind tenant to application container
        app()->singleton('tenant.current', function () use ($tenant) {
            return $tenant;
        });

        app()->instance('current_tenant', $tenant);
    }

    private function handleTenantNotFound(Request $request): Response|JsonResponse
    {
        // Check if this is a platform route
        if ($this->isPlatformRoute($request)) {
            // Allow platform routes to continue without tenant context
            return app()->handle($request);
        }

        // Return 404 for unknown tenant
        return response()->json([
            'message' => 'Tenant not found',
            'host' => $request->getHost(),
            'path' => $request->path(),
            'error' => 'No tenant found for this domain or path'
        ], 404);
    }

    private function handleInactiveTenant(Request $request, TenantEloquentModel $tenant)
    {
        // Determine status message based on subscription status for trial logic
        if ($tenant->subscription_status === 'trial' && !$tenant->isOnTrial()) {
            $statusMessage = 'Trial period has expired';
        } elseif ($tenant->subscription_status === 'expired') {
            $statusMessage = 'Subscription has expired';
        } else {
            $statusMessage = match($tenant->status) {
                'suspended' => 'Tenant is suspended',
                'inactive' => 'Tenant is not active',
                default => 'Tenant is not active'
            };
        }

        // For API requests, return JSON response
        if ($request->expectsJson() || str_starts_with($request->path(), 'api/')) {
            return response()->json([
                'message' => $statusMessage,
                'tenant_status' => $tenant->status,
                'error' => 'Tenant inactive'
            ], 403);
        }

        // For web requests, return view
        return response()->view('errors.tenant-inactive', [
            'message' => $statusMessage,
            'tenant' => $tenant,
            'status' => $tenant->status
        ], 403);
    }

    private function isPlatformRoute(Request $request): bool
    {
        $path = $request->path();
        $platformPrefixes = ['admin', 'api/platform', 'api/v1/platform', 'platform', 'auth/platform'];
        
        foreach ($platformPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }
}