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
            if ($tenant = self::resolveTenant()) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', $tenant->id);
            }
        });
    }

    protected static function resolveTenant(): ?BaseTenant
    {
        if (function_exists('tenant')) {
            $tenant = tenant();
            if ($tenant instanceof BaseTenant) {
                return $tenant;
            }
        }

        if (app()->bound('tenant.current')) {
            $tenant = app('tenant.current');
            if ($tenant instanceof BaseTenant) {
                return $tenant;
            }
        }

        if (app()->bound('current_tenant')) {
            $tenant = app('current_tenant');
            if ($tenant instanceof BaseTenant) {
                return $tenant;
            }
        }

        $configTenant = config('multitenancy.current_tenant');
        if ($configTenant instanceof BaseTenant) {
            return $configTenant;
        }

        if (app()->bound('request')) {
            $request = app('request');
            $requestTenant = $request->attributes->get('tenant')
                ?? $request->attributes->get('current_tenant')
                ?? $request->get('current_tenant');

            if ($requestTenant instanceof BaseTenant) {
                return $requestTenant;
            }
        }

        $user = auth()->user();
        if ($user && isset($user->tenant_id)) {
            $tenant = $user->tenant ?? BaseTenant::find($user->tenant_id);
            if ($tenant instanceof BaseTenant) {
                return $tenant;
            }
        }

        return null;
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
