<?php

namespace App\Infrastructure\Persistence\Eloquent\Traits;

use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Multitenancy\Models\Tenant;

trait TenantAware
{
    use BelongsToTenant;

    /**
     * Boot the TenantAware trait
     * This will automatically apply tenant scoping and auto-assign tenant_id
     */
    protected static function bootTenantAware(): void
    {
        // BelongsToTenant trait will handle the actual booting
        static::bootBelongsToTenant();
    }

    /**
     * Get the tenant ID for this model instance
     * Required by TenantAwareModel interface
     */
    public function getTenantId(): ?string
    {
        return $this->tenant_id;
    }

    /**
     * Get the tenant relationship
     * Required by TenantAwareModel interface
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * Scope query to current tenant
     * Required by TenantAwareModel interface
     */
    public function scopeTenantScoped(Builder $query): Builder
    {
        if ($tenant = self::resolveTenant()) {
            return $query->where($query->getModel()->getTable() . '.tenant_id', $tenant->id);
        }
        
        return $query;
    }

    /**
     * Scope query to specific tenant
     * Required by TenantAwareModel interface
     */
    public function scopeForTenant(Builder $query, Tenant|string $tenant): Builder
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;

        return $query
            ->withoutGlobalScope('tenant')
            ->where($query->getModel()->getTable() . '.tenant_id', $tenantId);
    }

    /**
     * Check if model belongs to current tenant
     * Required by TenantAwareModel interface
     */
    public function belongsToCurrentTenant(): bool
    {
        $currentTenant = self::resolveTenant();
        
        return $currentTenant && $this->tenant_id === $currentTenant->id;
    }

    /**
     * Check if model belongs to specific tenant
     * Required by TenantAwareModel interface
     */
    public function belongsToTenant(Tenant|string $tenant): bool
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        
        return $this->tenant_id === $tenantId;
    }
}