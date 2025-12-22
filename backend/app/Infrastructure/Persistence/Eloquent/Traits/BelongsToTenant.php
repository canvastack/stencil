<?php

namespace App\Infrastructure\Persistence\Eloquent\Traits;

use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Multitenancy\Models\Tenant as BaseTenant;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::creating(function (Model $model) {
            if (! $model->tenant_id && ($tenant = self::resolveTenant())) {
                $model->tenant_id = $tenant->id;
            }
        });

        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenant = self::resolveTenant();
            
            if ($tenant) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', $tenant->id);
            }
            // NOTE: Logging removed to prevent infinite recursion
            // Explicit tenant filtering in controllers provides safety net
        });
    }

    protected static function resolveTenant(): ?BaseTenant
    {
        // Use static cache to prevent infinite recursion
        static $resolving = false;
        static $cachedTenant = null;
        
        if ($resolving) {
            return $cachedTenant;
        }
        
        $resolving = true;
        
        try {
            // 1. Try Spatie Multitenancy helper function
            if (function_exists('tenant')) {
                $tenant = tenant();
                if ($tenant instanceof BaseTenant) {
                    $cachedTenant = $tenant;
                    return $tenant;
                }
            }

            // 2. Try from app container
            if (app()->bound('current_tenant')) {
                $tenant = app('current_tenant');
                if ($tenant instanceof BaseTenant) {
                    $cachedTenant = $tenant;
                    return $tenant;
                }
            }

            // 3. Try from config
            $configTenant = config('multitenancy.current_tenant');
            if ($configTenant instanceof BaseTenant) {
                $cachedTenant = $configTenant;
                return $configTenant;
            }

            // 4. Try from request attributes (set by middleware)
            if (app()->bound('request')) {
                $request = app('request');
                $requestTenant = $request->attributes->get('tenant')
                    ?? $request->get('current_tenant');

                if ($requestTenant instanceof BaseTenant) {
                    $cachedTenant = $requestTenant;
                    return $requestTenant;
                }
            }

            // 5. SIMPLE FALLBACK: Try default auth guard only (avoid infinite loop)
            $user = auth('sanctum')->user();
            if ($user && isset($user->tenant_id)) {
                $tenant = BaseTenant::find($user->tenant_id);
                if ($tenant instanceof BaseTenant) {
                    $cachedTenant = $tenant;
                    return $tenant;
                }
            }

            return null;
        } finally {
            $resolving = false;
        }
    }

    public function scopeForTenant(Builder $query, BaseTenant|string $tenant): Builder
    {
        $tenantId = $tenant instanceof BaseTenant ? $tenant->id : $tenant;

        return $query
            ->withoutGlobalScope('tenant')
            ->where($query->getModel()->getTable() . '.tenant_id', $tenantId);
    }

    /**
     * Get the tenant ID for this model instance
     * Implementation of TenantAwareModel interface
     */
    public function getTenantId(): ?string
    {
        return $this->tenant_id;
    }

    /**
     * Get the tenant relationship
     * Implementation of TenantAwareModel interface
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(BaseTenant::class, 'tenant_id');
    }

    /**
     * Scope query to current tenant
     * Implementation of TenantAwareModel interface
     */
    public function scopeTenantScoped(Builder $query): Builder
    {
        if ($tenant = self::resolveTenant()) {
            return $query->where($query->getModel()->getTable() . '.tenant_id', $tenant->id);
        }
        
        return $query;
    }

    /**
     * Check if model belongs to current tenant
     * Implementation of TenantAwareModel interface
     */
    public function belongsToCurrentTenant(): bool
    {
        $currentTenant = self::resolveTenant();
        
        return $currentTenant && $this->tenant_id === $currentTenant->id;
    }

    /**
     * Check if model belongs to specific tenant
     * Implementation of TenantAwareModel interface
     */
    public function belongsToTenant(BaseTenant|string $tenant): bool
    {
        $tenantId = $tenant instanceof BaseTenant ? $tenant->id : $tenant;
        
        return (string) $this->tenant_id === (string) $tenantId;
    }
}
