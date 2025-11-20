<?php

namespace App\Infrastructure\Persistence\Eloquent\Contracts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\Multitenancy\Models\Tenant;

interface TenantAwareModel
{
    /**
     * Get the tenant ID for this model instance
     */
    public function getTenantId(): ?string;

    /**
     * Get the tenant relationship
     */
    public function tenant();

    /**
     * Scope query to current tenant
     */
    public function scopeTenantScoped(Builder $query): Builder;

    /**
     * Scope query to specific tenant
     */
    public function scopeForTenant(Builder $query, Tenant|string $tenant): Builder;

    /**
     * Check if model belongs to current tenant
     */
    public function belongsToCurrentTenant(): bool;

    /**
     * Check if model belongs to specific tenant
     */
    public function belongsToTenant(Tenant|string $tenant): bool;
}