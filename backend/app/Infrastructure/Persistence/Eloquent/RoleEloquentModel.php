<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
class RoleEloquentModel extends Model
{

    protected $table = 'roles';

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'is_system',
        'abilities',
    ];

    protected $casts = [
        'abilities' => 'array',
        'is_system' => 'boolean',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            UserEloquentModel::class,
            'user_roles',
            'role_id',
            'user_id'
        );
    }

    public function accounts(): BelongsToMany
    {
        return $this->belongsToMany(
            AccountEloquentModel::class,
            'account_roles',
            'role_id',
            'account_id'
        );
    }

    // Global Scopes
    protected static function booted()
    {
        // Automatically scope to current tenant for tenant roles
        static::addGlobalScope('tenant_context', function ($query) {
            if (app()->has('currentTenant')) {
                $query->where('tenant_id', app('currentTenant')->id);
            }
        });
    }

    // Local Scopes
    public function scopePlatformRoles($query)
    {
        return $query->whereNull('tenant_id');
    }

    public function scopeTenantRoles($query, ?string $tenantId = null)
    {
        if ($tenantId) {
            return $query->where('tenant_id', $tenantId);
        }
        return $query->whereNotNull('tenant_id');
    }

    public function scopeSystemRoles($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeCustomRoles($query)
    {
        return $query->where('is_system', false);
    }

    // Business Logic Methods
    public function isPlatformRole(): bool
    {
        return is_null($this->tenant_id);
    }

    public function isTenantRole(): bool
    {
        return !is_null($this->tenant_id);
    }

    public function isSystemRole(): bool
    {
        return $this->is_system;
    }

    public function hasAbility(string $ability): bool
    {
        return in_array($ability, $this->abilities ?? []);
    }

    public function hasAnyAbility(array $abilities): bool
    {
        return count(array_intersect($abilities, $this->abilities ?? [])) > 0;
    }

    public function addAbility(string $ability): void
    {
        $abilities = $this->abilities ?? [];
        if (!in_array($ability, $abilities)) {
            $abilities[] = $ability;
            $this->update(['abilities' => $abilities]);
        }
    }

    public function removeAbility(string $ability): void
    {
        $abilities = $this->abilities ?? [];
        $abilities = array_values(array_filter($abilities, fn($a) => $a !== $ability));
        $this->update(['abilities' => $abilities]);
    }

    public function syncAbilities(array $abilities): void
    {
        $this->update(['abilities' => array_unique($abilities)]);
    }

    // Static Factory Methods
    public static function createPlatformRole(
        string $name,
        string $slug,
        array $abilities = [],
        ?string $description = null,
        bool $isSystem = false
    ): self {
        return static::create([
            'tenant_id' => null,
            'name' => $name,
            'slug' => $slug,
            'description' => $description,
            'is_system' => $isSystem,
            'abilities' => $abilities,
        ]);
    }

    public static function createTenantRole(
        string $tenantId,
        string $name,
        string $slug,
        array $abilities = [],
        ?string $description = null,
        bool $isSystem = false
    ): self {
        return static::create([
            'tenant_id' => $tenantId,
            'name' => $name,
            'slug' => $slug,
            'description' => $description,
            'is_system' => $isSystem,
            'abilities' => $abilities,
        ]);
    }
}