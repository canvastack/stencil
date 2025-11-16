<?php

namespace App\Infrastructure\Presentation\Http\Middleware;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class EnsureTenantScopedQueries
{
    public function handle(Request $request, Closure $next)
    {
        $tenant = $request->get('current_tenant');

        if ($tenant instanceof TenantEloquentModel) {
            $this->applyGlobalTenantScope($tenant);
        }

        return $next($request);
    }

    private function applyGlobalTenantScope(TenantEloquentModel $tenant): void
    {
        // Apply global scope to ensure all tenant-scoped models automatically filter by tenant_id
        $this->addTenantScopeToModels($tenant);
    }

    private function addTenantScopeToModels(TenantEloquentModel $tenant): void
    {
        $tenantScopedModels = [
            \App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class,
            // Add other tenant-scoped models here as they're created
        ];

        foreach ($tenantScopedModels as $modelClass) {
            $this->addTenantScopeToModel($modelClass, $tenant);
        }
    }

    private function addTenantScopeToModel(string $modelClass, TenantEloquentModel $tenant): void
    {
        if (class_exists($modelClass)) {
            $modelClass::addGlobalScope('tenant', function (Builder $builder) use ($tenant) {
                $builder->where('tenant_id', $tenant->id);
            });
        }
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