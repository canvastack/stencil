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
        // 0. Clear any previous tenant context (important for test isolation)
        \Spatie\Multitenancy\Models\Tenant::forgetCurrent();
        
        // Clear app container bindings
        app()->forgetInstance('tenant.current');
        app()->forgetInstance('current_tenant');
        
        // Clear config
        config(['multitenancy.current_tenant' => null]);
        
        // 1. Get authenticated user first
        $user = $this->getAuthenticatedUser($request);
        
        // 2. Determine tenant context based on authentication status
        if ($user && isset($user->tenant_id)) {
            // CRITICAL: User is authenticated with a tenant
            // Ignore headers to prevent tenant context manipulation
            $userTenant = $this->tenantFromUser($user);
            
            if (!$userTenant) {
                return response()->json([
                    'message' => 'User tenant not found',
                    'error' => 'Tenant context error'
                ], 404);
            }
            
            // Try to identify tenant from domain (ignoring headers)
            $domainTenant = $this->identifyTenant($request, true);
            
            // SECURITY: If domain identifies a different tenant, reject (cross-tenant access)
            if ($domainTenant && $domainTenant->id !== $userTenant->id) {
                \Log::error('[RBAC] Cross-tenant access attempt via domain', [
                    'user_id' => $user->id,
                    'user_tenant_id' => $userTenant->id,
                    'domain_tenant_id' => $domainTenant->id,
                    'request_host' => $request->getHost(),
                    'request_path' => $request->path(),
                ]);
                
                return response()->json([
                    'message' => 'User does not belong to this tenant',
                    'error' => 'Cross-tenant access denied'
                ], 403);
            }
            
            // Use user's tenant (prevents header manipulation)
            $tenant = $userTenant;
        } else {
            // 3. For unauthenticated requests, use all identification methods
            $tenant = $this->identifyTenant($request, false);

            // 4. If still not found, check if this is a tenant route that requires context
            if (!$tenant) {
                // Allow platform routes without tenant context
                if ($this->isPlatformRoute($request)) {
                    return $next($request);
                }
                
                // For tenant routes, tenant context is required
                return $this->handleTenantNotFound($request);
            }
        }

        // 5. Validate tenant is active
        if (!$tenant->isActive()) {
            return $this->handleInactiveTenant($request, $tenant);
        }

        // 6. Set tenant context for the request
        $this->setTenantContext($tenant, $request);

        // 7. Set permissions team ID for Spatie Permission multi-tenant feature
        // Re-fetch user to ensure we have the latest authenticated instance
        $currentUser = $this->getAuthenticatedUser($request);
        
        if ($currentUser && isset($currentUser->tenant_id)) {
            setPermissionsTeamId($currentUser->tenant_id);
            
            // Clear permission cache to ensure fresh load with team context
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
            
            // Force reload user with fresh permissions
            $currentUser = $currentUser->fresh();
            
            // TEMPORARY: Skip getAllPermissions() call due to UUID relationship issues
            // TODO: Fix Spatie Permission to use UUID properly in permissions() relationship
            \Log::info('[TenantContext] Set permissions team ID', [
                'user_id' => $currentUser->id,
                'user_email' => $currentUser->email,
                'tenant_id' => $currentUser->tenant_id,
                'team_id_set' => getPermissionsTeamId(),
            ]);
        } else {
            \Log::warning('[TenantContext] Could not set permissions team ID', [
                'user_exists' => $currentUser !== null,
                'has_tenant_id' => $currentUser ? isset($currentUser->tenant_id) : false,
            ]);
        }

        return $next($request);
    }
    
    /**
     * Get authenticated user from any guard
     */
    private function getAuthenticatedUser($request)
    {
        // Try sanctum first (API authentication)
        $user = auth('sanctum')->user();
        if ($user) {
            return $user;
        }
        
        // Try tenant guard
        $user = auth('tenant')->user();
        if ($user) {
            return $user;
        }
        
        // Try default guard
        $user = auth()->user();
        if ($user) {
            return $user;
        }
        
        // Try from request
        return $request->user();
    }

    private function resolveTenantFromAuthenticatedUser(Request $request): ?TenantEloquentModel
    {
        // Use the new helper to get user from any guard
        $user = $this->getAuthenticatedUser($request);
        
        if ($user) {
            return $this->tenantFromUser($user);
        }
        
        return null;
    }

    private function tenantFromUser($user): ?TenantEloquentModel
    {
        if (!$user || !isset($user->tenant_id)) {
            return null;
        }

        // Try eager loaded relationship first (most efficient)
        if (isset($user->tenant) && $user->tenant instanceof TenantEloquentModel) {
            return $user->tenant;
        }

        // Try relationship method
        if (method_exists($user, 'tenant')) {
            try {
                $tenant = $user->tenant()->first();
                if ($tenant instanceof TenantEloquentModel) {
                    return $tenant;
                }
            } catch (\Exception $e) {
                // Relationship might not be properly configured
                \Log::warning('[RBAC] Failed to load tenant relationship', [
                    'user_id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Fallback: direct query by tenant_id
        try {
            return TenantEloquentModel::find($user->tenant_id);
        } catch (\Exception $e) {
            \Log::error('[RBAC] Failed to find tenant by ID', [
                'user_id' => $user->id,
                'tenant_id' => $user->tenant_id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private function identifyTenant(Request $request, bool $ignoreHeaders = false): ?TenantEloquentModel
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

        // Check headers for tenant identification (API clients) - only for unauthenticated requests
        if (!$ignoreHeaders) {
            $tenantFromHeaders = $this->getTenantFromHeaders($request);
            if ($tenantFromHeaders) {
                return $tenantFromHeaders;
            }
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
            $tenant = null;
            
            // Check if the value looks like an integer first (safer for PostgreSQL)
            if (is_numeric($tenantId) && ctype_digit((string)$tenantId)) {
                // Try by ID (integer)
                $tenant = TenantEloquentModel::where('id', $tenantId)->first();
            } else {
                // Try by UUID (string)
                $tenant = TenantEloquentModel::where('uuid', $tenantId)->first();
            }
            
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

        // Check if user is authenticated as platform account trying to access tenant route
        $user = $this->getAuthenticatedUser($request);
        if ($user && isset($user->account_type) && in_array($user->account_type, ['platform_owner', 'platform_manager'])) {
            return response()->json([
                'message' => 'Platform accounts cannot access tenant-specific resources',
                'error' => 'Unauthorized'
            ], 401);
        }
        
        // Also check if user has no tenant_id but is authenticated (platform account check)
        if ($user && !isset($user->tenant_id)) {
            return response()->json([
                'message' => 'Platform accounts cannot access tenant-specific resources',
                'error' => 'Unauthorized'
            ], 401);
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