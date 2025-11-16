<?php

namespace App\Infrastructure\Services;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\DomainMappingEloquentModel;
use Spatie\Multitenancy\TenantFinder\TenantFinder as BaseTenantFinder;
use Spatie\Multitenancy\Models\Tenant;
use Illuminate\Http\Request;

class TenantFinder extends BaseTenantFinder
{
    public function findForRequest(Request $request): ?Tenant
    {
        $host = $request->getHost();
        $path = $request->path();

        // Check for custom domain first
        $tenant = $this->getTenantByDomain($host);
        if ($tenant) {
            return $tenant;
        }

        // Check for subdomain pattern (tenant.canvastencil.com)
        if ($this->isSubdomainPattern($host)) {
            $subdomain = $this->extractSubdomain($host);
            return TenantEloquentModel::where('slug', $subdomain)->first();
        }

        // Check for path-based tenant (canvastencil.com/tenant_slug)
        if ($this->isMainDomain($host)) {
            $tenantSlug = $this->extractTenantSlugFromPath($path);
            if ($tenantSlug) {
                return TenantEloquentModel::where('slug', $tenantSlug)->first();
            }
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
        $mainDomain = config('multitenancy.url_management.default_domain', 'canvastencil.com');
        
        return str_ends_with($host, '.' . $mainDomain) && 
               $host !== $mainDomain && 
               $host !== 'www.' . $mainDomain;
    }

    private function extractSubdomain(string $host): string
    {
        $mainDomain = config('multitenancy.url_management.default_domain', 'canvastencil.com');
        return str_replace('.' . $mainDomain, '', $host);
    }

    private function isMainDomain(string $host): bool
    {
        $mainDomain = config('multitenancy.url_management.default_domain', 'canvastencil.com');
        return in_array($host, [$mainDomain, 'www.' . $mainDomain, 'localhost']);
    }

    private function extractTenantSlugFromPath(string $path): ?string
    {
        // Skip platform routes (admin, api, etc.)
        $platformRoutes = ['admin', 'api', 'platform', 'auth'];
        
        $segments = explode('/', trim($path, '/'));
        $firstSegment = $segments[0] ?? null;

        if (!$firstSegment || in_array($firstSegment, $platformRoutes)) {
            return null;
        }

        return $firstSegment;
    }
}