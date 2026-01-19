<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Models\Role as SpatieRole;

class RoleEloquentModel extends SpatieRole
{
    protected $table = 'roles';

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'guard_name',
        'description',
        'is_system',
        'abilities',
    ];

    protected $casts = [
        'abilities' => 'array',
        'is_system' => 'boolean',
    ];

    public function __construct(array $attributes = [])
    {
        // Merge custom casts with parent casts
        $this->casts = array_merge($this->casts, [
            'abilities' => 'array',
            'is_system' => 'boolean',
        ]);
        
        parent::__construct($attributes);
        
        // Ensure our custom table name is used
        $this->table = 'roles';
    }

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    // Global Scopes
    protected static function booted()
    {
        parent::booted();
        
        // Auto-generate UUID for new roles
        static::creating(function ($role) {
            if (empty($role->uuid)) {
                $role->uuid = \Illuminate\Support\Str::uuid()->toString();
            }
        });
        
        // NOTE: We intentionally DO NOT add a global scope for tenant filtering here.
        // Spatie Permission handles tenant scoping automatically via the teams feature
        // (team_foreign_key config and getPermissionsTeamId()).
        // 
        // Adding a custom global scope here would interfere with Spatie's internal
        // queries (e.g., hasRole, assignRole) and cause PostgreSQL transaction errors.
        // 
        // If you need to filter roles by tenant in your application code, use the
        // tenantRoles() or platformRoles() scopes explicitly.
    }

    /**
     * Override findByName to use slug field instead of name field.
     * This allows hasRole('user') to work with slug='user' instead of name='User'.
     *
     * @param  string  $name
     * @param  string|null  $guardName
     * @return \Spatie\Permission\Contracts\Role
     *
     * @throws \Spatie\Permission\Exceptions\RoleDoesNotExist
     */
    public static function findByName(string $name, ?string $guardName = null): \Spatie\Permission\Contracts\Role
    {
        $guardName ??= \Spatie\Permission\Guard::getDefaultName(static::class);

        $role = static::findByParam(['slug' => $name, 'guard_name' => $guardName]);

        if (! $role) {
            throw \Spatie\Permission\Exceptions\RoleDoesNotExist::named($name, $guardName);
        }

        return $role;
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
            'guard_name' => 'api',
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
            'guard_name' => 'api',
            'description' => $description,
            'is_system' => $isSystem,
            'abilities' => $abilities,
        ]);
    }
}