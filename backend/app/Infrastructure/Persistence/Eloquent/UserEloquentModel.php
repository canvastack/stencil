<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class UserEloquentModel extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory;

    protected $table = 'users';
    
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

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::class,
            'user_roles',
            'user_id',
            'role_id'
        );
    }

    // Global Scopes
    protected static function booted()
    {
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

    public function hasRole(string $role): bool
    {
        return $this->roles->contains('slug', $role);
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
            $permissions = array_merge($permissions, $role->abilities ?? []);
        }
        return array_unique($permissions);
    }

    public function assignRole(string $roleSlug): void
    {
        $role = \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::where('tenant_id', $this->tenant_id)
            ->where('slug', $roleSlug)
            ->first();
            
        if ($role && !$this->hasRole($roleSlug)) {
            $this->roles()->attach($role);
        }
    }

    public function removeRole(string $roleSlug): void
    {
        $role = \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::where('tenant_id', $this->tenant_id)
            ->where('slug', $roleSlug)
            ->first();
            
        if ($role) {
            $this->roles()->detach($role);
        }
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