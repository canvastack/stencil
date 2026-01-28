<?php

namespace App\Infrastructure\Presentation\Http\Middleware;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class EnsureTenantScopedQueries
{
    public function handle(Request $request, Closure $next)
    {
        // Resolve tenant FIRST before registering scopes
        $tenant = $this->resolveTenant($request);

        if ($tenant) {
            // Set tenant context in multiple places for reliability
            config(['multitenancy.current_tenant' => $tenant]);
            $request->attributes->set('tenant', $tenant);
            $request->attributes->set('current_tenant', $tenant);
            $request->merge(['current_tenant' => $tenant]);
            
            // Make tenant current for Spatie Multitenancy
            if (method_exists($tenant, 'makeCurrent')) {
                $tenant->makeCurrent();
            }
            
            // Register tenant scopes for all models
            $this->registerTenantScopes();
        }

        return $next($request);
    }

    private function registerTenantScopes(): void
    {
        foreach ($this->tenantScopedModels() as $modelClass) {
            if (!class_exists($modelClass) || $this->modelUsesTenantTrait($modelClass)) {
                continue;
            }

            $modelClass::addGlobalScope('tenant_middleware', function (Builder $builder) {
                $tenant = self::currentTenant();

                if ($tenant) {
                    $builder->where($builder->getModel()->getTable() . '.tenant_id', $tenant->id);
                }
            });
        }
    }

    private function tenantScopedModels(): array
    {
        return [
            \App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class,
            \App\Infrastructure\Persistence\Eloquent\Models\Order::class,
            \App\Infrastructure\Persistence\Eloquent\Models\Customer::class,
            \App\Infrastructure\Persistence\Eloquent\Models\Vendor::class,
            \App\Infrastructure\Persistence\Eloquent\Models\Product::class,
            \App\Infrastructure\Persistence\Eloquent\Models\ProductCategory::class,
            \App\Infrastructure\Persistence\Eloquent\Models\ProductVariant::class,
            \App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation::class,
            \App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction::class,
        ];
    }

    private function modelUsesTenantTrait(string $modelClass): bool
    {
        $traits = class_uses_recursive($modelClass);

        return in_array(BelongsToTenant::class, $traits, true);
    }

    private function resolveTenant(Request $request): ?TenantEloquentModel
    {
        $candidate = $request->attributes->get('tenant')
            ?? $request->attributes->get('current_tenant')
            ?? $request->get('current_tenant');

        if ($candidate instanceof TenantEloquentModel) {
            return $candidate;
        }

        return self::currentTenant();
    }

    private static function currentTenant(): ?TenantEloquentModel
    {
        if (function_exists('tenant')) {
            $tenant = tenant();

            if ($tenant instanceof TenantEloquentModel) {
                return $tenant;
            }
        }

        if (app()->bound('tenant.current')) {
            $tenant = app('tenant.current');

            if ($tenant instanceof TenantEloquentModel) {
                return $tenant;
            }
        }

        if (app()->bound('current_tenant')) {
            $tenant = app('current_tenant');

            if ($tenant instanceof TenantEloquentModel) {
                return $tenant;
            }
        }

        $configTenant = config('multitenancy.current_tenant');

        if ($configTenant instanceof TenantEloquentModel) {
            return $configTenant;
        }

        if (app()->bound('request')) {
            $request = app('request');

            $tenant = $request->attributes->get('tenant')
                ?? $request->attributes->get('current_tenant')
                ?? $request->get('current_tenant');

            if ($tenant instanceof TenantEloquentModel) {
                return $tenant;
            }
        }

        return null;
    }
}

// Trait to be used by tenant-scoped Eloquent models
trait HasTenantScope
{
    protected static function bootHasTenantScope(): void
    {
        static::creating(function (Model $model) {
            if (!$model->tenant_id && $currentTenant = self::getCurrentTenant()) {
                $model->tenant_id = $currentTenant->id;
            }
        });

        static::addGlobalScope('tenant', function (Builder $builder) {
            if ($currentTenant = self::getCurrentTenant()) {
                $builder->where($builder->getQuery()->from . '.tenant_id', $currentTenant->id);
            }
        });
    }

    private static function getCurrentTenant(): ?TenantEloquentModel
    {
        return config('multitenancy.current_tenant') ?? request()->get('current_tenant');
    }

    public function tenant()
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }
}