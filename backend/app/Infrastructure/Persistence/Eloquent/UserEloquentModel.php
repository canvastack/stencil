<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class UserEloquentModel extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory;
    use HasRoles {
        assignRole as protected spatieAssignRole;
        hasRole as protected spatieHasRole;
        getAllPermissions as protected spatieGetAllPermissions;
        givePermissionTo as protected spatieGivePermissionTo;
        hasPermissionTo as protected spatieHasPermissionTo;
    }

    protected $table = 'users';
    protected $guard_name = 'api';
    
    protected static function newFactory()
    {
        return \Database\Factories\Infrastructure\Persistence\Eloquent\UserEloquentModelFactory::new();
    }

    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'email',
        'password',
        'phone',
        'status',
        'department',
        'location',
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
        'location' => 'array',
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    // Global Scopes
    protected static function booted()
    {
        parent::booted();
        
        // Auto-generate UUID for new users
        static::creating(function ($user) {
            if (empty($user->uuid)) {
                $user->uuid = \Illuminate\Support\Str::uuid()->toString();
            }
        });
        
        // Automatically scope to current tenant
        static::addGlobalScope('tenant', function ($query) {
            if (app()->has('currentTenant')) {
                $query->where('tenant_id', app('currentTenant')->id);
            }
        });
    }

    // Local Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    public function scopeInDepartment($query, string $department)
    {
        return $query->where('department', $department);
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

    public function belongsToTenant(string $tenantId): bool
    {
        return $this->tenant_id === $tenantId;
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
     */
    public function permissions(): BelongsToMany
    {
        $relation = $this->morphToMany(
            config('permission.models.permission'),
            'model',
            config('permission.table_names.model_has_permissions'),
            config('permission.column_names.model_morph_key'),
            app(\Spatie\Permission\PermissionRegistrar::class)->pivotPermission,
            'uuid',  // Use UUID as parent key instead of default 'id'
            'id'     // Use id on Permission model
        );

        if (! app(\Spatie\Permission\PermissionRegistrar::class)->teams) {
            return $relation;
        }

        $teamsKey = app(\Spatie\Permission\PermissionRegistrar::class)->teamsKey;
        $relation->withPivot($teamsKey);

        return $relation->wherePivot($teamsKey, getPermissionsTeamId());
    }

    /**
     * Get the team identifier for Spatie Permission's teams feature.
     * This method is required for multi-tenant permission scoping.
     *
     * @return int|string|null
     */
    public function getPermissionTeamId()
    {
        return $this->tenant_id;
    }

    /**
     * Override assignRole to automatically set the tenant_id as the team ID.
     * This ensures multi-tenant role assignment works correctly.
     *
     * @param  string|int|array|\Spatie\Permission\Contracts\Role|\Illuminate\Support\Collection|\BackedEnum  ...$roles
     * @return $this
     */
    public function assignRole(...$roles)
    {
        // Set the tenant_id as the team ID before role assignment
        setPermissionsTeamId($this->tenant_id);
        
        // Call the original trait method via alias
        return $this->spatieAssignRole(...$roles);
    }

    /**
     * Override givePermissionTo to automatically set the tenant_id as the team ID.
     * This ensures multi-tenant permission assignment works correctly.
     *
     * @param  string|int|array|\Spatie\Permission\Contracts\Permission|\Illuminate\Support\Collection|\BackedEnum  ...$permissions
     * @return $this
     */
    public function givePermissionTo(...$permissions)
    {
        // Set the tenant_id as the team ID before permission assignment
        setPermissionsTeamId($this->tenant_id);
        
        // Call the original trait method via alias
        return $this->spatieGivePermissionTo(...$permissions);
    }

    /**
     * Override hasPermissionTo to automatically set the tenant_id as the team ID.
     * This ensures multi-tenant permission checking works correctly during authorization.
     *
     * @param  string|int|\Spatie\Permission\Contracts\Permission|\BackedEnum  $permission
     * @param  string|null  $guardName
     * @return bool
     */
    public function hasPermissionTo($permission, $guardName = null): bool
    {
        // Set the tenant_id as the team ID before permission check
        setPermissionsTeamId($this->tenant_id);
        
        // Call the original trait method via alias
        return $this->spatieHasPermissionTo($permission, $guardName);
    }

    /**
     * Override hasRole to ensure tenant context is set and use slug field for string lookups.
     * Supports all Spatie Permission input types (string, int, Role object, etc.)
     * 
     * IMPORTANT: This override uses 'slug' field instead of 'name' field for string lookups
     * to match our application's convention.
     */
    public function hasRole($roles, ?string $guard = null): bool
    {
        setPermissionsTeamId($this->tenant_id);
        
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

    public function hasAnyRole(array $roles): bool
    {
        return $this->roles->pluck('slug')->intersect($roles)->isNotEmpty();
    }

    public function hasPermission(string $permission): bool
    {
        foreach ($this->roles as $role) {
            if (in_array($permission, $role->abilities ?? [])) {
                return true;
            }
        }
        return false;
    }

    public function getAllPermissions(): array
    {
        // Load roles if not already loaded
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



    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }

    public function activate(): void
    {
        $this->update(['status' => 'active']);
    }

    public function suspend(): void
    {
        $this->update(['status' => 'suspended']);
    }

    public function deactivate(): void
    {
        $this->update(['status' => 'inactive']);
    }

    // Override getAuthIdentifierName for Sanctum
    public function getAuthIdentifierName()
    {
        return 'id';
    }

    // Override for proper token scoping with tenant context
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

    // Route key binding
    public function getRouteKeyName()
    {
        return 'id';
    }
}
