<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class AccountEloquentModel extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory;
    use HasRoles {
        assignRole as protected spatieAssignRole;
        hasRole as protected spatieHasRole;
    }

    protected $table = 'accounts';
    protected $guard_name = 'api';

    protected $fillable = [
        'name',
        'email',
        'password',
        'account_type',
        'status',
        'settings',
        'avatar',
        'email_verified_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'uuid' => 'string',
        'settings' => 'array',
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Model Events
    protected static function booted()
    {
        parent::booted();
        
        // Auto-generate UUID for new accounts
        static::creating(function ($account) {
            if (empty($account->uuid)) {
                $account->uuid = \Illuminate\Support\Str::uuid()->toString();
            }
        });
    }

    // Relationships
    public function createdTenants(): HasMany
    {
        return $this->hasMany(TenantEloquentModel::class, 'created_by');
    }

    /**
     * Get the key name for Spatie Permission (use UUID instead of ID).
     * UUID is auto-generated in creating event, so no refresh needed.
     * 
     * @return mixed
     */
    public function getKeyForPermissions()
    {
        return $this->uuid;
    }

    /**
     * Override roles relationship to use UUID as the parent key.
     * 
     * IMPORTANT: We don't add custom tenant scoping here - Spatie Permission
     * handles that automatically via the teams feature and getPermissionsTeamId().
     */
    public function roles(): BelongsToMany
    {
        $relation = $this->morphToMany(
            config('permission.models.role'),
            'model',
            config('permission.table_names.model_has_roles'),
            config('permission.column_names.model_morph_key'),
            app(\Spatie\Permission\PermissionRegistrar::class)->pivotRole,
            'uuid',  // Use UUID as parent key instead of default 'id'
            'id'     // Use id on Role model
        );

        if (! app(\Spatie\Permission\PermissionRegistrar::class)->teams) {
            return $relation;
        }

        $teamsKey = app(\Spatie\Permission\PermissionRegistrar::class)->teamsKey;
        $relation->withPivot($teamsKey);
        $teamField = config('permission.table_names.roles').'.'.$teamsKey;

        return $relation->wherePivot($teamsKey, getPermissionsTeamId())
            ->where(fn ($q) => $q->whereNull($teamField)->orWhere($teamField, getPermissionsTeamId()));
    }

    /**
     * Override permissions relationship to use UUID as the parent key.
     * We don't use direct model-permission relationships in this app,
     * only role-based permissions, so this returns empty collection.
     */
    public function permissions(): BelongsToMany
    {
        // Return empty relationship since we don't assign permissions directly to accounts
        // All permissions come through roles
        $relation = $this->morphToMany(
            config('permission.models.permission'),
            'model',
            config('permission.table_names.model_has_permissions'),
            config('permission.column_names.model_morph_key'),
            app(\Spatie\Permission\PermissionRegistrar::class)->pivotPermission
        )->whereRaw('1 = 0');  // Always return empty - we only use role-based permissions

        return $relation;
    }

    /**
     * Get the team identifier for Spatie Permission's teams feature.
     * Platform accounts don't belong to any tenant, so return null.
     *
     * @return int|string|null
     */
    public function getPermissionTeamId()
    {
        return null;
    }

    /**
     * Override assignRole to automatically set team ID as null for platform accounts.
     * Platform accounts don't belong to any tenant.
     *
     * @param  string|int|array|\Spatie\Permission\Contracts\Role|\Illuminate\Support\Collection|\BackedEnum  ...$roles
     * @return $this
     */
    public function assignRole(...$roles)
    {
        // Set team ID to null for platform accounts
        setPermissionsTeamId(null);
        
        // Call the original trait method via alias
        return $this->spatieAssignRole(...$roles);
    }

    /**
     * Override hasRole to ensure platform context is set and use slug field for string lookups.
     * Supports all Spatie Permission input types (string, int, Role object, etc.)
     * 
     * IMPORTANT: This override uses 'slug' field instead of 'name' field for string lookups
     * to match our application's convention.
     */
    public function hasRole($roles, ?string $guard = null): bool
    {
        setPermissionsTeamId(null);
        
        // For string parameters, check slug field instead of name field
        if (is_string($roles) && strpos($roles, '|') === false) {
            $this->loadMissing('roles');
            return $guard
                ? $this->roles->where('guard_name', $guard)->contains('slug', $roles)
                : $this->roles->contains('slug', $roles);
        }
        
        // For all other types (objects, arrays, etc.), use parent implementation
        return $this->spatieHasRole($roles, $guard);
    }

    /**
     * Get all permissions for backward compatibility with tests.
     * Returns abilities from custom RoleEloquentModel's abilities field.
     *
     * @return array
     */
    public function getAllPermissions(): array
    {
        if (!$this->relationLoaded('roles')) {
            $this->load('roles');
        }
        
        $permissions = [];
        foreach ($this->roles as $role) {
            $abilities = $role->abilities ?? [];
            
            // Handle both array and JSON string cases
            if (is_string($abilities)) {
                $abilities = json_decode($abilities, true) ?? [];
            }
            
            if (is_array($abilities)) {
                $permissions = array_merge($permissions, $abilities);
            }
        }
        return array_unique($permissions);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePlatformOwners($query)
    {
        return $query->where('account_type', 'platform_owner');
    }

    // Business Logic Methods
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function isPlatformOwner(): bool
    {
        return $this->account_type === 'platform_owner';
    }

    public function canManageTenants(): bool
    {
        return $this->isPlatformOwner() && $this->isActive();
    }

    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }

    // Override getAuthIdentifierName for Sanctum
    public function getAuthIdentifierName()
    {
        return 'id';
    }

    // Override for proper token scoping
    public function createToken(string $name, array $abilities = ['*'])
    {
        $token = $this->tokens()->create([
            'name' => $name,
            'token' => hash('sha256', $plainTextToken = \Illuminate\Support\Str::random(80)),
            'abilities' => $abilities,
            'tokenable_type' => static::class,
            'tokenable_id' => $this->getKey(),
        ]);

        return new \Laravel\Sanctum\NewAccessToken($token, $token->getKey().'|'.$plainTextToken);
    }
}
