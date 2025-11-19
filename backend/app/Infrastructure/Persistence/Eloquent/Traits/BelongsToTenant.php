<?php

namespace App\Infrastructure\Persistence\Eloquent\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
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

        return null;
    }

    public function scopeForTenant(Builder $query, BaseTenant|string $tenant): Builder
    {
        $tenantId = $tenant instanceof BaseTenant ? $tenant->id : $tenant;

        return $query
            ->withoutGlobalScope('tenant')
            ->where($query->getModel()->getTable() . '.tenant_id', $tenantId);
    }
}
